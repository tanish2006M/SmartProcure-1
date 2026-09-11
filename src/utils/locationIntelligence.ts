import {
  GeoCoordinates,
  ProcurementCentre,
  Slot,
  CentreIntelligence,
  CentreComparisonResult,
} from '../types';

export const DEFAULT_CENTRE_COORDS: Record<string, GeoCoordinates> = {
  // 28 Master Demo Centres
  'C001': { lat: 17.3850, lng: 78.4867 }, // Hyderabad Agricultural Market, Telangana
  'C002': { lat: 17.8517, lng: 78.6833 }, // Gajwel Market, Telangana
  'C003': { lat: 18.7944, lng: 78.9142 }, // Jagtial Market, Telangana
  'C004': { lat: 18.5376, lng: 79.0306 }, // Gangadhara Market, Telangana
  'C005': { lat: 17.1405, lng: 79.6200 }, // Suryapet Smart Procurement Centre, Telangana
  'C006': { lat: 30.8165, lng: 75.1717 }, // Moga APMC, Punjab
  'C007': { lat: 30.9237, lng: 74.6065 }, // Ferozepur City APMC, Punjab
  'C008': { lat: 30.8657, lng: 74.9392 }, // Talwandi Bhai APMC, Punjab
  'C009': { lat: 28.0162, lng: 79.0116 }, // Ujhani Mandi, Uttar Pradesh
  'C010': { lat: 25.3176, lng: 82.9739 }, // Varanasi Mandi, Uttar Pradesh
  'C011': { lat: 26.5452, lng: 80.4878 }, // Unnao Mandi, Uttar Pradesh
  'C012': { lat: 25.9898, lng: 79.4530 }, // Orai Mandi, Uttar Pradesh
  'C013': { lat: 23.2324, lng: 87.8615 }, // Bardhaman Mandi, West Bengal
  'C014': { lat: 25.0108, lng: 88.1411 }, // Malda Mandi, West Bengal
  'C015': { lat: 24.0984, lng: 88.2678 }, // Murshidabad Mandi, West Bengal
  'C016': { lat: 21.3688, lng: 74.2402 }, // Nandurbar Mandi, Maharashtra
  'C017': { lat: 21.5422, lng: 74.4720 }, // Shahada Mandi, Maharashtra
  'C018': { lat: 20.1065, lng: 77.1348 }, // Washim Mandi, Maharashtra
  'C019': { lat: 20.4837, lng: 77.4891 }, // Karanja Mandi, Maharashtra
  'C020': { lat: 20.4608, lng: 79.9881 }, // Armori-Desaiganj Mandi, Maharashtra
  'C021': { lat: 17.4724, lng: 78.4862 }, // Bowenpally Agricultural Market, Telangana
  'C022': { lat: 17.3821, lng: 78.4374 }, // Gudimalkapur Market, Telangana
  'C023': { lat: 17.4022, lng: 78.5602 }, // Uppal Agricultural Market, Telangana
  'C024': { lat: 17.3503, lng: 78.5529 }, // LB Nagar Agricultural Market, Telangana
  'C025': { lat: 17.2543, lng: 78.3972 }, // Shamshabad Agricultural Market, Telangana
  'C026': { lat: 17.3190, lng: 78.4067 }, // Rajendranagar Agricultural Market, Telangana
  'C027': { lat: 17.4849, lng: 78.4138 }, // Kukatpally Market, Telangana
  'C028': { lat: 17.5186, lng: 78.4528 }, // Jeedimetla Agricultural Market, Telangana
  // Backward compatibility legacy IDs
  'centre-1': { lat: 17.3850, lng: 78.4867 },
  'centre-2': { lat: 17.8517, lng: 78.6833 },
  'centre-3': { lat: 18.7944, lng: 78.9142 },
  'centre-4': { lat: 18.5376, lng: 79.0306 },
};

export function getSafeCentreCoordinates(centre?: Partial<ProcurementCentre> | null): GeoCoordinates {
  if (
    centre?.coordinates &&
    typeof centre.coordinates.lat === 'number' &&
    !isNaN(centre.coordinates.lat) &&
    typeof centre.coordinates.lng === 'number' &&
    !isNaN(centre.coordinates.lng)
  ) {
    return centre.coordinates;
  }
  if (centre?.id && DEFAULT_CENTRE_COORDS[centre.id]) {
    return DEFAULT_CENTRE_COORDS[centre.id];
  }
  return { lat: 28.6128, lng: 76.9856 };
}

/**
 * Calculates Great-Circle distance using Haversine formula,
 * adjusted with standard road tortuosity factor (1.26x) for agricultural/rural transit.
 */
export function calculateDistanceKm(
  origin?: GeoCoordinates | null,
  destination?: GeoCoordinates | null
): number {
  const safeOrigin = {
    lat: typeof origin?.lat === 'number' && !isNaN(origin.lat) ? origin.lat : 28.5750,
    lng: typeof origin?.lng === 'number' && !isNaN(origin.lng) ? origin.lng : 76.9200,
  };
  const safeDest = {
    lat: typeof destination?.lat === 'number' && !isNaN(destination.lat) ? destination.lat : 28.6128,
    lng: typeof destination?.lng === 'number' && !isNaN(destination.lng) ? destination.lng : 76.9856,
  };

  const R = 6371; // Earth radius in km
  const dLat = ((safeDest.lat - safeOrigin.lat) * Math.PI) / 180;
  const dLng = ((safeDest.lng - safeOrigin.lng) * Math.PI) / 180;
  const lat1 = (safeOrigin.lat * Math.PI) / 180;
  const lat2 = (safeDest.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;

  // Road factor for rural/semi-urban routes: 1.26x
  const roadKm = Math.max(1.2, straightLineKm * 1.26);
  return Number(roadKm.toFixed(1));
}

/**
 * Estimates tractor / agricultural cargo transit time.
 * Average speed ~28 km/h on mixed mandi connector roads.
 */
export function estimateTravelTimeMins(distanceKm: number): number {
  const transitMins = (distanceKm / 28) * 60;
  // Add 3 minutes for village exit and mandi gate approach
  return Math.max(6, Math.round(transitMins + 3));
}

/**
 * Calculates current queue size and wait time based on yard load and active weighbridge counters.
 */
export function calculateCentreQueue(
  centre: ProcurementCentre,
  activeBookingsCount?: number
): { queueSize: number; currentWaitMins: number } {
  // If actual bookings count is passed, use that; otherwise calculate from current yard load
  const queueSize =
    typeof activeBookingsCount === 'number' && activeBookingsCount > 0
      ? activeBookingsCount
      : Math.max(2, Math.round((centre.currentLoad / 100) * 16));

  const effectiveCounters = Math.max(1, centre.activeCounters - 1); // 1 counter typically reserved for verification/re-checks
  const avgProcessingTime = centre.avgProcessingTimeMins || 7;
  const currentWaitMins = Math.max(
    6,
    Math.round((queueSize * avgProcessingTime) / effectiveCounters)
  );

  return { queueSize, currentWaitMins };
}

/**
 * Evaluates Smart Match Score (0 - 100) combining 5 dimensions:
 * 1. Distance & Travel (25 pts)
 * 2. Waiting Time & Queue (35 pts)
 * 3. Yard Load & Congestion (20 pts)
 * 4. Slot Availability (10 pts)
 * 5. Crop Specialization (10 pts)
 */
export function calculateSmartMatchScore(params: {
  distanceKm: number;
  travelTimeMins: number;
  currentWaitMins: number;
  currentLoad: number;
  availableSlots: number;
  cropMatched: boolean;
}): {
  score: number;
  breakdown: {
    travelScore: number;
    waitScore: number;
    loadScore: number;
    capacityScore: number;
    cropScore: number;
  };
  reasons: string[];
} {
  const { distanceKm, travelTimeMins, currentWaitMins, currentLoad, availableSlots, cropMatched } =
    params;

  // 1. Travel Score (Max 25 pts) - strongly rewards nearby regional centres and penalizes cross-state distances
  let travelScore = 0;
  if (distanceKm <= 8) travelScore = 25;
  else if (distanceKm <= 15) travelScore = 20;
  else if (distanceKm <= 25) travelScore = 14;
  else if (distanceKm <= 50) travelScore = 8;
  else if (distanceKm <= 100) travelScore = 2;
  else if (distanceKm <= 200) travelScore = -15;
  else travelScore = -50;

  // 2. Wait Score (Max 35 pts) - Most important for avoiding mandi queues
  let waitScore = 0;
  if (currentWaitMins <= 15) waitScore = 35;
  else if (currentWaitMins <= 28) waitScore = 28;
  else if (currentWaitMins <= 45) waitScore = 18;
  else if (currentWaitMins <= 60) waitScore = 10;
  else waitScore = 4;

  // 3. Yard Load Score (Max 20 pts)
  let loadScore = 0;
  if (currentLoad < 40) loadScore = 20;
  else if (currentLoad < 60) loadScore = 15;
  else if (currentLoad < 75) loadScore = 10;
  else if (currentLoad < 85) loadScore = 5;
  else loadScore = 2;

  // 4. Capacity & Slots Score (Max 10 pts)
  let capacityScore = 0;
  if (availableSlots >= 10) capacityScore = 10;
  else if (availableSlots >= 5) capacityScore = 7;
  else if (availableSlots >= 1) capacityScore = 4;
  else capacityScore = 0;

  // 5. Crop Support Score (Max 10 pts)
  const cropScore = cropMatched ? 10 : 0;

  const totalScore = Math.min(
    100,
    Math.max(10, travelScore + waitScore + loadScore + capacityScore + cropScore)
  );

  const reasons: string[] = [];

  if (distanceKm <= 10) {
    reasons.push(`Nearby location (${distanceKm} km, ~${travelTimeMins} min travel)`);
  }
  if (currentWaitMins <= 20) {
    reasons.push(`Fast clearance (~${currentWaitMins} min estimated wait)`);
  } else if (currentWaitMins > 45) {
    reasons.push(`High waiting queue (~${currentWaitMins} min wait)`);
  }

  if (currentLoad < 50) {
    reasons.push(`Low yard congestion (${currentLoad}% capacity)`);
  } else if (currentLoad > 75) {
    reasons.push(`Heavily loaded mandi yard (${currentLoad}% full)`);
  }

  if (availableSlots >= 5) {
    reasons.push(`${availableSlots} open slots remaining today`);
  }

  if (cropMatched) {
    reasons.push('Active MSP counter for your selected crop');
  }

  return {
    score: totalScore,
    breakdown: {
      travelScore,
      waitScore,
      loadScore,
      capacityScore,
      cropScore,
    },
    reasons,
  };
}

/**
 * Calculates departure and gate arrival times based on slot start time and transit time.
 */
export function calculateArrivalSchedule(
  slotStartTime: string = '10:00 AM',
  travelTimeMins: number = 20
): {
  recommendedArrivalTime: string;
  recommendedDepartureTime: string;
  reason: string;
} {
  // Parse slot start time e.g. "10:00 AM"
  const match = slotStartTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  let hours = 10;
  let minutes = 0;

  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    hours = h;
    minutes = m;
  }

  const slotStartTotalMins = hours * 60 + minutes;

  // Gate Check-in buffer: 15 minutes before slot start
  const arrivalTotalMins = Math.max(0, slotStartTotalMins - 15);
  // Departure from farm: arrival time minus travel time
  const departureTotalMins = Math.max(0, arrivalTotalMins - travelTimeMins);

  const formatTime = (totalMins: number) => {
    let h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    let displayH = h % 12;
    if (displayH === 0) displayH = 12;
    return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  const recommendedArrivalTime = formatTime(arrivalTotalMins);
  const recommendedDepartureTime = formatTime(departureTotalMins);

  const reason = `Leave by ${recommendedDepartureTime} to cover ${travelTimeMins} mins travel and arrive by ${recommendedArrivalTime} for 15-minute gate line-up before your ${slotStartTime} slot.`;

  return {
    recommendedArrivalTime,
    recommendedDepartureTime,
    reason,
  };
}

/**
 * Computes full CentreIntelligence for a given procurement centre.
 */
export function computeCentreIntelligence(params: {
  farmerCoords: GeoCoordinates;
  centre: ProcurementCentre;
  crop?: string;
  availableSlotsCount?: number;
  activeBookingsCount?: number;
  slotStartTime?: string;
}): CentreIntelligence {
  const {
    farmerCoords,
    centre,
    crop,
    availableSlotsCount = 6,
    activeBookingsCount,
    slotStartTime = '10:00 AM',
  } = params;

  const safeCoords = getSafeCentreCoordinates(centre);
  const safeFarmerCoords: GeoCoordinates = {
    lat: typeof farmerCoords?.lat === 'number' && !isNaN(farmerCoords.lat) ? farmerCoords.lat : 28.5750,
    lng: typeof farmerCoords?.lng === 'number' && !isNaN(farmerCoords.lng) ? farmerCoords.lng : 76.9200,
  };

  const distanceKm = calculateDistanceKm(safeFarmerCoords, safeCoords);
  const travelTimeMins = estimateTravelTimeMins(distanceKm);
  const { queueSize, currentWaitMins } = calculateCentreQueue(centre, activeBookingsCount);

  const cleanCrop = (crop || '').toLowerCase().trim();
  const cropMatched =
    !cleanCrop ||
    !centre.supportedCrops ||
    centre.supportedCrops.length === 0 ||
    centre.supportedCrops.some((c) => {
      const cLower = c.toLowerCase().trim();
      return cleanCrop.includes(cLower) || cLower.includes(cleanCrop);
    });

  const { score, breakdown, reasons } = calculateSmartMatchScore({
    distanceKm,
    travelTimeMins,
    currentWaitMins,
    currentLoad: centre.currentLoad,
    availableSlots: availableSlotsCount,
    cropMatched,
  });

  const totalTurnaroundMins = travelTimeMins + currentWaitMins + (centre.avgProcessingTimeMins || 7);

  const schedule = calculateArrivalSchedule(slotStartTime, travelTimeMins);

  return {
    centre: {
      ...centre,
      coordinates: safeCoords,
      distanceKm,
      travelTimeMins,
    },
    distanceKm,
    travelTimeMins,
    currentWaitMins,
    queueSize,
    yardLoad: centre.currentLoad,
    availableSlotsCount,
    totalTurnaroundMins,
    smartMatchScore: score,
    scoreBreakdown: breakdown,
    reasons,
    recommendationReasons: reasons,
    isNearest: false,
    isBestOverall: false,
    recommendedArrivalTime: schedule.recommendedArrivalTime,
    recommendedDepartureTime: schedule.recommendedDepartureTime,
  };
}

/**
 * Compares all available centres and produces "Nearest" vs "Best Overall" comparison.
 */
export function getCentresComparison(params: {
  farmerCoords: GeoCoordinates;
  centres: ProcurementCentre[];
  slots?: Slot[];
  crop?: string;
  selectedDate?: string;
}): CentreComparisonResult {
  const { farmerCoords, centres, slots = [], crop, selectedDate = '2026-09-10' } = params;

  const allIntelligence: CentreIntelligence[] = centres.map((centre) => {
    const centreSlots = slots.filter(
      (s) => s.centreId === centre.id && s.date === selectedDate && s.bookedCount < s.capacity
    );
    const availableSlotsCount = centreSlots.reduce(
      (acc, s) => acc + (s.capacity - s.bookedCount),
      0
    );

    return computeCentreIntelligence({
      farmerCoords,
      centre,
      crop,
      availableSlotsCount: Math.max(availableSlotsCount, 4),
    });
  });

  // Identify Nearest
  const sortedByDistance = [...allIntelligence].sort((a, b) => a.distanceKm - b.distanceKm);
  const nearest = sortedByDistance[0];

  // Identify Best Overall (Highest Smart Match Score)
  const sortedByScore = [...allIntelligence].sort(
    (a, b) => b.smartMatchScore - a.smartMatchScore
  );
  const best = sortedByScore[0];

  nearest.isNearest = true;
  best.isBestOverall = true;

  const isDifferent = nearest.centre.id !== best.centre.id;
  const distanceDiff = Number((best.distanceKm - nearest.distanceKm).toFixed(1));
  const travelDiff = best.travelTimeMins - nearest.travelTimeMins;
  const waitSavings = nearest.currentWaitMins - best.currentWaitMins;
  const netTimeSavings = nearest.totalTurnaroundMins - best.totalTurnaroundMins;

  let recommendationNote = '';
  if (!isDifferent) {
    recommendationNote = `${best.centre.name.split(',')[0]} is both the closest to your farm (${best.distanceKm} km) and has the optimal processing speed today!`;
  } else if (netTimeSavings > 0) {
    recommendationNote = `${best.centre.name.split(',')[0]} is ${distanceDiff > 0 ? `${distanceDiff} km further` : 'nearby'}, but has much lower waiting time (saves ~${waitSavings} mins in queue). You will finish ~${netTimeSavings} mins faster overall!`;
  } else {
    recommendationNote = `${best.centre.name.split(',')[0]} has lower yard congestion and better slot availability today.`;
  }

  return {
    nearestCentre: nearest,
    bestCentre: best,
    timeSavingsMins: Math.max(0, netTimeSavings),
    distanceDiffKm: distanceDiff,
    travelDiffMins: travelDiff,
    waitSavingsMins: Math.max(0, waitSavings),
    isDifferentCentre: isDifferent,
    recommendationNote,
  };
}

/**
 * Returns supported Google Maps directions URL.
 */
export function buildGoogleMapsDirectionsUrl(
  origin?: GeoCoordinates | string | null,
  destination?: GeoCoordinates | string | null
): string {
  const originStr =
    typeof origin === 'string'
      ? encodeURIComponent(origin)
      : origin && typeof origin.lat === 'number'
      ? `${origin.lat},${origin.lng}`
      : '28.5750,76.9200';
  const destStr =
    typeof destination === 'string'
      ? encodeURIComponent(destination)
      : destination && typeof destination.lat === 'number'
      ? `${destination.lat},${destination.lng}`
      : '28.6128,76.9856';

  return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}`;
}

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../translations';
import { CROP_PRICES } from '../../data/initialData';
import { Booking } from '../../types';
import {
  Wheat,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Radio,
  Layers,
  ChevronRight,
  TrendingDown,
  Building2,
  Check,
  Trash2,
  RotateCcw,
  ArrowLeft,
  Navigation,
  Compass,
  Locate,
  Map as MapIcon,
  ExternalLink,
  Scale,
} from 'lucide-react';
import { ProcurementMap } from './ProcurementMap';
import { CentreDetailsCard } from './CentreDetailsCard';
import { NearestVsBestBanner } from './NearestVsBestBanner';
import { CentreComparisonModal } from './CentreComparisonModal';
import { buildGoogleMapsDirectionsUrl } from '../../utils/locationIntelligence';

interface BookSlotProps {
  onBookingComplete: (booking: Booking) => void;
  onNavigate: (tab: string) => void;
}

export const BookSlot: React.FC<BookSlotProps> = ({ onBookingComplete, onNavigate }) => {
  const {
    currentFarmer,
    centres,
    slots,
    bookSlot,
    cancelBooking,
    resetFarmerAppointment,
    getFarmerActiveBooking,
    getSmartRecommendation,
    language,
    farmerLocation,
    setFarmerLocation,
    requestBrowserGpsLocation,
    getAllCentresIntelligence,
    getCentreComparison,
  } = useApp();
  const t = translations[language];

  const activeBooking = getFarmerActiveBooking(currentFarmer.id);

  // Form states
  const [selectedCrop, setSelectedCrop] = useState<string>(currentFarmer.crop || CROP_PRICES[0].name);
  const [quantity, setQuantity] = useState<number>(currentFarmer.quantity || 600);
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-10');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');

  // Location & Map states
  const [viewMode, setViewMode] = useState<'map' | 'cards'>('map');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [detailsCentreId, setDetailsCentreId] = useState<string | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);

  const [bookingError, setBookingError] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

  // Location Intelligence Computations (derived dynamically from current farmer origin, crop, date)
  const centresIntelligence = getAllCentresIntelligence(selectedCrop);
  const comparison = getCentreComparison(selectedCrop, selectedDate);
  const activeDetailsCentre = detailsCentreId
    ? centresIntelligence.find((c) => c.centre.id === detailsCentreId)
    : null;

  // Single Source of Truth for Smart Automation Recommendation:
  // Derived directly from the best centre intelligence for the CURRENT farmer origin
  const bestCentreIntelligence =
    comparison?.bestCentre || centresIntelligence.find((c) => c.isBestOverall) || centresIntelligence[0];
  const recommendedCentre = bestCentreIntelligence?.centre || centres[0];

  // Selected centre state - initialized to current recommended centre
  const [selectedCentreId, setSelectedCentreId] = useState<string>(() => recommendedCentre.id || centres[0].id);

  // Synchronize selected centre to the recommended centre whenever farmer origin changes
  const prevOriginRef = useRef<string>(`${farmerLocation.lat}_${farmerLocation.lng}_${farmerLocation.village || ''}`);
  useEffect(() => {
    const originKey = `${farmerLocation.lat}_${farmerLocation.lng}_${farmerLocation.village || ''}`;
    if (prevOriginRef.current !== originKey) {
      prevOriginRef.current = originKey;
      if (recommendedCentre?.id) {
        setSelectedCentreId(recommendedCentre.id);
        setSelectedSlotId('');
      }
    }
  }, [farmerLocation.lat, farmerLocation.lng, farmerLocation.village, recommendedCentre?.id]);

  // Smart automation recommendation for the selected centre (recalculates whenever selected centre changes)
  const recommendation = getSmartRecommendation(selectedCentreId || recommendedCentre.id, selectedCrop, quantity);

  const selectedCentre = centres.find((c) => c.id === selectedCentreId) || centres[0];
  const centreSlots = slots.filter(
    (s) => s.centreId === selectedCentreId && s.date === selectedDate
  );

  const selectedCropPrice = CROP_PRICES.find((c) => c.name === selectedCrop) || CROP_PRICES[0];
  const estimatedGrossAmount = Math.round((quantity / 100) * selectedCropPrice.mspPerQuintal);

  const handleUseGps = async () => {
    setIsLocating(true);
    setGpsError(null);
    const success = await requestBrowserGpsLocation();
    setIsLocating(false);
    if (!success) {
      setGpsError('Unable to access GPS. Keeping your selected origin.');
      setTimeout(() => setGpsError(null), 5000);
    }
  };

  const handleBook = (slotIdToBook?: string, replaceExisting = false) => {
    setBookingError(null);
    const targetSlotId = slotIdToBook || selectedSlotId;

    if (!targetSlotId) {
      setBookingError('Please choose an available time slot.');
      return;
    }

    const result = bookSlot({
      farmerId: currentFarmer.id,
      crop: selectedCrop,
      quantity,
      centreId: selectedCentreId,
      date: selectedDate,
      slotId: targetSlotId,
      replaceExisting,
    });

    if (result.success && result.booking) {
      setSuccessBooking(result.booking);
      onBookingComplete(result.booking);
    } else {
      setBookingError(result.error || 'Failed to book slot.');
    }
  };

  const handleCancelActiveAppointment = () => {
    if (activeBooking) {
      cancelBooking(activeBooking.id);
      setBookingError(null);
    } else {
      resetFarmerAppointment(currentFarmer.id);
      setBookingError(null);
    }
  };

  const handleBookRecommended = () => {
    const rec = recommendation.recommendedSlot;
    setSelectedCentreId(rec.centreId);
    setSelectedDate(rec.date);
    handleBook(rec.slotId);
  };

  const handleSelectAlternative = () => {
    if (recommendation.alternativeCentre) {
      const alt = recommendation.alternativeCentre;
      setSelectedCentreId(alt.centreId);
      if (alt.date) {
        setSelectedDate(alt.date);
      }
      setSelectedSlotId('');
      setDetailsCentreId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header with Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t.booking.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t.booking.subtitle}
          </p>
        </div>

        {activeBooking && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelActiveAppointment}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Cancel your current appointment to test a brand new booking"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Cancel Active Token ({activeBooking.token})</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Appointment Notice (Prevents testing dead-ends) */}
      {activeBooking && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-mono font-black text-sm shrink-0 border border-amber-300">
              {activeBooking.token}
            </div>
            <div>
              <div className="text-xs font-extrabold text-amber-950 flex items-center gap-2">
                <span>Active Appointment on Record</span>
                <span className="bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold">
                  {activeBooking.status}
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-0.5 font-medium">
                {activeBooking.centreName.split(',')[0]} • {activeBooking.date} ({activeBooking.timeSlot}) • {activeBooking.crop} ({activeBooking.bookedQuantity} kg)
              </p>
              <p className="text-[11px] text-amber-800 mt-1">
                To test booking a different slot or mandi, you can cancel this appointment or select a new slot below and click <strong>"Replace Slot & Book"</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCancelActiveAppointment}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Cancel Appointment</span>
            </button>
            <button
              onClick={() => onNavigate('myBooking')}
              className="px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              View Pass
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {successBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              Slot Confirmed
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-1">
              {t.booking.tokenGeneratedTitle}
            </h3>

            <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left">
              <div className="text-center mb-3">
                <div className="text-xs text-slate-500 mb-1">Digital Token Number</div>
                <div className="text-4xl font-black text-emerald-800 font-mono tracking-wider">
                  {successBooking.token}
                </div>
                <div className="text-xs text-slate-700 font-semibold mt-1">
                  {successBooking.centreName.split(',')[0]}
                </div>
                <div className="text-xs text-slate-500">
                  {successBooking.date} • {successBooking.timeSlot}
                </div>
              </div>

              {/* Arrival Intelligence Card */}
              {successBooking.recommendedArrivalTime && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs mb-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Smart Travel & Arrival Guidance</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                    <div>
                      <span className="text-slate-500 block">Leave Home:</span>
                      <strong className="text-slate-900 font-mono text-xs">
                        {successBooking.recommendedDepartureTime}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Gate Arrival:</span>
                      <strong className="text-emerald-700 font-mono text-xs">
                        {successBooking.recommendedArrivalTime}
                      </strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-tight">
                    {successBooking.arrivalReason}
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              {t.booking.tokenGeneratedDesc}
            </p>

            {/* Directions Link */}
            {selectedCentre.coordinates && (
              <a
                href={buildGoogleMapsDirectionsUrl(farmerLocation, selectedCentre.coordinates)}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all"
              >
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Google Maps Driving Directions</span>
                <ExternalLink className="w-3 h-3 text-blue-500 ml-1" />
              </a>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => onNavigate('queue')}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Track Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message with Immediate Action */}
      {bookingError && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Booking Restriction:</strong>
              <span>{bookingError}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => handleBook(undefined, true)}
              disabled={!selectedSlotId}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl shadow-xs transition-all ${
                selectedSlotId
                  ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                  : 'bg-rose-200 text-rose-400 cursor-not-allowed'
              }`}
            >
              Replace Existing Slot & Book
            </button>
            <button
              onClick={handleCancelActiveAppointment}
              className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel Prior Slot
            </button>
          </div>
        </div>
      )}

      {/* SMART AUTOMATION SECTION (Core requirement #8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recommended Slot Card */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-5 shadow-sm border border-emerald-800 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 p-4 pointer-events-none">
            <Sparkles className="w-32 h-32" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.booking.smartRecommend}</span>
            </div>

            <h3 className="text-lg font-bold mb-1">
              {recommendation.recommendedSlot.timeSlot}
            </h3>
            <p className="text-xs text-emerald-200 mb-4">
              {recommendation.recommendedSlot.centreName.split(',')[0]} (Today, {recommendation.recommendedSlot.date})
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4 bg-emerald-950/60 p-3 rounded-2xl border border-emerald-800/60 text-xs">
              <div>
                <span className="text-emerald-300 block text-[10px]">Yard Load:</span>
                <span className="font-bold text-base font-mono">{recommendation.recommendedSlot.currentLoad}%</span>
              </div>
              <div>
                <span className="text-emerald-300 block text-[10px]">Estimated Wait:</span>
                <span className="font-bold text-base font-mono">~{recommendation.recommendedSlot.estimatedWaitMins} mins</span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-300 leading-relaxed mb-5">
              {recommendation.recommendedSlot.reason}
            </p>
          </div>

          <button
            onClick={handleBookRecommended}
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t.booking.bookRecommended}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Alternative Centre Suggestion (Load Balancing requirement #8) */}
        {recommendation.alternativeCentre && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200 mb-3">
                <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.booking.alternativeCentre}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">
                {recommendation.alternativeCentre.centreName}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Next Available: <span className="font-bold text-slate-800">{recommendation.alternativeCentre.timeSlot}</span>
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Current Load:</span>
                  <span className="font-bold text-emerald-700 text-base font-mono">
                    {recommendation.alternativeCentre.currentLoad}% (Low Congestion)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Estimated Wait:</span>
                  <span className="font-bold text-slate-900 text-base font-mono">
                    ~{recommendation.alternativeCentre.estimatedWaitMins} mins
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed mb-5">
                {recommendation.alternativeCentre.reason}
              </p>
            </div>

            <button
              onClick={handleSelectAlternative}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Switch to this Centre</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Manual Slot Selection Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Custom Slot Selection
        </h3>

        {/* Step 1 & 2: Crop & Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.booking.selectCrop}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CROP_PRICES.map((crop) => (
                <option key={crop.name} value={crop.name}>
                  {crop.icon} {crop.name} — MSP ₹{crop.mspPerQuintal}/quintal
                </option>
              ))}
            </select>
            <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Govt MSP Rate:</span>
              <span className="font-bold text-emerald-800">
                ₹{selectedCropPrice.mspPerQuintal.toLocaleString('en-IN')} / quintal
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.booking.enterQty}
            </label>
            <div className="relative">
              <input
                type="number"
                min="50"
                step="50"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(10, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                KG
              </span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Est. Value at MSP:</span>
              <span className="font-bold text-slate-900">
                ₹{estimatedGrossAmount.toLocaleString('en-IN')} (approx)
              </span>
            </div>
          </div>
        </div>

        {/* Step 3: Procurement Centre with Location & Centre Intelligence */}
        <div className="space-y-4">
          {/* Farmer Location & Origin Context Bar */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Farmer Dispatch Origin
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                      farmerLocation.source === 'gps'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {farmerLocation.source === 'gps' ? 'Current GPS Location' : 'Registered Village'}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {farmerLocation.source === 'gps' ? 'Current GPS Location' : (farmerLocation?.addressLabel || 'Origin')}
                  <span className="text-slate-400 font-normal font-mono text-[11px] ml-1.5 hidden md:inline">
                    ({(farmerLocation?.lat ?? 28.575).toFixed(4)}°N,{' '}
                    {(farmerLocation?.lng ?? 76.920).toFixed(4)}°E)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleUseGps}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Detect precise GPS location from your browser"
              >
                <Locate className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
              </button>

              <select
                aria-label="Select demo farmer origin location"
                value={farmerLocation.source === 'gps' ? 'CURRENT_GPS' : (farmerLocation.village || 'Medchal Rural')}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'CURRENT_GPS') {
                    handleUseGps();
                    return;
                  }
                  setGpsError(null);
                  const locMap: Record<string, { lat: number; lng: number; label: string; district: string; state: string }> = {
                    'Medchal Rural': { lat: 17.4100, lng: 78.4720, label: 'Medchal Rural, Hyderabad', district: 'Hyderabad', state: 'Telangana' },
                    'Malegaon Jahangir': { lat: 20.1250, lng: 77.1020, label: 'Malegaon Jahangir, Washim', district: 'Washim', state: 'Maharashtra' },
                    'Chivvemla': { lat: 17.1620, lng: 79.6480, label: 'Chivvemla, Suryapet', district: 'Suryapet', state: 'Telangana' },
                    'Gajwel Rural': { lat: 17.8650, lng: 78.6920, label: 'Gajwel Rural, Siddipet', district: 'Siddipet', state: 'Telangana' },
                    'Shivpur': { lat: 25.3520, lng: 82.9510, label: 'Shivpur, Varanasi', district: 'Varanasi', state: 'Uttar Pradesh' },
                    'Baghapurana': { lat: 30.6850, lng: 75.0820, label: 'Baghapurana, Moga', district: 'Moga', state: 'Punjab' },
                    'Memari': { lat: 23.2010, lng: 88.0120, label: 'Memari, Purba Bardhaman', district: 'Purba Bardhaman', state: 'West Bengal' },
                  };
                  const matched = locMap[val];
                  if (matched) {
                    setFarmerLocation({
                      lat: matched.lat,
                      lng: matched.lng,
                      source: 'manual',
                      addressLabel: matched.label,
                      village: val,
                      district: matched.district,
                      state: matched.state,
                    });
                  }
                }}
                className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                {farmerLocation.source === 'gps' && (
                  <option value="CURRENT_GPS">
                    Origin: Current GPS Location ({farmerLocation.lat.toFixed(3)}°N, {farmerLocation.lng.toFixed(3)}°E)
                  </option>
                )}
                <option value="Medchal Rural">Origin: Hyderabad, TS (Gopal)</option>
                <option value="Malegaon Jahangir">Origin: Washim, MH (Ramesh)</option>
                <option value="Chivvemla">Origin: Suryapet, TS (Manjunath)</option>
                <option value="Gajwel Rural">Origin: Gajwel, TS (Lakshmi)</option>
                <option value="Shivpur">Origin: Varanasi, UP (Sunita)</option>
                <option value="Baghapurana">Origin: Moga, PB (Harpreet)</option>
                <option value="Memari">Origin: Bardhaman, WB (Priya)</option>
              </select>
            </div>
          </div>

          {gpsError && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between">
              <span className="font-medium">{gpsError}</span>
              <button
                type="button"
                onClick={() => setGpsError(null)}
                className="text-amber-700 hover:text-amber-950 font-bold px-2 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Nearest vs Best Overall Intelligence Banner */}
          <NearestVsBestBanner
            comparison={comparison}
            onSelectCentre={(id) => {
              setSelectedCentreId(id);
              setSelectedSlotId('');
            }}
            onOpenDetails={(id) => setDetailsCentreId(id)}
            onOpenComparison={() => setShowComparisonModal(true)}
          />

          {/* Section Header & View Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-900">
                Choose Mandi / Procurement Centre
              </label>
              <p className="text-[11px] text-slate-500">
                Select a centre based on distance, live queue wait, and yard congestion.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowComparisonModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5 text-slate-600" />
                <span>3-Centre Comparison</span>
              </button>

              <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Interactive Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Card List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Map View */}
          {viewMode === 'map' && (
            <div className="space-y-3">
              <ProcurementMap
                farmerLocation={farmerLocation}
                centresIntelligence={centresIntelligence}
                selectedCentreId={selectedCentreId}
                onSelectCentre={(id) => {
                  setSelectedCentreId(id);
                  setSelectedSlotId('');
                }}
                onOpenDetails={(id) => setDetailsCentreId(id)}
                crop={selectedCrop}
              />
            </div>
          )}

          {/* Enriched Cards View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {centresIntelligence.map((item) => {
                const c = item.centre;
                const isSelected = c.id === selectedCentreId;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCentreId(c.id);
                      setSelectedSlotId('');
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.isBestOverall && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Best Match
                            </span>
                          )}
                          {item.isNearest && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                              <Navigation className="w-3 h-3 text-blue-600" />
                              Nearest
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono">
                            {item.smartMatchScore}% Match
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>

                      {/* Title & Location */}
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {c.name.split(',')[0]}
                      </h4>
                      <p className="text-[11px] text-slate-500 mb-3 truncate">
                        {c.location}
                      </p>

                      {/* Key Intelligence Matrix */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center mb-3">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Distance</span>
                          <span className="text-xs font-black text-slate-900 font-mono">
                            {item.distanceKm} km
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Transit</span>
                          <span className="text-xs font-black text-slate-900 font-mono">
                            ~{item.travelTimeMins}m
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Wait Queue</span>
                          <span className="text-xs font-black text-amber-900 font-mono">
                            ~{item.currentWaitMins}m
                          </span>
                        </div>
                      </div>

                      {/* Reasons */}
                      <div className="space-y-1 mb-3">
                        {(item.reasons || item.recommendationReasons || []).slice(0, 2).map((reason, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Yard: <strong className="text-slate-800">{c.currentLoad}% full</strong>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailsCentreId(c.id);
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Full Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 4 & 5: Date and Dynamic Slot Grid (Prompt section 7) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700">
              {t.booking.selectSlot} ({selectedDate})
            </label>
            <span className="text-[11px] text-slate-500">
              Yard Capacity: 20 slots / hour
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {centreSlots.map((slot) => {
              const isFull = slot.bookedCount >= slot.capacity;
              const isSelected = selectedSlotId === slot.id;
              const remaining = slot.capacity - slot.bookedCount;

              return (
                <button
                  key={slot.id}
                  disabled={isFull}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    isFull
                      ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-slate-900 font-mono">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        isFull
                          ? 'bg-slate-200 text-slate-600'
                          : remaining <= 4
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isFull ? 'FULL' : 'AVAILABLE'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>
                      {slot.bookedCount} / {slot.capacity} booked
                    </span>
                    {!isFull && (
                      <span className="font-semibold text-emerald-700">
                        {remaining} left
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Booking Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {activeBooking ? (
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
              <span>Replacing Token {activeBooking.token} on submission</span>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {activeBooking && (
              <button
                type="button"
                onClick={handleCancelActiveAppointment}
                className="px-4 py-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              >
                Clear Prior Token
              </button>
            )}

            <button
              onClick={() => handleBook(undefined, !!activeBooking)}
              disabled={!selectedSlotId}
              className={`px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedSlotId
                  ? activeBooking
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{activeBooking ? 'Replace & Confirm New Slot' : t.booking.confirmBooking}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Centre Details Modal / Sheet */}
      {activeDetailsCentre && (
        <CentreDetailsCard
          intelligence={activeDetailsCentre}
          farmerLocation={farmerLocation}
          isSelected={selectedCentreId === activeDetailsCentre.centre.id}
          onSelectCentre={(id) => {
            setSelectedCentreId(id);
            setSelectedSlotId('');
            setDetailsCentreId(null);
          }}
          onSelectAndBook={(id) => {
            setSelectedCentreId(id);
            setSelectedSlotId('');
            setDetailsCentreId(null);
          }}
          onClose={() => setDetailsCentreId(null)}
          onCompare={(_id) => {
            setDetailsCentreId(null);
            setShowComparisonModal(true);
          }}
          onOpenComparison={() => {
            setDetailsCentreId(null);
            setShowComparisonModal(true);
          }}
        />
      )}

      {/* Multi-Centre Comparison Modal */}
      {showComparisonModal && (
        <CentreComparisonModal
          centresIntelligence={centresIntelligence}
          farmerLocation={farmerLocation}
          selectedCentreId={selectedCentreId}
          onSelectCentre={(id) => {
            setSelectedCentreId(id);
            setSelectedSlotId('');
            setShowComparisonModal(false);
          }}
          onClose={() => setShowComparisonModal(false)}
        />
      )}
    </div>
  );
};

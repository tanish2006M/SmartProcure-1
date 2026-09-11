import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  Language,
  Farmer,
  ProcurementCentre,
  Slot,
  Booking,
  Procurement,
  Payment,
  AppNotification,
  SmartRecommendation,
  BookingStatus,
  PaymentStatus,
  OtpSession,
  OtpStats,
  FarmerLocation,
  CentreIntelligence,
  CentreComparisonResult,
  FarmerSmsPreferences,
  SmsStatus,
  SmsPriority,
  NotificationDeliveryLog,
} from '../types';
import {
  INITIAL_CENTRES,
  INITIAL_FARMERS,
  INITIAL_SLOTS,
  INITIAL_BOOKINGS,
  INITIAL_PROCUREMENTS,
  INITIAL_PAYMENTS,
  INITIAL_NOTIFICATIONS,
  CROP_PRICES,
  DEFAULT_SMS_PREFERENCES,
} from '../data/initialData';
import { notificationService } from '../services/notificationService';
import {
  smartSmsEngine,
  isValidIndianMobile,
  maskIndianMobile,
  formatFullRegisteredMobile,
} from '../services/smsService';
import {
  calculateDistanceKm,
  estimateTravelTimeMins,
  calculateArrivalSchedule,
  computeCentreIntelligence,
  getCentresComparison,
  calculateCentreQueue,
} from '../utils/locationIntelligence';

const STORAGE_KEY = 'smartprocure_master_v2';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  currentFarmer: Farmer;
  setCurrentFarmerId: (id: string) => void;
  setFarmer: (farmer: Farmer) => void;
  activeOfficialCentreId: string;
  setActiveOfficialCentreId: (id: string) => void;

  // Location Intelligence
  farmerLocation: FarmerLocation;
  setFarmerLocation: (loc: FarmerLocation) => void;
  requestBrowserGpsLocation: () => Promise<boolean>;
  getCentreIntelligence: (
    centreId: string,
    crop?: string,
    slotStartTime?: string
  ) => CentreIntelligence;
  getAllCentresIntelligence: (
    crop?: string,
    slotStartTime?: string
  ) => CentreIntelligence[];
  getCentreComparison: (
    crop?: string,
    selectedDate?: string
  ) => CentreComparisonResult;

  centres: ProcurementCentre[];
  farmers: Farmer[];
  slots: Slot[];
  bookings: Booking[];
  procurements: Procurement[];
  payments: Payment[];
  notifications: AppNotification[];

  // Actions
  bookSlot: (params: {
    farmerId: string;
    crop: string;
    quantity: number;
    centreId: string;
    date: string;
    slotId: string;
    replaceExisting?: boolean;
  }) => { success: boolean; booking?: Booking; error?: string };
  cancelBooking: (bookingId: string) => { success: boolean; error?: string };
  cancelRegistration: (farmerIdToCancel?: string) => void;
  resetFarmerAppointment: (farmerIdToReset?: string) => void;

  getSmartRecommendation: (centreId?: string, crop?: string, quantity?: number) => SmartRecommendation;
  callNextToken: (centreId: string) => Booking | null;
  markArrived: (bookingId: string) => void;
  startVerification: (bookingId: string) => void;
  startWeighing: (bookingId: string) => void;
  startQualityCheck: (bookingId: string) => void;
  completeProcurement: (params: {
    bookingId: string;
    actualWeight: number;
    grossWeight?: number;
    tareWeight?: number;
    qualityGrade: 'Grade A' | 'Common / FAQ' | 'Grade B' | string;
    qualityStatus?: 'ACCEPTABLE' | 'VERIFICATION_NEEDED' | 'REJECTED';
    moisturePercentage: number;
    remarks?: string;
    operatorName?: string;
    verifiedBy?: string;
  }) => { procurement: Procurement; payment: Payment };
  initiatePayment: (bookingOrPaymentId: string) => void;
  disbursePayment: (params: {
    paymentId?: string;
    bookingId?: string;
    approvedAmount?: number;
    paymentMethod?: string;
    bankRefNo?: string;
    disbursementDate?: string;
    disbursementTime?: string;
  }) => void;

  updatePaymentStatus: (paymentId: string, status: PaymentStatus, bankRefNo?: string) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  markNoShow: (bookingId: string) => void;
  delaySlot: (centreId: string, slotTime: string, minutes: number) => void;
  addEmergencySlot: (params: {
    centreId: string;
    farmerName: string;
    crop: string;
    quantity: number;
  }) => string;
  updateCentreCapacity: (centreId: string, capacity: number) => void;
  addCentre: (centre: Omit<ProcurementCentre, 'id'>) => ProcurementCentre;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  registerFarmer: (data: Omit<Farmer, 'id' | 'farmerId'>) => Farmer;
  resetToDemoData: () => void;

  // OTP Authentication
  sendOtp: (
    mobile: string,
    purpose: 'LOGIN' | 'REGISTRATION'
  ) => {
    success: boolean;
    demoOtp?: string;
    expiresAt: number;
    resendAvailableAt: number;
    error?: string;
  };
  verifyOtp: (
    mobile: string,
    otp: string
  ) => {
    success: boolean;
    farmer?: Farmer;
    error?: string;
  };
  resendOtp: (
    mobile: string
  ) => {
    success: boolean;
    demoOtp?: string;
    expiresAt: number;
    resendAvailableAt: number;
    error?: string;
  };
  activeOtpSession: OtpSession | null;
  clearOtpSession: () => void;
  otpStats: OtpStats;
  updateFarmerPreferences: (
    farmerId: string,
    channels: { app: boolean; sms: boolean; whatsapp: boolean }
  ) => void;

  // SMS Notifications & Multi-Channel
  smsMode: 'DEMO' | 'LIVE';
  setSmsMode: (mode: 'DEMO' | 'LIVE') => void;
  updateFarmerSmsPreferences: (farmerId: string, prefs: Partial<FarmerSmsPreferences>) => void;
  sendManualSms: (params: {
    mobile: string;
    message: string;
    notificationType?: any;
    priority?: SmsPriority;
    farmerId?: string;
  }) => Promise<{ success: boolean; status: SmsStatus; error?: string }>;
  sendMandiOfficialSms: (params: {
    centreId: string;
    target: 'ALL_WAITING' | 'TOKEN' | 'DELAY' | 'EMERGENCY' | 'GATE';
    token?: string;
    customMessage?: string;
    delayMins?: number;
    title?: string;
  }) => { success: boolean; recipientCount: number; message: string };
  smsMetrics: {
    totalSms: number;
    demoSent: number;
    realDelivered: number;
    queued: number;
    failed: number;
    isDemoMode: boolean;
    providerName: string;
  };
  flushOfflineSms: () => Promise<number>;

  // Helpers
  getFarmerActiveBooking: (farmerId: string) => Booking | undefined;
  getFarmerQueueStats: (bookingId: string) => {
    currentServingToken: string;
    position: number;
    farmersAhead: number;
    estimatedWaitMins: number;
    avgProcessingTimeMins: number;
  };
  getCentreActiveBookings: (centreId: string) => Booking[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initial
  const [role, setRole] = useState<UserRole>('public');
  const [language, setLanguage] = useState<Language>('en');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [currentFarmerId, setCurrentFarmerId] = useState<string>('F001');
  const [activeOfficialCentreId, setActiveOfficialCentreId] = useState<string>('C001');

  const [centres, setCentres] = useState<ProcurementCentre[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_centres`);
      if (saved) {
        const parsed: ProcurementCentre[] = JSON.parse(saved);
        const mapped = parsed.map((c) => {
          const init = INITIAL_CENTRES.find((ic) => ic.id === c.id);
          const safeCoords =
            c.coordinates && typeof c.coordinates.lat === 'number' && typeof c.coordinates.lng === 'number'
              ? c.coordinates
              : init?.coordinates || { lat: 28.6128, lng: 76.9856 };
          return {
            ...init,
            ...c,
            coordinates: safeCoords,
            operatingHours: c.operatingHours || init?.operatingHours || '8:00 AM - 6:00 PM',
            supportedCrops: c.supportedCrops || init?.supportedCrops || ['Wheat', 'Paddy', 'Mustard'],
          };
        });
        const missing = INITIAL_CENTRES.filter((ic) => !mapped.some((m) => m.id === ic.id));
        return [...mapped, ...missing];
      }
      return INITIAL_CENTRES;
    } catch {
      return INITIAL_CENTRES;
    }
  });

  const [farmers, setFarmers] = useState<Farmer[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_farmers`);
      if (saved) {
        const parsed: Farmer[] = JSON.parse(saved);
        return parsed.map((f) => {
          const init = INITIAL_FARMERS.find((inf) => inf.id === f.id);
          const safeCoords =
            f.coordinates && typeof f.coordinates.lat === 'number' && typeof f.coordinates.lng === 'number'
              ? f.coordinates
              : init?.coordinates || { lat: 28.5750, lng: 76.9200 };
          return {
            ...init,
            ...f,
            isMobileVerified: f.isMobileVerified ?? true,
            smsPreferences: f.smsPreferences || init?.smsPreferences || DEFAULT_SMS_PREFERENCES,
            coordinates: safeCoords,
          };
        });
      }
      return INITIAL_FARMERS;
    } catch {
      return INITIAL_FARMERS;
    }
  });

  const [smsMode, setSmsModeState] = useState<'DEMO' | 'LIVE'>(() => smartSmsEngine.getMode());

  const setSmsMode = (mode: 'DEMO' | 'LIVE') => {
    smartSmsEngine.setMode(mode);
    setSmsModeState(mode);
  };

  const [slots, setSlots] = useState<Slot[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_slots`);
      if (saved) {
        const parsed: Slot[] = JSON.parse(saved);
        const missing = INITIAL_SLOTS.filter((is) => !parsed.some((ps) => ps.id === is.id));
        return [...parsed, ...missing];
      }
      return INITIAL_SLOTS;
    } catch {
      return INITIAL_SLOTS;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_bookings`);
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  const [procurements, setProcurements] = useState<Procurement[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_procurements`);
      return saved ? JSON.parse(saved) : INITIAL_PROCUREMENTS;
    } catch {
      return INITIAL_PROCUREMENTS;
    }
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_payments`);
      return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_centres`, JSON.stringify(centres));
      localStorage.setItem(`${STORAGE_KEY}_farmers`, JSON.stringify(farmers));
      localStorage.setItem(`${STORAGE_KEY}_slots`, JSON.stringify(slots));
      localStorage.setItem(`${STORAGE_KEY}_bookings`, JSON.stringify(bookings));
      localStorage.setItem(`${STORAGE_KEY}_procurements`, JSON.stringify(procurements));
      localStorage.setItem(`${STORAGE_KEY}_payments`, JSON.stringify(payments));
      localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [centres, farmers, slots, bookings, procurements, payments, notifications]);

  const currentFarmer =
    farmers.find(
      (f) =>
        f.id === currentFarmerId ||
        f.farmerId === currentFarmerId ||
        (currentFarmerId === 'farmer-1' && f.id === 'F001')
    ) || farmers[0];

  // Farmer Geographic Location State
  const [farmerLocation, setFarmerLocation] = useState<FarmerLocation>(() => {
    return {
      lat: currentFarmer.coordinates?.lat || 28.5750,
      lng: currentFarmer.coordinates?.lng || 76.9200,
      source: 'registered',
      addressLabel: `${currentFarmer.village}, ${currentFarmer.district}`,
      village: currentFarmer.village,
      district: currentFarmer.district,
      state: currentFarmer.state,
    };
  });

  // Sync farmer location when current farmer changes (if using registered source)
  useEffect(() => {
    if (farmerLocation.source === 'registered') {
      setFarmerLocation({
        lat: currentFarmer.coordinates?.lat || 28.5750,
        lng: currentFarmer.coordinates?.lng || 76.9200,
        source: 'registered',
        addressLabel: `${currentFarmer.village}, ${currentFarmer.district}`,
        village: currentFarmer.village,
        district: currentFarmer.district,
        state: currentFarmer.state,
      });
    }
  }, [currentFarmerId, currentFarmer.coordinates, currentFarmer.village, currentFarmer.district, currentFarmer.state]);

  const requestBrowserGpsLocation = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lng = Number(pos.coords.longitude.toFixed(4));
          setFarmerLocation({
            lat,
            lng,
            source: 'gps',
            addressLabel: `Current GPS Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
            village: 'Current GPS Location',
            district: 'Current GPS Location',
            state: 'India',
          });
          resolve(true);
        },
        (err) => {
          console.warn('Geolocation failed or permission denied:', err);
          // Preserve existing farmerLocation! Never switch to another origin or farmer
          resolve(false);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  };

  const getCentreIntelligence = (
    centreId: string,
    crop?: string,
    slotStartTime?: string
  ): CentreIntelligence => {
    const centre = centres.find((c) => c.id === centreId) || centres[0];
    const activeCount = bookings.filter(
      (b) =>
        b.centreId === centre.id &&
        (b.status === 'WAITING' ||
          b.status === 'ARRIVED' ||
          b.status === 'VERIFYING' ||
          b.status === 'PROCESSING')
    ).length;

    const availSlots = slots
      .filter((s) => s.centreId === centre.id && s.bookedCount < s.capacity)
      .reduce((acc, s) => acc + (s.capacity - s.bookedCount), 0);

    return computeCentreIntelligence({
      farmerCoords: {
        lat: farmerLocation?.lat ?? 28.5750,
        lng: farmerLocation?.lng ?? 76.9200,
      },
      centre,
      crop: crop || currentFarmer.crop,
      availableSlotsCount: Math.max(availSlots, 4),
      activeBookingsCount: activeCount,
      slotStartTime,
    });
  };

  const getAllCentresIntelligence = (
    crop?: string,
    slotStartTime?: string
  ): CentreIntelligence[] => {
    const list = centres.map((centre) =>
      getCentreIntelligence(centre.id, crop, slotStartTime)
    );

    // Flag nearest and best
    if (list.length > 0) {
      const sortedByDist = [...list].sort((a, b) => a.distanceKm - b.distanceKm);
      const sortedByScore = [...list].sort(
        (a, b) => b.smartMatchScore - a.smartMatchScore
      );

      return list.map((item) => ({
        ...item,
        isNearest: item.centre.id === sortedByDist[0]?.centre.id,
        isBestOverall: item.centre.id === sortedByScore[0]?.centre.id,
      }));
    }

    return list;
  };

  const getCentreComparison = (
    crop?: string,
    selectedDate?: string
  ): CentreComparisonResult => {
    return getCentresComparison({
      farmerCoords: {
        lat: farmerLocation?.lat ?? 28.5750,
        lng: farmerLocation?.lng ?? 76.9200,
      },
      centres,
      slots,
      crop: crop || currentFarmer.crop,
      selectedDate,
    });
  };

  const resetToDemoData = () => {
    setCentres(INITIAL_CENTRES);
    setFarmers(INITIAL_FARMERS);
    setSlots(INITIAL_SLOTS);
    setBookings(INITIAL_BOOKINGS);
    setProcurements(INITIAL_PROCUREMENTS);
    setPayments(INITIAL_PAYMENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentFarmerId('farmer-1');
    setActiveOfficialCentreId('centre-1');
    setActiveOtpSession(null);
    setOtpStats({
      totalRequested: 148,
      verifiedCount: 142,
      unverifiedCount: 6,
      successRate: 95.9,
      failedAttempts: 8,
    });
  };

  const setFarmer = (farmer: Farmer) => {
    setFarmers((prev) => {
      const exists = prev.some((f) => f.id === farmer.id);
      if (exists) {
        return prev.map((f) => (f.id === farmer.id ? farmer : f));
      }
      return [...prev, farmer];
    });
    setCurrentFarmerId(farmer.id);
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
    const target = bookings.find((b) => b.id === bookingId);
    if (target) {
      addNotification(
        target.farmerId,
        `Status Updated: ${status}`,
        `Token ${target.token}: Your appointment status is now ${status}.`,
        'QUEUE'
      );
    }
  };

  const delaySlot = (centreId: string, slotTime: string, minutes: number) => {
    addNotification(
      'all',
      'Mandi Yard Delay Notice',
      `Slots around ${slotTime} are adjusted by +${minutes} mins due to yard traffic.`,
      'ALERT'
    );
  };

  const addEmergencySlot = ({
    centreId,
    farmerName,
    crop,
    quantity,
  }: {
    centreId: string;
    farmerName: string;
    crop: string;
    quantity: number;
  }): string => {
    const centre = centres.find((c) => c.id === centreId) || centres[0];
    const prefix = centre.id === 'centre-1' ? 'P' : 'N';
    const token = `${prefix}VIP${Math.floor(10 + Math.random() * 90)}`;
    const newBooking: Booking = {
      id: `booking-em-${Date.now()}`,
      farmerId: `f-em-${Date.now()}`,
      farmerName,
      farmerCode: `EM${Math.floor(100 + Math.random() * 900)}`,
      farmerMobile: '9899001122',
      centreId: centre.id,
      centreName: centre.name,
      slotId: 'slot-em',
      date: '2026-09-10',
      timeSlot: 'Immediate (Priority)',
      token,
      crop,
      bookedQuantity: quantity,
      status: 'WAITING',
      createdAt: new Date().toISOString(),
      isEmergency: true,
    };
    setBookings((prev) => [newBooking, ...prev]);
    return token;
  };

  const updateCentreCapacity = (centreId: string, capacity: number) => {
    setCentres((prev) =>
      prev.map((c) => (c.id === centreId ? { ...c, capacity } : c))
    );
  };

  const addCentre = (centreData: Omit<ProcurementCentre, 'id'>): ProcurementCentre => {
    const newCentre: ProcurementCentre = {
      id: `centre-${Date.now()}`,
      ...centreData,
    };
    setCentres((prev) => [...prev, newCentre]);
    return newCentre;
  };

  // OTP state & methods
  const [activeOtpSession, setActiveOtpSession] = useState<OtpSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('smartprocure_otp_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [otpStats, setOtpStats] = useState<OtpStats>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_otp_stats`);
      return saved
        ? JSON.parse(saved)
        : {
            totalRequested: 148,
            verifiedCount: 142,
            unverifiedCount: 6,
            successRate: 95.9,
            failedAttempts: 8,
          };
    } catch {
      return {
        totalRequested: 148,
        verifiedCount: 142,
        unverifiedCount: 6,
        successRate: 95.9,
        failedAttempts: 8,
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_otp_stats`, JSON.stringify(otpStats));
    } catch {}
  }, [otpStats]);

  useEffect(() => {
    try {
      if (activeOtpSession) {
        sessionStorage.setItem('smartprocure_otp_session', JSON.stringify(activeOtpSession));
      } else {
        sessionStorage.removeItem('smartprocure_otp_session');
      }
    } catch {}
  }, [activeOtpSession]);

  const sendOtp = (mobile: string, purpose: 'LOGIN' | 'REGISTRATION') => {
    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      return {
        success: false,
        error: 'Please enter a valid 10-digit mobile number',
        expiresAt: 0,
        resendAvailableAt: 0,
      };
    }

    const demoOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiresAt = now + 120000; // 2 mins
    const resendAvailableAt = now + 30000; // 30s cooldown

    const session: OtpSession = {
      mobile: cleanMobile,
      otp: demoOtp,
      expiresAt,
      resendAvailableAt,
      attemptsRemaining: 3,
      purpose,
    };

    setActiveOtpSession(session);
    notificationService.sendOTP({ mobile: cleanMobile, otp: demoOtp, purpose });

    setOtpStats((prev) => {
      const total = prev.totalRequested + 1;
      return {
        ...prev,
        totalRequested: total,
        successRate: Number(((prev.verifiedCount / total) * 100).toFixed(1)),
      };
    });

    return {
      success: true,
      demoOtp,
      expiresAt,
      resendAvailableAt,
    };
  };

  const verifyOtp = (mobile: string, otp: string) => {
    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    const cleanOtp = otp.trim().replace(/\D/g, '');

    if (!activeOtpSession || activeOtpSession.mobile !== cleanMobile) {
      return {
        success: false,
        error: 'No active OTP session found for this mobile number. Please click Send OTP.',
      };
    }

    if (Date.now() > activeOtpSession.expiresAt) {
      return {
        success: false,
        error: 'OTP has expired (2 min limit). Please click Resend OTP.',
      };
    }

    if (activeOtpSession.attemptsRemaining <= 0) {
      return {
        success: false,
        error: 'Maximum OTP verification attempts exceeded. Please request a new OTP.',
      };
    }

    if (cleanOtp !== activeOtpSession.otp) {
      const remaining = activeOtpSession.attemptsRemaining - 1;
      setActiveOtpSession((prev) => (prev ? { ...prev, attemptsRemaining: remaining } : null));

      setOtpStats((prev) => {
        const failed = prev.failedAttempts + 1;
        return { ...prev, failedAttempts: failed };
      });

      return {
        success: false,
        error:
          remaining > 0
            ? `Incorrect OTP entered. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
            : 'Maximum OTP verification attempts exceeded. Please request a new OTP.',
      };
    }

    // Correct OTP
    let matchedFarmer = farmers.find(
      (f) => (f.mobile || '').replace(/\D/g, '').slice(-10) === cleanMobile
    );

    if (matchedFarmer) {
      const updatedFarmer: Farmer = {
        ...matchedFarmer,
        isVerified: true,
        isMobileVerified: true,
        verifiedAt: new Date().toISOString(),
        smsPreferences: matchedFarmer.smsPreferences || DEFAULT_SMS_PREFERENCES,
      };
      setFarmers((prev) => prev.map((f) => (f.id === updatedFarmer.id ? updatedFarmer : f)));
      setCurrentFarmerId(updatedFarmer.id);
      setRole('farmer');
      matchedFarmer = updatedFarmer;
    }

    setOtpStats((prev) => {
      const verified = prev.verifiedCount + 1;
      const unverified = Math.max(0, prev.unverifiedCount - 1);
      return {
        ...prev,
        verifiedCount: verified,
        unverifiedCount: unverified,
        successRate: Number(((verified / prev.totalRequested) * 100).toFixed(1)),
      };
    });

    setActiveOtpSession(null);
    return { success: true, farmer: matchedFarmer };
  };

  const resendOtp = (mobile: string) => {
    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    return sendOtp(cleanMobile, activeOtpSession?.purpose || 'LOGIN');
  };

  const clearOtpSession = () => {
    setActiveOtpSession(null);
  };

  const updateFarmerPreferences = (
    farmerId: string,
    channels: { app: boolean; sms: boolean; whatsapp: boolean }
  ) => {
    setFarmers((prev) =>
      prev.map((f) =>
        f.id === farmerId
          ? {
              ...f,
              notificationChannels: channels,
            }
          : f
      )
    );
  };

  const updateFarmerSmsPreferences = (farmerId: string, prefs: Partial<FarmerSmsPreferences>) => {
    setFarmers((prev) =>
      prev.map((f) => {
        if (f.id === farmerId) {
          const merged: FarmerSmsPreferences = {
            ...(f.smsPreferences || DEFAULT_SMS_PREFERENCES),
            ...prefs,
          };
          return { ...f, smsPreferences: merged };
        }
        return f;
      })
    );
  };

  const addNotification = (
    farmerId: string,
    title: string,
    message: string,
    type: AppNotification['type'],
    priorityOverride?: SmsPriority,
    contextData?: {
      token?: string;
      centreName?: string;
      timeSlot?: string;
      date?: string;
      farmersAhead?: number;
      waitMins?: number;
      actualWeight?: number;
      amount?: number;
      refNo?: string;
    }
  ) => {
    const priority = priorityOverride || smartSmsEngine.determinePriority(type as any, title, message);
    const targetFarmer =
      farmers.find((f) => f.id === farmerId) ||
      (currentFarmer && currentFarmer.id === farmerId ? currentFarmer : undefined);

    const conciseSms = smartSmsEngine.formatSmsMessage({
      type,
      title,
      message,
      token: contextData?.token,
      centreName: contextData?.centreName,
      timeSlot: contextData?.timeSlot,
      date: contextData?.date,
      farmersAhead: contextData?.farmersAhead,
      waitMins: contextData?.waitMins,
      actualWeight: contextData?.actualWeight,
      amount: contextData?.amount,
      refNo: contextData?.refNo,
    });

    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let initialSmsStatus: SmsStatus = 'NOT_CONFIGURED';
    let smsSent = false;

    if (targetFarmer && targetFarmer.mobile) {
      const prefs = targetFarmer.smsPreferences || DEFAULT_SMS_PREFERENCES;
      const shouldSend = smartSmsEngine.shouldSendSms(priority, type, prefs);

      if (shouldSend) {
        initialSmsStatus = isOnline
          ? smartSmsEngine.getMode() === 'DEMO'
            ? 'DEMO SENT'
            : 'SENDING'
          : 'QUEUED';
        smsSent = isOnline;

        // Asynchronously dispatch via smart SMS engine
        smartSmsEngine
          .dispatchSms({
            farmerId,
            farmerName: targetFarmer.name,
            mobile: targetFarmer.mobile,
            notificationType: type,
            priority,
            title,
            message: conciseSms,
            preferences: prefs,
            isOnline,
          })
          .then((res) => {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === notifId
                  ? {
                      ...n,
                      smsSent: res.sent,
                      smsStatus: res.status,
                      smsDelivered: res.sent,
                    }
                  : n
              )
            );
          });
      }
    }

    const newNotif: AppNotification = {
      id: notifId,
      farmerId,
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString(),
      smsDelivered: smsSent,
      smsSent,
      smsStatus: initialSmsStatus,
      smsMessage: conciseSms,
      priority,
      channels: {
        inApp: true,
        sms: smsSent || initialSmsStatus === 'DEMO SENT' || initialSmsStatus === 'QUEUED',
        whatsapp: targetFarmer?.notificationChannels?.whatsapp ?? false,
      },
    };

    setNotifications((prev) => [newNotif, ...prev]);
  };

  const sendManualSms = async (params: {
    mobile: string;
    message: string;
    notificationType?: any;
    priority?: SmsPriority;
    farmerId?: string;
  }) => {
    const res = await smartSmsEngine.dispatchSms({
      farmerId: params.farmerId || currentFarmer.id,
      mobile: params.mobile,
      notificationType: params.notificationType || 'ALERT',
      priority: params.priority || 'URGENT',
      title: 'Mandi Official Alert',
      message: params.message,
      isOnline,
    });
    return { success: res.sent, status: res.status, error: res.reason };
  };

  const sendMandiOfficialSms = (params: {
    centreId: string;
    target: 'ALL_WAITING' | 'TOKEN' | 'DELAY' | 'EMERGENCY' | 'GATE';
    token?: string;
    customMessage?: string;
    delayMins?: number;
    title?: string;
  }) => {
    const centre = centres.find((c) => c.id === params.centreId) || centres[0];
    const centreName = centre?.name?.split(',')[0] || 'Mandi Yard';

    let targets: Booking[] = [];
    if (params.target === 'TOKEN' && params.token) {
      targets = bookings.filter((b) => b.centreId === params.centreId && b.token === params.token);
    } else if (params.target === 'ALL_WAITING') {
      targets = bookings.filter(
        (b) => b.centreId === params.centreId && (b.status === 'WAITING' || b.status === 'ARRIVED')
      );
    } else if (params.target === 'DELAY') {
      targets = bookings.filter(
        (b) =>
          b.centreId === params.centreId &&
          (b.status === 'WAITING' || b.status === 'ARRIVED' || b.status === 'BOOKED')
      );
    } else if (params.target === 'EMERGENCY') {
      targets = bookings.filter((b) => b.centreId === params.centreId);
    } else if (params.target === 'GATE') {
      targets = bookings
        .filter((b) => b.centreId === params.centreId && (b.status === 'ARRIVED' || b.status === 'WAITING'))
        .slice(0, 1);
    }

    if (targets.length === 0) {
      // Send to current farmer as demo recipient
      addNotification(
        currentFarmer.id,
        params.title || `Mandi Alert: ${centreName}`,
        params.customMessage || `Important operational update from ${centreName} for all incoming farmers.`,
        'ALERT',
        'URGENT',
        { centreName, waitMins: params.delayMins }
      );
      return {
        success: true,
        recipientCount: 1,
        message: `Dispatched broadcast SMS to registered test mobile.`,
      };
    }

    targets.forEach((b) => {
      const text =
        params.customMessage ||
        (params.target === 'DELAY'
          ? `Slots at ${centreName} are shifted by +${params.delayMins || 15} mins due to yard operations.`
          : params.target === 'GATE'
          ? `Token ${b.token}: Please proceed to Gate No. 1 / Weighbridge Counter immediately.`
          : `Official advisory from ${centreName}: Please keep transit documents ready.`);

      addNotification(
        b.farmerId,
        params.title || `Official Mandi Alert: ${centreName}`,
        text,
        params.target === 'GATE' ? 'QUEUE' : 'ALERT',
        'URGENT',
        { token: b.token, centreName, waitMins: params.delayMins }
      );
    });

    return {
      success: true,
      recipientCount: targets.length,
      message: `SMS dispatched successfully to ${targets.length} farmer(s) using their linked mobile.`,
    };
  };

  const flushOfflineSms = async () => {
    return await smartSmsEngine.flushQueuedMessages();
  };

  const smsMetrics = smartSmsEngine.getMetrics();

  const getFarmerActiveBooking = (farmerId: string) => {
    const farmerBookings = bookings.filter((b) => b.farmerId === farmerId);
    if (farmerBookings.length === 0) return undefined;

    // Return only active ongoing appointments (NOT cancelled, NOT no-show, NOT completed/paid)
    const active = farmerBookings.find(
      (b) =>
        b.status === 'WAITING' ||
        b.status === 'BOOKED' ||
        b.status === 'ARRIVED' ||
        b.status === 'VERIFYING' ||
        b.status === 'PROCESSING' ||
        b.status === 'WEIGHING' ||
        b.status === 'PAYMENT_PROCESSING'
    );
    return active;
  };

  const getCentreActiveBookings = (centreId: string) => {
    return bookings.filter((b) => b.centreId === centreId);
  };

  const getFarmerQueueStats = (bookingId: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) {
      return {
        currentServingToken: 'P098',
        position: 0,
        farmersAhead: 0,
        estimatedWaitMins: 0,
        avgProcessingTimeMins: 7,
      };
    }

    const centre = centres.find((c) => c.id === targetBooking.centreId);
    const avgTime = centre?.avgProcessingTimeMins || 7;
    const currentServingToken = centre?.currentServingToken || 'P098';

    // Active queue: bookings in WAITING, ARRIVED, VERIFYING, PROCESSING
    const queueStatuses: BookingStatus[] = ['WAITING', 'ARRIVED', 'VERIFYING', 'PROCESSING'];
    const activeQueue = bookings
      .filter((b) => b.centreId === targetBooking.centreId && queueStatuses.includes(b.status))
      .sort((a, b) => a.token.localeCompare(b.token));

    const targetIndex = activeQueue.findIndex((b) => b.id === targetBooking.id);

    if (targetIndex === -1) {
      return {
        currentServingToken,
        position: 1,
        farmersAhead: 0,
        estimatedWaitMins: 0,
        avgProcessingTimeMins: avgTime,
      };
    }

    // Farmers strictly ahead of this booking in the active queue
    const farmersAhead = targetIndex;
    const position = targetIndex + 1;
    const estimatedWaitMins = farmersAhead * avgTime;

    return {
      currentServingToken,
      position,
      farmersAhead,
      estimatedWaitMins,
      avgProcessingTimeMins: avgTime,
    };
  };

  // Smart slot recommendation algorithm (Rule-Based as requested in prompt #8 & reactive to current origin)
  const getSmartRecommendation = (centreId?: string, crop?: string, quantity?: number): SmartRecommendation => {
    let primaryCentre: ProcurementCentre | undefined;
    if (centreId) {
      primaryCentre = centres.find((c) => c.id === centreId);
    }
    if (!primaryCentre) {
      const comp = getCentresComparison({
        farmerCoords: {
          lat: farmerLocation?.lat ?? 28.5750,
          lng: farmerLocation?.lng ?? 76.9200,
        },
        centres,
        slots,
        crop: crop || currentFarmer.crop,
      });
      primaryCentre = comp?.bestCentre?.centre || centres[0];
    }

    const centreSlots = slots.filter((s) => s.centreId === primaryCentre.id && s.bookedCount < s.capacity);

    // Pick slot with lowest booking percentage to balance workload
    const bestSlot =
      centreSlots.sort((a, b) => (a.bookedCount / a.capacity) - (b.bookedCount / b.capacity))[0] ||
      slots.find((s) => s.centreId === primaryCentre.id) ||
      slots[0];

    const currentLoad = primaryCentre.currentLoad ?? Math.round((bestSlot.bookedCount / (bestSlot.capacity || 20)) * 100);
    const queueInfo = calculateCentreQueue(primaryCentre);
    const estimatedWaitMins = Math.max(
      10,
      queueInfo.currentWaitMins ||
        primaryCentre.estimatedWaitMins ||
        Math.round((bestSlot.bookedCount / (primaryCentre.activeCounters || 4)) * (primaryCentre.avgProcessingTimeMins || 6))
    );
    const openSlotsCount = slots.filter((s) => s.centreId === primaryCentre.id && s.bookedCount < s.capacity).length;

    // Find regional/nearby alternative centre with lower load or faster clearance relative to current farmer location
    const safeFarmerCoords = {
      lat: farmerLocation?.lat ?? 28.5750,
      lng: farmerLocation?.lng ?? 76.9200,
    };
    const otherCentres = centres
      .filter((c) => c.id !== primaryCentre.id && c.status !== 'CLOSED')
      .map((c) => {
        const safeCoords = c.coordinates || { lat: 28.6128, lng: 76.9856 };
        const dist = calculateDistanceKm(safeFarmerCoords, safeCoords);
        return { centre: c, dist };
      })
      .sort((a, b) => a.dist - b.dist);

    const localPool = otherCentres.filter((c) => c.dist <= 50);
    const regionalPool = otherCentres.filter((c) => c.dist <= 180);
    const candidatePool = localPool.length > 0 ? localPool : (regionalPool.length > 0 ? regionalPool : otherCentres.slice(0, 3));
    const altItem = candidatePool.sort((a, b) => a.centre.currentLoad - b.centre.currentLoad)[0];
    const altCentre = altItem ? altItem.centre : undefined;

    const altSlots = altCentre ? slots.filter((s) => s.centreId === altCentre.id && s.bookedCount < s.capacity) : [];
    const bestAltSlot = altSlots[0] || (altCentre ? slots.find((s) => s.centreId === altCentre.id) : undefined);

    return {
      recommendedSlot: {
        slotId: bestSlot.id,
        centreId: primaryCentre.id,
        centreName: primaryCentre.name,
        date: bestSlot.date,
        timeSlot: `${bestSlot.startTime} - ${bestSlot.endTime}`,
        currentLoad,
        estimatedWaitMins,
        reason: `Optimal capacity window at ${primaryCentre.name.split(',')[0]} with ${openSlotsCount} open slots and active weighing counters.`,
      },
      alternativeCentre: altCentre && bestAltSlot
        ? {
            centreId: altCentre.id,
            centreName: altCentre.name,
            date: bestAltSlot.date,
            timeSlot: `${bestAltSlot.startTime} - ${bestAltSlot.endTime}`,
            currentLoad: altCentre.currentLoad,
            estimatedWaitMins: Math.max(10, Math.round((altCentre.currentLoad / 100) * (altCentre.avgProcessingTimeMins || 6) * 3)),
            reason: `Currently at ${altCentre.currentLoad}% load with ~${altCentre.avgProcessingTimeMins} min processing time. Nearby alternative with lower congestion.`,
          }
        : undefined,
    };
  };

  const bookSlot = ({
    farmerId,
    crop,
    quantity,
    centreId,
    date,
    slotId,
    replaceExisting = false,
  }: {
    farmerId: string;
    crop: string;
    quantity: number;
    centreId: string;
    date: string;
    slotId: string;
    replaceExisting?: boolean;
  }) => {
    // Check slot
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return { success: false, error: 'Selected time slot does not exist.' };
    if (slot.bookedCount >= slot.capacity) {
      return { success: false, error: 'This slot is full. Please choose another available slot.' };
    }

    // Check duplicate active booking
    const activeBooking = bookings.find(
      (b) =>
        b.farmerId === farmerId &&
        b.date === date &&
        (b.status === 'BOOKED' || b.status === 'WAITING' || b.status === 'ARRIVED' || b.status === 'PROCESSING')
    );
    if (activeBooking) {
      if (replaceExisting) {
        // Cancel the prior active booking to replace it
        setBookings((prev) =>
          prev.map((b) => (b.id === activeBooking.id ? { ...b, status: 'CANCELLED' } : b))
        );
        setSlots((prev) =>
          prev.map((s) =>
            s.id === activeBooking.slotId ? { ...s, bookedCount: Math.max(0, s.bookedCount - 1) } : s
          )
        );
        addNotification(
          farmerId,
          'Prior Appointment Replaced',
          `Your prior appointment (Token ${activeBooking.token}) was cancelled to book your new slot.`,
          'ALERT'
        );
      } else {
        return {
          success: false,
          error: `You already have an active appointment (Token ${activeBooking.token}) on this date. You can cancel it or click "Replace Existing Slot" to rebook.`,
        };
      }
    }

    const farmer = farmers.find((f) => f.id === farmerId) || currentFarmer;
    const centre = centres.find((c) => c.id === centreId) || centres[0];

    // Calculate transit and arrival schedule from farmer location
    const safeFarmerCoords = {
      lat: farmerLocation?.lat ?? 28.5750,
      lng: farmerLocation?.lng ?? 76.9200,
    };
    const safeCentreCoords = centre.coordinates && typeof centre.coordinates.lat === 'number'
      ? centre.coordinates
      : { lat: 28.6128, lng: 76.9856 };
    const distKm = calculateDistanceKm(safeFarmerCoords, safeCentreCoords);
    const transitMins = estimateTravelTimeMins(distKm);
    const arrivalSchedule = calculateArrivalSchedule(slot.startTime, transitMins);

    // Generate token: prefix based on centre code, e.g. P107, N043, etc.
    const prefix = centre.id === 'centre-1' ? 'P' : centre.id === 'centre-2' ? 'N' : centre.id === 'centre-3' ? 'S' : 'E';
    const centreTokens = bookings
      .filter((b) => b.token.startsWith(prefix))
      .map((b) => parseInt(b.token.replace(prefix, ''), 10))
      .filter((num) => !isNaN(num));
    const nextNum = (centreTokens.length > 0 ? Math.max(...centreTokens) : 100) + 1;
    const token = `${prefix}${String(nextNum).padStart(3, '0')}`;

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      farmerId: farmer.id,
      farmerName: farmer.name,
      farmerCode: farmer.farmerId,
      farmerMobile: farmer.mobile,
      centreId: centre.id,
      centreName: centre.name,
      slotId: slot.id,
      date,
      timeSlot: `${slot.startTime} - ${slot.endTime}`,
      token,
      crop,
      bookedQuantity: quantity,
      status: 'WAITING',
      createdAt: new Date().toISOString(),
      distanceKm: distKm,
      travelTimeMins: transitMins,
      recommendedArrivalTime: arrivalSchedule.recommendedArrivalTime,
      recommendedDepartureTime: arrivalSchedule.recommendedDepartureTime,
      arrivalReason: arrivalSchedule.reason,
    };

    // Update slot booked count
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, bookedCount: s.bookedCount + 1 } : s))
    );

    // Add booking
    setBookings((prev) => [...prev, newBooking]);

    // Keep active official centre in sync with latest booking activity
    setActiveOfficialCentreId(centreId);

    // Recalculate centre load
    const updatedBooked = slot.bookedCount + 1;
    const newLoad = Math.min(100, Math.round((updatedBooked / slot.capacity) * 100));
    setCentres((prev) =>
      prev.map((c) => (c.id === centreId ? { ...c, currentLoad: Math.max(c.currentLoad, newLoad) } : c))
    );

    // Send in-app notification & SMS
    addNotification(
      farmer.id,
      'Booking Confirmed with Travel Schedule',
      `Your procurement slot is confirmed at ${centre.name.split(',')[0]} (Token: ${token}). Distance: ${distKm} km (~${transitMins}m transit). Recommended arrival: ${arrivalSchedule.recommendedArrivalTime} (leave by ${arrivalSchedule.recommendedDepartureTime}).`,
      'BOOKING'
    );

    return { success: true, booking: newBooking };
  };

  const callNextToken = (centreId: string): Booking | null => {
    // Find next WAITING or ARRIVED booking in this centre
    const nextInQueue = bookings.find(
      (b) => b.centreId === centreId && (b.status === 'ARRIVED' || b.status === 'WAITING')
    );

    if (!nextInQueue) return null;

    // Update centre current serving token
    setCentres((prev) =>
      prev.map((c) => (c.id === centreId ? { ...c, currentServingToken: nextInQueue.token } : c))
    );

    // Update booking status to PROCESSING
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === nextInQueue.id) {
          return { ...b, status: 'PROCESSING', arrivedAt: b.arrivedAt || new Date().toISOString() };
        }
        if (b.centreId === centreId && b.status === 'PROCESSING') {
          return { ...b, status: 'COMPLETED' };
        }
        return b;
      })
    );

    // Send notification to the called farmer
    addNotification(
      nextInQueue.farmerId,
      'Your Turn is NOW SERVING!',
      `Token ${nextInQueue.token}: Your turn has been called at Counter #1. Please move your vehicle to Weighbridge Bay A.`,
      'QUEUE'
    );

    // Check upcoming farmers (e.g. 3 ahead) and notify them
    const subsequent = bookings
      .filter((b) => b.centreId === centreId && b.status === 'WAITING' && b.id !== nextInQueue.id)
      .slice(0, 2);

    subsequent.forEach((b, idx) => {
      addNotification(
        b.farmerId,
        'Queue Reminder: Turn Approaching',
        `Your turn is approaching. There are ${idx + 1} farmers ahead of your token ${b.token}. Please be ready near the Mandi gate.`,
        'QUEUE'
      );
    });

    return nextInQueue;
  };

  const markArrived = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'ARRIVED', arrivedAt: new Date().toISOString() } : b
      )
    );

    addNotification(
      booking.farmerId,
      'Arrival Checked In',
      `Gate entry recorded for Token ${booking.token}. You are now in the active weighing queue.`,
      'QUEUE'
    );
  };

  const startVerification = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'VERIFYING' } : b))
    );
    const b = bookings.find((item) => item.id === bookingId);
    if (b) {
      addNotification(
        b.farmerId,
        'Verification Started',
        `Verification has commenced for Token ${b.token} (${b.crop}). Identity and gate pass verified.`,
        'QUEUE'
      );
    }
  };

  const startWeighing = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'WEIGHING' } : b))
    );
    const b = bookings.find((item) => item.id === bookingId);
    if (b) {
      addNotification(
        b.farmerId,
        'Weighing In Progress',
        `Your vehicle/lot for Token ${b.token} has been directed to the Electronic Weighbridge.`,
        'PROCUREMENT'
      );
    }
  };

  const startQualityCheck = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'QUALITY_CHECK' } : b))
    );
    const b = bookings.find((item) => item.id === bookingId);
    if (b) {
      addNotification(
        b.farmerId,
        'Quality Check In Progress',
        `Grain sampling and digital moisture probe testing is currently underway for Token ${b.token}.`,
        'PROCUREMENT'
      );
    }
  };

  const completeProcurement = ({
    bookingId,
    actualWeight,
    grossWeight,
    tareWeight,
    qualityGrade,
    qualityStatus = 'ACCEPTABLE',
    moisturePercentage,
    remarks = 'Passed FAQ standard specifications.',
    operatorName = 'Mandi Official Weighmaster',
    verifiedBy = 'Rajesh Sharma (Mandi Officer #01)',
  }: {
    bookingId: string;
    actualWeight: number;
    grossWeight?: number;
    tareWeight?: number;
    qualityGrade: 'Grade A' | 'Common / FAQ' | 'Grade B' | string;
    qualityStatus?: 'ACCEPTABLE' | 'VERIFICATION_NEEDED' | 'REJECTED';
    moisturePercentage: number;
    remarks?: string;
    operatorName?: string;
    verifiedBy?: string;
  }) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const cropObj =
      CROP_PRICES.find((c) => c.name.toLowerCase().includes(booking.crop.toLowerCase())) ||
      CROP_PRICES[0];
    const ratePerQuintal = cropObj.mspPerQuintal;

    const calcTare = tareWeight !== undefined ? tareWeight : 12;
    const calcGross = grossWeight !== undefined ? grossWeight : actualWeight + calcTare;
    const netWeight = actualWeight;

    // Calculation: weight in kg -> quintals (100 kg = 1 quintal)
    const quintals = netWeight / 100;
    const grossAmount = Math.round(quintals * ratePerQuintal * 100) / 100;
    const deductions = 0;
    const netPayable = grossAmount - deductions;

    const tokenNum = booking.token.replace(/\D/g, '') || '104';
    const procId = `proc-${Date.now()}`;
    const payId = `pay-${Date.now()}`;
    const weighSlip = `WS-2026-${tokenNum}-001`;
    const procRef = `PROC-2026-${tokenNum}`;
    const txnId = `PAY-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newProcurement: Procurement = {
      id: procId,
      bookingId: booking.id,
      token: booking.token,
      farmerId: booking.farmerId,
      farmerName: booking.farmerName,
      centreName: booking.centreName,
      crop: booking.crop,
      bookedWeight: booking.bookedQuantity,
      grossWeight: calcGross,
      tareWeight: calcTare,
      actualWeight: netWeight,
      ratePerQuintal,
      expectedAmount: netPayable,
      grossAmount,
      deductions,
      netPayable,
      verificationStatus: qualityStatus === 'REJECTED' ? 'REJECTED' : 'VERIFIED',
      qualityGrade,
      qualityStatus,
      moisture: moisturePercentage,
      weighmentSlipNo: weighSlip,
      procurementRefId: procRef,
      verifiedBy,
      operatorName,
      remarks,
      weighingDate: dateStr,
      weighingTime: timeStr,
      completedAt: now.toISOString(),
    };

    const newPayment: Payment = {
      id: payId,
      procurementId: procId,
      procurementRefId: procRef,
      bookingId: booking.id,
      farmerId: booking.farmerId,
      farmerName: booking.farmerName,
      amount: netPayable,
      approvedAmount: netPayable,
      status: 'PROCESSING',
      transactionId: txnId,
      accountMasked: '•••• •••• 4829',
      ifscCode: 'SBIN0001423',
      paymentMethod: 'DBT Direct Credit (PFMS / NPCI)',
      initiatedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Update booking
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'COMPLETED',
              actualWeight: netWeight,
              grossWeight: calcGross,
              tareWeight: calcTare,
              qualityGrade,
              qualityStatus,
              moisturePercentage,
              completedAt: now.toISOString(),
              remarks,
              paymentId: payId,
              procurementRefId: procRef,
              weighingSlipId: weighSlip,
            }
          : b
      )
    );

    setProcurements((prev) => [newProcurement, ...prev]);
    setPayments((prev) => [newPayment, ...prev]);

    // Send notifications
    addNotification(
      booking.farmerId,
      'Weighing Completed',
      `Your weighing has been completed. Net accepted quantity: ${netWeight} kg (${booking.crop}). Weighing Slip: ${weighSlip}.`,
      'PROCUREMENT'
    );

    addNotification(
      booking.farmerId,
      'Procurement Complete',
      `Your procurement is complete. Procurement reference ${procRef} has been generated. Approved value: ₹${netPayable.toLocaleString('en-IN')}.`,
      'PROCUREMENT'
    );

    addNotification(
      booking.farmerId,
      'Payment Initiated',
      `Payment initiated. Your payment of ₹${netPayable.toLocaleString('en-IN')} is being processed via DBT. Ref: ${txnId}.`,
      'PAYMENT'
    );

    notificationService.sendSMS({
      mobile: booking.farmerMobile,
      message: `SmartProcure: Procurement COMPLETED for Token ${booking.token}. Slip: ${weighSlip}. Net: ${netWeight}kg. Amount: ₹${netPayable.toLocaleString('en-IN')}. Ref: ${procRef}`,
    });

    return { procurement: newProcurement, payment: newPayment };
  };

  const initiatePayment = (bookingOrPaymentId: string) => {
    const targetBooking = bookings.find(
      (b) => b.id === bookingOrPaymentId || b.paymentId === bookingOrPaymentId
    );
    const targetPayment = payments.find(
      (p) => p.id === bookingOrPaymentId || p.bookingId === bookingOrPaymentId
    );

    if (targetPayment) {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === targetPayment.id
            ? { ...p, status: 'PROCESSING', updatedAt: new Date().toISOString() }
            : p
        )
      );
    }

    if (targetBooking) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === targetBooking.id ? { ...b, status: 'PAYMENT_PROCESSING' } : b
        )
      );
      addNotification(
        targetBooking.farmerId,
        'Payment Processing',
        `Payment request ${targetPayment?.transactionId || 'DBT'} is now queued for Treasury batch clearance.`,
        'PAYMENT'
      );
    }
  };

  const disbursePayment = ({
    paymentId,
    bookingId,
    approvedAmount,
    paymentMethod,
    bankRefNo,
    disbursementDate,
    disbursementTime,
  }: {
    paymentId?: string;
    bookingId?: string;
    approvedAmount?: number;
    paymentMethod?: string;
    bankRefNo?: string;
    disbursementDate?: string;
    disbursementTime?: string;
  }) => {
    const now = new Date();
    const dateStr =
      disbursementDate ||
      now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr =
      disbursementTime ||
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const existingPayment = payments.find(
      (p) =>
        (paymentId && (p.id === paymentId || p.bookingId === paymentId)) ||
        (bookingId && p.bookingId === bookingId)
    );
    const targetBookingId = bookingId || existingPayment?.bookingId || paymentId;
    const targetBooking = bookings.find(
      (b) =>
        b.id === targetBookingId ||
        (paymentId && (b.id === paymentId || b.paymentId === paymentId))
    );

    let targetFarmerId = targetBooking?.farmerId || existingPayment?.farmerId || 'farmer-1';
    let targetAmount =
      approvedAmount ||
      existingPayment?.amount ||
      (targetBooking
        ? Math.round(((targetBooking.actualWeight || targetBooking.bookedQuantity) / 100) * 2300)
        : 0);
    const finalBankRefNo = bankRefNo || existingPayment?.bankRefNo || `UTR${Date.now().toString().slice(-8)}`;

    setPayments((prev) => {
      const hasPayment = prev.some(
        (p) =>
          (paymentId && (p.id === paymentId || p.bookingId === paymentId)) ||
          (targetBookingId && p.bookingId === targetBookingId)
      );
      if (hasPayment) {
        return prev.map((p) => {
          if (
            (paymentId && (p.id === paymentId || p.bookingId === paymentId)) ||
            (targetBookingId && p.bookingId === targetBookingId)
          ) {
            targetFarmerId = p.farmerId;
            targetAmount = approvedAmount || p.amount;
            return {
              ...p,
              status: 'PAID',
              amount: approvedAmount || p.amount,
              approvedAmount: approvedAmount || p.amount,
              paymentMethod: paymentMethod || p.paymentMethod,
              bankRefNo: finalBankRefNo,
              disbursedAt: now.toISOString(),
              disbursedDate: dateStr,
              disbursedTime: timeStr,
              updatedAt: now.toISOString(),
            };
          }
          return p;
        });
      } else if (targetBooking) {
        const newPayment: Payment = {
          id: paymentId || `pay-${targetBooking.id}`,
          procurementId: `proc-${targetBooking.id}`,
          procurementRefId: `PROC-2026-${targetBooking.token}`,
          bookingId: targetBooking.id,
          farmerId: targetBooking.farmerId,
          farmerName: targetBooking.farmerName,
          amount: targetAmount,
          approvedAmount: targetAmount,
          status: 'PAID',
          transactionId: `PAY-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          accountMasked: '•••• •••• ' + (targetBooking.farmerMobile?.slice(-4) || '5512'),
          ifscCode: 'SBIN0020194',
          paymentMethod: paymentMethod || 'DBT Direct Credit (PFMS)',
          bankRefNo: finalBankRefNo,
          initiatedAt: now.toISOString(),
          disbursedAt: now.toISOString(),
          disbursedDate: dateStr,
          disbursedTime: timeStr,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        return [...prev, newPayment];
      }
      return prev;
    });

    setBookings((prev) =>
      prev.map((b) => {
        if (
          b.id === targetBookingId ||
          (paymentId && (b.id === paymentId || b.paymentId === paymentId)) ||
          (existingPayment && b.id === existingPayment.bookingId)
        ) {
          return { ...b, status: 'PAYMENT_SENT' };
        }
        return b;
      })
    );

    addNotification(
      targetFarmerId,
      'Payment Sent',
      `Your payment of ₹${targetAmount.toLocaleString('en-IN')} has been sent to your bank account. Bank Ref (UTR): ${finalBankRefNo}.`,
      'PAYMENT'
    );

    notificationService.sendSMS({
      mobile: targetBooking?.farmerMobile || '9876543210',
      message: `SmartProcure: Payment of ₹${targetAmount.toLocaleString('en-IN')} has been sent via DBT to your bank account. Bank Ref (UTR): ${finalBankRefNo}. Date: ${dateStr}.`,
    });
  };

  const updatePaymentStatus = (paymentId: string, status: PaymentStatus, bankRefNo?: string) => {
    if (status === 'PAID') {
      disbursePayment({
        paymentId,
        bankRefNo: bankRefNo || `UTR${Date.now().toString().slice(-8)}`,
      });
      return;
    }

    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          return {
            ...p,
            status,
            bankRefNo: bankRefNo || p.bankRefNo,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    const targetPayment = payments.find((p) => p.id === paymentId);
    if (targetPayment) {
      addNotification(
        targetPayment.farmerId,
        `Payment Status: ${status}`,
        `Your payment of ₹${targetPayment.amount.toLocaleString('en-IN')} is now ${status}. Ref: ${targetPayment.transactionId}.`,
        'PAYMENT'
      );
    }
  };

  const markNoShow = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'NO_SHOW' } : b))
    );

    addNotification(
      booking.farmerId,
      'Marked as No-Show',
      `You did not arrive for your scheduled slot (Token ${booking.token}). Please re-book your slot or contact the procurement centre helpline.`,
      'ALERT'
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const registerFarmer = (data: Omit<Farmer, 'id' | 'farmerId'>): Farmer => {
    const newId = `farmer-${Date.now()}`;
    const newFarmerId = `FRM${Math.floor(1010 + Math.random() * 8900)}`;
    const newFarmer: Farmer = {
      id: newId,
      farmerId: newFarmerId,
      ...data,
      isVerified: true,
      isMobileVerified: true,
      verifiedAt: new Date().toISOString(),
      smsPreferences: data.smsPreferences || DEFAULT_SMS_PREFERENCES,
      bankAccountMasked: '•••• •••• ' + Math.floor(1000 + Math.random() * 9000),
      ifscCode: 'SBIN0001090',
      aadhaarMasked: '•••• •••• ' + Math.floor(1000 + Math.random() * 9000),
    };

    setFarmers((prev) => [...prev, newFarmer]);
    setCurrentFarmerId(newId);
    setRole('farmer');

    addNotification(
      newId,
      'Welcome to SmartProcure',
      `Your registration is complete with Farmer ID ${newFarmerId}. Mobile ${data.mobile ? maskIndianMobile(data.mobile) : 'linked'} is verified for instant SMS gate tokens & alerts.`,
      'ALERT',
      'URGENT'
    );

    return newFarmer;
  };

  const cancelBooking = (bookingId: string): { success: boolean; error?: string } => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return { success: false, error: 'Booking not found.' };
    }

    // Set booking status to CANCELLED
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
    );

    // Free up slot capacity
    setSlots((prev) =>
      prev.map((s) =>
        s.id === booking.slotId
          ? { ...s, bookedCount: Math.max(0, s.bookedCount - 1) }
          : s
      )
    );

    // Send Alert Notification
    addNotification(
      booking.farmerId,
      'Appointment Cancelled',
      `Your appointment (Token ${booking.token}) at ${booking.centreName} scheduled for ${booking.date} (${booking.timeSlot}) has been cancelled. You can now book a new appointment.`,
      'ALERT'
    );

    notificationService.sendSMS({
      mobile: booking.farmerMobile,
      message: `SmartProcure: Token ${booking.token} cancelled. You can book a new slot anytime. Ref: #DOCA2026`,
    });

    return { success: true };
  };

  const cancelRegistration = (farmerIdToCancel?: string) => {
    const targetId = farmerIdToCancel || currentFarmer.id;

    // 1. Cancel all active bookings for this farmer
    setBookings((prev) =>
      prev.map((b) => (b.farmerId === targetId ? { ...b, status: 'CANCELLED' } : b))
    );

    // 2. Clear active OTP session
    clearOtpSession();

    // 3. If dynamically created farmer, remove from farmers list
    const isDemo = INITIAL_FARMERS.some((df) => df.id === targetId);
    if (!isDemo) {
      setFarmers((prev) => prev.filter((f) => f.id !== targetId));
    }

    // 4. Reset to default demo farmer and switch role to public
    setCurrentFarmerId('farmer-1');
    setRole('public');

    addNotification(
      targetId,
      'Registration Cancelled',
      'Farmer registration and active bookings have been cancelled. You are returned to the public portal.',
      'ALERT'
    );
  };

  const resetFarmerAppointment = (farmerIdToReset?: string) => {
    const targetId = farmerIdToReset || currentFarmer.id;
    setBookings((prev) =>
      prev.map((b) => (b.farmerId === targetId ? { ...b, status: 'CANCELLED' } : b))
    );
    addNotification(
      targetId,
      'Appointments Cleared',
      'Active appointments have been cleared. You are free to book a new slot for testing.',
      'ALERT'
    );
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        language,
        setLanguage,
        isOnline,
        setIsOnline,
        currentFarmer,
        setCurrentFarmerId,
        setFarmer,
        activeOfficialCentreId,
        setActiveOfficialCentreId,
        farmerLocation,
        setFarmerLocation,
        requestBrowserGpsLocation,
        getCentreIntelligence,
        getAllCentresIntelligence,
        getCentreComparison,
        centres,
        farmers,
        slots,
        bookings,
        procurements,
        payments,
        notifications,
        bookSlot,
        cancelBooking,
        cancelRegistration,
        resetFarmerAppointment,
        getSmartRecommendation,
        callNextToken,
        markArrived,
        startVerification,
        startWeighing,
        startQualityCheck,
        completeProcurement,
        initiatePayment,
        disbursePayment,
        updatePaymentStatus,
        updateBookingStatus,
        markNoShow,
        delaySlot,
        addEmergencySlot,
        updateCentreCapacity,
        addCentre,
        markNotificationRead,
        markAllNotificationsRead,
        registerFarmer,
        resetToDemoData,
        sendOtp,
        verifyOtp,
        resendOtp,
        activeOtpSession,
        clearOtpSession,
        otpStats,
        updateFarmerPreferences,
        smsMode,
        setSmsMode,
        updateFarmerSmsPreferences,
        sendManualSms,
        sendMandiOfficialSms,
        smsMetrics,
        flushOfflineSms,
        getFarmerActiveBooking,
        getFarmerQueueStats,
        getCentreActiveBookings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

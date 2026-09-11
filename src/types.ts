export type UserRole = 'public' | 'farmer' | 'official' | 'admin' | 'login';

export type Language = 'en' | 'hi' | 'te';

export type BookingStatus =
  | 'BOOKED'
  | 'WAITING'
  | 'ARRIVED'
  | 'VERIFYING'
  | 'PROCESSING'
  | 'WEIGHING'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_SENT'
  | 'PAID'
  | 'NO_SHOW'
  | 'CANCELLED';

export type PaymentStatus =
  | 'NOT_INITIATED'
  | 'PROCESSING'
  | 'APPROVED'
  | 'PAYMENT_SENT'
  | 'PAID'
  | 'FAILED';

export type SmsStatus =
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'DEMO SENT'
  | 'FAILED'
  | 'NOT_CONFIGURED';

export type SmsPriority = 'URGENT' | 'IMPORTANT' | 'INFO';

export interface FarmerSmsPreferences {
  enabled: boolean; // Master toggle
  bookingConfirmations: boolean;
  slotReminders: boolean;
  tokenQueueAlerts: boolean;
  gateAlerts: boolean;
  delayCongestionAlerts: boolean;
  procurementUpdates: boolean;
  paymentUpdates: boolean;
  emergencyAlerts: boolean; // Always recommended on
}

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface FarmerLocation {
  lat: number;
  lng: number;
  source: 'registered' | 'gps' | 'manual';
  addressLabel: string;
  village?: string;
  district?: string;
  state?: string;
}

export interface Farmer {
  id: string;
  name: string;
  mobile: string;
  farmerId: string;
  state: string;
  district: string;
  village: string;
  tehsil?: string;
  pincode?: string;
  coordinates?: GeoCoordinates;
  locationSource?: 'registered' | 'gps' | 'manual';
  language?: Language;
  languagePreference?: Language;
  crop: string;
  quantity: number; // in kg
  landAreaAcres?: number;
  preferredCentre?: string;
  bankAccountMasked?: string;
  ifscCode?: string;
  aadhaarMasked?: string;
  isVerified?: boolean;
  verifiedAt?: string;
  isMobileVerified?: boolean;
  smsPreferences?: FarmerSmsPreferences;
  notificationChannels?: {
    app: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  vehicle?: string;
  bookedSlot?: string;
  status?: string;
  queuePosition?: number;
  estWaitTime?: string;
}

export interface ProcurementCentre {
  id: string;
  name: string;
  code: string;
  location: string;
  district: string;
  state: string;
  coordinates: GeoCoordinates;
  operatingHours?: string;
  supportedCrops?: string[];
  totalDailyCapacity?: number; // in quintals/farmers
  capacity: number; // MT or farmers
  currentLoad: number; // percentage e.g. 58
  activeCounters: number;
  avgProcessingTimeMins: number; // e.g. 7
  status: 'AVAILABLE' | 'MODERATE' | 'BUSY' | 'CLOSED';
  contactNumber: string;
  currentServingToken?: string;
  distanceKm?: number;
  travelTimeMins?: number;
  queue?: number;
  estimatedWaitMins?: number;
  availableSlots?: number;
  isDemoCentre?: boolean;
}

export interface Slot {
  id: string;
  centreId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "09:00 AM"
  endTime: string; // e.g. "10:00 AM"
  capacity: number; // max farmers per slot e.g. 20
  bookedCount: number;
}

export interface Booking {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerCode: string;
  farmerMobile: string;
  centreId: string;
  centreName: string;
  slotId: string;
  date: string;
  timeSlot: string;
  token: string; // e.g. "P104"
  crop: string;
  bookedQuantity: number; // in kg
  actualWeight?: number; // in kg (Net)
  grossWeight?: number; // in kg
  tareWeight?: number; // in kg
  qualityGrade?: 'Grade A' | 'Common / FAQ' | 'Grade B' | string;
  moisturePercentage?: number;
  qualityStatus?: 'ACCEPTABLE' | 'VERIFICATION_NEEDED' | 'REJECTED';
  status: BookingStatus;
  createdAt: string;
  arrivedAt?: string;
  completedAt?: string;
  remarks?: string;
  paymentId?: string;
  procurementRefId?: string;
  weighingSlipId?: string;
  isEmergency?: boolean;
  recommendedArrivalTime?: string;
  recommendedDepartureTime?: string;
  arrivalReason?: string;
  distanceKm?: number;
  travelTimeMins?: number;
}

export interface CentreIntelligence {
  centre: ProcurementCentre;
  distanceKm: number;
  travelTimeMins: number;
  currentWaitMins: number;
  queueSize: number;
  yardLoad: number;
  availableSlotsCount: number;
  totalTurnaroundMins: number;
  smartMatchScore: number; // 0 - 100
  scoreBreakdown: {
    travelScore: number;
    waitScore: number;
    loadScore: number;
    capacityScore: number;
    cropScore: number;
  };
  reasons: string[];
  recommendationReasons?: string[];
  isNearest: boolean;
  isBestOverall: boolean;
  recommendedArrivalTime?: string;
  recommendedDepartureTime?: string;
}

export interface CentreComparisonResult {
  nearestCentre: CentreIntelligence;
  bestCentre: CentreIntelligence;
  timeSavingsMins: number;
  distanceDiffKm: number;
  travelDiffMins: number;
  waitSavingsMins: number;
  isDifferentCentre: boolean;
  recommendationNote: string;
}

export interface Procurement {
  id: string;
  bookingId: string;
  token: string;
  farmerId: string;
  farmerName: string;
  farmerMobile?: string;
  farmerAadhaarMasked?: string;
  centreId?: string;
  centreName: string;
  crop: string;
  cropCategory?: string;
  bookedWeight?: number; // in kg
  grossWeight: number; // in kg
  tareWeight: number; // in kg
  actualWeight: number; // net weight in kg
  ratePerQuintal: number;
  expectedAmount?: number;
  grossAmount: number;
  deductions: number;
  netPayable: number;
  verificationStatus?: 'VERIFIED' | 'REJECTED';
  qualityGrade: string;
  qualityStatus?: 'ACCEPTABLE' | 'VERIFICATION_NEEDED' | 'REJECTED';
  moisture: number;
  weighmentSlipNo: string; // e.g. "WS-2026-104-001"
  procurementRefId: string; // e.g. "PROC-2026-104"
  verifiedBy?: string;
  operatorName: string;
  remarks: string;
  weighingDate: string;
  weighingTime: string;
  completedAt: string;
  status?: string;
  weighbridgeId?: string;
}

export interface Payment {
  id: string;
  procurementId: string;
  procurementRefId?: string;
  bookingId: string;
  farmerId: string;
  farmerName: string;
  amount: number;
  approvedAmount: number;
  status: PaymentStatus;
  transactionId: string; // e.g. "PAY-2026-13273"
  bankRefNo?: string; // e.g. "UTR99882210479"
  accountMasked: string;
  ifscCode: string;
  paymentMethod: string;
  initiatedAt?: string;
  disbursedAt?: string;
  disbursedDate?: string;
  disbursedTime?: string;
  isDelayed?: boolean;
  delayReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  farmerId: string;
  title: string;
  message: string;
  type: 'BOOKING' | 'QUEUE' | 'VERIFICATION' | 'PROCUREMENT' | 'PAYMENT' | 'ALERT';
  read: boolean;
  timestamp: string;
  smsDelivered?: boolean;
  smsStatus?: SmsStatus;
  smsSent?: boolean;
  smsMessage?: string;
  priority?: SmsPriority;
  channels?: {
    inApp: boolean;
    sms: boolean;
    whatsapp?: boolean;
  };
}

export interface SmartRecommendation {
  recommendedSlot: {
    slotId: string;
    centreId: string;
    centreName: string;
    date: string;
    timeSlot: string;
    currentLoad: number;
    estimatedWaitMins: number;
    reason: string;
  };
  alternativeCentre?: {
    centreId: string;
    centreName: string;
    date: string;
    timeSlot: string;
    currentLoad: number;
    estimatedWaitMins: number;
    reason: string;
  };
}

export interface CropPrice {
  name: string;
  mspPerQuintal: number;
  category: 'Kharif' | 'Rabi' | 'Commercial' | 'Horticulture';
  icon: string;
}

export interface NotificationDeliveryLog {
  id: string;
  eventId?: string;
  farmerId?: string;
  channel: 'SMS' | 'WHATSAPP';
  recipient: string;
  message: string;
  templateId: string;
  timestamp: string;
  status: SmsStatus | 'DELIVERED (SIMULATED)';
  priority?: SmsPriority;
  notificationType?: string;
  isDemo: boolean;
  error?: string;
}

export interface OtpSession {
  mobile: string;
  otp: string;
  expiresAt: number; // unix timestamp in ms
  resendAvailableAt: number; // unix timestamp in ms
  attemptsRemaining: number;
  purpose: 'LOGIN' | 'REGISTRATION';
}

export interface OtpStats {
  totalRequested: number;
  verifiedCount: number;
  unverifiedCount: number;
  successRate: number; // e.g. 96.8
  failedAttempts: number;
}

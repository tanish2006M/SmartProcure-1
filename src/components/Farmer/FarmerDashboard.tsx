import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../translations';
import { BookingStatus } from '../../types';
import {
  Wheat,
  Clock,
  MapPin,
  Calendar,
  Radio,
  CheckCircle2,
  AlertCircle,
  QrCode,
  CreditCard,
  ArrowRight,
  TrendingUp,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
  Scale,
  FileText,
  Sparkles,
  Bot,
  Compass,
  Navigation,
  Check,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';

interface FarmerDashboardProps {
  onNavigate: (tab: string) => void;
}

type StepStatus = 'COMPLETED' | 'CURRENT' | 'UPCOMING';

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ onNavigate }) => {
  const {
    currentFarmer,
    getFarmerActiveBooking,
    getFarmerQueueStats,
    cancelBooking,
    resetFarmerAppointment,
    language,
    isOnline,
    payments,
    procurements,
  } = useApp();
  const t = translations[language];

  const [showCancelModal, setShowCancelModal] = useState(false);

  const activeBooking = getFarmerActiveBooking(currentFarmer.id);
  const queueStats = activeBooking ? getFarmerQueueStats(activeBooking.id) : null;
  const payment = payments?.find((p) => p.bookingId === activeBooking?.id || p.farmerId === currentFarmer.id);
  const procurement = procurements?.find((p) => p.bookingId === activeBooking?.id || p.farmerId === currentFarmer.id);

  // 10-Stage Farmer Journey (Prompt 8.3 Section 8)
  const getJourneySteps = (): { title: string; status: StepStatus; detail: string }[] => {
    const bStatus = activeBooking?.status;
    const pStatus = payment?.status;
    const isPaid = bStatus === 'PAID' || pStatus === 'PAID';

    if (!activeBooking) {
      return [
        { title: 'Booking', status: 'CURRENT', detail: 'Select crop & slot' },
        { title: 'Gate Arrival', status: 'UPCOMING', detail: 'Entry gate' },
        { title: 'Verification', status: 'UPCOMING', detail: 'Identity & pass' },
        { title: 'Waiting', status: 'UPCOMING', detail: 'Yard queue' },
        { title: 'Weighing', status: 'UPCOMING', detail: 'Weighbridge' },
        { title: 'Quality Check', status: 'UPCOMING', detail: 'Moisture probe' },
        { title: 'Procurement', status: 'UPCOMING', detail: 'Digital receipt' },
        { title: 'Payment Processing', status: 'UPCOMING', detail: 'PFMS clearing' },
        { title: 'Payment Approved', status: 'UPCOMING', detail: 'Treasury sanction' },
        { title: 'Payment Sent', status: 'UPCOMING', detail: 'Direct DBT credit' },
      ];
    }

    if (isPaid) {
      return [
        { title: 'Booking', status: 'COMPLETED', detail: 'Confirmed' },
        { title: 'Gate Arrival', status: 'COMPLETED', detail: 'Checked in' },
        { title: 'Verification', status: 'COMPLETED', detail: 'Verified' },
        { title: 'Waiting', status: 'COMPLETED', detail: 'Completed' },
        { title: 'Weighing', status: 'COMPLETED', detail: 'Weighed' },
        { title: 'Quality Check', status: 'COMPLETED', detail: 'Approved' },
        { title: 'Procurement', status: 'COMPLETED', detail: 'Slip issued' },
        { title: 'Payment Processing', status: 'COMPLETED', detail: 'Cleared' },
        { title: 'Payment Approved', status: 'COMPLETED', detail: 'Approved' },
        { title: 'Payment Sent', status: 'COMPLETED', detail: 'Credited to bank' },
      ];
    }

    if (pStatus === 'APPROVED') {
      return [
        { title: 'Booking', status: 'COMPLETED', detail: 'Confirmed' },
        { title: 'Gate Arrival', status: 'COMPLETED', detail: 'Checked in' },
        { title: 'Verification', status: 'COMPLETED', detail: 'Verified' },
        { title: 'Waiting', status: 'COMPLETED', detail: 'Completed' },
        { title: 'Weighing', status: 'COMPLETED', detail: 'Weighed' },
        { title: 'Quality Check', status: 'COMPLETED', detail: 'Approved' },
        { title: 'Procurement', status: 'COMPLETED', detail: 'Slip issued' },
        { title: 'Payment Processing', status: 'COMPLETED', detail: 'Processed' },
        { title: 'Payment Approved', status: 'CURRENT', detail: 'Treasury sanction' },
        { title: 'Payment Sent', status: 'UPCOMING', detail: 'Awaiting release' },
      ];
    }

    if (bStatus === 'COMPLETED' || bStatus === 'PAYMENT_PROCESSING' || pStatus === 'PROCESSING') {
      return [
        { title: 'Booking', status: 'COMPLETED', detail: 'Confirmed' },
        { title: 'Gate Arrival', status: 'COMPLETED', detail: 'Checked in' },
        { title: 'Verification', status: 'COMPLETED', detail: 'Verified' },
        { title: 'Waiting', status: 'COMPLETED', detail: 'Completed' },
        { title: 'Weighing', status: 'COMPLETED', detail: 'Weighed' },
        { title: 'Quality Check', status: 'COMPLETED', detail: 'Approved' },
        { title: 'Procurement', status: 'COMPLETED', detail: 'Slip issued' },
        { title: 'Payment Processing', status: 'CURRENT', detail: 'PFMS clearing' },
        { title: 'Payment Approved', status: 'UPCOMING', detail: 'Pending' },
        { title: 'Payment Sent', status: 'UPCOMING', detail: 'Pending' },
      ];
    }

    if (bStatus === 'PROCESSING' || bStatus === 'WEIGHING' || bStatus === 'QUALITY_CHECK') {
      const isQuality = bStatus === 'QUALITY_CHECK';
      return [
        { title: 'Booking', status: 'COMPLETED', detail: 'Confirmed' },
        { title: 'Gate Arrival', status: 'COMPLETED', detail: 'Checked in' },
        { title: 'Verification', status: 'COMPLETED', detail: 'Verified' },
        { title: 'Waiting', status: 'COMPLETED', detail: 'Called' },
        { title: 'Weighing', status: isQuality ? 'COMPLETED' : 'CURRENT', detail: 'Weighbridge Bay 1' },
        { title: 'Quality Check', status: isQuality ? 'CURRENT' : 'UPCOMING', detail: 'Moisture probe' },
        { title: 'Procurement', status: 'UPCOMING', detail: 'Pending' },
        { title: 'Payment Processing', status: 'UPCOMING', detail: 'Pending' },
        { title: 'Payment Approved', status: 'UPCOMING', detail: 'Pending' },
        { title: 'Payment Sent', status: 'UPCOMING', detail: 'Pending' },
      ];
    }

    if (bStatus === 'ARRIVED' || bStatus === 'VERIFYING') {
      return [
        { title: 'Booking', status: 'COMPLETED', detail: 'Confirmed' },
        { title: 'Gate Arrival', status: 'COMPLETED', detail: 'Gate No. 4' },
        { title: 'Verification', status: 'CURRENT', detail: 'Identity desk' },
        { title: 'Waiting', status: 'UPCOMING', detail: 'Yard queue' },
        { title: 'Weighing', status: 'UPCOMING', detail: 'Weighbridge' },
        { title: 'Quality Check', status: 'UPCOMING', detail: 'Moisture probe' },
        { title: 'Procurement', status: 'UPCOMING', detail: 'Pending' },
        { title: 'Payment Processing', status: 'UPCOMING', detail: 'Pending' },
        { title: 'Payment Approved', status: 'UPCOMING', detail: 'Pending' },
        { title: 'Payment Sent', status: 'UPCOMING', detail: 'Pending' },
      ];
    }

    if (bStatus === 'WAITING') {
      return [
        { title: 'Booking', status: 'COMPLETED', detail: 'Confirmed' },
        { title: 'Gate Arrival', status: 'COMPLETED', detail: 'Gate pass verified' },
        { title: 'Verification', status: 'COMPLETED', detail: 'Identity cleared' },
        { title: 'Waiting', status: 'CURRENT', detail: `Position #${queueStats?.position || 6}` },
        { title: 'Weighing', status: 'UPCOMING', detail: 'Next in bay' },
        { title: 'Quality Check', status: 'UPCOMING', detail: 'Pending' },
        { title: 'Procurement', status: 'UPCOMING', detail: 'Pending' },
        { title: 'Payment Processing', status: 'UPCOMING', detail: 'Pending' },
        { title: 'Payment Approved', status: 'UPCOMING', detail: 'Pending' },
        { title: 'Payment Sent', status: 'UPCOMING', detail: 'Pending' },
      ];
    }

    // Default: BOOKED
    return [
      { title: 'Booking', status: 'COMPLETED', detail: 'Confirmed' },
      { title: 'Gate Arrival', status: 'CURRENT', detail: 'Expected at slot' },
      { title: 'Verification', status: 'UPCOMING', detail: 'Gate No. 4' },
      { title: 'Waiting', status: 'UPCOMING', detail: 'Holding yard' },
      { title: 'Weighing', status: 'UPCOMING', detail: 'Weighbridge' },
      { title: 'Quality Check', status: 'UPCOMING', detail: 'Moisture probe' },
      { title: 'Procurement', status: 'UPCOMING', detail: 'Receipt' },
      { title: 'Payment Processing', status: 'UPCOMING', detail: 'PFMS' },
      { title: 'Payment Approved', status: 'UPCOMING', detail: 'Treasury' },
      { title: 'Payment Sent', status: 'UPCOMING', detail: 'Direct DBT' },
    ];
  };

  const journeySteps = getJourneySteps();
  const completedCount = journeySteps.filter((s) => s.status === 'COMPLETED').length;

  // "WHAT SHOULD I DO NOW?" stage-aware guidance logic (Prompts 7 & 9)
  const getWhatShouldIDoNow = () => {
    if (!activeBooking) {
      return {
        youAreHere: 'Farmer Portal Home • No active booking scheduled',
        whereToGo: 'Najafgarh Grain Mandi or nearest available procurement centre',
        instructionHeading: 'Book Your Procurement Slot',
        instructionText:
          'You currently do not have a scheduled grain procurement appointment. Book your slot now to receive a guaranteed gate token and avoid waiting in long yard queues.',
        actionLabel: 'Book Procurement Slot',
        actionTarget: 'bookSlot',
        theme: 'emerald',
      };
    }

    const bStatus = activeBooking.status;
    const isPaid = bStatus === 'PAID' || payment?.status === 'PAID';

    if (isPaid) {
      return {
        youAreHere: 'Payment Sent ✓ • Transaction Complete',
        whereToGo: 'Your Aadhaar-linked Bank Account (DBT Credit)',
        instructionHeading: 'Payment Sent. No further action is required.',
        instructionText: `Your grain procurement payment of ₹${(payment?.approvedAmount || payment?.amount || (activeBooking.bookedQuantity * 22.75)).toLocaleString('en-IN')} has been sent directly to your Aadhaar-linked bank account (Bank UTR: ${payment?.bankRefNo || 'UTR889201948'}). You can view or download your official receipt.`,
        actionLabel: 'View Verified Receipt',
        actionTarget: 'payment',
        theme: 'emerald',
      };
    }

    if (bStatus === 'COMPLETED' || bStatus === 'PAYMENT_PROCESSING' || payment?.status === 'PROCESSING') {
      return {
        youAreHere: 'Procurement Slip Verified • Treasury PFMS Clearing',
        whereToGo: 'Procurement completed — you may safely leave the Mandi yard',
        instructionHeading: 'Your procurement is complete. Payment is being processed.',
        instructionText:
          'Electronic weighment and quality analysis have been completed. Your digital weighing slip has been issued. Payment clearance is currently in the government PFMS batch pipeline for direct DBT transfer.',
        actionLabel: 'Track Payment Clearance',
        actionTarget: 'payment',
        theme: 'purple',
      };
    }

    if (bStatus === 'PROCESSING' || bStatus === 'WEIGHING' || bStatus === 'QUALITY_CHECK') {
      return {
        youAreHere: 'Electronic Weighbridge Bay 1 • Turn Called',
        whereToGo: 'Drive vehicle onto Weighbridge Bay A (Main Mandi Yard)',
        instructionHeading: 'Proceed to the weighing counter.',
        instructionText:
          'Your token has been called by the Mandi weighbridge operator! Please drive your vehicle onto Electronic Weighbridge Bay 1 for gross tare weighment and digital moisture probe testing.',
        actionLabel: 'View Weighment Live Status',
        actionTarget: 'procurement',
        theme: 'blue',
      };
    }

    if (bStatus === 'ARRIVED' || bStatus === 'VERIFYING') {
      return {
        youAreHere: 'Mandi Gate No. 4 • Verification Desk',
        whereToGo: 'Check-in Desk at Entry Gate 4 (Najafgarh Grain Mandi)',
        instructionHeading: 'Please present your Gate Pass for verification.',
        instructionText: `Present your Digital Gate Pass QR code along with Farmer ID (${currentFarmer.farmerId}) and Aadhaar card at the gate desk to complete document and land quota verification.`,
        actionLabel: 'Show Digital Gate Pass',
        actionTarget: 'myBooking',
        theme: 'teal',
      };
    }

    if (bStatus === 'WAITING') {
      const farmersAhead = queueStats?.farmersAhead ?? 6;
      const isApproaching = farmersAhead <= 3 && farmersAhead > 0;

      if (isApproaching) {
        return {
          youAreHere: `Yard Queue • Position #${queueStats?.position || 2} (Turn Approaching)`,
          whereToGo: 'Move vehicle toward Gate 2 / Weighbridge Bay A staging lane',
          instructionHeading: 'Your token is approaching. Please move toward Gate 2.',
          instructionText: `Only ${farmersAhead} farmer${farmersAhead > 1 ? 's' : ''} ahead of your token ${activeBooking.token}! Please start your tractor/vehicle and position it near the Weighbridge Bay entry staging lane.`,
          actionLabel: 'View Live Yard Queue',
          actionTarget: 'queue',
          theme: 'amber',
        };
      }

      return {
        youAreHere: `Yard Holding Area • Position #${queueStats?.position || 6} (${farmersAhead} ahead)`,
        whereToGo: 'Farmer Rest Shed #2 / Holding Bay C (Najafgarh Mandi)',
        instructionHeading: 'Please wait in the designated yard area.',
        instructionText: `Current token serving is ${queueStats?.currentServingToken || 'P098'}. There are ${farmersAhead} farmers ahead of your token ${activeBooking.token} with an estimated waiting time of ~${queueStats?.estimatedWaitMins || 42} minutes. Please wait in the holding shed; you will receive an SMS alert when your turn is near.`,
        actionLabel: 'Track Live Queue',
        actionTarget: 'queue',
        theme: 'amber',
      };
    }

    // Default: BOOKED
    return {
      youAreHere: `Scheduled Appointment • Date: ${activeBooking.date} • Slot: ${activeBooking.timeSlot}`,
      whereToGo: `${activeBooking.centreName.split(',')[0]} (Gate No. 4)`,
      instructionHeading: 'Keep your Digital Gate Pass ready.',
      instructionText: `Your appointment is confirmed for ${activeBooking.date} during slot ${activeBooking.timeSlot}. Please arrive around your recommended arrival time and keep your gate pass QR code ready on your phone for expedited check-in.`,
      actionLabel: 'View Digital Gate Pass',
      actionTarget: 'myBooking',
      theme: 'emerald',
    };
  };

  const whatNext = getWhatShouldIDoNow();

  // Procurement & Payment summary strings (Prompt 7 questions 7 & 8)
  const procurementSummary = procurement
    ? `Actual: ${procurement.actualWeight} kg (${procurement.qualityGrade || 'Grade A'} • Moisture: ${procurement.moistureContent || '11.8'}%)`
    : activeBooking
    ? `Booked: ${activeBooking.bookedQuantity} kg ${activeBooking.crop} @ MSP ₹2,275/qtl`
    : 'No active procurement';

  const paymentSummary = isOnline
    ? activeBooking?.status === 'PAID' || payment?.status === 'PAID'
      ? `Payment Sent: ₹${(payment?.approvedAmount || payment?.amount || (activeBooking?.bookedQuantity || 600) * 22.75).toLocaleString('en-IN')} (UTR: ${payment?.bankRefNo || 'UTR889201948'})`
      : activeBooking?.status === 'COMPLETED' || activeBooking?.status === 'PAYMENT_PROCESSING'
      ? `Processing in Treasury batch: ₹${(payment?.amount || (activeBooking?.bookedQuantity || 600) * 22.75).toLocaleString('en-IN')}`
      : `Estimated Gross: ₹${Math.round(((activeBooking?.bookedQuantity || 600) / 100) * 2275).toLocaleString('en-IN')} via DBT`
    : 'Payment details cached locally';

  return (
    <div className="space-y-6">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>OFFLINE MODE: Displaying locally cached appointment pass and token. Changes will sync once reconnected.</span>
          </div>
          <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
            Cached
          </span>
        </div>
      )}

      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 pointer-events-none">
          <Wheat className="w-48 h-48" />
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold mb-2 border border-emerald-600/40 flex-wrap">
              <span className="flex items-center gap-1 text-emerald-100 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Farmer ID: {currentFarmer.farmerId}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">✓ Registered</span>
              </span>
              <span>•</span>
              <span className="text-emerald-100 font-mono">
                {currentFarmer.mobile ? `+91 ******${currentFarmer.mobile.slice(-4)}` : '+91 ******3210'}
                <span className="text-[10px] ml-1 bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-sans">✓ Verified</span>
              </span>
              <span>•</span>
              <span>{currentFarmer.village}, {currentFarmer.district}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              GOOD MORNING, {currentFarmer.name.toUpperCase()} 👋
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200 mt-1 max-w-xl">
              Welcome to the SmartProcure Grain Portal. Track your queue position, view weighing slips, and receive transparent payments.
            </p>
          </div>

          {!activeBooking && (
            <button
              onClick={() => onNavigate('bookSlot')}
              className="px-5 py-3 bg-white text-emerald-950 font-extrabold text-xs rounded-2xl shadow-md hover:bg-emerald-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{t.booking.title}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. "WHAT SHOULD I DO NOW?" & "YOU ARE HERE" (Prompt 8.3 Sections 7 & 9) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500/40 shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <Compass className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <span>YOU ARE HERE</span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <span>{whatNext.youAreHere}</span>
              </h2>
            </div>
          </div>

          {activeBooking && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                TOKEN: <strong className="text-emerald-800 text-xs">{activeBooking.token}</strong>
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase ${
                  activeBooking.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : activeBooking.status === 'COMPLETED'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : activeBooking.status === 'PROCESSING'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {activeBooking.status}
              </span>
            </div>
          )}
        </div>

        {/* Guidance Box: WHAT SHOULD I DO NOW? */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 p-5 rounded-2xl border border-emerald-200/80 mb-5">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs mt-0.5">
              <Navigation className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                  WHAT SHOULD I DO NOW?
                </span>
                <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>Where to go: <strong>{whatNext.whereToGo}</strong></span>
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                {whatNext.instructionHeading}
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {whatNext.instructionText}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => onNavigate(whatNext.actionTarget)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{whatNext.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {activeBooking && (
                  <>
                    <button
                      onClick={() => onNavigate('queue')}
                      className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live Yard Queue</span>
                    </button>
                    <button
                      onClick={() => onNavigate('myBooking')}
                      className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-slate-600" />
                      <span>Gate Pass QR</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    const fab = document.getElementById('smartprocure-ai-fab-button');
                    if (fab) fab.click();
                  }}
                  className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Bot className="w-3.5 h-3.5 text-teal-700" />
                  <span>Ask AI Assistant</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 8 Core Farmer Answers Summary Grid (Prompt 8.3 Section 7) */}
        {activeBooking && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Where is my token?</span>
              <strong className="text-emerald-900 font-mono text-sm block">{activeBooking.token}</strong>
              <span className="text-[11px] text-slate-500">Status: {activeBooking.status}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Queue & Wait</span>
              <strong className="text-amber-950 font-mono text-sm block">#{queueStats?.position || 6} in line</strong>
              <span className="text-[11px] text-slate-500">~{queueStats?.estimatedWaitMins || 42}m wait ({queueStats?.farmersAhead || 6} ahead)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Procurement Status</span>
              <strong className="text-slate-900 text-xs block truncate">{activeBooking.crop} ({activeBooking.bookedQuantity} kg)</strong>
              <span className="text-[11px] text-slate-500 truncate block">MSP ₹2,275/qtl • Verified</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Payment Status</span>
              <strong className={`text-xs block truncate font-bold ${activeBooking.status === 'PAID' ? 'text-emerald-800' : 'text-purple-800'}`}>
                {activeBooking.status === 'PAID' ? 'Payment Sent ✓' : 'Payment Processing'}
              </strong>
              <span className="text-[11px] text-slate-500 truncate block">
                {activeBooking.status === 'PAID' ? 'Credited to Bank (DBT)' : 'PFMS Treasury Clearance'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. 10-STAGE FARMER JOURNEY (Prompt 8.3 Section 8) */}
      {/* Booking ↓ Gate Arrival ↓ Verification ↓ Waiting ↓ Weighing ↓ Quality Check */}
      {/* ↓ Procurement ↓ Payment Processing ↓ Payment Approved ↓ Payment Sent */}
      {/* States: ✓ Completed | ● Current | ○ Upcoming */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>FARMER JOURNEY</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live progression from initial slot booking to direct DBT payment credit in your bank account.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>✓ Completed</span>
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>● Current</span>
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 text-[11px]">
              <span>○ Upcoming</span>
            </span>
          </div>
        </div>

        {/* 10-Step Journey Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
          {journeySteps.map((step, idx) => {
            const isCompleted = step.status === 'COMPLETED';
            const isCurrent = step.status === 'CURRENT';

            return (
              <div
                key={step.title}
                className={`p-3 rounded-2xl border transition-all text-center flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-300 shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50/60 border-slate-200 opacity-70'
                }`}
              >
                {/* Step indicator top */}
                <div className="flex items-center justify-center mb-1.5">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs ring-2 ring-blue-200 animate-pulse">
                      ●
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                      ○
                    </div>
                  )}
                </div>

                <div>
                  <div
                    className={`text-[11px] font-bold leading-tight ${
                      isCurrent
                        ? 'text-blue-950 font-black'
                        : isCompleted
                        ? 'text-emerald-950 font-extrabold'
                        : 'text-slate-600'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                    {step.detail}
                  </div>
                </div>

                <div className="mt-2 pt-1 border-t border-slate-200/60">
                  <span
                    className={`text-[9px] font-extrabold uppercase ${
                      isCompleted
                        ? 'text-emerald-700'
                        : isCurrent
                        ? 'text-blue-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {isCompleted ? '✓ Completed' : isCurrent ? '● Current' : '○ Upcoming'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVE APPOINTMENT PASS & YARD CARD */}
      {/* ========================================================================= */}
      {activeBooking ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex flex-col items-center justify-center font-black text-xl font-mono shadow-xs border border-emerald-300">
                <span className="text-[9px] font-sans font-bold text-emerald-700 tracking-wider">GATE</span>
                <span>{activeBooking.token}</span>
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3 h-3" />
                  <span>YOUR ASSIGNED GATE TOKEN</span>
                </div>
                <h2 className="text-lg font-black text-slate-900">
                  {activeBooking.crop} ({activeBooking.bookedQuantity} kg)
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 uppercase ${
                  activeBooking.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : activeBooking.status === 'COMPLETED'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : activeBooking.status === 'PROCESSING'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    : activeBooking.status === 'ARRIVED'
                    ? 'bg-teal-100 text-teal-900 border border-teal-300'
                    : activeBooking.status === 'NO_SHOW'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>{activeBooking.status}</span>
              </span>

              <button
                onClick={() => setShowCancelModal(true)}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Cancel this appointment to test booking a new one"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Cancel</span>
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Procurement Centre</span>
              </div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                {activeBooking.centreName.split(',')[0]}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Appointment Date</span>
              </div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                {activeBooking.date}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Assigned Slot</span>
              </div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                {activeBooking.timeSlot}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <div className="text-[11px] font-medium text-emerald-800 mb-1 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                <span>Now Serving at Mandi</span>
              </div>
              <div className="font-black text-emerald-950 text-base font-mono">
                {queueStats?.currentServingToken || 'P098'}
              </div>
            </div>
          </div>

          {/* Queue Position & Estimated Wait Metric Blocks */}
          {activeBooking.status !== 'COMPLETED' && activeBooking.status !== 'PAID' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 rounded-2xl border border-amber-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-amber-900 mb-0.5">
                    Your Queue Position
                  </div>
                  <div className="text-2xl font-black text-amber-950 font-mono">
                    #{queueStats?.position || 6}
                  </div>
                  <div className="text-[11px] text-amber-800 font-medium">
                    {queueStats?.farmersAhead || 6} farmers ahead of your token
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Layers className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 rounded-2xl border border-blue-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-blue-900 mb-0.5">
                    Estimated Waiting Time
                  </div>
                  <div className="text-2xl font-black text-blue-950 font-mono">
                    ~{queueStats?.estimatedWaitMins || 42} mins
                  </div>
                  <div className="text-[11px] text-blue-800 font-medium">
                    Based on {queueStats?.avgProcessingTimeMins || 7}m avg weighment cycle
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-6 mt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('queue')}
              className="flex-1 min-w-[140px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              <span>Track Live Queue</span>
            </button>

            <button
              onClick={() => onNavigate('myBooking')}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-slate-600" />
              <span>Digital Gate Pass</span>
            </button>

            <button
              onClick={() => onNavigate('procurement')}
              className="py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Scale className="w-4 h-4 text-blue-700" />
              <span>Weighing & Status</span>
            </button>

            <button
              onClick={() => onNavigate('payment')}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-slate-600" />
              <span>Payment Details</span>
            </button>

            <button
              onClick={() => setShowCancelModal(true)}
              className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Cancel appointment to test booking a new slot"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Cancel Appointment</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 font-black">
            <Wheat className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Procurement Booking</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            You currently do not have a scheduled grain procurement slot. Book an appointment now to avoid long waiting times at the Mandi yard.
          </p>
          <button
            onClick={() => onNavigate('bookSlot')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Book Smart Procurement Slot</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SmartProcure AI Assistant Quick Bar */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 rounded-3xl border border-emerald-500/40 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700/80 border border-emerald-400/40 flex items-center justify-center text-amber-300">
            <Sparkles className="w-5 h-5 fill-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-white">SmartProcure AI Assistant</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-400/30">
                Voice & Multi-Lingual
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/90 font-medium">
              Have questions about your gate token, queue delay, weighing slip, or DBT bank credit?
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const fab = document.getElementById('smartprocure-ai-fab-button');
            if (fab) fab.click();
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          <span>Ask SmartProcure AI</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mandi Support & Guidelines Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <UserCheck className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 mb-1">Documents to Carry</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Farmer ID (FRM1001), Aadhaar Card, and Bank Passbook copy for DBT verification at entry.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 mb-1">Grain Quality Standards</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Moisture should be below 14.0% for Paddy and 12.0% for Wheat to pass direct electronic weighment.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 mb-1">Mandi Helpline</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Toll-Free DoCA Kisan Helpline: 1800-180-1551 (Mon–Sat 08:00 AM to 06:00 PM).
          </p>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && activeBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Cancel Active Appointment?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to cancel your appointment for <strong>Token {activeBooking.token}</strong> ({activeBooking.crop}, {activeBooking.bookedQuantity} kg at {activeBooking.centreName.split(',')[0]})?
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-5 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <strong className="text-slate-800">{activeBooking.date} • {activeBooking.timeSlot}</strong>
              </div>
              <div className="flex justify-between">
                <span>Gate Token:</span>
                <strong className="text-emerald-800 font-mono">{activeBooking.token}</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Keep Appointment
              </button>
              <button
                onClick={() => {
                  cancelBooking(activeBooking.id);
                  setShowCancelModal(false);
                }}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Cancel Slot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


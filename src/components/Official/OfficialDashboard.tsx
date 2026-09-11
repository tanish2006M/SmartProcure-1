import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking, BookingStatus, PaymentStatus, Procurement, Payment } from '../../types';
import { WeighmentProcureModal } from './WeighmentProcureModal';
import { PaymentDisburseModal } from './PaymentDisburseModal';
import { DigitalWeighingSlipModal } from '../Shared/DigitalWeighingSlipModal';
import { DigitalReceiptModal } from '../Shared/DigitalReceiptModal';
import { OfficialAiAssistantWidget } from './OfficialAiAssistantWidget';
import {
  Building2,
  PhoneCall,
  UserCheck,
  UserX,
  Clock,
  Scale,
  CreditCard,
  PlusCircle,
  PauseCircle,
  PlayCircle,
  Filter,
  Search,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  QrCode,
  RotateCcw,
  MessageSquare,
  Smartphone,
  Send,
  Radio,
  X,
} from 'lucide-react';

export const OfficialDashboard: React.FC = () => {
  const {
    centres,
    bookings,
    updateBookingStatus,
    callNextToken,
    delaySlot,
    addEmergencySlot,
    payments,
    procurements,
    updatePaymentStatus,
    resetToDemoData,
    startVerification,
    startWeighing,
    startQualityCheck,
    initiatePayment,
    disbursePayment,
    sendMandiOfficialSms,
    activeOfficialCentreId,
    setActiveOfficialCentreId,
  } = useApp();

  const selectedCentreId = activeOfficialCentreId || centres[0].id;
  const setSelectedCentreId = setActiveOfficialCentreId;
  const [selectedBookingForWeigh, setSelectedBookingForWeigh] = useState<Booking | null>(null);
  const [selectedBookingForDisburse, setSelectedBookingForDisburse] = useState<Booking | null>(null);
  const [selectedSlipForView, setSelectedSlipForView] = useState<{ proc: Procurement; booking?: Booking } | null>(null);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<{ proc?: Procurement; pay?: Payment; booking?: Booking } | null>(null);

  const [isQueuePaused, setIsQueuePaused] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // SMS Broadcast & Token SMS state (Prompt 8 Section 15)
  const [isSmsBroadcastOpen, setIsSmsBroadcastOpen] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL_WAITING' | 'DELAY' | 'EMERGENCY'>('ALL_WAITING');
  const [broadcastTemplate, setBroadcastTemplate] = useState<'WEATHER' | 'CONGESTION' | 'DELAY' | 'CUSTOM'>('WEATHER');
  const [broadcastCustomText, setBroadcastCustomText] = useState('');
  const [selectedBookingForSms, setSelectedBookingForSms] = useState<Booking | null>(null);
  const [tokenSmsText, setTokenSmsText] = useState('');
  const [isDispatchingSms, setIsDispatchingSms] = useState(false);

  // Emergency slot modal state
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyFarmerName, setEmergencyFarmerName] = useState('');
  const [emergencyCrop, setEmergencyCrop] = useState('Wheat');
  const [emergencyQty, setEmergencyQty] = useState(400);

  const centre = centres.find((c) => c.id === selectedCentreId) || centres[0];
  const centreBookings = bookings.filter((b) => b.centreId === centre.id);

  const waitingBookings = centreBookings.filter(
    (b) =>
      b.status === 'WAITING' ||
      b.status === 'ARRIVED' ||
      b.status === 'VERIFYING' ||
      b.status === 'WEIGHING' ||
      b.status === 'QUALITY_CHECK'
  );

  const currentServing =
    centreBookings.find(
      (b) =>
        b.token === centre.currentServingToken &&
        b.status !== 'COMPLETED' &&
        b.status !== 'PAID' &&
        b.status !== 'PAYMENT_SENT' &&
        b.status !== 'CANCELLED' &&
        b.status !== 'NO_SHOW'
    ) ||
    centreBookings.find(
      (b) => b.status === 'PROCESSING' || b.status === 'WEIGHING'
    ) ||
    centreBookings.find(
      (b) => b.status === 'ARRIVED' || b.status === 'WAITING'
    ) ||
    centreBookings[0];

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCallNext = () => {
    const nextBooking = callNextToken(centre.id);
    if (nextBooking) {
      showNotification(`Token ${nextBooking.token} (${nextBooking.farmerName}) called to Weighbridge Bay 1.`);
    } else {
      showNotification('No more waiting tokens in yard queue.');
    }
  };

  const handleMarkArrived = (id: string, token: string) => {
    updateBookingStatus(id, 'ARRIVED');
    showNotification(`Token ${token} checked in at Gate No. 4.`);
  };

  const handleStartVerification = (id: string, token: string) => {
    startVerification(id);
    showNotification(`Verification started for Token ${token}. Identity & land pass checked.`);
  };

  const handleStartWeighing = (id: string, token: string) => {
    startWeighing(id);
    showNotification(`Weighing started for Token ${token}. Directed to Electronic Weighbridge.`);
  };

  const handleStartQualityCheck = (id: string, token: string) => {
    startQualityCheck(id);
    showNotification(`Quality & digital moisture probe check initiated for Token ${token}.`);
  };

  const handleInitiatePayment = (bookingId: string, token: string) => {
    initiatePayment(bookingId);
    showNotification(`Payment initiated for Token ${token}. Sent to PFMS clearing batch.`);
  };

  const handleSendPayment = (booking: Booking) => {
    const existingPayment = payments.find(
      (p) => p.bookingId === booking.id || p.id === booking.paymentId
    );
    const approvedAmount =
      existingPayment?.amount ||
      Math.round(((booking.actualWeight || booking.bookedQuantity) / 100) * 2300);
    const bankRefNo =
      existingPayment?.bankRefNo || `UTR${Date.now().toString().slice(-8)}`;

    disbursePayment({
      bookingId: booking.id,
      paymentId: existingPayment?.id || `pay-${booking.id}`,
      approvedAmount,
      bankRefNo,
    });

    showNotification(
      `Payment sent for ${booking.farmerName} (UTR: ${bankRefNo}).`
    );
  };

  const handleMarkNoShow = (id: string, token: string) => {
    updateBookingStatus(id, 'NO_SHOW');
    showNotification(`Token ${token} marked as No-Show.`);
  };

  const handleDelaySlot = () => {
    delaySlot(centre.id, '10:00 AM - 11:00 AM', 15);
    showNotification('10:00-11:00 AM slots shifted by +15 mins due to rain/yard congestion.');
  };

  const handleAddEmergencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyFarmerName) return;
    const token = addEmergencySlot({
      centreId: centre.id,
      farmerName: emergencyFarmerName,
      crop: emergencyCrop,
      quantity: emergencyQty,
    });
    setIsEmergencyModalOpen(false);
    setEmergencyFarmerName('');
    showNotification(`Emergency priority token ${token} created!`);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatchingSms(true);
    let msg = broadcastCustomText;
    if (broadcastTemplate === 'WEATHER') {
      msg = broadcastCustomText || `SmartProcure Alert: Heavy rain forecast near ${centre.name.split(',')[0]}. Please keep grain trolleys covered in yard.`;
    } else if (broadcastTemplate === 'CONGESTION') {
      msg = broadcastCustomText || `SmartProcure Alert: Yard gate congestion at ${centre.name.split(',')[0]}. Traffic diverted to Gate 2.`;
    } else if (broadcastTemplate === 'DELAY') {
      msg = broadcastCustomText || `SmartProcure Alert: Electronic weighbridge calibration in progress at ${centre.name.split(',')[0]}. Average 30 min delay expected.`;
    }

    const res = await sendMandiOfficialSms({
      centreId: centre.id,
      target: broadcastTarget,
      title: `Advisory: ${centre.name.split(',')[0]}`,
      customMessage: msg,
    });
    setIsDispatchingSms(false);
    setIsSmsBroadcastOpen(false);
    setBroadcastCustomText('');
    showNotification(res.message || 'Broadcast SMS sent successfully.');
  };

  const handleSendTokenSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForSms) return;
    setIsDispatchingSms(true);
    const msg = tokenSmsText || `Token ${selectedBookingForSms.token}: Please report to Weighbridge Counter 1 immediately.`;

    const res = await sendMandiOfficialSms({
      centreId: selectedBookingForSms.centreId,
      target: 'TOKEN',
      token: selectedBookingForSms.token,
      title: `Token ${selectedBookingForSms.token} Alert`,
      customMessage: msg,
    });
    setIsDispatchingSms(false);
    setSelectedBookingForSms(null);
    setTokenSmsText('');
    showNotification(res.message || `SMS dispatched for Token ${selectedBookingForSms.token}.`);
  };

  // Search & Filter (Prompt 17)
  const filteredBookings = centreBookings.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    const proc = procurements.find((p) => p.bookingId === b.id);
    const pay = payments.find((p) => p.bookingId === b.id);

    const matchesSearch =
      !q ||
      b.token.toLowerCase().includes(q) ||
      b.farmerName.toLowerCase().includes(q) ||
      b.farmerId.toLowerCase().includes(q) ||
      b.crop.toLowerCase().includes(q) ||
      (proc && proc.procurementRefId?.toLowerCase().includes(q)) ||
      (proc && proc.weighmentSlipNo?.toLowerCase().includes(q)) ||
      (pay && pay.transactionId?.toLowerCase().includes(q));

    const matchesFilter =
      filterStatus === 'ALL' ||
      b.status === filterStatus ||
      (filterStatus === 'PAID' && (b.status === 'PAID' || b.status === 'PAYMENT_SENT')) ||
      (filterStatus === 'COMPLETED' && (b.status === 'COMPLETED' || b.status === 'PAID' || b.status === 'PAYMENT_SENT'));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Header & Centre Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-emerald-800 uppercase tracking-wider">
              Department of Consumer Affairs • Govt of India
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Mandi Official Procurement & Weighing Console
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            End-to-end yard intake, digital scale logging, quality grading, and DBT clearance.
          </p>
        </div>

        {/* Centre Dropdown & Demo Reset */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-2xs">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.split(',')[0]} ({c.district})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              resetToDemoData();
              showNotification('Demo state reset to original simulation.');
            }}
            className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
            title="Reset simulation data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SmartProcure AI Operational Yard Assistant */}
      <OfficialAiAssistantWidget centreId={selectedCentreId} />

      {/* Control Banner: Active Counter & Calling Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Currently Calling Box */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono font-bold text-blue-200 uppercase tracking-wider">
              Bay 1 Active Counter
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="my-2">
            <div className="text-3xl font-black font-mono tracking-tight text-white">
              {currentServing ? currentServing.token : 'NO TOKEN'}
            </div>
            <div className="text-xs text-blue-200 font-medium">
              {currentServing ? `${currentServing.farmerName} • ${currentServing.crop}` : 'Idle'}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <button
              onClick={handleCallNext}
              className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Next Token</span>
            </button>
          </div>
        </div>

        {/* Centre Queue Status & Congestion */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Yard Load & Efficiency
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                centre.status === 'LOW'
                  ? 'bg-emerald-100 text-emerald-800'
                  : centre.status === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {centre.status} LOAD
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Yard Queue</span>
              <strong className="text-slate-900 text-base font-black font-mono">
                {waitingBookings.length} Vehicles
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Avg Weigh Time</span>
              <strong className="text-slate-900 text-base font-black font-mono">
                {centre.avgWaitTimeMinutes || 12} mins
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleDelaySlot}
              className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold text-[11px] transition-colors cursor-pointer"
            >
              +15m Shift
            </button>
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="flex-1 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Priority</span>
            </button>
            <button
              onClick={() => setIsSmsBroadcastOpen(true)}
              className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="Broadcast Emergency / Congestion SMS to Farmers"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>SMS Alert</span>
            </button>
          </div>
        </div>

        {/* Digital Weighing Quick Stats */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Procurement & Weighment
            </span>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Day 1 Session
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Procured Today</span>
              <strong className="text-emerald-800 text-base font-black font-mono">
                {centreBookings
                  .filter((b) => b.status === 'COMPLETED' || b.status === 'PAID' || b.status === 'PAYMENT_SENT')
                  .reduce((acc, b) => acc + (b.actualWeight || b.bookedQuantity), 0)}{' '}
                kg
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Payments Sent</span>
              <strong className="text-purple-900 text-base font-black font-mono">
                {payments.filter((p) => p.status === 'PAID' || p.status === 'PAYMENT_SENT').length} / {payments.length}
              </strong>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Scale zero-tare and moisture probe calibrated.</span>
          </div>
        </div>
      </div>

      {/* 8 & 17. Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Token, Farmer Name, Farmer ID, Ref ID, Payment ID, Crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            {[
              { key: 'ALL', label: 'All' },
              { key: 'WAITING', label: 'Waiting' },
              { key: 'ARRIVED', label: 'Arrived' },
              { key: 'VERIFYING', label: 'Verification' },
              { key: 'WEIGHING', label: 'Weighing' },
              { key: 'QUALITY_CHECK', label: 'Quality Check' },
              { key: 'COMPLETED', label: 'Completed' },
              { key: 'PAYMENT_PROCESSING', label: 'Payment Processing' },
              { key: 'PAID', label: 'Paid' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer text-[11px] ${
                  filterStatus === f.key
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table with all Prompt 8 Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">
            Farmer Procurement Queue & Stage Operations ({filteredBookings.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {centre.name}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Farmer Details</th>
                <th className="py-3 px-4">Crop</th>
                <th className="py-3 px-4">Weight (Booked / Net)</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Official Workflow Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No farmers matching the search / filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((row) => {
                  const proc = procurements.find((p) => p.bookingId === row.id);
                  const pay = payments.find((p) => p.bookingId === row.id);
                  const isServingNow = currentServing?.id === row.id;

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isServingNow ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Token */}
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span>{row.token}</span>
                          {row.isEmergency && (
                            <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                              VIP
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Farmer Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{row.farmerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {row.farmerId} • {row.farmerMobile}
                        </div>
                      </td>

                      {/* Crop */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {row.crop}
                      </td>

                      {/* Weight */}
                      <td className="py-3.5 px-4 font-mono">
                        {row.actualWeight ? (
                          <div>
                            <span className="font-bold text-emerald-800">{row.actualWeight} kg</span>
                            <span className="text-[10px] text-slate-400 block font-sans">
                              Gross: {row.grossWeight || row.actualWeight + 12}kg
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600">{row.bookedQuantity} kg (Est)</span>
                        )}
                      </td>

                      {/* Slot */}
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {row.timeSlot}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase whitespace-nowrap ${
                            row.status === 'PAID' || row.status === 'PAYMENT_SENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : row.status === 'PAYMENT_PROCESSING'
                              ? 'bg-purple-100 text-purple-800'
                              : row.status === 'WEIGHING' || row.status === 'QUALITY_CHECK'
                              ? 'bg-indigo-100 text-indigo-800'
                              : row.status === 'ARRIVED' || row.status === 'VERIFYING'
                              ? 'bg-teal-100 text-teal-800'
                              : row.status === 'NO_SHOW'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {row.status === 'PAID' || row.status === 'PAYMENT_SENT' ? 'PAYMENT SENT ✓' : row.status}
                        </span>
                      </td>

                      {/* Official Workflow Controls (Prompt 8) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* 1. MARK ARRIVED */}
                          {row.status === 'WAITING' && (
                            <button
                              onClick={() => handleMarkArrived(row.id, row.token)}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                              title="Mark Farmer Arrived"
                            >
                              Arrived
                            </button>
                          )}

                          {/* 2. START VERIFICATION */}
                          {(row.status === 'ARRIVED' || row.status === 'WAITING') && (
                            <button
                              onClick={() => handleStartVerification(row.id, row.token)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                              title="Start KYC and Land record verification"
                            >
                              Verify
                            </button>
                          )}

                          {/* 3. START WEIGHING / 4. ENTER WEIGHT */}
                          {(row.status === 'VERIFYING' || row.status === 'ARRIVED' || row.status === 'WAITING' || row.status === 'WEIGHING') && (
                            <button
                              onClick={() => setSelectedBookingForWeigh(row)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span>{row.status === 'WEIGHING' ? 'Enter Weight' : 'Weigh & Procure'}</span>
                            </button>
                          )}

                          {/* 5. QUALITY CHECK */}
                          {row.status === 'WEIGHING' && (
                            <button
                              onClick={() => handleStartQualityCheck(row.id, row.token)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Quality Check
                            </button>
                          )}

                          {/* 6. INITIATE PAYMENT */}
                          {row.status === 'COMPLETED' && (!pay || pay.status === 'PROCESSING') && (
                            <button
                              onClick={() => handleInitiatePayment(row.id, row.token)}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Initiate DBT
                            </button>
                          )}

                          {/* 7. MARK PAYMENT SENT */}
                          {(row.status === 'PAYMENT_PROCESSING' || (row.status === 'COMPLETED' && pay && pay.status !== 'PAID' && pay.status !== 'PAYMENT_SENT')) &&
                            row.status !== 'PAID' &&
                            row.status !== 'PAYMENT_SENT' &&
                            (!pay || (pay.status !== 'PAID' && pay.status !== 'PAYMENT_SENT')) && (
                            <button
                              onClick={() => handleSendPayment(row)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Send Payment</span>
                            </button>
                          )}

                          {/* Action to View Slip / Receipt if completed */}
                          {(row.status === 'COMPLETED' || row.status === 'PAID' || row.status === 'PAYMENT_SENT') && proc && (
                            <button
                              onClick={() => setSelectedSlipForView({ proc, booking: row })}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="View Weighing Slip"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {(row.status === 'COMPLETED' || row.status === 'PAID' || row.status === 'PAYMENT_SENT') && (
                            <button
                              onClick={() => setSelectedReceiptForView({ proc, pay, booking: row })}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="View Digital Receipt"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}

                          {/* Send Token SMS (Prompt 8) */}
                          <button
                            onClick={() => {
                              setSelectedBookingForSms(row);
                              setTokenSmsText(`Token ${row.token}: Please report to Weighbridge Counter 1 immediately.`);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title={`Send SMS update to ${row.farmerName} (${row.farmerMobile || 'linked mobile'})`}
                          >
                            <Smartphone className="w-4 h-4" />
                          </button>

                          {/* No-Show option */}
                          {row.status === 'WAITING' && (
                            <button
                              onClick={() => handleMarkNoShow(row.id, row.token)}
                              className="px-2 py-1 text-slate-400 hover:text-rose-600 font-semibold text-[11px] transition-colors cursor-pointer"
                              title="Farmer did not show up"
                            >
                              No-Show
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {/* 1. Weighing Entry Modal */}
      {selectedBookingForWeigh && (
        <WeighmentProcureModal
          isOpen={true}
          booking={selectedBookingForWeigh}
          onClose={() => setSelectedBookingForWeigh(null)}
        />
      )}

      {/* 2. Payment Disburse Modal (Prompt 10) */}
      {selectedBookingForDisburse && (
        <PaymentDisburseModal
          booking={selectedBookingForDisburse}
          payment={payments.find((p) => p.bookingId === selectedBookingForDisburse.id)}
          onClose={() => setSelectedBookingForDisburse(null)}
          onConfirmDisburse={(data) => {
            disbursePayment(data);
            setSelectedBookingForDisburse(null);
            showNotification(
              `Payment sent for ${selectedBookingForDisburse.farmerName} (UTR: ${data.bankRefNo}).`
            );
          }}
        />
      )}

      {/* 3. Weighing Slip Modal */}
      {selectedSlipForView && (
        <DigitalWeighingSlipModal
          procurement={selectedSlipForView.proc}
          booking={selectedSlipForView.booking}
          onClose={() => setSelectedSlipForView(null)}
        />
      )}

      {/* 4. Digital Receipt Modal */}
      {selectedReceiptForView && (
        <DigitalReceiptModal
          procurement={selectedReceiptForView.proc}
          payment={selectedReceiptForView.pay}
          booking={selectedReceiptForView.booking}
          onClose={() => setSelectedReceiptForView(null)}
        />
      )}

      {/* 5. Emergency Priority Slot Modal */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Add Emergency Priority Slot
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Allocate immediate priority token for farmers facing transit emergency or spoilage risk.
            </p>

            <form onSubmit={handleAddEmergencySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Farmer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Balwinder Singh"
                  value={emergencyFarmerName}
                  onChange={(e) => setEmergencyFarmerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Crop Type</label>
                <select
                  value={emergencyCrop}
                  onChange={(e) => setEmergencyCrop(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option value="Wheat">Wheat</option>
                  <option value="Paddy (Basmati)">Paddy (Basmati)</option>
                  <option value="Paddy (Common)">Paddy (Common)</option>
                  <option value="Mustard">Mustard</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estimated Quantity (kg)</label>
                <input
                  type="number"
                  step="50"
                  value={emergencyQty}
                  onChange={(e) => setEmergencyQty(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmergencyModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Confirm Emergency Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency & Advisory SMS Broadcast Modal (Prompt 8 Section 15) */}
      {isSmsBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Broadcast Mandi SMS Alert</h3>
                  <p className="text-xs text-slate-500 font-medium">{centre.name.split(',')[0]} • Priority Broadcast</p>
                </div>
              </div>
              <button
                onClick={() => setIsSmsBroadcastOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="mt-4 space-y-4 text-xs">
              {/* Target Audience */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Recipient Farmers</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('ALL_WAITING')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-colors cursor-pointer ${
                      broadcastTarget === 'ALL_WAITING'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Waiting in Yard ({waitingBookings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('DELAY')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-colors cursor-pointer ${
                      broadcastTarget === 'DELAY'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Today's Bookings ({centreBookings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('EMERGENCY')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-colors cursor-pointer ${
                      broadcastTarget === 'EMERGENCY'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All Mandi Users
                  </button>
                </div>
              </div>

              {/* Template selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Advisory Category & Preset</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBroadcastTemplate('WEATHER');
                      setBroadcastCustomText(`SmartProcure Alert: Heavy rain forecast near ${centre.name.split(',')[0]}. Please keep grain trolleys covered in yard.`);
                    }}
                    className={`p-2 text-left rounded-xl border transition-colors cursor-pointer ${
                      broadcastTemplate === 'WEATHER'
                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold block">🌧️ Weather Hazard</span>
                    <span className="text-[10px] text-slate-500 block">Rain / tarp advisory</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBroadcastTemplate('CONGESTION');
                      setBroadcastCustomText(`SmartProcure Alert: Yard gate congestion at ${centre.name.split(',')[0]}. Traffic diverted to Gate 2.`);
                    }}
                    className={`p-2 text-left rounded-xl border transition-colors cursor-pointer ${
                      broadcastTemplate === 'CONGESTION'
                        ? 'bg-amber-50 border-amber-500 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold block">🚦 Gate Congestion</span>
                    <span className="text-[10px] text-slate-500 block">Traffic & gate diversion</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBroadcastTemplate('DELAY');
                      setBroadcastCustomText(`SmartProcure Alert: Electronic weighbridge calibration in progress at ${centre.name.split(',')[0]}. Average 30 min delay expected.`);
                    }}
                    className={`p-2 text-left rounded-xl border transition-colors cursor-pointer ${
                      broadcastTemplate === 'DELAY'
                        ? 'bg-orange-50 border-orange-500 text-orange-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold block">⏱️ Weighbridge Delay</span>
                    <span className="text-[10px] text-slate-500 block">Maintenance notice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBroadcastTemplate('CUSTOM');
                      setBroadcastCustomText('');
                    }}
                    className={`p-2 text-left rounded-xl border transition-colors cursor-pointer ${
                      broadcastTemplate === 'CUSTOM'
                        ? 'bg-purple-50 border-purple-500 text-purple-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold block">✍️ Custom Message</span>
                    <span className="text-[10px] text-slate-500 block">Write manual advisory</span>
                  </button>
                </div>
              </div>

              {/* Message text with character limit */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">SMS Content</label>
                  <span className={`text-[10px] font-mono ${broadcastCustomText.length > 160 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                    {broadcastCustomText.length}/160 chars (1 SMS segment)
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={broadcastCustomText}
                  onChange={(e) => setBroadcastCustomText(e.target.value)}
                  placeholder="Type official advisory message to broadcast via SMS..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 resize-none font-mono"
                />
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>URGENT Emergency Advisory:</strong> This message will bypass standard DND preferences to alert farmers of weather hazards or operational gate changes.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSmsBroadcastOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatchingSms || !broadcastCustomText.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isDispatchingSms ? 'Dispatching...' : 'Dispatch Broadcast SMS'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Token SMS Update Modal (Prompt 8 Section 15) */}
      {selectedBookingForSms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black font-mono">
                  {selectedBookingForSms.token}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Send Token SMS Update</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedBookingForSms.farmerName} • {selectedBookingForSms.farmerMobile || '+91 98765 43210'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingForSms(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendTokenSms} className="mt-4 space-y-4 text-xs">
              {/* Quick Preset Buttons */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Quick Actions</label>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setTokenSmsText(
                        `Token ${selectedBookingForSms.token}: Please report to Weighbridge Counter 1 immediately.`
                      )
                    }
                    className="w-full text-left p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    🚛 Report to Weighbridge Counter 1
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTokenSmsText(
                        `Token ${selectedBookingForSms.token}: Moisture check cleared. Proceed directly to Unloading Platform 3.`
                      )
                    }
                    className="w-full text-left p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    🌾 Moisture Cleared: Proceed to Platform 3
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTokenSmsText(
                        `Token ${selectedBookingForSms.token}: Please report to Mandi Verification Desk with land passbook.`
                      )
                    }
                    className="w-full text-left p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    📋 Verification Desk: Passbook Check
                  </button>
                </div>
              </div>

              {/* Message text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">SMS Text</label>
                  <span className={`text-[10px] font-mono ${tokenSmsText.length > 160 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                    {tokenSmsText.length}/160 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={tokenSmsText}
                  onChange={(e) => setTokenSmsText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 resize-none font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForSms(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatchingSms || !tokenSmsText.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isDispatchingSms ? 'Sending...' : 'Send SMS'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

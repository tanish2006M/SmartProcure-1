import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../translations';
import { DigitalWeighingSlipModal } from '../Shared/DigitalWeighingSlipModal';
import { DigitalReceiptModal } from '../Shared/DigitalReceiptModal';
import { BookingStatus } from '../../types';
import {
  Scale,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  ShieldCheck,
  Wheat,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  Building,
  CreditCard,
  QrCode,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';

interface ProcurementStatusViewProps {
  onNavigate: (tab: string) => void;
}

export const ProcurementStatusView: React.FC<ProcurementStatusViewProps> = ({ onNavigate }) => {
  const { currentFarmer, getFarmerActiveBooking, procurements, payments, language } = useApp();
  const t = translations[language];

  const [showWeighSlipModal, setShowWeighSlipModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const activeBooking = getFarmerActiveBooking(currentFarmer.id);
  const activeProcurement = procurements.find(
    (p) => p.bookingId === activeBooking?.id || p.farmerId === currentFarmer.id
  );
  const activePayment = payments.find(
    (p) => p.bookingId === activeBooking?.id || p.procurementId === activeProcurement?.id
  );

  // Status computation for the 8-state timeline
  const status: BookingStatus = activeBooking?.status || 'WAITING';
  const isPaid = status === 'PAID' || activePayment?.status === 'PAID';
  const isCompleted =
    status === 'COMPLETED' ||
    status === 'PAYMENT_PROCESSING' ||
    status === 'PAID' ||
    !!activeProcurement;

  // Timeline 8 steps definition (Prompt 4)
  const timelineSteps = [
    {
      id: 1,
      title: 'Slot Booked',
      desc: `${activeBooking?.date || 'Confirmed'} • ${activeBooking?.timeSlot || '10:00 - 11:00 AM'}`,
      isDone: true,
      isActive: status === 'WAITING',
    },
    {
      id: 2,
      title: 'Farmer Arrived at Centre',
      desc: 'Gate entry barcode validated',
      isDone: status !== 'WAITING',
      isActive: status === 'ARRIVED',
    },
    {
      id: 3,
      title: 'Verification Complete',
      desc: 'Land record & Aadhaar e-KYC',
      isDone:
        status === 'WEIGHING' ||
        status === 'QUALITY_CHECK' ||
        status === 'COMPLETED' ||
        status === 'PAYMENT_PROCESSING' ||
        isPaid,
      isActive: status === 'VERIFYING',
    },
    {
      id: 4,
      title: 'Weighing in Progress',
      desc: 'Electronic weighbridge gross & tare',
      isDone:
        status === 'QUALITY_CHECK' ||
        status === 'COMPLETED' ||
        status === 'PAYMENT_PROCESSING' ||
        isPaid,
      isActive: status === 'WEIGHING',
    },
    {
      id: 5,
      title: 'Quality Check Completed',
      desc: 'Digital moisture & dockage probe',
      isDone:
        status === 'COMPLETED' ||
        status === 'PAYMENT_PROCESSING' ||
        isPaid,
      isActive: status === 'QUALITY_CHECK',
    },
    {
      id: 6,
      title: 'Procurement Completed',
      desc: 'Weighment slip & ref generated',
      isDone: status === 'PAYMENT_PROCESSING' || isPaid || (isCompleted && !isPaid),
      isActive: status === 'COMPLETED',
    },
    {
      id: 7,
      title: 'Payment Processing',
      desc: 'Sanctioned for DBT clearing',
      isDone: isPaid,
      isActive: status === 'PAYMENT_PROCESSING' || (activePayment?.status === 'PROCESSING' && !isPaid),
    },
    {
      id: 8,
      title: 'Payment Sent',
      desc: 'Direct credit sent to bank account via UTR',
      isDone: isPaid,
      isActive: isPaid,
    },
  ];

  // Derived data for display
  const grossWeight = activeProcurement?.grossWeight || (activeBooking ? activeBooking.bookedQuantity + 12 : 612);
  const tareWeight = activeProcurement?.tareWeight || 12;
  const netWeight = activeProcurement?.actualWeight || activeBooking?.actualWeight || activeBooking?.bookedQuantity || 600;
  const rate = activeProcurement?.ratePerQuintal || 2300;
  const quintals = (netWeight / 100).toFixed(2);
  const grossAmount = activeProcurement?.netPayable || Math.round((netWeight / 100) * rate);
  const moisture = activeProcurement?.moisture || activeBooking?.moisturePercentage || 13.5;
  const qualityGrade = activeProcurement?.qualityGrade || activeBooking?.qualityGrade || 'FAQ Grade A (Fair Average Quality)';
  const qualityStatus = activeProcurement?.qualityStatus || 'ACCEPTABLE';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Transparent Procurement & Weighing Tracking
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time digital post-queue verification, electronic scale slip, and price transparency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeProcurement && (
            <button
              onClick={() => setShowReceiptModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Digital Receipt</span>
            </button>
          )}
          {activeProcurement && (
            <button
              onClick={() => setShowWeighSlipModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Weighing Slip</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Live Status Dashboard Header (Prompt 3) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <Wheat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500">
                  TOKEN:
                </span>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded font-mono font-black text-sm">
                  {activeBooking?.token || 'P104'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                {activeBooking?.centreName || 'Central Procurement Centre, APMC Yard'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Current Lifecycle State
              </span>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase mt-0.5 ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isCompleted
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : status === 'WEIGHING' || status === 'QUALITY_CHECK'
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isPaid
                  ? 'PAYMENT SENT ✓'
                  : isCompleted
                  ? 'PROCUREMENT COMPLETED ✓'
                  : status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Accepted Crop</span>
            <strong className="text-slate-900 font-bold text-sm">
              {activeBooking?.crop || 'Paddy (Common)'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Booked Quantity</span>
            <strong className="text-slate-900 font-bold text-sm">
              {activeBooking?.bookedQuantity || 600} kg
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Actual Net Weighed</span>
            <strong className="text-emerald-800 font-bold text-sm">
              {netWeight} kg ({quintals} Qtl)
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Procurement Reference</span>
            <span className="font-mono font-bold text-slate-800 text-xs">
              {activeProcurement?.procurementRefId || `PROC-2026-${activeBooking?.token.replace(/\D/g, '') || '104'}`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Transparent Procurement Timeline (Prompt 4: 8 States) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>8-Stage Transparent Procurement Timeline</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Stage {timelineSteps.filter((s) => s.isDone).length} of 8 Completed
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
            style={{
              width: `${(timelineSteps.filter((s) => s.isDone).length / 8) * 100}%`,
            }}
          />
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {timelineSteps.map((step) => (
            <div
              key={step.id}
              className={`p-3.5 rounded-2xl border transition-all text-xs relative ${
                step.isDone
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : step.isActive
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400 text-blue-950 animate-pulse'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-white/70">
                  STAGE {step.id}
                </span>
                {step.isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : step.isActive ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                )}
              </div>
              <strong className="block text-xs font-extrabold">{step.title}</strong>
              <span className="text-[10px] block opacity-80 mt-0.5 leading-tight">
                {step.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Unique Feature: Transparency Score Card (Prompt 14) */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-3xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-wider text-emerald-300">
                TRANSPARENCY CHECK
              </h4>
              <p className="text-xs text-slate-300">
                Zero-hidden-dockage integrity guarantee under Department of Consumer Affairs guidelines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-1.5 rounded-full">
            <span className="text-xs font-bold text-emerald-300">Transparency:</span>
            <span className="text-base font-black font-mono text-white">100%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4 text-xs font-medium">
          <div className="flex items-center gap-2 text-emerald-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Quantity recorded</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Quality recorded</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Rate displayed</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Amount calculated</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Procurement reference generated</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Payment status visible</span>
          </div>
        </div>
      </div>

      {/* 4 & 5. Digital Weighing Slip Card + Quality & Crop Acceptance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Digital Weighing Slip Card (Prompt 5) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                Digital Weighing Slip
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
              Zero Tare Calibrated
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Weighing Slip ID:</span>
              <strong className="font-mono text-slate-900 font-bold">
                {activeProcurement?.weighmentSlipNo || `WS-2026-${activeBooking?.token.replace(/\D/g, '') || '104'}-001`}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <strong className="text-slate-800">
                {activeProcurement?.weighingDate || '10 September 2026'} • {activeProcurement?.weighingTime || '10:42 AM'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Centre:</span>
              <span className="text-slate-800 font-medium">
                {activeProcurement?.centreName || activeBooking?.centreName || 'APMC Yard'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Weighbridge Operator:</span>
              <span className="text-slate-800 font-medium">
                {activeProcurement?.operatorName || 'Mandi Official Weighmaster'}
              </span>
            </div>
          </div>

          {/* Electronic Scale Triad */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Gross Wt</span>
              <span className="font-mono font-black text-slate-900 text-sm">{grossWeight} kg</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Tare Deduction</span>
              <span className="font-mono font-black text-amber-700 text-sm">-{tareWeight} kg</span>
            </div>
            <div className="bg-emerald-100 rounded-xl py-1">
              <span className="text-[10px] text-emerald-900 block uppercase font-black">Net Wt</span>
              <span className="font-mono font-black text-emerald-950 text-sm">{netWeight} kg</span>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              onClick={() => setShowWeighSlipModal(true)}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>View Full Weighing Slip</span>
            </button>
          </div>
        </div>

        {/* Quality & Crop Acceptance Card (Prompt 6) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                Quality & Crop Acceptance
              </h3>
            </div>
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                qualityStatus === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800'
                  : qualityStatus === 'VERIFICATION_NEEDED'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {qualityStatus === 'REJECTED'
                ? 'Rejected'
                : qualityStatus === 'VERIFICATION_NEEDED'
                ? 'Requires Verification'
                : '✓ Within Acceptable Range'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Crop Name:</span>
              <strong className="text-slate-900 font-bold">{activeBooking?.crop || 'Paddy (Common)'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Grade Recorded:</span>
              <span className="text-emerald-800 font-bold">{qualityGrade}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Moisture Tested:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">{moisture}%</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Max FAQ limit: 14.0%
                </span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Quality Inspector Remarks
              </span>
              <p className="text-slate-700 italic">
                "{activeProcurement?.remarks || 'Grain samples meet Fair Average Quality specifications. Zero foreign adulteration detected.'}"
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowReceiptModal(true)}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Verify Digital Procurement Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Transparent Price & Value Calculation (Prompt 7) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">
            Transparent Price & Value Calculation
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            How your payment was calculated — fully auditable breakdown with direct treasury MSP formula.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Net Quantity</span>
            <div className="text-lg font-black font-mono text-slate-900 mt-1">
              {netWeight} kg
            </div>
            <span className="text-[10px] text-slate-500 block">
              = {quintals} quintals (1 Qtl = 100 kg)
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Applicable MSP Rate</span>
            <div className="text-lg font-black font-mono text-blue-900 mt-1">
              ₹{rate.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-500 block">per quintal (Govt notified)</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Deductions / Dockage</span>
            <div className="text-lg font-black font-mono text-emerald-700 mt-1">
              ₹0.00
            </div>
            <span className="text-[10px] text-emerald-700 block font-medium">No unauthorized cuts</span>
          </div>

          <div className="bg-emerald-900 text-white p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-emerald-300 block text-[11px] uppercase font-bold tracking-wider">
              Final Payable Amount
            </span>
            <div className="text-2xl font-black font-mono text-white mt-1">
              ₹{grossAmount.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-300 block">
              DBT Direct Credit
            </span>
          </div>
        </div>

        {/* Formula Explainer */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Formula:</strong> Net Quantity (kg) ÷ 100 × MSP Rate (₹/quintal) = <strong>₹{grossAmount.toLocaleString('en-IN')}</strong>
            </span>
          </div>

          <button
            onClick={() => onNavigate('payment')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Go to Payment Tracking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modals */}
      {showWeighSlipModal && activeProcurement && (
        <DigitalWeighingSlipModal
          procurement={activeProcurement}
          booking={activeBooking || undefined}
          onClose={() => setShowWeighSlipModal(false)}
        />
      )}

      {showReceiptModal && (
        <DigitalReceiptModal
          procurement={activeProcurement}
          payment={activePayment}
          booking={activeBooking || undefined}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};

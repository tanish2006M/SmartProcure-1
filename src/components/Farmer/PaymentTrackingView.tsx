import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../translations';
import { PaymentStatus } from '../../types';
import { DigitalReceiptModal } from '../Shared/DigitalReceiptModal';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Building,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  ArrowLeft,
  QrCode,
  Calendar,
  AlertTriangle,
  Info,
  Check,
} from 'lucide-react';

interface PaymentTrackingViewProps {
  onNavigate: (tab: string) => void;
}

export const PaymentTrackingView: React.FC<PaymentTrackingViewProps> = ({ onNavigate }) => {
  const { currentFarmer, getFarmerActiveBooking, payments, procurements, language } = useApp();
  const t = translations[language];

  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const activeBooking = getFarmerActiveBooking(currentFarmer.id);
  const payment = payments.find(
    (p) => p.bookingId === activeBooking?.id || p.farmerId === currentFarmer.id
  );
  const procurement = procurements.find(
    (p) => p.bookingId === activeBooking?.id || p.farmerId === currentFarmer.id
  );

  const isPaid = payment?.status === 'PAID' || activeBooking?.status === 'PAID';
  const isProcessing = payment?.status === 'PROCESSING' || activeBooking?.status === 'PAYMENT_PROCESSING';

  const displayAmount =
    payment?.approvedAmount ||
    payment?.amount ||
    procurement?.netPayable ||
    (activeBooking ? Math.round((activeBooking.bookedQuantity / 100) * 2300) : 42500);

  const displayTxnId = payment?.transactionId || 'PAY-2026-10482';
  const displayStatus: PaymentStatus = isPaid ? 'PAID' : payment?.status || 'PROCESSING';
  const displayStatusLabel = isPaid
    ? 'Payment Sent'
    : payment?.status === 'APPROVED'
    ? 'Payment Approved'
    : payment?.status === 'FAILED'
    ? 'Payment Failed'
    : 'Payment Processing';
  const bankRefNo = payment?.bankRefNo || (isPaid ? 'UTR889201948' : undefined);

  // 5-Step Payment Timeline (Prompt 11 & Prompt 8.2)
  const procDate = procurement?.weighingDate || '10 Sep 2026';
  const procTime = procurement?.weighingTime || '10:45 AM';

  const paymentSteps = [
    {
      step: 1,
      title: 'Procurement Completed',
      desc: `Recorded at Mandi scale on ${procDate} at ${procTime}`,
      meta: `Procurement Ref: ${procurement?.procurementRefId || 'PROC-2026-104'}`,
      isDone: true,
      isActive: false,
    },
    {
      step: 2,
      title: 'Payment Request Created',
      desc: `Sanctioned by Mandi Secretary for ₹${displayAmount.toLocaleString('en-IN')}`,
      meta: `Request ID: ${displayTxnId}`,
      isDone: true,
      isActive: false,
    },
    {
      step: 3,
      title: 'Payment Processing',
      desc: isPaid
        ? 'Batch settlement approved by State Treasury'
        : 'Active in PFMS government clearing pipeline',
      meta: 'Processing since: ' + (payment?.initiatedAt ? new Date(payment.initiatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '11:00 AM'),
      isDone: isPaid || isProcessing,
      isActive: !isPaid && isProcessing,
    },
    {
      step: 4,
      title: 'Payment Approved',
      desc: `Aadhaar-linked account: ${currentFarmer.bankAccountMasked || '•••• •••• 4829'}`,
      meta: `IFSC: ${currentFarmer.ifscCode || 'SBIN0001423'} (State Bank of India)`,
      isDone: isPaid,
      isActive: !isPaid && payment?.status === 'APPROVED',
    },
    {
      step: 5,
      title: 'Payment Sent',
      desc: isPaid
        ? `Direct Benefit Transfer (DBT) successfully sent to your bank account`
        : 'Awaiting final bank credit release and UTR generation',
      meta: isPaid
        ? `UTR Ref: ${bankRefNo || 'UTR889201948'} • Method: DBT Direct Credit`
        : 'Pending Treasury Release',
      isDone: isPaid,
      isActive: isPaid,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            Direct Benefit Transfer (DBT) Payment Tracking
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time stage-wise payment clearance directly into your Aadhaar-linked bank account.
          </p>
        </div>

        <button
          onClick={() => setShowReceiptModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4" />
          <span>View Verified Receipt</span>
        </button>
      </div>

      {/* Main Payment Card */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-1">
              Sanctioned Net Payment
            </div>
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
              ₹{displayAmount.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-purple-200 mt-1 block">
              Calculated at Government MSP • Zero unauthorized deductions
            </span>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                isPaid
                  ? 'bg-emerald-400 text-emerald-950 shadow-sm'
                  : 'bg-amber-400 text-amber-950 animate-pulse'
              }`}
            >
              {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              <span>{isPaid ? 'PAYMENT SENT ✓' : displayStatusLabel.toUpperCase()}</span>
            </span>
            <div className="text-[11px] font-mono text-purple-200 mt-1.5">
              Payment ID: {displayTxnId}
            </div>
          </div>
        </div>

        {/* Bank & Beneficiary Sub-Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-purple-200 block text-[11px]">Beneficiary Name</span>
            <strong className="text-white font-semibold text-sm">{currentFarmer.name}</strong>
          </div>
          <div>
            <span className="text-purple-200 block text-[11px]">Bank Account (Masked)</span>
            <strong className="text-white font-mono font-semibold text-sm">
              {currentFarmer.bankAccountMasked || '•••• •••• 4829'}
            </strong>
          </div>
          <div>
            <span className="text-purple-200 block text-[11px]">IFSC Code & Bank</span>
            <strong className="text-white font-mono font-semibold text-sm">
              {currentFarmer.ifscCode || 'SBIN0001423'} (SBI)
            </strong>
          </div>
        </div>
      </div>

      {/* 12. PAYMENT DELAY INTELLIGENCE (Prompt 12) */}
      {!isPaid ? (
        <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-3 text-amber-900">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">
                Payment Delay Intelligence & Status Window
              </h3>
              <p className="text-xs text-amber-800">
                Transparent government settlement tracking — no farmer anxiety.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="bg-white p-3.5 rounded-2xl border border-amber-200">
              <span className="text-slate-500 block text-[11px]">Estimated Processing Time</span>
              <strong className="text-slate-900 text-sm font-bold block mt-0.5">24 – 48 Hours</strong>
              <span className="text-[10px] text-slate-400">Direct Benefit Transfer standard</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-amber-200">
              <span className="text-slate-500 block text-[11px]">Expected Credit Window</span>
              <strong className="text-slate-900 text-sm font-bold block mt-0.5">Within 2 business days</strong>
              <span className="text-[10px] text-emerald-700 font-semibold">Priority treasury batch</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-amber-200">
              <span className="text-slate-500 block text-[11px]">Delay Factor Analysis</span>
              <strong className="text-slate-900 text-sm font-bold block mt-0.5">
                {payment?.delayReason || 'Treasury automated batch clearance cycle.'}
              </strong>
              <span className="text-[10px] text-slate-400">Regular banking processing</span>
            </div>
          </div>

          <div className="p-3 bg-white/70 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Helpful Note:</strong> Your grain acceptance has been digitally certified by the Mandi Weighmaster. Your payment is backed by the Ministry of Consumer Affairs, Food & Public Distribution. Funds are guaranteed and will be credited directly to your registered bank account.
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-950">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm">
                  Payment Sent Successfully
                </h3>
                <p className="text-xs text-emerald-800">
                  Transferred via Direct Benefit Transfer (DBT) to your Aadhaar-linked account.
                </p>
              </div>
            </div>
            <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full font-mono">
              PAYMENT SENT ✓
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs bg-white p-4 rounded-2xl border border-emerald-200">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank Reference (UTR)</span>
              <strong className="text-emerald-950 font-mono text-sm">{bankRefNo || 'UTR889201948'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Sent Date</span>
              <strong className="text-slate-900">{payment?.disbursedDate || '10 Sep 2026'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Sent Time</span>
              <strong className="text-slate-900">{payment?.disbursedTime || '11:15 AM'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Transfer Mode</span>
              <strong className="text-slate-900">{payment?.paymentMethod || 'DBT Direct Credit'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* 11. Step-by-Step Payment Timeline (Prompt 11) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
          <span>5-Stage Public Financial Management (PFMS) Timeline</span>
          <span className="text-xs font-normal text-slate-500">End-to-End Treasury Audit Trail</span>
        </h3>

        <div className="relative pl-6 space-y-7 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {paymentSteps.map((step) => (
            <div key={step.step} className="relative flex items-start gap-4">
              <div
                className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  step.isDone
                    ? 'bg-purple-600 text-white shadow-xs'
                    : step.isActive
                    ? 'bg-amber-500 text-white animate-ping'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step.isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.step}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4
                    className={`text-sm font-extrabold ${
                      step.isDone ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </h4>
                  {step.isActive && (
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Current Stage
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{step.desc}</p>
                <div className="text-[11px] font-mono text-slate-400 mt-1">{step.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Receipts Modal */}
      {showReceiptModal && (
        <DigitalReceiptModal
          procurement={procurement}
          payment={payment}
          booking={activeBooking || undefined}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Procurement, Payment, Booking } from '../../types';
import {
  ShieldCheck,
  Printer,
  X,
  CheckCircle2,
  QrCode,
  Sparkles,
  Wheat,
  Scale,
  CreditCard,
  Building,
  User,
  Hash,
} from 'lucide-react';

interface DigitalReceiptModalProps {
  procurement?: Procurement;
  payment?: Payment;
  booking?: Booking;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  procurement,
  payment,
  booking,
  onClose,
}) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 600);
  };

  const handlePrint = () => {
    window.print();
  };

  // Fallback defaults if viewing demo receipt
  const farmerName = procurement?.farmerName || booking?.farmerName || 'Ramesh Kumar';
  const farmerId = procurement?.farmerId || booking?.farmerId || 'FRM1001';
  const token = procurement?.token || booking?.token || 'P104';
  const centre = procurement?.centreName || booking?.centreName || 'Central Procurement Centre, APMC Yard';
  const crop = procurement?.crop || booking?.crop || 'Paddy (Common)';
  const netWeight = procurement?.actualWeight || booking?.actualWeight || booking?.bookedQuantity || 600;
  const grossWeight = procurement?.grossWeight || (netWeight + 12);
  const tareWeight = procurement?.tareWeight || 12;
  const quality = procurement?.qualityGrade || 'FAQ Grade A';
  const rate = procurement?.ratePerQuintal || 2300;
  const finalAmount = procurement?.netPayable || payment?.amount || Math.round((netWeight / 100) * rate);
  const procurementId = procurement?.procurementRefId || `PROC-2026-${token.replace(/\D/g, '') || '104'}`;
  const weighingSlipId = procurement?.weighmentSlipNo || `WS-2026-${token.replace(/\D/g, '') || '104'}-001`;
  const paymentId = payment?.transactionId || payment?.id || `PAY-2026-13273`;
  const paymentStatus = payment?.status || 'PROCESSING';
  const dateTime = procurement?.completedAt
    ? new Date(procurement.completedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '10 Sep 2026, 10:45 AM';

  const quintals = (netWeight / 100).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in duration-200">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              SmartProcure National Grain Registry
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Header */}
        <div className="text-center pb-5 border-b border-slate-200/80">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>SmartProcure • Department of Consumer Affairs • Government of India</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            DIGITAL PROCUREMENT RECEIPT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent Agricultural Mandi Electronic Procurement Record
          </p>
          <div className="mt-2 text-[11px] font-mono font-semibold text-slate-600">
            Certified under National Agricultural Procurement Standard Framework
          </div>
        </div>

        {/* Body Content */}
        <div className="py-5 space-y-5 text-xs">
          {/* Key Reference Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-slate-800 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 text-[10px] block font-sans">PROCUREMENT ID</span>
              <strong className="text-slate-900">{procurementId}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block font-sans">WEIGHING SLIP ID</span>
              <strong className="text-slate-900">{weighingSlipId}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block font-sans">PAYMENT ID</span>
              <strong className="text-slate-900">{paymentId}</strong>
            </div>
          </div>

          {/* Farmer & Lot Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-slate-400 text-[11px] block">Farmer Name</span>
              <strong className="text-slate-900 text-sm">{farmerName}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Farmer ID</span>
              <strong className="text-slate-900 font-mono text-sm">{farmerId}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Gate Token</span>
              <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-900 font-mono font-black rounded">
                {token}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 text-[11px] block">Procurement Centre</span>
              <strong className="text-slate-800">{centre}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Crop Accepted</span>
              <strong className="text-emerald-800 font-bold">{crop}</strong>
            </div>
          </div>

          {/* Electronic Weighment Breakdown */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Electronic Scale Certified Breakdown</span>
              <span className="text-emerald-700 font-bold">Grade: {quality}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Gross Weight</span>
                <span className="font-mono font-black text-slate-800 text-sm">{grossWeight} kg</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Tare Deduction</span>
                <span className="font-mono font-black text-amber-700 text-sm">{tareWeight} kg</span>
              </div>
              <div className="bg-emerald-100/70 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold block uppercase">Net Accepted</span>
                <span className="font-mono font-black text-emerald-950 text-sm">{netWeight} kg</span>
              </div>
            </div>
          </div>

          {/* Pricing & Net Payable Box */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>Formula: Net Quantity ÷ 100 × MSP Rate</span>
              <span className="font-mono">{netWeight} kg ÷ 100 = {quintals} quintals</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/15">
              <div>
                <span className="text-xs text-slate-300 block">Applicable MSP Rate</span>
                <strong className="text-base text-white font-mono">₹{rate} / quintal</strong>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider block">
                  Final Approved Amount
                </span>
                <div className="text-3xl font-black font-mono text-emerald-300">
                  ₹{finalAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-white/10">
              <span>Payment Mode: Direct Benefit Transfer (DBT)</span>
              <span className="text-emerald-400 font-bold">
                Status: {paymentStatus === 'PAID' ? 'Payment Sent' : paymentStatus === 'PROCESSING' ? 'Payment Processing' : paymentStatus}
              </span>
            </div>
          </div>

          {/* Verification Area with Demo QR Code (Prompt 13) */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 bg-white border-2 border-dashed border-emerald-400 rounded-2xl flex flex-col items-center justify-center p-1 shrink-0 text-emerald-800 shadow-xs">
              <QrCode className="w-12 h-12 text-emerald-800" />
              <span className="text-[8px] font-mono font-bold text-slate-400">SCAN VERIFY</span>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h4 className="font-extrabold text-slate-900 text-xs">
                  Cryptographic Verification Seal
                </h4>
                {isVerified && (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                {isVerified
                  ? 'Official Digital Receipt Verified Successfully! Authenticated via DoCA SmartProcure Registry Node #DOCA-SEC-01.'
                  : 'Tamper-proof digital receipt record. Click verify to validate against the simulated Mandi registry.'}
              </p>
              <div className="text-[10px] font-mono text-slate-400">
                Timestamp: {dateTime} • SHA-256: 8f9c...d41b
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={isVerifying || isVerified}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isVerified
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              {isVerifying ? (
                'Verifying...'
              ) : isVerified ? (
                'Receipt Verified ✓'
              ) : (
                'Verify Receipt'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

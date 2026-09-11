import React from 'react';
import { Procurement, Booking } from '../../types';
import {
  Scale,
  X,
  Printer,
  ShieldCheck,
  Wheat,
  CheckCircle2,
  Calendar,
  Clock,
  Building,
  User,
  Hash,
  AlertTriangle,
} from 'lucide-react';

interface DigitalWeighingSlipModalProps {
  procurement: Procurement;
  booking?: Booking;
  onClose: () => void;
}

export const DigitalWeighingSlipModal: React.FC<DigitalWeighingSlipModalProps> = ({
  procurement,
  booking,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const gross = procurement.grossWeight || procurement.actualWeight + 12;
  const tare = procurement.tareWeight || 12;
  const net = procurement.actualWeight;
  const quintals = (net / 100).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in duration-200">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              Official Electronic Document
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ministry of Consumer Affairs, Food & Public Distribution • Govt. of India</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            DIGITAL WEIGHING SLIP
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            SmartProcure Electronic Weighbridge Subsystem • Department of Consumer Affairs
          </p>
          <div className="mt-3 inline-block bg-slate-100 text-slate-900 px-3.5 py-1 rounded-full font-mono text-xs font-black border border-slate-300">
            WEIGHING SLIP ID: {procurement.weighmentSlipNo}
          </div>
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-5 text-xs">
          {/* Farmer & Centre Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 block">Farmer Name</span>
              <strong className="text-slate-900 text-sm">{procurement.farmerName}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Farmer ID</span>
              <strong className="text-slate-900 font-mono text-sm">{procurement.farmerId}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Queue Token</span>
              <span className="inline-block px-2 py-0.5 rounded font-mono font-black text-xs bg-blue-100 text-blue-800">
                {procurement.token}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-2">
              <span className="text-[11px] text-slate-500 block">Procurement Centre</span>
              <strong className="text-slate-900">{procurement.centreName}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Crop</span>
              <strong className="text-emerald-800 font-bold">{procurement.crop}</strong>
            </div>
          </div>

          {/* Scale Weight Box (Prompt 2 & 9 Gross / Tare / Net) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-blue-600" />
                <span>Calibrated Electronic Weighbridge Readings</span>
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                Zero Tare Calibrated
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 p-4 gap-3 text-center bg-white divide-x-0 sm:divide-x divide-slate-100">
              <div>
                <span className="text-[11px] text-slate-400 block">Booked Qty</span>
                <span className="text-base font-black font-mono text-slate-700">
                  {procurement.bookedWeight} kg
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Actual Gross Wt</span>
                <span className="text-base font-black font-mono text-slate-900">
                  {gross} kg
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Tare Weight</span>
                <span className="text-base font-black font-mono text-amber-700">
                  {tare} kg
                </span>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2 sm:p-0">
                <span className="text-[11px] text-emerald-800 font-bold block">Final Net Weight</span>
                <span className="text-lg font-black font-mono text-emerald-900">
                  {net} kg
                </span>
                <span className="text-[10px] text-emerald-700 font-medium block">
                  ({quintals} quintals)
                </span>
              </div>
            </div>
          </div>

          {/* Quality & Moisture Info */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
            <h4 className="font-extrabold text-slate-900 flex items-center justify-between text-xs">
              <span>Quality & Moisture Analysis</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  procurement.qualityStatus === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800'
                    : procurement.qualityStatus === 'VERIFICATION_NEEDED'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {procurement.qualityStatus === 'REJECTED'
                  ? '✕ Rejected'
                  : procurement.qualityStatus === 'VERIFICATION_NEEDED'
                  ? '⚠ Requires Verification'
                  : '✓ Within Acceptable Range'}
              </span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-slate-500 block text-[11px]">Tested Moisture</span>
                <strong className="text-slate-900 text-sm font-mono">{procurement.moisture}%</strong>
                <span className="text-[10px] text-slate-400 block">Max standard: 14.0%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Quality Grade</span>
                <strong className="text-slate-900 text-sm">{procurement.qualityGrade}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Applicable Rate (MSP)</span>
                <strong className="text-emerald-800 text-sm font-mono">
                  ₹{procurement.ratePerQuintal} / quintal
                </strong>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
              <span className="font-bold text-slate-700">Inspector Remarks: </span>
              {procurement.remarks || 'Standard fair average quality grain accepted.'}
            </div>
          </div>

          {/* Transparent Valuation */}
          <div className="bg-emerald-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold">
                Gross Expected Procurement Amount
              </div>
              <div className="text-xs text-emerald-200">
                {net} kg ÷ 100 = {quintals} quintals × ₹{procurement.ratePerQuintal}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black font-mono text-white">
                ₹{procurement.netPayable.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-emerald-300 font-medium">
                No unauthorized dockage deducted
              </div>
            </div>
          </div>

          {/* Signatures and Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
            <div>
              <div>Weighing Date & Time:</div>
              <strong className="text-slate-800">
                {procurement.weighingDate || '10 September 2026'} • {procurement.weighingTime || '10:42 AM'}
              </strong>
              <div className="mt-1">Operator: <span className="text-slate-700 font-medium">{procurement.operatorName || 'Mandi Official'}</span></div>
            </div>
            <div className="text-right">
              <div>Certification Authority:</div>
              <strong className="text-slate-800 font-mono">
                {procurement.verifiedBy || 'Mandi Procurement Cell #01'}
              </strong>
              <div className="mt-1 text-emerald-700 font-bold flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Digitally Signed Slip</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Close Slip
          </button>
        </div>
      </div>
    </div>
  );
};

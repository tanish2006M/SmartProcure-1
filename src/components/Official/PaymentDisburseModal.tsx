import React, { useState } from 'react';
import { Payment, Booking } from '../../types';
import {
  CreditCard,
  X,
  CheckCircle2,
  AlertCircle,
  Building,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface PaymentDisburseModalProps {
  payment?: Payment;
  booking: Booking;
  onClose: () => void;
  onConfirmDisburse: (data: {
    paymentId: string;
    approvedAmount: number;
    paymentMethod: string;
    bankRefNo: string;
    disbursementDate: string;
    disbursementTime: string;
  }) => void;
}

export const PaymentDisburseModal: React.FC<PaymentDisburseModalProps> = ({
  payment,
  booking,
  onClose,
  onConfirmDisburse,
}) => {
  const defaultAmount = payment?.amount || Math.round(((booking.actualWeight || booking.bookedQuantity) / 100) * 2300);
  const defaultPaymentId = payment?.transactionId || `PAY-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const [paymentId, setPaymentId] = useState(defaultPaymentId);
  const [approvedAmount, setApprovedAmount] = useState(defaultAmount);
  const [paymentMethod, setPaymentMethod] = useState('Direct Benefit Transfer (DBT / PFMS)');
  const [bankRefNo, setBankRefNo] = useState(
    payment?.bankRefNo || `UTR${Date.now().toString().slice(-8)}`
  );
  const [disbursementDate, setDisbursementDate] = useState(dateStr);
  const [disbursementTime, setDisbursementTime] = useState(timeStr);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankRefNo.trim()) {
      setError('Please provide a valid Bank Reference Number / UTR.');
      return;
    }
    if (!isConfirmed) {
      setError('Please check the confirmation box to authorize treasury payment release.');
      return;
    }

    onConfirmDisburse({
      paymentId: payment?.id || `pay-${booking.id}`,
      approvedAmount,
      paymentMethod,
      bankRefNo: bankRefNo.trim(),
      disbursementDate,
      disbursementTime,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Mark Payment Sent
              </h3>
              <p className="text-[11px] text-slate-500">
                Token {booking.token} • {booking.farmerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Summary Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Farmer:</span>
              <strong className="text-slate-900">{booking.farmerName} ({booking.farmerId})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Crop & Net Quantity:</span>
              <strong className="text-slate-900">
                {booking.crop} • {booking.actualWeight || booking.bookedQuantity} kg
              </strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm">
              <span className="text-slate-700">Sanctioned Amount:</span>
              <span className="text-emerald-700 font-mono text-base">
                ₹{approvedAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment ID</label>
            <input
              type="text"
              value={paymentId}
              readOnly
              className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Approved Amount (₹)</label>
            <input
              type="number"
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Direct Benefit Transfer (DBT / PFMS)">Direct Benefit Transfer (DBT / PFMS)</option>
              <option value="State Treasury APMC E-Transfer">State Treasury APMC E-Transfer</option>
              <option value="NACH / NPCI Direct Credit">NACH / NPCI Direct Credit</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Bank Reference Number / UTR</label>
            <input
              type="text"
              value={bankRefNo}
              onChange={(e) => {
                setBankRefNo(e.target.value);
                setError(null);
              }}
              placeholder="e.g. UTR99882210482"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Sent Date</label>
              <input
                type="text"
                value={disbursementDate}
                onChange={(e) => setDisbursementDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Sent Time</label>
              <input
                type="text"
                value={disbursementTime}
                onChange={(e) => setDisbursementTime(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Mandatory Confirmation */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => {
                  setIsConfirmed(e.target.checked);
                  setError(null);
                }}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-[11px] text-purple-950 leading-relaxed">
                I confirm that funds have been released by the Treasury and electronic UTR reference has been generated. This will immediately update the farmer's status to <strong>PAYMENT SENT ✓</strong>.
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-bold hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Mark Payment Sent</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { PAST_FARMER_HISTORY } from '../../data/initialData';
import { useApp } from '../../context/AppContext';
import { DigitalReceiptModal } from '../Shared/DigitalReceiptModal';
import { DigitalWeighingSlipModal } from '../Shared/DigitalWeighingSlipModal';
import { Procurement, Payment } from '../../types';
import {
  History,
  FileCheck,
  Download,
  Calendar,
  Wheat,
  Scale,
  CreditCard,
  X,
  Printer,
  ArrowLeft,
  QrCode,
  CheckCircle2,
  Building,
  Hash,
} from 'lucide-react';

interface HistoryViewProps {
  onNavigate?: (tab: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onNavigate }) => {
  const { currentFarmer, procurements, payments, bookings } = useApp();
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showWeighSlipModal, setShowWeighSlipModal] = useState<boolean>(false);

  // Combine live completed/paid bookings from context with historical seasons
  const completedCurrent = bookings
    .filter(
      (b) =>
        b.farmerId === currentFarmer.id &&
        (b.status === 'COMPLETED' || b.status === 'PAID' || b.status === 'PAYMENT_PROCESSING')
    )
    .map((b) => {
      const proc = procurements.find((p) => p.bookingId === b.id);
      const pay = payments.find((p) => p.bookingId === b.id || p.procurementId === proc?.id);
      const netWeight = b.actualWeight || proc?.actualWeight || b.bookedQuantity;
      const rate = proc?.ratePerQuintal || 2300;
      const amount = pay?.amount || proc?.netPayable || Math.round((netWeight / 100) * rate);

      return {
        id: b.id,
        season: 'Kharif 2026-27 (Current)',
        crop: b.crop,
        centre: b.centreName,
        date: b.date,
        token: b.token,
        quantity: netWeight,
        bookedQuantity: b.bookedQuantity,
        grossWeight: proc?.grossWeight || netWeight + 12,
        tareWeight: proc?.tareWeight || 12,
        ratePerQuintal: rate,
        amount: amount,
        paymentStatus: pay?.status || (b.status === 'PAID' ? 'PAID' : 'PROCESSING'),
        paymentId: pay?.transactionId || pay?.id || `PAY-2026-${b.token.replace(/\D/g, '') || '10482'}`,
        transactionId: pay?.bankRefNo || `UTR${b.token.replace(/\D/g, '') || '8810231'}`,
        weighingSlipId: proc?.weighmentSlipNo || `WS-2026-${b.token.replace(/\D/g, '') || '104'}-001`,
        procurementId: proc?.procurementRefId || `PROC-2026-${b.token.replace(/\D/g, '') || '104'}`,
        status: b.status,
        rawProcurement: proc,
        rawPayment: pay,
        rawBooking: b,
      };
    });

  const historicalItems = PAST_FARMER_HISTORY.map((item, idx) => ({
    id: `hist-${idx}`,
    season: item.season,
    crop: item.crop,
    centre: item.centre,
    date: item.date,
    token: item.token,
    quantity: item.actualWeight,
    bookedQuantity: item.bookedWeight,
    grossWeight: item.actualWeight + 14,
    tareWeight: 14,
    ratePerQuintal: item.ratePerQuintal,
    amount: item.totalAmount,
    paymentStatus: item.paymentStatus,
    paymentId: item.transactionId,
    transactionId: `UTR${item.token}99182`,
    weighingSlipId: item.receiptNo,
    procurementId: `PROC-2025-${item.token}`,
    status: 'PAID',
  }));

  const allHistory = [...completedCurrent, ...historicalItems];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        )}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Procurement & Payment Ledger
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Auditable transaction history with electronic weighbridge records and certified DBT receipts.
        </p>
      </div>

      <div className="space-y-4">
        {allHistory.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {item.season}
                </span>
                <span className="text-xs text-slate-400 font-mono">{item.date}</span>
                <span className="bg-blue-100 text-blue-900 text-[10px] font-black font-mono px-2 py-0.5 rounded">
                  Token {item.token}
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Slip: {item.weighingSlipId}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>{item.crop}</span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  ({item.quantity} kg / {(item.quantity / 100).toFixed(2)} Qtl)
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Procurement Centre</span>
                  <span className="text-slate-800 font-medium">{item.centre.split(',')[0]}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Payment Ref (ID)</span>
                  <span className="font-mono text-slate-700">{item.paymentId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Bank UTR</span>
                  <span className="font-mono text-slate-700">{item.transactionId}</span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="text-left sm:text-right">
                <div className="text-xl font-black text-emerald-700 font-mono">
                  ₹{item.amount.toLocaleString('en-IN')}
                </div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase mt-1 ${
                    item.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.paymentStatus === 'PAID' ? 'PAYMENT SENT ✓' : item.paymentStatus}
                </span>
              </div>

              <button
                onClick={() => setSelectedDetails(item)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Complete Transaction Details Modal (Prompt 15) */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Procurement Transaction Details
                </h3>
                <p className="text-xs text-slate-500">
                  Token {selectedDetails.token} • {selectedDetails.crop}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Reference Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">PROCUREMENT REF</span>
                  <strong className="text-slate-900">{selectedDetails.procurementId}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">WEIGHING SLIP ID</span>
                  <strong className="text-slate-900">{selectedDetails.weighingSlipId}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">PAYMENT ID</span>
                  <strong className="text-slate-900">{selectedDetails.paymentId}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">BANK UTR NO.</span>
                  <strong className="text-purple-900">{selectedDetails.transactionId}</strong>
                </div>
              </div>

              {/* Weighment & Pricing breakdown */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Procurement Centre:</span>
                  <strong className="text-slate-900">{selectedDetails.centre}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date of Weighment:</span>
                  <strong className="text-slate-900">{selectedDetails.date}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross / Tare / Net:</span>
                  <strong className="text-slate-900 font-mono">
                    {selectedDetails.grossWeight} kg / -{selectedDetails.tareWeight} kg = {selectedDetails.quantity} kg
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MSP Rate Applied:</span>
                  <strong className="text-slate-900 font-mono">₹{selectedDetails.ratePerQuintal} / quintal</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm">
                  <span className="text-slate-900">Total Sanctioned Amount:</span>
                  <span className="text-emerald-700 font-mono text-base">
                    ₹{selectedDetails.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className="font-bold text-emerald-700">
                    {selectedDetails.paymentStatus === 'PAID' ? 'Payment Sent' : selectedDetails.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowWeighSlipModal(true)}
                  className="py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Scale className="w-4 h-4" />
                  <span>View Weighing Slip</span>
                </button>

                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Digital Receipt</span>
                </button>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDetails(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip Modal from History */}
      {showWeighSlipModal && selectedDetails && (
        <DigitalWeighingSlipModal
          procurement={
            selectedDetails.rawProcurement || {
              id: selectedDetails.procurementId,
              bookingId: selectedDetails.id,
              token: selectedDetails.token,
              farmerId: currentFarmer.farmerId,
              farmerName: currentFarmer.name,
              centreName: selectedDetails.centre,
              crop: selectedDetails.crop,
              bookedWeight: selectedDetails.bookedQuantity,
              grossWeight: selectedDetails.grossWeight,
              tareWeight: selectedDetails.tareWeight,
              actualWeight: selectedDetails.quantity,
              ratePerQuintal: selectedDetails.ratePerQuintal,
              expectedAmount: selectedDetails.amount,
              grossAmount: selectedDetails.amount,
              deductions: 0,
              netPayable: selectedDetails.amount,
              verificationStatus: 'VERIFIED',
              qualityGrade: 'FAQ Grade A',
              qualityStatus: 'ACCEPTABLE',
              moisture: 13.4,
              weighmentSlipNo: selectedDetails.weighingSlipId,
              procurementRefId: selectedDetails.procurementId,
              verifiedBy: 'Mandi Officer #01',
              operatorName: 'Mandi Official Weighmaster',
              weighingDate: selectedDetails.date,
              weighingTime: '10:30 AM',
              completedAt: new Date().toISOString(),
            }
          }
          booking={selectedDetails.rawBooking}
          onClose={() => setShowWeighSlipModal(false)}
        />
      )}

      {/* Receipt Modal from History */}
      {showReceiptModal && selectedDetails && (
        <DigitalReceiptModal
          procurement={selectedDetails.rawProcurement}
          payment={selectedDetails.rawPayment}
          booking={selectedDetails.rawBooking}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};

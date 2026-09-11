import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking } from '../../types';
import { CROP_PRICES } from '../../data/initialData';
import {
  Scale,
  X,
  UserCheck,
  CheckCircle2,
  Wheat,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface WeighmentProcureModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export const WeighmentProcureModal: React.FC<WeighmentProcureModalProps> = ({
  isOpen,
  booking,
  onClose,
}) => {
  const { completeProcurement } = useApp();

  const cropPrice = booking
    ? CROP_PRICES.find((c) => c.name.toLowerCase() === booking.crop.toLowerCase()) || CROP_PRICES[0]
    : CROP_PRICES[0];

  // Gross, Tare, Net states (Prompt 9: Net Weight auto-calculated: Gross - Tare)
  const defaultNet = booking?.actualWeight || booking?.bookedQuantity || 100;
  const [grossWeight, setGrossWeight] = useState<number>(defaultNet + 12);
  const [tareWeight, setTareWeight] = useState<number>(12);
  const [moisture, setMoisture] = useState<number>(booking?.moisturePercentage || 13.5);
  const [qualityGrade, setQualityGrade] = useState<string>(
    booking?.qualityGrade || 'FAQ Grade A (Fair Average Quality)'
  );
  const [qualityStatus, setQualityStatus] = useState<'ACCEPTABLE' | 'VERIFICATION_NEEDED' | 'REJECTED'>(
    'ACCEPTABLE'
  );
  const [remarks, setRemarks] = useState<string>(
    'Grain clean, moisture below 14.0% threshold, electronic weighbridge certified.'
  );
  const [verifiedBy, setVerifiedBy] = useState<string>('Rajesh Sharma (Mandi Officer #01)');
  const [operatorName, setOperatorName] = useState<string>('Mandi Official Weighmaster');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState<boolean>(false);

  // Sync state when booking changes
  useEffect(() => {
    if (booking) {
      const net = booking.actualWeight || booking.bookedQuantity;
      setGrossWeight(net + 12);
      setTareWeight(12);
      setMoisture(booking.moisturePercentage || 13.5);
      setQualityGrade(booking.qualityGrade || 'FAQ Grade A (Fair Average Quality)');
      setQualityStatus('ACCEPTABLE');
      setRemarks('Grain clean, moisture below 14.0% threshold, electronic weighbridge certified.');
      setIsConfirmed(false);
      setValidationError(null);
      setIsDone(false);
    }
  }, [booking?.id]);

  // Auto-calculated Net Weight: Gross - Tare
  const netWeight = Math.max(0, grossWeight - tareWeight);
  const quintals = (netWeight / 100).toFixed(2);
  const netPayable = Math.round((netWeight / 100) * cropPrice.mspPerQuintal);
  const diffFromBooked = booking ? netWeight - booking.bookedQuantity : 0;

  useEffect(() => {
    if (grossWeight < tareWeight) {
      setValidationError('Gross weight cannot be less than tare deduction weight.');
    } else if (netWeight <= 0) {
      setValidationError('Net weight must be greater than zero.');
    } else {
      setValidationError(null);
    }
  }, [grossWeight, tareWeight, netWeight]);

  // Early return after ALL hooks are called
  if (!isOpen || !booking) return null;

  const handleSaveProcurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (grossWeight < tareWeight || netWeight <= 0) {
      setValidationError('Please enter valid positive gross and tare weights.');
      return;
    }
    if (!isConfirmed) {
      setValidationError('Please check the confirmation box before saving procurement.');
      return;
    }

    completeProcurement({
      bookingId: booking.id,
      actualWeight: netWeight,
      grossWeight,
      tareWeight,
      qualityGrade,
      qualityStatus,
      moisturePercentage: moisture,
      remarks,
      operatorName,
      verifiedBy,
    });

    setIsDone(true);
    setTimeout(() => {
      setIsDone(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-6">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Token {booking.token}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Bay 1 Electronic Scale
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Weighing Entry & Procurement Completion
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isDone ? (
          <div className="p-10 text-center space-y-3 bg-white">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Procurement Finalized!</h3>
            <p className="text-xs text-slate-500">
              Weighment Slip generated, procurement reference recorded, and DBT payment queued.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSaveProcurement} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Farmer & Lot Info Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Farmer Name / ID:</span>
                <strong className="text-slate-900">{booking.farmerName} ({booking.farmerId})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Booked Crop & Quantity:</span>
                <strong className="text-slate-900">{booking.crop} • {booking.bookedQuantity} kg</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Procurement Centre:</span>
                <span className="text-slate-700 font-medium">{booking.centreName}</span>
              </div>
            </div>

            {/* Section 1: Calibrated Scale Weight Input */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-blue-600" />
                  <span>Electronic Weighbridge Entry (Gross, Tare, Net)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Net = Gross - Tare</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gross Weight */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gross Weight (kg)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Vehicle / bag gross weight</span>
                </div>

                {/* Tare Weight */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tare Weight (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={tareWeight}
                    onChange={(e) => setTareWeight(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Container / vehicle tare</span>
                </div>

                {/* Net Weight (Auto-calculated) */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex flex-col justify-center">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                    Calculated Net Weight
                  </span>
                  <div className="text-xl font-black font-mono text-emerald-950">
                    {netWeight} kg
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {quintals} quintals ({diffFromBooked >= 0 ? `+${diffFromBooked}` : diffFromBooked} kg vs booked)
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Quality & Moisture Analysis */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center justify-between">
                <span>Quality & Moisture Inspection</span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  MSP Rate: ₹{cropPrice.mspPerQuintal} / quintal
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Moisture Content (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={moisture}
                      onChange={(e) => setMoisture(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${
                        moisture <= 14.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {moisture <= 14.0 ? '≤ 14.0% OK' : '> 14.0% High'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quality Grade</label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FAQ Grade A (Fair Average Quality)">FAQ Grade A (Fair Average Quality)</option>
                    <option value="Common / FAQ">Common / FAQ</option>
                    <option value="Grade B (Acceptable with standard dockage)">Grade B (Acceptable with standard dockage)</option>
                    <option value="Super Premium Certified Seed">Super Premium Certified Seed</option>
                  </select>
                </div>
              </div>

              {/* Verification Result Pills (Prompt 9) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Inspection Verification Result
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQualityStatus('ACCEPTABLE')}
                    className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition-all cursor-pointer border ${
                      qualityStatus === 'ACCEPTABLE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✓ Within Acceptable Range
                  </button>

                  <button
                    type="button"
                    onClick={() => setQualityStatus('VERIFICATION_NEEDED')}
                    className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition-all cursor-pointer border ${
                      qualityStatus === 'VERIFICATION_NEEDED'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⚠ Requires Verification
                  </button>

                  <button
                    type="button"
                    onClick={() => setQualityStatus('REJECTED')}
                    className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition-all cursor-pointer border ${
                      qualityStatus === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✕ Rejected
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Inspector Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Transparent Calculation Display */}
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Calculation Logic:</span>
                <span className="font-mono text-emerald-950 font-bold">
                  {netWeight} kg ÷ 100 = {quintals} quintals × ₹{cropPrice.mspPerQuintal}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-emerald-200/80 text-sm">
                <span className="font-extrabold text-slate-900">Final Gross Payable Amount:</span>
                <strong className="text-emerald-800 font-mono text-lg">
                  ₹{netPayable.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Mandatory Confirmation (Prompt 9) */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => {
                    setIsConfirmed(e.target.checked);
                    setValidationError(null);
                  }}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-[11px] text-blue-950 leading-relaxed">
                  I confirm that electronic tare was zeroed and grain inspection passes Central Government MSP procurement guidelines. This will generate Weighment Slip #{`WS-2026-${booking.token.replace(/\D/g, '') || '104'}-001`} and update the farmer portal immediately.
                </span>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Save & Complete Procurement</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

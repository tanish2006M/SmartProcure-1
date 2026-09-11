import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  X,
  User,
  Building2,
  CheckCircle2,
  ArrowRight,
  Clock,
  Scale,
  CreditCard,
  RotateCcw,
} from 'lucide-react';

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateFarmerTab?: (tab: string) => void;
}

export const DemoTourModal: React.FC<DemoTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateFarmerTab,
}) => {
  const { setRole, resetToDemoData } = useApp();
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: 'Farmer Experience: Smart Slot Booking & Live Queue',
      role: 'farmer' as const,
      badge: 'Farmer Role (Ramesh Kumar - FRM1001)',
      desc: 'View Ramesh’s active appointment (Token P104) at Central Procurement Centre, or try booking a new slot. Notice the Smart Recommendation engine that suggests the lowest-congestion slot and alternative centre (North Mandi with 42% load).',
      highlight: 'Notice the live position (#6) and calculated waiting time: 6 farmers × 7 min = ~42 minutes.',
      actionLabel: 'Switch to Farmer View & See Queue',
      onAction: () => {
        setRole('farmer');
        if (onNavigateFarmerTab) onNavigateFarmerTab('queue');
        onClose();
      },
    },
    {
      num: 2,
      title: 'Mandi Official: Call Next & Mark Arrived',
      role: 'official' as const,
      badge: 'Official Role (Central Procurement Centre)',
      desc: 'Officials manage the live yard queue. Click "Call Next" to bring Token P098/P099 forward, or click "Mark Arrived" on Ramesh Kumar’s Token P104 when he checks in at the gate.',
      highlight: 'Every official action updates the queue immediately and recalculates waiting times for all waiting farmers.',
      actionLabel: 'Switch to Mandi Official View',
      onAction: () => {
        setRole('official');
        onClose();
      },
    },
    {
      num: 3,
      title: 'Weighing & Completing Grain Procurement',
      role: 'official' as const,
      badge: 'Official Action (Verification & Scale)',
      desc: 'In the Live Queue table, click "Weigh & Procure" for Token P104. Enter actual scale reading (e.g. 585 kg vs 600 kg booked), verify moisture %, and click "Complete Procurement".',
      highlight: 'Generates official Weighment Slip, calculates MSP value (₹42,500), and auto-triggers payment processing.',
      actionLabel: 'Go to Official Table to Procure',
      onAction: () => {
        setRole('official');
        onClose();
      },
    },
    {
      num: 4,
      title: 'DBT Payment Transfer & Instant Farmer Reflection',
      role: 'official' as const,
      badge: 'End-to-End Verification',
      desc: 'Update Payment to "PAID" (DBT reference generated). Switch back to Farmer view — Ramesh Kumar’s dashboard instantly reflects PAYMENT COMPLETED and the transaction appears in History!',
      highlight: 'Zero latency between official weighing, banking DBT update, and farmer notification.',
      actionLabel: 'Switch to Farmer Payment View',
      onAction: () => {
        setRole('farmer');
        if (onNavigateFarmerTab) onNavigateFarmerTab('payment');
        onClose();
      },
    },
  ];

  const active = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Top Banner */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-lg">SmartProcure Interactive Demo Guide</h3>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  National Portal
                </span>
              </div>
              <p className="text-xs text-slate-500">
                End-to-end procurement workflow demonstration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bubbles */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                currentStep === s.num
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Step {s.num}</div>
              <div className="text-xs font-bold truncate mt-0.5">
                {s.num === 1 ? 'Slot & Queue' : s.num === 2 ? 'Official Call' : s.num === 3 ? 'Weigh & Procure' : 'DBT Payment'}
              </div>
            </button>
          ))}
        </div>

        {/* Active Step Content Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs">
              {active.num <= 1 || active.num === 4 ? (
                <User className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
              )}
              {active.badge}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {active.num} of 4
            </span>
          </div>

          <h4 className="text-base font-extrabold text-slate-900 mb-2">
            {active.title}
          </h4>

          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            {active.desc}
          </p>

          <div className="bg-emerald-900/5 border border-emerald-600/20 rounded-xl p-3 text-xs text-emerald-950 font-medium">
            💡 <strong>Smart Feature:</strong> {active.highlight}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => resetToDemoData()}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-100 flex items-center gap-1.5"
              title="Reset data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>

            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Previous
              </button>
            )}
            {currentStep < 4 && (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                className="px-3 py-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900 font-bold"
              >
                Next Step →
              </button>
            )}
          </div>

          <button
            onClick={active.onAction}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <span>{active.actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

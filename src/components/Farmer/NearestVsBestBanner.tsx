import React from 'react';
import { CentreComparisonResult } from '../../types';
import {
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  TrendingDown,
  Scale,
  CheckCircle,
} from 'lucide-react';

interface NearestVsBestBannerProps {
  comparison: CentreComparisonResult;
  selectedCentreId: string;
  onSelectCentre: (centreId: string) => void;
  onOpenComparisonModal: () => void;
}

export const NearestVsBestBanner: React.FC<NearestVsBestBannerProps> = ({
  comparison,
  selectedCentreId,
  onSelectCentre,
  onOpenComparisonModal,
}) => {
  const {
    nearestCentre,
    bestCentre,
    timeSavingsMins,
    distanceDiffKm,
    travelDiffMins,
    waitSavingsMins,
    isDifferentCentre,
    recommendationNote,
  } = comparison;

  if (!isDifferentCentre) {
    return (
      <div className="bg-emerald-50/90 border border-emerald-300 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
                Optimal Mandi Match Found
              </strong>
              <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Score: {bestCentre.smartMatchScore}/100
              </span>
            </div>
            <p className="text-xs text-emerald-900 font-semibold mt-0.5">
              {bestCentre.centre.name.split(',')[0]} is your nearest centre ({bestCentre.distanceKm} km) and has low yard congestion!
            </p>
            <p className="text-[11px] text-emerald-700 mt-1">
              Estimated wait is only ~{bestCentre.currentWaitMins} mins with {bestCentre.availableSlotsCount} slots available today.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectCentre(bestCentre.centre.id)}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer ${
            selectedCentreId === bestCentre.centre.id
              ? 'bg-emerald-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {selectedCentreId === bestCentre.centre.id ? 'Selected Centre' : 'Select This Mandi'}
        </button>
      </div>
    );
  }

  // Nearest is different from Best Overall
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Smart Location Intelligence Advisory
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              Nearest Centre vs. Best Overall Centre
            </h3>
          </div>
        </div>

        <button
          onClick={onOpenComparisonModal}
          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Full 3-Centre Comparison Table</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Comparison Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Nearest Centre Column */}
        <div
          onClick={() => onSelectCentre(nearestCentre.centre.id)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedCentreId === nearestCentre.centre.id
              ? 'bg-slate-800/90 border-blue-500 ring-1 ring-blue-500'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
              <MapPin className="w-3 h-3" />
              Nearest Option
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              Score: {nearestCentre.smartMatchScore}/100
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-white mb-1">
            {nearestCentre.centre.name.split(',')[0]}
          </h4>
          <p className="text-[11px] text-slate-400 mb-3">
            {nearestCentre.distanceKm} km from farm • ~{nearestCentre.travelTimeMins} min travel
          </p>

          <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/60 rounded-xl text-center text-xs border border-slate-800/80 mb-3">
            <div>
              <span className="text-[10px] text-slate-500 block">Queue</span>
              <span className="font-bold text-amber-400 font-mono">
                {nearestCentre.queueSize} farmers
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Est. Wait</span>
              <span className="font-bold text-orange-400 font-mono">
                ~{nearestCentre.currentWaitMins}m
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Yard Load</span>
              <span className="font-bold text-slate-300 font-mono">
                {nearestCentre.yardLoad}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              Total Turnaround: <strong>~{nearestCentre.totalTurnaroundMins} mins</strong>
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                selectedCentreId === nearestCentre.centre.id
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-400 hover:underline'
              }`}
            >
              {selectedCentreId === nearestCentre.centre.id ? 'Selected' : 'Select Nearest'}
            </span>
          </div>
        </div>

        {/* Best Overall Centre Column */}
        <div
          onClick={() => onSelectCentre(bestCentre.centre.id)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            selectedCentreId === bestCentre.centre.id
              ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500'
              : 'bg-slate-900/60 border-emerald-900/40 hover:border-emerald-700/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
              Recommended Best Choice
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              Score: {bestCentre.smartMatchScore}/100
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-white mb-1">
            {bestCentre.centre.name.split(',')[0]}
          </h4>
          <p className="text-[11px] text-slate-400 mb-3">
            {bestCentre.distanceKm} km from farm (+{distanceDiffKm} km) • ~{bestCentre.travelTimeMins} min travel
          </p>

          <div className="grid grid-cols-3 gap-2 p-2.5 bg-emerald-950/40 rounded-xl text-center text-xs border border-emerald-900/60 mb-3">
            <div>
              <span className="text-[10px] text-emerald-400/80 block">Queue</span>
              <span className="font-bold text-emerald-300 font-mono">
                {bestCentre.queueSize} farmers
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400/80 block">Est. Wait</span>
              <span className="font-bold text-emerald-300 font-mono">
                ~{bestCentre.currentWaitMins}m
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400/80 block">Yard Load</span>
              <span className="font-bold text-emerald-300 font-mono">
                {bestCentre.yardLoad}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-300">
              Total Turnaround: <strong>~{bestCentre.totalTurnaroundMins} mins</strong>
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                selectedCentreId === bestCentre.centre.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-400 hover:underline'
              }`}
            >
              {selectedCentreId === bestCentre.centre.id ? 'Selected' : 'Select Recommended'}
            </span>
          </div>
        </div>
      </div>

      {/* Net Time Savings Advice Callout */}
      <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-200">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{recommendationNote}</span>
        </div>
        {timeSavingsMins > 0 && (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md font-mono font-bold shrink-0">
            Save ~{timeSavingsMins} mins
          </span>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { CentreIntelligence, FarmerLocation } from '../../types';
import {
  Scale,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ExternalLink,
  X,
} from 'lucide-react';
import { buildGoogleMapsDirectionsUrl } from '../../utils/locationIntelligence';

interface CentreComparisonModalProps {
  centresIntelligence: CentreIntelligence[];
  farmerLocation: FarmerLocation;
  selectedCentreId: string;
  onSelectCentre: (centreId: string) => void;
  onClose: () => void;
}

export const CentreComparisonModal: React.FC<CentreComparisonModalProps> = ({
  centresIntelligence,
  farmerLocation,
  selectedCentreId,
  onSelectCentre,
  onClose,
}) => {
  // Compare top 3 centres
  const topCentres = (centresIntelligence || []).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Multi-Centre Location & Queue Intelligence Comparison
              </h3>
              <p className="text-xs text-slate-400">
                Comparing travel distance, queue times, and yard congestion from {farmerLocation.addressLabel}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table / Cards */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topCentres.map((item) => {
              const {
                centre,
                distanceKm,
                travelTimeMins,
                currentWaitMins,
                queueSize,
                yardLoad,
                availableSlotsCount,
                totalTurnaroundMins,
                smartMatchScore,
                isBestOverall,
                isNearest,
                recommendedArrivalTime,
                recommendedDepartureTime,
              } = item;

              const isSelected = centre.id === selectedCentreId;

              return (
                <div
                  key={centre.id}
                  className={`rounded-3xl p-5 border flex flex-col justify-between relative transition-all ${
                    isBestOverall
                      ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400 shadow-xs'
                      : isSelected
                      ? 'bg-slate-50 border-blue-400 ring-1 ring-blue-300'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  {/* Top Badges */}
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {isBestOverall && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                          Recommended Best
                        </span>
                      )}
                      {isNearest && (
                        <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <MapPin className="w-3 h-3" />
                          Nearest Centre
                        </span>
                      )}
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {centre.code}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-1">
                      {centre.name.split(',')[0]}
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-4 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{centre.location.split(',')[0]}</span>
                    </p>

                    {/* Score Bar */}
                    <div className="mb-4 p-3 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Smart Match Score
                        </span>
                        <span className="text-xl font-black text-slate-900 font-mono">
                          {smartMatchScore} <span className="text-xs text-slate-400">/100</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Total Turnaround
                        </span>
                        <span className="text-sm font-black text-slate-800 font-mono">
                          ~{totalTurnaroundMins} mins
                        </span>
                      </div>
                    </div>

                    {/* Metrics List */}
                    <div className="space-y-2.5 text-xs text-slate-600 mb-5">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Distance from Farm:</span>
                        <strong className="text-slate-900 font-mono">{distanceKm} km</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Transit Travel Time:</span>
                        <strong className="text-slate-900 font-mono">~{travelTimeMins} mins</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Waiting Queue:</span>
                        <strong className="text-amber-700 font-mono">{queueSize} farmers</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Est. Queue Wait:</span>
                        <strong className="text-slate-900 font-mono">~{currentWaitMins} mins</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Yard Capacity Load:</span>
                        <strong className="text-slate-900 font-mono">{yardLoad}%</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Slots Available Today:</span>
                        <strong className="text-emerald-700 font-mono">{availableSlotsCount} open</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Leave by (Recommended):</span>
                        <strong className="text-blue-700 font-mono font-bold">{recommendedDepartureTime}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => {
                        onSelectCentre(centre.id);
                        onClose();
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : isBestOverall
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <span>{isSelected ? 'Currently Selected' : 'Choose this Mandi'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={buildGoogleMapsDirectionsUrl(farmerLocation, centre.coordinates)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Tip: Travelling 5-8 km further often saves 40+ minutes of waiting in high-congestion yards.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

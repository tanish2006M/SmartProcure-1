import React from 'react';
import { CentreIntelligence, FarmerLocation } from '../../types';
import { buildGoogleMapsDirectionsUrl } from '../../utils/locationIntelligence';
import {
  Building2,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Scale,
  Users,
  Calendar,
  Phone,
  Layers,
  X,
} from 'lucide-react';

interface CentreDetailsCardProps {
  intelligence: CentreIntelligence;
  farmerLocation: FarmerLocation;
  isSelected?: boolean;
  onClose: () => void;
  onSelectAndBook?: (centreId: string) => void;
  onSelectCentre?: (centreId: string) => void;
  onCompare?: (centreId: string) => void;
  onOpenComparison?: () => void;
}

export const CentreDetailsCard: React.FC<CentreDetailsCardProps> = ({
  intelligence,
  farmerLocation,
  isSelected: _isSelected,
  onClose,
  onSelectAndBook,
  onSelectCentre,
  onCompare,
  onOpenComparison,
}) => {
  const {
    centre,
    distanceKm,
    travelTimeMins,
    currentWaitMins,
    queueSize,
    yardLoad,
    availableSlotsCount,
    smartMatchScore,
    scoreBreakdown,
    reasons,
    isNearest,
    isBestOverall,
    recommendedArrivalTime,
    recommendedDepartureTime,
  } = intelligence;

  const directionsUrl = buildGoogleMapsDirectionsUrl(
    farmerLocation,
    centre.coordinates
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Card Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white relative flex items-start justify-between gap-4">
          <div className="min-w-0 pr-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700 px-2 py-0.5 rounded">
                {centre.code}
              </span>
              {isBestOverall && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                  Recommended Best Mandi
                </span>
              )}
              {isNearest && (
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-300" />
                  Nearest to Your Village
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              {centre.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{centre.location}, {centre.district}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Distance
              </span>
              <div className="text-lg font-black text-slate-900 font-mono">
                {distanceKm} <span className="text-xs font-semibold text-slate-500">km</span>
              </div>
              <span className="text-[11px] text-slate-500">~{travelTimeMins} min transit</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Est. Waiting Time
              </span>
              <div className="text-lg font-black text-emerald-700 font-mono">
                ~{currentWaitMins} <span className="text-xs font-semibold text-slate-500">min</span>
              </div>
              <span className="text-[11px] text-slate-500">{queueSize} farmers ahead</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Yard Load
              </span>
              <div className="text-lg font-black text-slate-900 font-mono">
                {yardLoad}%
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${
                    yardLoad > 75 ? 'bg-orange-500' : yardLoad > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, yardLoad)}%` }}
                />
              </div>
            </div>

            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                Smart Match Score
              </span>
              <div className="text-xl font-black text-emerald-800 font-mono">
                {smartMatchScore} <span className="text-xs font-bold text-emerald-600">/ 100</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700">
                {smartMatchScore >= 85 ? 'High Efficiency' : smartMatchScore >= 65 ? 'Moderate Match' : 'Sub-Optimal'}
              </span>
            </div>
          </div>

          {/* Recommended Departure & Arrival Intelligence */}
          {recommendedArrivalTime && (
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 block font-bold mb-0.5">
                  Recommended Travel & Arrival Advisory:
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  Start your journey by <strong className="text-blue-900 font-mono font-bold">{recommendedDepartureTime}</strong> from {farmerLocation.village || 'your farm'} to arrive at Mandi Gate around <strong className="text-emerald-900 font-mono font-bold">{recommendedArrivalTime}</strong>.
                </p>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Includes ~{travelTimeMins} mins road transit and 15 mins gate entry check-in window.
                </span>
              </div>
            </div>
          )}

          {/* Smart Match Breakdown & Reasons */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Smart Centre Recommendation Reasons</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {reasons.map((reason, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Active Weighbridges:</span>
                <strong className="text-slate-900">{centre.activeCounters} Counters</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Avg. Weighment Time:</span>
                <strong className="text-slate-900">{centre.avgProcessingTimeMins || 7} mins / vehicle</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Daily Throughput:</span>
                <strong className="text-slate-900">{centre.capacity} Farmers/day</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Operating Hours:</span>
                <strong className="text-slate-900">{centre.operatingHours || '08:00 AM - 06:00 PM'}</strong>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                Supported MSP Commodities:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(centre.supportedCrops || ['Paddy (Common)', 'Wheat (Sharbati/FAQ)', 'Mustard / Rapeseed']).map(
                  (cropName) => (
                    <span
                      key={cropName}
                      className="bg-slate-100 text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    >
                      {cropName}
                    </span>
                  )
                )}
              </div>
              <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Helpdesk: {centre.contactNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (typeof onCompare === 'function') {
                  onCompare(centre.id);
                } else if (typeof onOpenComparison === 'function') {
                  onOpenComparison();
                }
              }}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Compare with Others
            </button>
            <button
              onClick={() => {
                if (typeof onSelectAndBook === 'function') {
                  onSelectAndBook(centre.id);
                } else if (typeof onSelectCentre === 'function') {
                  onSelectCentre(centre.id);
                }
                onClose();
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Book Slot at this Centre</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

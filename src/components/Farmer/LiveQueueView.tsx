import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../translations';
import {
  Radio,
  Clock,
  Layers,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  RefreshCw,
  Bell,
  Volume2,
  ArrowLeft,
} from 'lucide-react';

interface LiveQueueViewProps {
  onNavigate?: (tab: string) => void;
}

export const LiveQueueView: React.FC<LiveQueueViewProps> = ({ onNavigate }) => {
  const {
    currentFarmer,
    getFarmerActiveBooking,
    getFarmerQueueStats,
    bookings,
    centres,
    language,
    isOnline,
  } = useApp();
  const t = translations[language];

  const activeBooking = getFarmerActiveBooking(currentFarmer.id);
  const centre = centres.find((c) => c.id === activeBooking?.centreId) || centres[0];
  const queueStats = activeBooking ? getFarmerQueueStats(activeBooking.id) : null;

  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [pulseActive, setPulseActive] = useState<boolean>(true);

  // Active queue bookings at this centre (WAITING, ARRIVED, VERIFYING, PROCESSING)
  const activeQueue = bookings
    .filter(
      (b) =>
        b.centreId === centre.id &&
        (b.status === 'WAITING' ||
          b.status === 'ARRIVED' ||
          b.status === 'VERIFYING' ||
          b.status === 'PROCESSING')
    )
    .sort((a, b) => a.token.localeCompare(b.token));

  const farmersAheadCount = queueStats?.farmersAhead ?? 6;
  const avgTime = queueStats?.avgProcessingTimeMins ?? 7;
  const estimatedWait = queueStats?.estimatedWaitMins ?? 42;
  const currentServing = queueStats?.currentServingToken || centre.currentServingToken || 'P098';

  const isTurnApproaching = farmersAheadCount <= 3 && farmersAheadCount > 0;
  const isServingNow = activeBooking?.token === currentServing;

  useEffect(() => {
    const timer = setInterval(() => {
      setLastRefreshed(new Date());
      setPulseActive((p) => !p);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Yard Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {t.queue.title}
            </h2>
            <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
              Live Yard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {centre.name} • {t.queue.queueProgressionNotice}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            Auto-refreshed: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={() => setLastRefreshed(new Date())}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Force refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Turn Approaching Alert (Prompt #12 Notification logic) */}
      {isTurnApproaching && (
        <div className="bg-amber-500 text-slate-950 p-4 rounded-2xl font-bold text-xs flex items-center gap-3.5 shadow-md border border-amber-600/30">
          <div className="p-2.5 rounded-xl bg-slate-950 text-amber-400 shrink-0">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-black flex items-center gap-2">
              <span>{t.queue.turnApproachingAlert}</span>
              <span className="bg-slate-950 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                Action Required
              </span>
            </div>
            <div className="text-xs text-slate-900 font-medium mt-0.5">
              Only <strong>{farmersAheadCount} farmer{farmersAheadCount > 1 ? 's' : ''}</strong> ahead of your token <strong>{activeBooking?.token}</strong>. Please bring your tractor to Weighbridge Bay A.
            </div>
          </div>
        </div>
      )}

      {/* Serving Now Banner (Prompt #9) */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-emerald-800/40 relative overflow-hidden text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/20 px-3 py-1 rounded-full text-xs uppercase tracking-widest font-extrabold text-emerald-400 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{t.queue.nowServing}</span>
        </div>
        <div className="text-5xl sm:text-7xl font-black font-mono tracking-wider text-emerald-300 drop-shadow-sm my-1">
          {currentServing}
        </div>
        <div className="text-xs text-slate-300 font-medium mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span className="bg-white/10 px-2.5 py-0.5 rounded-md font-semibold text-emerald-200">
            Weighbridge Bay A & B
          </span>
          <span className="text-slate-500">•</span>
          <span className="bg-white/10 px-2.5 py-0.5 rounded-md font-semibold text-slate-200">
            Counter #01 (Active)
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-300 font-semibold">
            Automated Weighment
          </span>
        </div>
      </div>

      {/* 4 Core Metrics Grid (Prompt section 9 & 10) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Metric 1: Your Token */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t.queue.yourToken}
              </span>
              <span className="p-1 rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight">
              {activeBooking ? activeBooking.token : 'N/A'}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-semibold truncate pt-2 border-t border-slate-100">
            {currentFarmer.name}
          </div>
        </div>

        {/* Metric 2: Farmers Ahead */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t.queue.farmersAheadCount}
              </span>
              <span className="p-1 rounded-lg bg-amber-50 text-amber-700">
                <Layers className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-800 font-mono tracking-tight">
              {farmersAheadCount}
            </div>
          </div>
          <div className="text-[11px] text-slate-600 mt-2 font-semibold pt-2 border-t border-slate-100">
            Queue Position #{queueStats?.position || 1}
          </div>
        </div>

        {/* Metric 3: Avg Processing Time */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t.queue.avgProcessTime}
              </span>
              <span className="p-1 rounded-lg bg-slate-100 text-slate-700">
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {avgTime}m
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-semibold pt-2 border-t border-slate-100">
            Per Vehicle Weighment
          </div>
        </div>

        {/* Metric 4: Estimated Waiting */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t.common.estimatedWait}
              </span>
              <span className="p-1 rounded-lg bg-blue-50 text-blue-700">
                <TrendingDown className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700 font-mono tracking-tight">
              ~{estimatedWait}m
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-semibold pt-2 border-t border-slate-100">
            Real-Time Dynamic
          </div>
        </div>
      </div>

      {/* Waiting Time Estimation Formula Card (Prompt #10) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Automated Waiting Time Calculation Formula</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-amber-700 font-bold">{farmersAheadCount} farmers ahead</span>
            <span className="text-slate-400 mx-2">×</span>
            <span className="text-slate-700 font-bold">{avgTime} mins processing</span>
            <span className="text-slate-400 mx-2">=</span>
            <span className="text-blue-700 font-black text-base">~{estimatedWait} mins waiting</span>
          </div>
          <span className="text-[11px] text-slate-400 font-sans font-normal">
            Updates in real-time as officials complete weighments
          </span>
        </div>
      </div>

      {/* Visual Live Queue Token Track (Prompt #9: NOW SERVING P098, P099, P100... YOU -> P104...) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">
            Live Token Sequence in Yard
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {activeQueue.length} tokens active
          </span>
        </div>

        <div className="space-y-2.5">
          {activeQueue.map((item, idx) => {
            const isMe = activeBooking && item.id === activeBooking.id;
            const isCurrentlyServing = item.token === currentServing;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isMe
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500'
                    : isCurrentlyServing
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                {/* Left: Token & Status */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm ${
                      isCurrentlyServing
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isMe
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200'
                    }`}
                  >
                    {item.token}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        {item.farmerName}
                      </span>
                      {isMe && (
                        <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          YOU
                        </span>
                      )}
                      {isCurrentlyServing && (
                        <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          SERVING NOW
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.crop} • {item.bookedQuantity} kg • Slot: {item.timeSlot.split('-')[0]}
                    </div>
                  </div>
                </div>

                {/* Right: Position & Status */}
                <div className="text-right">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      item.status === 'PROCESSING'
                        ? 'bg-blue-100 text-blue-800'
                        : item.status === 'ARRIVED'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                  <div className="text-[11px] font-mono font-semibold text-slate-500 mt-1">
                    Queue #{idx + 1}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

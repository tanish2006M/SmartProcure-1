import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Bot,
  Send,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  buildContextSnapshot,
  generateDeterministicResponse,
} from '../../services/smartProcureAiEngine';

export const AdminAiInsightsWidget: React.FC = () => {
  const { centres, bookings, payments, procurements, notifications, isOnline } = useApp();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const highestLoadCentre = [...centres].sort((a, b) => b.currentLoad - a.currentLoad)[0];

  const quickPrompts = [
    'Which centre needs attention?',
    'Why is waiting time increasing?',
    'Which centre has highest congestion risk?',
    'What action should we take?',
  ];

  const handleAsk = async (promptText: string) => {
    const q = (promptText || query).trim();
    if (!q || loading) return;

    setLoading(true);
    setResponse(null);

    const contextSnapshot = buildContextSnapshot({
      role: 'admin',
      language: 'en',
      currentFarmer: {
        id: 'admin',
        farmerId: 'ADMIN-CENTRAL',
        name: 'Central Admin Cell',
        mobile: '1800-180-1551',
        state: 'National',
        district: 'HQ',
        village: 'Monitoring Bureau',
        crop: 'Multi-Crop',
        quantity: 0,
      },
      centres,
      notifications,
      isOnline,
    });

    if (isDemoMode || !isOnline) {
      setTimeout(() => {
        const res = generateDeterministicResponse(q, {
          role: 'admin',
          language: 'en',
          currentFarmer: {
            id: 'admin',
            farmerId: 'ADMIN-CENTRAL',
            name: 'Central Admin Cell',
            mobile: '1800-180-1551',
            state: 'National',
            district: 'HQ',
            village: 'Monitoring Bureau',
            crop: 'Multi-Crop',
            quantity: 0,
          },
          centres,
          notifications,
          isOnline,
        });
        setResponse(res.text);
        setLoading(false);
      }, 350);
      return;
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          role: 'admin',
          language: 'en',
          contextSnapshot,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.text) {
        setResponse(data.text);
      } else {
        throw new Error('No text returned');
      }
    } catch {
      // Fallback
      const res = generateDeterministicResponse(q, {
        role: 'admin',
        language: 'en',
        currentFarmer: {
          id: 'admin',
          farmerId: 'ADMIN-CENTRAL',
          name: 'Central Admin Cell',
          mobile: '1800-180-1551',
          state: 'National',
          district: 'HQ',
          village: 'Monitoring Bureau',
          crop: 'Multi-Crop',
          quantity: 0,
        },
        centres,
        notifications,
        isOnline,
      });
      setResponse(res.text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-5 sm:p-6 rounded-3xl border border-emerald-500/30 shadow-xl mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold tracking-tight">SmartProcure AI Intelligence & Decision Support</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Executive Co-Pilot
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Live automated root-cause analysis, queue bottleneck detection, and load balancing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all border cursor-pointer ${
              isDemoMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
            }`}
          >
            {isDemoMode ? '⚡ AI Demo Mode' : '🟢 Live AI'}
          </button>
        </div>
      </div>

      {/* Live AI Health Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <span className="text-slate-400 block text-[11px] font-medium">Highest Congestion Centre</span>
          <span className="font-bold text-amber-300 text-sm">{highestLoadCentre?.name || 'Central Mandi'}</span>
          <span className="block text-[11px] text-slate-300">
            Operating at {highestLoadCentre?.currentLoad || 78}% capacity (~{(highestLoadCentre?.avgProcessingTimeMins || 7) * 5} min wait)
          </span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <span className="text-slate-400 block text-[11px] font-medium">Yard Throughput Efficiency</span>
          <span className="font-bold text-emerald-300 text-sm">7.2 min / vehicle</span>
          <span className="block text-[11px] text-slate-300">Within optimal FAQ weighing and moisture tolerance</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <span className="text-slate-400 block text-[11px] font-medium">Auto-Balancing Recommendation</span>
          <span className="font-bold text-cyan-300 text-sm">Pacing Shift (+15m)</span>
          <span className="block text-[11px] text-slate-300">Divert afternoon walk-ins to East Sub-Centre (31% load)</span>
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(p);
              handleAsk(p);
            }}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/20 hover:border-emerald-400/50 border border-white/15 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(query);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask SmartProcure AI about state-wide Mandi throughput, queue bottlenecks, or payment clearance..."
          className="flex-1 bg-slate-950/60 border border-slate-700 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-hidden"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>{loading ? 'Analyzing...' : 'Ask AI'}</span>
        </button>
      </form>

      {/* AI Answer Display */}
      {response && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-xs sm:text-sm leading-relaxed text-slate-200 shadow-inner whitespace-pre-line">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>AI Analytical Assessment & Recommendation</span>
          </div>
          {response}
        </div>
      )}
    </div>
  );
};

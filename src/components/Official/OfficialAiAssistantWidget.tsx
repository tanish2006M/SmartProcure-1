import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Bot,
  Send,
  HelpCircle,
  Clock,
  Radio,
  Scale,
  CheckCircle2,
  RefreshCw,
  Building2,
} from 'lucide-react';
import {
  buildContextSnapshot,
  generateDeterministicResponse,
} from '../../services/smartProcureAiEngine';

interface OfficialAiAssistantWidgetProps {
  centreId: string;
}

export const OfficialAiAssistantWidget: React.FC<OfficialAiAssistantWidgetProps> = ({ centreId }) => {
  const { centres, bookings, notifications, isOnline } = useApp();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const centre = centres.find((c) => c.id === centreId) || centres[0];
  const centreBookings = bookings.filter((b) => b.centreId === centre.id);
  const activeQueue = centreBookings.filter(
    (b) => b.status === 'WAITING' || b.status === 'ARRIVED' || b.status === 'VERIFYING'
  );

  const quickPrompts = [
    'Why is the queue increasing?',
    'Which tokens are approaching?',
    'How many counters are active?',
    'What should I prioritize?',
  ];

  const handleAsk = async (promptText: string) => {
    const q = (promptText || query).trim();
    if (!q || loading) return;

    setLoading(true);
    setResponse(null);

    const contextSnapshot = buildContextSnapshot({
      role: 'official',
      language: 'en',
      currentFarmer: {
        id: 'official-1',
        farmerId: 'MANDI-OFFICER',
        name: 'Mandi Procurement Officer',
        mobile: '1800-180-1551',
        state: centre.state,
        district: centre.district,
        village: centre.location,
        crop: 'Wheat',
        quantity: 0,
      },
      queueStats: {
        currentServingToken: centre.currentServingToken || 'P098',
        position: 1,
        farmersAhead: activeQueue.length,
        estimatedWaitMins: activeQueue.length * (centre.avgProcessingTimeMins || 7),
        avgProcessingTimeMins: centre.avgProcessingTimeMins || 7,
      },
      centres,
      notifications,
      isOnline,
    });

    if (isDemoMode || !isOnline) {
      setTimeout(() => {
        const res = generateDeterministicResponse(q, {
          role: 'official',
          language: 'en',
          currentFarmer: {
            id: 'official-1',
            farmerId: 'MANDI-OFFICER',
            name: 'Mandi Procurement Officer',
            mobile: '1800-180-1551',
            state: centre.state,
            district: centre.district,
            village: centre.location,
            crop: 'Wheat',
            quantity: 0,
          },
          queueStats: {
            currentServingToken: centre.currentServingToken || 'P098',
            position: 1,
            farmersAhead: activeQueue.length,
            estimatedWaitMins: activeQueue.length * (centre.avgProcessingTimeMins || 7),
            avgProcessingTimeMins: centre.avgProcessingTimeMins || 7,
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
          role: 'official',
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
      const res = generateDeterministicResponse(q, {
        role: 'official',
        language: 'en',
        currentFarmer: {
          id: 'official-1',
          farmerId: 'MANDI-OFFICER',
          name: 'Mandi Procurement Officer',
          mobile: '1800-180-1551',
          state: centre.state,
          district: centre.district,
          village: centre.location,
          crop: 'Wheat',
          quantity: 0,
        },
        queueStats: {
          currentServingToken: centre.currentServingToken || 'P098',
          position: 1,
          farmersAhead: activeQueue.length,
          estimatedWaitMins: activeQueue.length * (centre.avgProcessingTimeMins || 7),
          avgProcessingTimeMins: centre.avgProcessingTimeMins || 7,
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
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-5 rounded-3xl border border-teal-500/30 shadow-xl mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold tracking-tight">SmartProcure AI Yard Assistant</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30">
                {centre.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Operational queue intelligence, weighbridge pacing, and gate throughput guidance
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDemoMode(!isDemoMode)}
          className={`text-[11px] px-2.5 py-1 rounded-xl font-bold transition-all border cursor-pointer ${
            isDemoMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
              : 'bg-teal-500/20 text-teal-300 border-teal-400/40'
          }`}
        >
          {isDemoMode ? '⚡ AI Demo Mode' : '🟢 Live AI'}
        </button>
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
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-teal-500/20 hover:border-teal-400/50 border border-white/15 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer disabled:opacity-50"
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
          placeholder="Ask AI about yard queue delays, approaching farmers, or weighbridge throughput..."
          className="flex-1 bg-slate-950/60 border border-slate-700 focus:border-teal-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-hidden"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>{loading ? 'Analyzing...' : 'Ask AI'}</span>
        </button>
      </form>

      {/* AI Answer Display */}
      {response && (
        <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/80 border border-teal-500/30 text-xs leading-relaxed text-slate-200 shadow-inner whitespace-pre-line">
          <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-white/10 text-teal-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Operational Recommendation</span>
          </div>
          {response}
        </div>
      )}
    </div>
  );
};

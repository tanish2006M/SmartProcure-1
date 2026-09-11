import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { CROP_PRICES } from '../data/initialData';
import {
  Wheat,
  Clock,
  Radio,
  CheckCircle2,
  ArrowRight,
  Search,
  Building2,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  TrendingUp,
  MapPin,
  Users,
} from 'lucide-react';

interface LandingPageProps {
  onStartBooking: () => void;
  onTrackQueue: () => void;
  onOfficialLogin: () => void;
  onAdminLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartBooking,
  onTrackQueue,
  onOfficialLogin,
  onAdminLogin,
}) => {
  const { language, centres, bookings } = useApp();
  const t = translations[language];

  const [searchToken, setSearchToken] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleTrackToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchToken.trim()) return;
    const cleanToken = searchToken.trim().toUpperCase();
    const found = bookings.find((b) => b.token.toUpperCase() === cleanToken);
    setSearchResult(found || null);
    setHasSearched(true);
  };

  const workflowSteps = [
    {
      num: 1,
      title: 'Book Slot',
      desc: 'Smart load-balanced scheduling avoids long Mandi queues.',
      icon: <CalendarCheck className="w-5 h-5 text-emerald-600" />,
    },
    {
      num: 2,
      title: 'Get Token',
      desc: 'Instant digital token pass with assigned entry gate & time window.',
      icon: <Radio className="w-5 h-5 text-blue-600" />,
    },
    {
      num: 3,
      title: 'Track Queue',
      desc: 'Live SMS & mobile updates of counter movement and estimated wait time.',
      icon: <Clock className="w-5 h-5 text-amber-600" />,
    },
    {
      num: 4,
      title: 'Weigh & Procure',
      desc: 'Digital scale weighment, moisture test, and official electronic certificate.',
      icon: <Wheat className="w-5 h-5 text-teal-600" />,
    },
    {
      num: 5,
      title: 'Get Paid (DBT)',
      desc: 'Direct bank transfer at guaranteed Govt MSP rates directly to Aadhaar account.',
      icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Government Department Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ministry of Consumer Affairs, Food & Public Distribution (DoCA)</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            {t.landing.heroTitle}
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 mb-10 leading-relaxed font-normal">
            {t.landing.heroSubtitle}
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-14">
            <button
              onClick={onStartBooking}
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-2"
            >
              <span>{t.landing.ctaBook}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onTrackQueue}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>{t.landing.ctaTrack}</span>
            </button>

            <button
              onClick={onOfficialLogin}
              className="px-6 py-3.5 bg-transparent hover:bg-white/5 text-slate-300 hover:text-white text-sm font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>{t.landing.ctaOfficial}</span>
            </button>
          </div>

          {/* Live Quick Token Tracker Card */}
          <div className="max-w-xl mx-auto bg-slate-800/90 backdrop-blur-md rounded-2xl p-5 border border-slate-700 shadow-xl text-left">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-300">
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Quick Live Token Tracker</span>
              <span className="text-[11px] text-slate-400 font-normal ml-auto">
                Try: <span className="font-mono text-emerald-300 font-bold">P104</span> (Ramesh Kumar)
              </span>
            </div>

            <form onSubmit={handleTrackToken} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Token (e.g. P104, P098, N042)"
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Track Now
              </button>
            </form>

            {hasSearched && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs">
                {searchResult ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          Token {searchResult.token}
                        </span>
                        <span className="text-slate-300 font-medium">({searchResult.farmerName})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700/50">
                        {searchResult.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>Centre: <span className="text-slate-200">{searchResult.centreName.split(',')[0]}</span></div>
                      <div>Slot: <span className="text-slate-200">{searchResult.timeSlot}</span></div>
                      <div>Crop: <span className="text-slate-200">{searchResult.crop}</span></div>
                      <div>Booked Qty: <span className="text-slate-200">{searchResult.bookedQuantity} kg</span></div>
                    </div>
                    <button
                      onClick={onTrackQueue}
                      className="w-full mt-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors text-center block"
                    >
                      View in Live Mandi Queue →
                    </button>
                  </div>
                ) : (
                  <div className="text-rose-400 py-1 font-medium">
                    Token not found. Please verify the token number (e.g. P104).
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Live MSP Rates Ticker */}
      <section className="bg-emerald-900/10 border-b border-emerald-900/20 py-3 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 text-xs">
          <span className="bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[11px] shrink-0 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            GOVT MSP 2026-27
          </span>
          <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap scrollbar-none py-1 text-slate-700">
            {CROP_PRICES.map((crop) => (
              <div key={crop.name} className="inline-flex items-center gap-1.5 font-medium">
                <span>{crop.icon}</span>
                <span className="font-semibold text-slate-900">{crop.name}:</span>
                <span className="text-emerald-700 font-bold">₹{crop.mspPerQuintal.toLocaleString('en-IN')}/q</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5-Step Visual Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            End-to-End Procurement Lifecycle
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
            {t.landing.workflowTitle}
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Eliminating 4-6 hours of manual yard delays into a predictable 25-minute smart digital process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {workflowSteps.map((step, idx) => (
            <div
              key={step.num}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all relative"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  {step.icon}
                </div>
                <span className="text-xl font-black text-slate-300 font-mono">
                  0{step.num}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">{step.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              {idx < workflowSteps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-400">
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3 Major Benefits */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 font-black">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {t.landing.benefit1Title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t.landing.benefit1Desc}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 font-black">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {t.landing.benefit2Title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t.landing.benefit2Desc}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 font-black">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {t.landing.benefit3Title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t.landing.benefit3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Active Procurement Centres Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Live Mandi Network
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
              Procurement Centres & Real-time Yard Load
            </h2>
          </div>
          <button
            onClick={onStartBooking}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>Book a slot at these centres</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {centres.map((centre) => {
            const isBusy = centre.status === 'BUSY';
            const isModerate = centre.status === 'MODERATE';
            return (
              <div
                key={centre.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                        isBusy
                          ? 'bg-rose-100 text-rose-800'
                          : isModerate
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {centre.status}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {centre.code}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">
                    {centre.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{centre.location}</span>
                  </p>

                  <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Current Yard Load:</span>
                      <span className="font-bold text-slate-900">{centre.currentLoad}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          centre.currentLoad > 70
                            ? 'bg-rose-500'
                            : centre.currentLoad > 45
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${centre.currentLoad}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500">Avg Weighing Time:</span>
                      <span className="font-semibold text-slate-800">{centre.avgProcessingTimeMins} mins</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onStartBooking}
                  className="w-full py-2 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 text-xs font-bold rounded-xl transition-all text-center"
                >
                  Select & Book Slot
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Role Access Footer Shortcuts for Judges */}
      <section className="max-w-5xl mx-auto px-4 mt-8">
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-extrabold mb-1">National Procurement Portal Experience</h3>
            <p className="text-xs text-slate-400 max-w-md">
              Explore each unified portal role: Farmers, Mandi Procurement Officials, and Central Administrators.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onStartBooking}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
            >
              Farmer Demo
            </button>
            <button
              onClick={onOfficialLogin}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
            >
              Official Dashboard
            </button>
            <button
              onClick={onAdminLogin}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
            >
              State Admin
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

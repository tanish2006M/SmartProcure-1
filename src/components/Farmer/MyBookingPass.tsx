import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../translations';
import {
  QrCode,
  Calendar,
  Clock,
  MapPin,
  Wheat,
  Printer,
  ShieldCheck,
  AlertCircle,
  Phone,
  ArrowRight,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  X,
  Navigation,
  ExternalLink,
  Compass,
} from 'lucide-react';
import { buildGoogleMapsDirectionsUrl } from '../../utils/locationIntelligence';

interface MyBookingPassProps {
  onNavigate: (tab: string) => void;
}

export const MyBookingPass: React.FC<MyBookingPassProps> = ({ onNavigate }) => {
  const { currentFarmer, centres, farmerLocation, getFarmerActiveBooking, cancelBooking, language } = useApp();
  const t = translations[language];

  const [showCancelModal, setShowCancelModal] = useState(false);

  const booking = getFarmerActiveBooking(currentFarmer.id);
  const centre = centres.find((c) => c.id === booking?.centreId);

  if (!booking) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xs max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Gate Pass</h3>
        <p className="text-xs text-slate-500 mb-6">
          Book a procurement slot to generate your digital Mandi entry QR pass.
        </p>
        <button
          onClick={() => onNavigate('bookSlot')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
        >
          Book Slot
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Digital Mandi Gate Pass
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Present this QR code at Mandi Gate No. 4 for expedited vehicle check-in.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cancel this appointment"
          >
            <Trash2 className="w-4 h-4" />
            <span>Cancel Pass</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Pass</span>
          </button>
        </div>
      </div>

      {/* Pass Card */}
      <div className="bg-white rounded-3xl border-2 border-emerald-600 shadow-lg overflow-hidden relative">
        {/* Pass Header */}
        <div className="bg-emerald-700 text-white p-5 text-center relative">
          <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-200">
            Govt. of India • Department of Consumer Affairs
          </div>
          <h3 className="text-lg font-black tracking-tight mt-1">
            Kisan Grain Procurement Entry Pass
          </h3>
          <div className="mt-2 inline-block bg-white text-emerald-950 px-3 py-0.5 rounded-full text-xs font-black font-mono">
            TOKEN: {booking.token}
          </div>
        </div>

        {/* QR Code and Key Details */}
        <div className="p-6 text-center space-y-5">
          {/* Simulated QR Code SVG */}
          <div className="w-44 h-44 mx-auto p-3 bg-white border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center shadow-xs">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
              <rect width="100" height="100" fill="#ffffff" />
              {/* Corner position markers */}
              <rect x="5" y="5" width="26" height="26" fill="#0f172a" />
              <rect x="9" y="9" width="18" height="18" fill="#ffffff" />
              <rect x="13" y="13" width="10" height="10" fill="#0f172a" />

              <rect x="69" y="5" width="26" height="26" fill="#0f172a" />
              <rect x="73" y="9" width="18" height="18" fill="#ffffff" />
              <rect x="77" y="13" width="10" height="10" fill="#0f172a" />

              <rect x="5" y="69" width="26" height="26" fill="#0f172a" />
              <rect x="9" y="73" width="18" height="18" fill="#ffffff" />
              <rect x="13" y="77" width="10" height="10" fill="#0f172a" />

              {/* Data pattern blocks */}
              <rect x="36" y="8" width="6" height="6" fill="#0f172a" />
              <rect x="46" y="8" width="6" height="6" fill="#0f172a" />
              <rect x="56" y="8" width="6" height="6" fill="#0f172a" />
              <rect x="36" y="18" width="6" height="6" fill="#0f172a" />
              <rect x="50" y="24" width="6" height="6" fill="#0f172a" />
              <rect x="36" y="36" width="28" height="28" fill="#059669" rx="4" />
              <rect x="10" y="38" width="6" height="6" fill="#0f172a" />
              <rect x="20" y="48" width="6" height="6" fill="#0f172a" />
              <rect x="72" y="38" width="6" height="6" fill="#0f172a" />
              <rect x="82" y="48" width="6" height="6" fill="#0f172a" />
              <rect x="72" y="68" width="6" height="6" fill="#0f172a" />
              <rect x="82" y="78" width="6" height="6" fill="#0f172a" />
              <rect x="40" y="72" width="6" height="6" fill="#0f172a" />
              <rect x="52" y="72" width="6" height="6" fill="#0f172a" />
              <rect x="46" y="84" width="6" height="6" fill="#0f172a" />
            </svg>
            <span className="text-[10px] font-mono text-slate-500 mt-1">Scan at Gate Scanner</span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Farmer Name:</span>
              <strong className="text-slate-900">{currentFarmer.name} ({currentFarmer.farmerId})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Procurement Centre:</span>
              <strong className="text-slate-900">{booking.centreName.split(',')[0]}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Slot Schedule:</span>
              <strong className="text-emerald-800 font-bold">{booking.date} • {booking.timeSlot}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Crop & Estimated Qty:</span>
              <strong className="text-slate-900">{booking.crop} • {booking.bookedQuantity} kg</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Status:</span>
              <strong className="text-amber-800 uppercase font-extrabold">{booking.status}</strong>
            </div>

            {/* Smart Arrival Guidance */}
            {booking.recommendedArrivalTime && (
              <div className="pt-2.5 mt-2 border-t border-slate-200/80">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Smart Departure & Arrival Guidance</span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Leave Home By:</span>
                    <strong className="text-slate-900 font-mono text-xs">
                      {booking.recommendedDepartureTime}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Gate Check-in:</span>
                    <strong className="text-emerald-700 font-mono text-xs">
                      {booking.recommendedArrivalTime}
                    </strong>
                  </div>
                </div>
                {booking.distanceKm && (
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>Route Distance: <strong>{booking.distanceKm} km</strong></span>
                    <span>Transit Time: <strong>~{booking.travelTimeMins} mins</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Directions Bar */}
        {centre?.coordinates && (
          <div className="px-6 pb-2">
            <a
              href={buildGoogleMapsDirectionsUrl(farmerLocation, centre.coordinates)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Get Live Google Maps Turn-by-Turn Directions</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            </a>
          </div>
        )}

        {/* Gate Instructions */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            Please reach the Mandi Gate 15 minutes before your time slot. Have your tractor/cart parked in Weighing Line A upon gate scanner verification.
          </p>
        </div>

        {/* Action controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setShowCancelModal(true)}
            className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Cancel This Appointment</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('bookSlot')}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Change / Re-Book Slot
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Cancel Mandi Appointment?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Cancelling will release your gate token <strong>{booking.token}</strong> and allow you to test or book a new appointment slot immediately.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Keep Pass
              </button>
              <button
                onClick={() => {
                  cancelBooking(booking.id);
                  setShowCancelModal(false);
                }}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

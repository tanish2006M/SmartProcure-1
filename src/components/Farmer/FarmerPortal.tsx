import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../translations';
import { FarmerDashboard } from './FarmerDashboard';
import { BookSlot } from './BookSlot';
import { LiveQueueView } from './LiveQueueView';
import { ProcurementStatusView } from './ProcurementStatusView';
import { PaymentTrackingView } from './PaymentTrackingView';
import { MyBookingPass } from './MyBookingPass';
import { HistoryView } from './HistoryView';
import { ProfileView } from './ProfileView';
import { FarmerRegisterLoginModal } from './FarmerRegisterLoginModal';
import { SmartProcureAiAssistant } from './SmartProcureAiAssistant';
import {
  LayoutDashboard,
  CalendarPlus,
  Radio,
  Scale,
  CreditCard,
  QrCode,
  History,
  User,
  UserCheck,
  Trash2,
  LogOut,
} from 'lucide-react';

interface FarmerPortalProps {
  initialTab?: string;
  onOpenNotifications: () => void;
}

export const FarmerPortal: React.FC<FarmerPortalProps> = ({
  initialTab = 'dashboard',
  onOpenNotifications,
}) => {
  const {
    currentFarmer,
    getFarmerActiveBooking,
    cancelBooking,
    cancelRegistration,
    setRole,
    language,
  } = useApp();
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const activeBooking = getFarmerActiveBooking(currentFarmer.id);

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'bookSlot', label: t.nav.bookSlot, icon: CalendarPlus },
    { id: 'queue', label: t.nav.liveQueue, icon: Radio },
    { id: 'myBooking', label: 'Gate Pass', icon: QrCode },
    { id: 'procurement', label: t.nav.procurementStatus, icon: Scale },
    { id: 'payment', label: t.nav.payment, icon: CreditCard },
    { id: 'history', label: t.nav.history, icon: History },
    { id: 'profile', label: t.nav.profile, icon: User },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Kisan Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
            {currentFarmer.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900">
                {currentFarmer.name}
              </h2>
              <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {currentFarmer.farmerId}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {currentFarmer.village}, {currentFarmer.district} • Reg. Crop: {currentFarmer.crop}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeBooking && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs">
              <span className="text-amber-800 font-medium">Gate Token:</span>
              <strong className="font-mono text-amber-950 font-bold">{activeBooking.token}</strong>
              <button
                onClick={() => cancelBooking(activeBooking.id)}
                className="ml-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                title="Cancel this appointment to test booking a new slot"
              >
                Cancel Slot
              </button>
            </div>
          )}

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Switch / Register</span>
          </button>

          <button
            onClick={() => cancelRegistration(currentFarmer.id)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Deregister and return to landing page to test registration flow from start"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Cancel Reg. / Exit</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-slate-200">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div>
        {activeTab === 'dashboard' && <FarmerDashboard onNavigate={setActiveTab} />}
        {activeTab === 'bookSlot' && (
          <BookSlot
            onBookingComplete={() => {}}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'queue' && <LiveQueueView onNavigate={setActiveTab} />}
        {activeTab === 'myBooking' && <MyBookingPass onNavigate={setActiveTab} />}
        {(activeTab === 'procurement' || activeTab === 'procurementStatus') && (
          <ProcurementStatusView onNavigate={setActiveTab} />
        )}
        {activeTab === 'payment' && <PaymentTrackingView onNavigate={setActiveTab} />}
        {activeTab === 'history' && <HistoryView onNavigate={setActiveTab} />}
        {activeTab === 'profile' && <ProfileView />}
      </div>

      {/* Farmer Register / Login Modal */}
      <FarmerRegisterLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Context-Aware SmartProcure AI Floating Assistant */}
      <SmartProcureAiAssistant
        onNavigate={setActiveTab}
        onOpenNotifications={onOpenNotifications}
      />
    </div>
  );
};

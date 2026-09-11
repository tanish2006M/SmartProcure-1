import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { FarmerPortal } from './components/Farmer/FarmerPortal';
import { OfficialDashboard } from './components/Official/OfficialDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { LoginPage } from './components/LoginPage';
import { NotificationModal } from './components/NotificationModal';
import { DemoTourModal } from './components/DemoTourModal';
import { Wheat, ShieldCheck } from 'lucide-react';

function AppContent() {
  const { role, setRole } = useApp();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);
  const [farmerInitialTab, setFarmerInitialTab] = useState<string>('dashboard');
  const [loginInitialRole, setLoginInitialRole] = useState<'farmer' | 'official' | 'admin'>('official');

  const handleStartBooking = () => {
    setFarmerInitialTab('bookSlot');
    setRole('farmer');
  };

  const handleTrackQueue = () => {
    setFarmerInitialTab('queue');
    setRole('farmer');
  };

  const handleOfficialLogin = () => {
    setLoginInitialRole('official');
    setRole('login');
  };

  const handleAdminLogin = () => {
    setLoginInitialRole('admin');
    setRole('login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation & Role Switcher Header */}
      <Header
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenDemoTour={() => setIsDemoTourOpen(true)}
      />

      {/* Main View by Role */}
      <main className="flex-1">
        {role === 'public' && (
          <LandingPage
            onStartBooking={handleStartBooking}
            onTrackQueue={handleTrackQueue}
            onOfficialLogin={handleOfficialLogin}
            onAdminLogin={handleAdminLogin}
          />
        )}

        {role === 'login' && (
          <LoginPage
            initialRole={loginInitialRole}
            onBackToPortal={() => setRole('public')}
          />
        )}

        {role === 'farmer' && (
          <FarmerPortal
            initialTab={farmerInitialTab}
            onOpenNotifications={() => setIsNotificationOpen(true)}
          />
        )}

        {role === 'official' && <OfficialDashboard />}

        {role === 'admin' && <AdminDashboard />}
      </main>

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <Wheat className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">SmartProcure</span>
            <span>•</span>
            <span>National Agricultural Procurement Platform</span>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-400">
            Department of Consumer Affairs (DoCA) • Ministry of Consumer Affairs, Food & Public Distribution
          </div>
        </div>
      </footer>

      {/* Notification & SMS Gateway Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Interactive Demo Walkthrough Modal */}
      <DemoTourModal
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        onNavigateFarmerTab={(tab) => {
          setFarmerInitialTab(tab);
          setRole('farmer');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

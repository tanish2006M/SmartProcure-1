import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../translations';
import {
  User,
  Phone,
  MapPin,
  LandPlot,
  Building,
  CreditCard,
  Save,
  CheckCircle2,
  Globe,
  Trash2,
  RotateCcw,
  UserMinus,
  AlertTriangle,
  MessageSquare,
  Bell,
  ShieldCheck,
  Send,
  Radio,
  Clock,
  ExternalLink,
} from 'lucide-react';
import {
  isValidIndianMobile,
  maskIndianMobile,
  formatFullRegisteredMobile,
} from '../../services/smsService';
import { DEFAULT_SMS_PREFERENCES } from '../../data/initialData';
import { FarmerSmsPreferences } from '../../types';

export const ProfileView: React.FC = () => {
  const {
    currentFarmer,
    setFarmer,
    cancelRegistration,
    resetFarmerAppointment,
    getFarmerActiveBooking,
    updateFarmerSmsPreferences,
    sendManualSms,
    smsMode,
    language,
    setLanguage,
  } = useApp();
  const t = translations[language];

  const [name, setName] = useState(currentFarmer.name);
  const [mobile, setMobile] = useState(currentFarmer.mobile);
  const [village, setVillage] = useState(currentFarmer.village);
  const [district, setDistrict] = useState(currentFarmer.district);
  const [landArea, setLandArea] = useState(currentFarmer.landAreaAcres || 3.5);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // SMS Preferences Local State
  const initialPrefs: FarmerSmsPreferences = currentFarmer.smsPreferences || DEFAULT_SMS_PREFERENCES;
  const [smsPrefs, setSmsPrefs] = useState<FarmerSmsPreferences>(initialPrefs);
  const [testSmsStatus, setTestSmsStatus] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const activeBooking = getFarmerActiveBooking(currentFarmer.id);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    const valid = isValidIndianMobile(cleanMobile).valid;

    setFarmer({
      ...currentFarmer,
      name,
      mobile: valid ? cleanMobile : currentFarmer.mobile,
      village,
      district,
      landAreaAcres: landArea,
      smsPreferences: smsPrefs,
    });
    updateFarmerSmsPreferences(currentFarmer.id, smsPrefs);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const togglePref = (key: keyof FarmerSmsPreferences) => {
    if (key === 'emergencyAlerts') return; // Emergency alerts are mandatory
    const updated = { ...smsPrefs, [key]: !smsPrefs[key] };
    setSmsPrefs(updated);
    updateFarmerSmsPreferences(currentFarmer.id, updated);
  };

  const handleSendTestSms = async () => {
    setIsSendingTest(true);
    setTestSmsStatus(null);
    try {
      const res = await sendManualSms({
        mobile: currentFarmer.mobile || '9876543210',
        message: `Kisan ${currentFarmer.name}: Test SMS from SmartProcure. Your mobile is active for gate tokens and Mandi alerts. Ref: #TEST-${Date.now().toString().slice(-4)}`,
        farmerId: currentFarmer.id,
        priority: 'IMPORTANT',
        notificationType: 'ALERT',
      });
      if (res.success) {
        setTestSmsStatus(`✓ Test SMS dispatched [${res.status}]. Check Notification Center logs.`);
      } else {
        setTestSmsStatus(`Notice: ${res.error || 'Could not send SMS.'}`);
      }
    } catch {
      setTestSmsStatus('Failed to send test SMS.');
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestSmsStatus(null), 6000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Kisan Profile & Mobile Identity
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Aadhaar-linked farmer profile with verified mobile number and SMS dispatch controls.
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile & SMS preferences updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl">
              {name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">{name}</h3>
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                Farmer ID: {currentFarmer.farmerId}
              </span>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-bold text-slate-400 block">Mobile Identity</span>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
              {maskIndianMobile(currentFarmer.mobile || '9876543210')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name (As per Aadhaar)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registered Mobile Number (+91)
            </label>
            <div className="relative">
              <input
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none pr-20"
              />
              <span className="absolute right-2.5 top-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                Active SMS
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Village</label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">District / State</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Land Holding (Acres)</label>
            <input
              type="number"
              step="0.5"
              value={landArea}
              onChange={(e) => setLandArea(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Portal Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="te">తెలుగు (Telugu)</option>
            </select>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-slate-600" />
            <span>DBT Aadhaar-Seeded Bank Account (PFMS Integrated)</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Bank Name</span>
              <span className="font-semibold text-slate-800">State Bank of India</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Account Number</span>
              <span className="font-mono font-semibold text-slate-800">{currentFarmer.bankAccountMasked || '•••• •••• 4829'}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & SMS Settings</span>
          </button>
        </div>
      </form>

      {/* SMS Notifications & Delivery Preferences (Section 6) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Smart SMS Notification Settings
              </h3>
              <p className="text-xs text-slate-500">
                Manage automated SMS delivery to {formatFullRegisteredMobile(currentFarmer.mobile || '9876543210')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Mode:</span>
            <span
              className={`text-[10px] font-extrabold px-2 py-1 rounded-full border ${
                smsMode === 'LIVE'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-amber-100 text-amber-900 border-amber-200'
              }`}
            >
              {smsMode === 'LIVE' ? 'LIVE GATEWAY' : 'DEMO SIMULATION'}
            </span>
          </div>
        </div>

        {/* Master SMS Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <span className="font-extrabold text-xs text-slate-900 block">
              Enable SMS Notifications (Master Channel)
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Receive standard booking, queue and procurement updates via SMS. Emergency safety alerts will always remain active.
            </span>
          </div>
          <button
            type="button"
            onClick={() => togglePref('enabled')}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              smsPrefs.enabled ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full transition-transform transform ${
                smsPrefs.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Granular Category Toggles */}
        <div className="space-y-2.5">
          <span className="text-xs font-extrabold text-slate-900 block">
            Granular SMS Alert Categories
          </span>

          {/* 1. Booking Confirmations */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Booking & Slot Confirmations</span>
              <span className="text-[11px] text-slate-500 block">
                Instant SMS with gate token, date, yard name, and transit timing.
              </span>
            </div>
            <input
              type="checkbox"
              checked={smsPrefs.bookingConfirmations}
              onChange={() => togglePref('bookingConfirmations')}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* 2. Token & Queue Alerts */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Token & Queue Approaching Alerts</span>
              <span className="text-[11px] text-slate-500 block">
                Alerts when 5 farmers ahead, 2 farmers ahead, and token is active.
              </span>
            </div>
            <input
              type="checkbox"
              checked={smsPrefs.tokenQueueAlerts}
              onChange={() => togglePref('tokenQueueAlerts')}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* 3. Gate Announcements */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Gate & Weighbridge Announcements</span>
              <span className="text-[11px] text-slate-500 block">
                Urgent call to proceed to Gate #1 / Weighbridge Counter immediately.
              </span>
            </div>
            <input
              type="checkbox"
              checked={smsPrefs.gateAlerts}
              onChange={() => togglePref('gateAlerts')}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* 4. Mandi Delay & Congestion */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Mandi Delay & Traffic Congestion</span>
              <span className="text-[11px] text-slate-500 block">
                Notifies when wait times increase by 30+ minutes so you can adjust travel.
              </span>
            </div>
            <input
              type="checkbox"
              checked={smsPrefs.delayCongestionAlerts}
              onChange={() => togglePref('delayCongestionAlerts')}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* 5. Procurement Completed */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Procurement & Weighment Slips</span>
              <span className="text-[11px] text-slate-500 block">
                Confirmation of net weight recorded, quality grade, and MSP calculation.
              </span>
            </div>
            <input
              type="checkbox"
              checked={smsPrefs.procurementUpdates}
              onChange={() => togglePref('procurementUpdates')}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* 6. Payment & DBT */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">DBT & Treasury Payment Clearance</span>
              <span className="text-[11px] text-slate-500 block">
                Bank transaction reference number and payment confirmation.
              </span>
            </div>
            <input
              type="checkbox"
              checked={smsPrefs.paymentUpdates}
              onChange={() => togglePref('paymentUpdates')}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* 7. Emergency Alerts (Non-toggleable) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-200">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-rose-950">Emergency & Weather Hazard Alerts</span>
                <span className="text-[9px] font-extrabold uppercase bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded">
                  Mandatory
                </span>
              </div>
              <span className="text-[11px] text-rose-700 block mt-0.5">
                Yard closures, sudden weather damage warnings, and critical safety notifications.
              </span>
            </div>
            <input
              type="checkbox"
              checked={true}
              disabled
              className="w-4 h-4 text-rose-600 rounded cursor-not-allowed opacity-75"
            />
          </div>
        </div>

        {/* Test SMS Action */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            <span>Test the SMS notification pipeline for your linked number.</span>
          </div>

          <button
            type="button"
            disabled={isSendingTest}
            onClick={handleSendTestSms}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingTest ? 'Dispatching...' : 'Send Test SMS'}</span>
          </button>
        </div>

        {testSmsStatus && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{testSmsStatus}</span>
          </div>
        )}
      </div>

      {/* Account & Testing Operations (Cancel Registration & Reset Appointments) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Testing & Registration Controls</h3>
            <p className="text-xs text-slate-500">
              Clear your active appointment to test booking or cancel registration to test the entire flow from scratch.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-slate-900">Clear Active Appointment</h4>
                {activeBooking && (
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                    Token {activeBooking.token}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Removes your current active gate token so you can test booking another slot without getting blocked.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetFarmerAppointment(currentFarmer.id);
                setResetMessage('Active appointment cleared successfully! You can now book any slot.');
                setTimeout(() => setResetMessage(null), 4000);
              }}
              className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Active Appointment</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-rose-950 mb-1">Cancel Registration & Reset</h4>
              <p className="text-[11px] text-rose-800 mb-3">
                Cancels active appointments, clears your logged-in session, and returns to the public landing page to test registration.
              </p>
            </div>
            <button
              type="button"
              onClick={() => cancelRegistration(currentFarmer.id)}
              className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>Cancel Registration & Exit</span>
            </button>
          </div>
        </div>

        {resetMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resetMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../translations';
import { DEMO_FARMERS, CROP_PRICES } from '../../data/initialData';
import { Farmer } from '../../types';
import {
  User,
  X,
  UserPlus,
  CheckCircle2,
  LogIn,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Clock,
  RotateCcw,
  AlertCircle,
  KeyRound,
  Check,
} from 'lucide-react';

interface FarmerRegisterLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'demo';
}

export const FarmerRegisterLoginModal: React.FC<FarmerRegisterLoginModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
}) => {
  const {
    currentFarmer,
    setFarmer,
    centres,
    language,
    setLanguage,
    farmers,
    sendOtp,
    verifyOtp,
    resendOtp,
    registerFarmer,
    setRole,
  } = useApp();

  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'demo'>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // --- LOGIN WITH OTP STATE ---
  const [loginStep, setLoginStep] = useState<'MOBILE' | 'OTP' | 'SUCCESS'>('MOBILE');
  const [loginMobile, setLoginMobile] = useState('9823145210'); // Default to Ramesh Patil (F001)
  const [loginOtpDigits, setLoginOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [demoLoginOtp, setDemoLoginOtp] = useState<string>('');
  const [loginExpirySeconds, setLoginExpirySeconds] = useState(120);
  const [loginResendCooldown, setLoginResendCooldown] = useState(30);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginAttemptsRemaining, setLoginAttemptsRemaining] = useState(3);
  const [isLoginVerifying, setIsLoginVerifying] = useState(false);

  // --- REGISTRATION WITH OTP STATE ---
  const [regStep, setRegStep] = useState<'DETAILS' | 'OTP' | 'SUCCESS'>('DETAILS');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    state: 'Haryana',
    district: 'Rohtak',
    village: '',
    preferredLanguage: 'en' as 'en' | 'hi' | 'te',
    crop: 'Wheat',
    quantity: 500,
    preferredCentre: centres[0]?.name || 'Central Procurement Centre, APMC Yard',
  });
  const [regOtpDigits, setRegOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [demoRegOtp, setDemoRegOtp] = useState<string>('');
  const [regExpirySeconds, setRegExpirySeconds] = useState(120);
  const [regResendCooldown, setRegResendCooldown] = useState(30);
  const [regError, setRegError] = useState<string | null>(null);
  const [regAttemptsRemaining, setRegAttemptsRemaining] = useState(3);
  const [isRegVerifying, setIsRegVerifying] = useState(false);

  // Input refs for 6-digit OTP fields
  const loginInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const regInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timers for Login OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && loginStep === 'OTP') {
      timer = setInterval(() => {
        setLoginExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
        setLoginResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, loginStep]);

  // Timers for Reg OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && regStep === 'OTP') {
      timer = setInterval(() => {
        setRegExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
        setRegResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, regStep]);

  if (!isOpen) return null;

  const maskMobile = (mobile?: string) => {
    if (!mobile) return '+91 ******0000';
    const clean = mobile.replace(/\D/g, '').slice(-10);
    if (clean.length === 10) {
      return `+91 ******${clean.slice(-4)}`;
    }
    return `+91 ${mobile}`;
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- LOGIN ACTIONS ---
  const handleSendLoginOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);

    const clean = loginMobile.trim().replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setLoginError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const res = sendOtp(clean, 'LOGIN');
    if (!res.success) {
      setLoginError(res.error || 'Failed to send OTP.');
      return;
    }

    setDemoLoginOtp(res.demoOtp || '482731');
    setLoginOtpDigits(['', '', '', '', '', '']);
    setLoginExpirySeconds(120);
    setLoginResendCooldown(30);
    setLoginAttemptsRemaining(3);
    setLoginStep('OTP');

    // Auto-focus first digit
    setTimeout(() => {
      loginInputRefs.current[0]?.focus();
    }, 100);
  };

  const handleLoginOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...loginOtpDigits];
    newDigits[index] = value.slice(-1);
    setLoginOtpDigits(newDigits);
    setLoginError(null);

    // Auto advance
    if (value && index < 5) {
      loginInputRefs.current[index + 1]?.focus();
    }
  };

  const handleLoginOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !loginOtpDigits[index] && index > 0) {
      loginInputRefs.current[index - 1]?.focus();
    }
  };

  const handleLoginOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newDigits = [...loginOtpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || '';
      }
      setLoginOtpDigits(newDigits);
      const nextFocus = Math.min(pastedData.length, 5);
      loginInputRefs.current[nextFocus]?.focus();
    }
  };

  const handleFillDemoLoginOtp = () => {
    if (!demoLoginOtp) return;
    const digits = demoLoginOtp.split('').slice(0, 6);
    setLoginOtpDigits(digits);
    setLoginError(null);
  };

  const handleVerifyLoginOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredOtp = loginOtpDigits.join('');

    if (enteredOtp.length !== 6) {
      setLoginError('Please enter all 6 digits of the OTP.');
      return;
    }

    if (loginExpirySeconds <= 0) {
      setLoginError('OTP has expired. Please request a new OTP.');
      return;
    }

    if (loginAttemptsRemaining <= 0) {
      setLoginError('Maximum attempts exceeded. Please request a new OTP.');
      return;
    }

    setIsLoginVerifying(true);
    setLoginError(null);

    setTimeout(() => {
      const clean = loginMobile.trim().replace(/\D/g, '').slice(-10);
      const result = verifyOtp(clean, enteredOtp);

      setIsLoginVerifying(false);

      if (!result.success) {
        setLoginError(result.error || 'Invalid OTP. Please try again.');
        setLoginAttemptsRemaining((prev) => Math.max(0, prev - 1));
        return;
      }

      setLoginStep('SUCCESS');
      setTimeout(() => {
        onClose();
        setLoginStep('MOBILE');
      }, 1200);
    }, 400);
  };

  const handleResendLoginOtp = () => {
    if (loginResendCooldown > 0) return;
    const clean = loginMobile.trim().replace(/\D/g, '').slice(-10);
    const res = resendOtp(clean);
    if (res.success) {
      setDemoLoginOtp(res.demoOtp || '482731');
      setLoginOtpDigits(['', '', '', '', '', '']);
      setLoginExpirySeconds(120);
      setLoginResendCooldown(30);
      setLoginAttemptsRemaining(3);
      setLoginError(null);
    }
  };

  // --- REGISTRATION ACTIONS ---
  const handleSendRegOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!formData.name.trim()) {
      setRegError('Please enter the farmer’s full name.');
      return;
    }

    const clean = formData.mobile.trim().replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setRegError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Check if mobile already exists in registered farmers
    const existing = farmers.find(
      (f) => (f.mobile || '').replace(/\D/g, '').slice(-10) === clean
    );
    if (existing) {
      setRegError(
        `This mobile number is already registered under ${existing.name} (${existing.farmerId}). Please use Kisan OTP Login.`
      );
      return;
    }

    const res = sendOtp(clean, 'REGISTRATION');
    if (!res.success) {
      setRegError(res.error || 'Failed to send verification OTP.');
      return;
    }

    setDemoRegOtp(res.demoOtp || '739102');
    setRegOtpDigits(['', '', '', '', '', '']);
    setRegExpirySeconds(120);
    setRegResendCooldown(30);
    setRegAttemptsRemaining(3);
    setRegStep('OTP');

    setTimeout(() => {
      regInputRefs.current[0]?.focus();
    }, 100);
  };

  const handleRegOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...regOtpDigits];
    newDigits[index] = value.slice(-1);
    setRegOtpDigits(newDigits);
    setRegError(null);

    if (value && index < 5) {
      regInputRefs.current[index + 1]?.focus();
    }
  };

  const handleRegOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !regOtpDigits[index] && index > 0) {
      regInputRefs.current[index - 1]?.focus();
    }
  };

  const handleRegOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newDigits = [...regOtpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || '';
      }
      setRegOtpDigits(newDigits);
      const nextFocus = Math.min(pastedData.length, 5);
      regInputRefs.current[nextFocus]?.focus();
    }
  };

  const handleFillDemoRegOtp = () => {
    if (!demoRegOtp) return;
    const digits = demoRegOtp.split('').slice(0, 6);
    setRegOtpDigits(digits);
    setRegError(null);
  };

  const handleVerifyRegOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredOtp = regOtpDigits.join('');

    if (enteredOtp.length !== 6) {
      setRegError('Please enter all 6 digits of the OTP.');
      return;
    }

    if (regExpirySeconds <= 0) {
      setRegError('OTP has expired. Please request a new OTP.');
      return;
    }

    if (regAttemptsRemaining <= 0) {
      setRegError('Maximum attempts exceeded. Please request a new OTP.');
      return;
    }

    setIsRegVerifying(true);
    setRegError(null);

    setTimeout(() => {
      const clean = formData.mobile.trim().replace(/\D/g, '').slice(-10);
      const result = verifyOtp(clean, enteredOtp);

      setIsRegVerifying(false);

      if (!result.success) {
        setRegError(result.error || 'Invalid OTP. Please try again.');
        setRegAttemptsRemaining((prev) => Math.max(0, prev - 1));
        return;
      }

      // Create new farmer
      const newFarmer = registerFarmer({
        name: formData.name.trim(),
        mobile: clean,
        village: formData.village.trim() || 'Dhansa Village',
        district: formData.district,
        state: formData.state,
        crop: formData.crop,
        quantity: formData.quantity,
        preferredCentre: formData.preferredCentre,
        languagePreference: formData.preferredLanguage,
        isVerified: true,
        verifiedAt: new Date().toISOString(),
        notificationChannels: { app: true, sms: true, whatsapp: true },
      });

      setLanguage(formData.preferredLanguage);
      setRegStep('SUCCESS');

      setTimeout(() => {
        onClose();
        setRegStep('DETAILS');
      }, 1200);
    }, 400);
  };

  const handleResendRegOtp = () => {
    if (regResendCooldown > 0) return;
    const clean = formData.mobile.trim().replace(/\D/g, '').slice(-10);
    const res = resendOtp(clean);
    if (res.success) {
      setDemoRegOtp(res.demoOtp || '739102');
      setRegOtpDigits(['', '', '', '', '', '']);
      setRegExpirySeconds(120);
      setRegResendCooldown(30);
      setRegAttemptsRemaining(3);
      setRegError(null);
    }
  };

  // --- DEMO PRESET SWITCHER ---
  const handleSelectDemoFarmer = (farmer: Farmer) => {
    setFarmer(farmer);
    if (farmer.languagePreference) {
      setLanguage(farmer.languagePreference);
    }
    setRole('farmer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span>Kisan Authentication</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Government Verified
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Secure OTP verification for farmer identity & procurement passes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2">
          <button
            onClick={() => setActiveTab('login')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'login'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Kisan OTP Login</span>
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'register'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Farmer Registration</span>
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'demo'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Demo Switcher</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ========================================================= */}
          {/* TAB 1: KISAN OTP LOGIN                                    */}
          {/* ========================================================= */}
          {activeTab === 'login' && (
            <div>
              {loginStep === 'MOBILE' && (
                <form onSubmit={handleSendLoginOtp} className="space-y-4 text-xs">
                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-emerald-950">
                    <div className="font-bold flex items-center gap-1.5 text-xs mb-1">
                      <Smartphone className="w-4 h-4 text-emerald-700" />
                      <span>Direct Farmer Verification (DoCA Standard)</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Enter your mobile number to receive a 6-digit one-time password (OTP). No password required.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Farmer Mobile Number *
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-bold text-slate-500 text-xs select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        placeholder="9876543210"
                        value={loginMobile}
                        onChange={(e) => {
                          setLoginMobile(e.target.value.replace(/\D/g, ''));
                          setLoginError(null);
                        }}
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Quick Select Presets for Evaluators */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 mb-2">
                      ⚡ Quick-Fill Registered Demo Numbers:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMobile('9823145210');
                          setLoginError(null);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        🌿 Ramesh Patil (9823145210) • Washim APMC
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMobile('9980334411');
                          setLoginError(null);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        🌾 Manjunath Gowda (9980334411) • Suryapet
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMobile('9415288120');
                          setLoginError(null);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        🌱 Sunita Devi (9415288120) • Varanasi
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMobile('9872990210');
                          setLoginError(null);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        🌾 Harpreet Singh (9872990210) • Moga
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <span>{loginError}</span>
                        {loginError.includes('not found') && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('register')}
                            className="block font-bold text-emerald-700 hover:underline mt-1"
                          >
                            Click here to Register as a New Farmer →
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {loginStep === 'OTP' && (
                <div className="space-y-4 text-xs">
                  {/* Verified Header & Target */}
                  <div className="text-center pb-1">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Verify Mobile Number
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      OTP sent to: <strong className="text-slate-800 font-mono">{maskMobile(loginMobile)}</strong>
                    </p>
                  </div>

                  {/* Demo Mode Banner (Prompt: Make Demo Mode Obvious) */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-amber-950 flex items-center justify-between shadow-xs">
                    <div>
                      <div className="font-extrabold text-[11px] text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Demo Mode Active</span>
                      </div>
                      <div className="text-xs font-mono font-black text-amber-900 mt-0.5">
                        Demo OTP: <span className="text-emerald-700 text-sm tracking-widest bg-white px-2 py-0.5 rounded border border-amber-300 font-mono">{demoLoginOtp}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleFillDemoLoginOtp}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors"
                    >
                      Auto-Fill OTP
                    </button>
                  </div>

                  {/* 6-Digit OTP Boxes */}
                  <div>
                    <label className="block text-center font-bold text-slate-700 mb-2">
                      Enter 6-Digit Verification Code
                    </label>
                    <div className="flex justify-center gap-2" onPaste={handleLoginOtpPaste}>
                      {loginOtpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (loginInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleLoginOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleLoginOtpKeyDown(idx, e)}
                          className="w-11 h-13 text-center font-black text-lg font-mono rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 text-slate-900 transition-all outline-none"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Timers & Attempts Status */}
                  <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Expires in: <strong className="font-mono text-slate-800">{formatTimer(loginExpirySeconds)}</strong>
                      </span>
                    </div>

                    <div>
                      {loginAttemptsRemaining > 0 ? (
                        <span className="text-slate-600">
                          {loginAttemptsRemaining} attempts remaining
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold">Max attempts reached</span>
                      )}
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      disabled={isLoginVerifying || loginAttemptsRemaining <= 0 || loginExpirySeconds <= 0}
                      onClick={handleVerifyLoginOtp}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoginVerifying ? (
                        <span>Verifying Security Code...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify OTP & Login</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginStep('MOBILE');
                          setLoginError(null);
                        }}
                        className="text-slate-500 hover:text-slate-800 font-semibold text-[11px]"
                      >
                        ← Change Mobile Number
                      </button>

                      <button
                        type="button"
                        disabled={loginResendCooldown > 0}
                        onClick={handleResendLoginOtp}
                        className="text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 font-bold text-[11px] flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>
                          {loginResendCooldown > 0
                            ? `Resend OTP in ${loginResendCooldown}s`
                            : 'Resend OTP'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loginStep === 'SUCCESS' && (
                <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Mobile Verified Successfully!
                  </h4>
                  <p className="text-xs text-slate-500">
                    Logged in as <strong>{currentFarmer.name}</strong> ({currentFarmer.farmerId}). Loading your gate passes...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: NEW FARMER REGISTRATION                            */}
          {/* ========================================================= */}
          {activeTab === 'register' && (
            <div>
              {regStep === 'DETAILS' && (
                <form onSubmit={handleSendRegOtp} className="space-y-3.5 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-600">
                    <div className="font-bold text-slate-900 text-xs mb-0.5">
                      New Kisan Registration (Aadhaar/DBT Linked)
                    </div>
                    <p className="text-[11px]">
                      A 6-digit verification code will be sent to verify this mobile number.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Gurpreet Singh"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="98XXXXXXXX"
                        value={formData.mobile}
                        onChange={(e) =>
                          setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Village</label>
                      <input
                        type="text"
                        placeholder="e.g. Rampur Village"
                        value={formData.village}
                        onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">District</label>
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Crop Type</label>
                      <select
                        value={formData.crop}
                        onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {CROP_PRICES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} (MSP ₹{c.mspPerQuintal})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Approx Quantity (kg)</label>
                      <input
                        type="number"
                        step="50"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, quantity: parseInt(e.target.value) || 500 })
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Preferred Procurement Centre
                    </label>
                    <select
                      value={formData.preferredCentre}
                      onChange={(e) =>
                        setFormData({ ...formData, preferredCentre: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {centres.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {regError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Send Verification OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {regStep === 'OTP' && (
                <div className="space-y-4 text-xs">
                  <div className="text-center pb-1">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Verify Mobile for New Registration
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      OTP sent to: <strong className="text-slate-800 font-mono">{maskMobile(formData.mobile)}</strong>
                    </p>
                  </div>

                  {/* Demo Mode Banner */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-amber-950 flex items-center justify-between shadow-xs">
                    <div>
                      <div className="font-extrabold text-[11px] text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Demo Mode Active</span>
                      </div>
                      <div className="text-xs font-mono font-black text-amber-900 mt-0.5">
                        Registration OTP: <span className="text-emerald-700 text-sm tracking-widest bg-white px-2 py-0.5 rounded border border-amber-300 font-mono">{demoRegOtp}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleFillDemoRegOtp}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors"
                    >
                      Auto-Fill OTP
                    </button>
                  </div>

                  {/* 6-Digit OTP Boxes */}
                  <div>
                    <label className="block text-center font-bold text-slate-700 mb-2">
                      Enter 6-Digit Verification Code
                    </label>
                    <div className="flex justify-center gap-2" onPaste={handleRegOtpPaste}>
                      {regOtpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (regInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleRegOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleRegOtpKeyDown(idx, e)}
                          className="w-11 h-13 text-center font-black text-lg font-mono rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 text-slate-900 transition-all outline-none"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Timers & Attempts */}
                  <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Expires in: <strong className="font-mono text-slate-800">{formatTimer(regExpirySeconds)}</strong>
                      </span>
                    </div>

                    <div>
                      {regAttemptsRemaining > 0 ? (
                        <span className="text-slate-600">
                          {regAttemptsRemaining} attempts remaining
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold">Max attempts reached</span>
                      )}
                    </div>
                  </div>

                  {regError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      disabled={isRegVerifying || regAttemptsRemaining <= 0 || regExpirySeconds <= 0}
                      onClick={handleVerifyRegOtp}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isRegVerifying ? (
                        <span>Verifying & Creating Profile...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify Mobile & Complete Registration</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setRegStep('DETAILS');
                          setRegError(null);
                        }}
                        className="text-slate-500 hover:text-slate-800 font-semibold text-[11px]"
                      >
                        ← Edit Details
                      </button>

                      <button
                        type="button"
                        disabled={regResendCooldown > 0}
                        onClick={handleResendRegOtp}
                        className="text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 font-bold text-[11px] flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>
                          {regResendCooldown > 0
                            ? `Resend OTP in ${regResendCooldown}s`
                            : 'Resend OTP'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {regStep === 'SUCCESS' && (
                <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Kisan Account Created & Verified!
                  </h4>
                  <p className="text-xs text-slate-500">
                    Welcome, <strong>{formData.name}</strong>. Opening your portal dashboard...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: DEMO SWITCHER                                      */}
          {/* ========================================================= */}
          {activeTab === 'demo' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 mb-2">
                Click any profile to immediately preview that farmer’s dashboard, active gate passes, and queue alerts:
              </div>

              {DEMO_FARMERS.map((farmer) => {
                const isSelected = farmer.id === currentFarmer.id;
                return (
                  <div
                    key={farmer.id}
                    onClick={() => handleSelectDemoFarmer(farmer)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {farmer.name}
                        </span>
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {farmer.farmerId}
                        </span>
                        {farmer.id === 'farmer-1' && (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                            Active Token P104
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                          ✓ OTP Verified
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {farmer.village}, {farmer.district}, {farmer.state}
                        </span>
                        <span>•</span>
                        <span className="font-mono font-bold text-slate-700">
                          {maskMobile(farmer.mobile)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Crop: <strong>{farmer.crop}</strong> ({farmer.quantity} kg)
                      </div>
                    </div>

                    <button className="px-3 py-1.5 bg-slate-900 text-white hover:bg-emerald-600 rounded-xl text-xs font-bold transition-colors">
                      {isSelected ? 'Active' : 'Switch'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

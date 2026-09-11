import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { FarmerRegisterLoginModal } from './Farmer/FarmerRegisterLoginModal';
import {
  Wheat,
  Building2,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Smartphone,
  RotateCcw,
  Check,
} from 'lucide-react';

interface LoginPageProps {
  initialRole?: 'farmer' | 'official' | 'admin';
  onBackToPortal: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialRole = 'farmer',
  onBackToPortal,
}) => {
  const {
    setRole,
    sendOtp,
    verifyOtp,
    resendOtp,
    farmers,
    setCurrentFarmerId,
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<'farmer' | 'official' | 'admin'>(initialRole);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // --- FARMER LOGIN STATE ---
  const [farmerMobile, setFarmerMobile] = useState('9823145210');
  const [farmerStep, setFarmerStep] = useState<'MOBILE' | 'OTP' | 'SUCCESS'>('MOBILE');
  const [farmerOtpDigits, setFarmerOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [demoFarmerOtp, setDemoFarmerOtp] = useState<string>('');
  const [farmerExpirySeconds, setFarmerExpirySeconds] = useState(120);
  const [farmerResendCooldown, setFarmerResendCooldown] = useState(30);
  const [farmerError, setFarmerError] = useState<string | null>(null);
  const [farmerAttemptsRemaining, setFarmerAttemptsRemaining] = useState(3);
  const [isFarmerVerifying, setIsFarmerVerifying] = useState(false);
  const farmerInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- MANDI OFFICIAL LOGIN STATE ---
  const [officialId, setOfficialId] = useState('');
  const [officialPassword, setOfficialPassword] = useState('');
  const [officialError, setOfficialError] = useState<string | null>(null);
  const [isOfficialLoggingIn, setIsOfficialLoggingIn] = useState(false);

  // --- ADMINISTRATOR LOGIN STATE ---
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  // Farmer OTP Countdown Timers
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (selectedRole === 'farmer' && farmerStep === 'OTP') {
      timer = setInterval(() => {
        setFarmerExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
        setFarmerResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [selectedRole, farmerStep]);

  // Sync initialRole if changed from outside
  useEffect(() => {
    setSelectedRole(initialRole);
  }, [initialRole]);

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

  // --- FARMER LOGIN HANDLERS ---
  const handleSendFarmerOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFarmerError(null);

    const clean = farmerMobile.trim().replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setFarmerError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const res = sendOtp(clean, 'LOGIN');
    if (!res.success) {
      setFarmerError(res.error || 'Failed to dispatch OTP. Please check mobile number.');
      return;
    }

    setDemoFarmerOtp(res.demoOtp || '482731');
    setFarmerOtpDigits(['', '', '', '', '', '']);
    setFarmerExpirySeconds(120);
    setFarmerResendCooldown(30);
    setFarmerAttemptsRemaining(3);
    setFarmerStep('OTP');
  };

  const handleFillDemoFarmerOtp = () => {
    const digits = demoFarmerOtp.split('').slice(0, 6);
    while (digits.length < 6) digits.push('0');
    setFarmerOtpDigits(digits);
    setFarmerError(null);
  };

  const handleFarmerOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...farmerOtpDigits];
    newDigits[index] = digit;
    setFarmerOtpDigits(newDigits);
    setFarmerError(null);

    if (digit && index < 5) {
      farmerInputRefs.current[index + 1]?.focus();
    }
  };

  const handleFarmerOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !farmerOtpDigits[index] && index > 0) {
      farmerInputRefs.current[index - 1]?.focus();
    }
  };

  const handleFarmerOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = pasted.split('');
      while (newDigits.length < 6) newDigits.push('');
      setFarmerOtpDigits(newDigits);
      setFarmerError(null);
      const focusIndex = Math.min(pasted.length, 5);
      farmerInputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerifyFarmerOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredOtp = farmerOtpDigits.join('');

    if (enteredOtp.length !== 6) {
      setFarmerError('Please enter all 6 digits of the OTP.');
      return;
    }

    if (farmerExpirySeconds <= 0) {
      setFarmerError('OTP has expired. Please request a new OTP.');
      return;
    }

    if (farmerAttemptsRemaining <= 0) {
      setFarmerError('Maximum attempts exceeded. Please request a new OTP.');
      return;
    }

    setIsFarmerVerifying(true);
    setFarmerError(null);

    setTimeout(() => {
      const clean = farmerMobile.trim().replace(/\D/g, '').slice(-10);
      const result = verifyOtp(clean, enteredOtp);

      setIsFarmerVerifying(false);

      if (!result.success) {
        setFarmerError(result.error || 'Invalid OTP. Please try again.');
        setFarmerAttemptsRemaining((prev) => Math.max(0, prev - 1));
        return;
      }

      setFarmerStep('SUCCESS');
      setTimeout(() => {
        setRole('farmer');
      }, 700);
    }, 400);
  };

  const handleResendFarmerOtp = () => {
    if (farmerResendCooldown > 0) return;
    const clean = farmerMobile.trim().replace(/\D/g, '').slice(-10);
    const res = resendOtp(clean);
    if (res.success) {
      setDemoFarmerOtp(res.demoOtp || '482731');
      setFarmerOtpDigits(['', '', '', '', '', '']);
      setFarmerExpirySeconds(120);
      setFarmerResendCooldown(30);
      setFarmerAttemptsRemaining(3);
      setFarmerError(null);
    }
  };

  // --- MANDI OFFICIAL LOGIN HANDLER ---
  const handleOfficialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setOfficialError(null);

    const cleanId = officialId.trim().toUpperCase();
    const cleanPassword = officialPassword.trim();

    if (!cleanId || !cleanPassword) {
      setOfficialError('Please enter Official ID and password.');
      return;
    }

    setIsOfficialLoggingIn(true);
    setTimeout(() => {
      setIsOfficialLoggingIn(false);
      // Valid demo credentials check
      if (cleanId === 'MANDI001' && cleanPassword === 'demo123') {
        setRole('official');
      } else {
        setOfficialError('Invalid demo credentials.');
      }
    }, 350);
  };

  const handleFillDemoOfficial = () => {
    setOfficialId('MANDI001');
    setOfficialPassword('demo123');
    setOfficialError(null);
  };

  // --- ADMINISTRATOR LOGIN HANDLER ---
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    const cleanId = adminId.trim().toUpperCase();
    const cleanPassword = adminPassword.trim();

    if (!cleanId || !cleanPassword) {
      setAdminError('Please enter Admin ID and password.');
      return;
    }

    setIsAdminLoggingIn(true);
    setTimeout(() => {
      setIsAdminLoggingIn(false);
      // Valid demo credentials check
      if (cleanId === 'ADMIN001' && cleanPassword === 'demo123') {
        setRole('admin');
      } else {
        setAdminError('Invalid demo credentials.');
      }
    }, 350);
  };

  const handleFillDemoAdmin = () => {
    setAdminId('ADMIN001');
    setAdminPassword('demo123');
    setAdminError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={onBackToPortal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <Wheat className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-slate-900">
                Smart<span className="text-emerald-700">Procure</span>
              </span>
              <span className="ml-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                DoCA
              </span>
            </div>
          </div>
        </div>

        {/* Page Title & Heading */}
        <div className="text-center max-w-xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unified Agricultural Procurement Authentication Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In to SmartProcure
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Select your role to access your dedicated procurement, queue management, or administration portal.
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* 1. Kisan / Farmer Role Card */}
          <div
            onClick={() => setSelectedRole('farmer')}
            className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
              selectedRole === 'farmer'
                ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  selectedRole === 'farmer'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <Wheat className="w-5 h-5" />
              </div>
              {selectedRole === 'farmer' && (
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Kisan / Farmer Login
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                OTP-based mobile login for registered farmers to book slots & track tokens.
              </p>
            </div>
          </div>

          {/* 2. Mandi Official Role Card */}
          <div
            onClick={() => setSelectedRole('official')}
            className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
              selectedRole === 'official'
                ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  selectedRole === 'official'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                <Building2 className="w-5 h-5" />
              </div>
              {selectedRole === 'official' && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Mandi Official Login
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Procurement centre gate verification, weighing scales & quality testing.
              </p>
            </div>
          </div>

          {/* 3. Administrator Role Card */}
          <div
            onClick={() => setSelectedRole('admin')}
            className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
              selectedRole === 'admin'
                ? 'border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  selectedRole === 'admin'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              {selectedRole === 'admin' && (
                <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Administrator Login
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Central & State DoCA analytics, quota control & load rebalancing.
              </p>
            </div>
          </div>
        </div>

        {/* Selected Role Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {/* ========================================================================= */}
          {/* SECTION 1: KISAN / FARMER LOGIN FORM (REUSES EXISTING KISAN FLOW)         */}
          {/* ========================================================================= */}
          {selectedRole === 'farmer' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Wheat className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Kisan Mobile OTP Authentication
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your registered 10-digit mobile number to receive a secure DLT-registered OTP.
                </p>
              </div>

              {farmerStep === 'MOBILE' && (
                <form onSubmit={handleSendFarmerOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                        +91
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={farmerMobile}
                        onChange={(e) => {
                          setFarmerMobile(e.target.value.replace(/\D/g, ''));
                          setFarmerError(null);
                        }}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-wider"
                      />
                    </div>
                  </div>

                  {/* Registered Demo Farmer Shortcuts */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Registered Demo Farmers (Click to auto-fill):</span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFarmerMobile('9823145210');
                          setFarmerError(null);
                        }}
                        className="p-2 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer"
                      >
                        <p className="text-[11px] font-bold text-slate-800 truncate">Ramesh Patil</p>
                        <p className="text-[10px] text-slate-500 font-mono">9823145210</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFarmerMobile('9980334411');
                          setFarmerError(null);
                        }}
                        className="p-2 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer"
                      >
                        <p className="text-[11px] font-bold text-slate-800 truncate">Suresh Rao</p>
                        <p className="text-[10px] text-slate-500 font-mono">9980334411</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFarmerMobile('9415288120');
                          setFarmerError(null);
                        }}
                        className="p-2 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer"
                      >
                        <p className="text-[11px] font-bold text-slate-800 truncate">Balwinder Singh</p>
                        <p className="text-[10px] text-slate-500 font-mono">9415288120</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFarmerMobile('9872990210');
                          setFarmerError(null);
                        }}
                        className="p-2 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer"
                      >
                        <p className="text-[11px] font-bold text-slate-800 truncate">Priya Sharma</p>
                        <p className="text-[10px] text-slate-500 font-mono">9872990210</p>
                      </button>
                    </div>
                  </div>

                  {farmerError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{farmerError}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Get OTP via SMS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRegisterModalOpen(true)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      New farmer? Register here →
                    </button>
                  </div>
                </form>
              )}

              {farmerStep === 'OTP' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500">OTP dispatched to: </span>
                      <strong className="text-slate-800 font-mono font-bold">
                        {maskMobile(farmerMobile)}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFarmerStep('MOBILE');
                        setFarmerError(null);
                      }}
                      className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>

                  {/* Demo OTP Banner with Auto-fill */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-800">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <span>
                        Demo OTP Code:{' '}
                        <strong className="text-amber-900 font-mono text-sm bg-white px-2 py-0.5 rounded border border-amber-300">
                          {demoFarmerOtp || '482731'}
                        </strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillDemoFarmerOtp}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Auto-fill OTP
                    </button>
                  </div>

                  {/* 6-Digit OTP Input Boxes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-2 text-center">
                      Enter 6-Digit Verification Code
                    </label>
                    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleFarmerOtpPaste}>
                      {farmerOtpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (farmerInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleFarmerOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleFarmerOtpKeyDown(idx, e)}
                          className="w-10 sm:w-12 h-12 text-center text-lg font-mono font-black border-2 border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Timer & Attempts indicator */}
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Expires in:{' '}
                        <strong className="font-mono text-slate-800 font-bold">
                          {formatTimer(farmerExpirySeconds)}
                        </strong>
                      </span>
                    </div>

                    <div>
                      {farmerAttemptsRemaining > 0 ? (
                        <span className="text-slate-500">
                          {farmerAttemptsRemaining} attempt{farmerAttemptsRemaining > 1 ? 's' : ''} left
                        </span>
                      ) : (
                        <span className="text-red-600 font-bold">Limit reached</span>
                      )}
                    </div>
                  </div>

                  {farmerError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{farmerError}</span>
                    </div>
                  )}

                  {/* Verification CTA & Resend */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isFarmerVerifying || farmerAttemptsRemaining <= 0 || farmerExpirySeconds <= 0}
                      onClick={handleVerifyFarmerOtp}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isFarmerVerifying ? (
                        <span>Verifying...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Verify OTP & Open Farmer Portal</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={farmerResendCooldown > 0}
                      onClick={handleResendFarmerOtp}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 disabled:text-slate-400 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        {farmerResendCooldown > 0
                          ? `Resend OTP in ${farmerResendCooldown}s`
                          : 'Resend OTP'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {farmerStep === 'SUCCESS' && (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Authentication Successful
                  </h3>
                  <p className="text-xs text-slate-500">
                    Redirecting to your SmartProcure Farmer Dashboard...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: MANDI OFFICIAL LOGIN FORM                                      */}
          {/* ========================================================================= */}
          {selectedRole === 'official' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Mandi Official Portal Sign In
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorized procurement yard inspectors, weighbridge operators & gate managers.
                </p>
              </div>

              {/* Demo Credentials Callout */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">
                        Demo Credentials
                      </span>
                      <span className="text-xs font-bold text-blue-900">
                        Official ID: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-300">MANDI001</span>
                        {' '}&bull;{' '}
                        Password: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-300">demo123</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-700 mt-1">
                      Use these credentials to sign in and test the live queue, electronic weighing & DBT disburse workflows.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleFillDemoOfficial}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    Auto-fill Demo Credentials
                  </button>
                </div>
              </div>

              <form onSubmit={handleOfficialLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Official ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={officialId}
                    onChange={(e) => {
                      setOfficialId(e.target.value);
                      setOfficialError(null);
                    }}
                    placeholder="e.g. MANDI001"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={officialPassword}
                    onChange={(e) => {
                      setOfficialPassword(e.target.value);
                      setOfficialError(null);
                    }}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                {officialError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{officialError}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={isOfficialLoggingIn}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isOfficialLoggingIn ? (
                      <span>Signing In...</span>
                    ) : (
                      <>
                        <span>Login as Mandi Official</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('official')}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Direct Official Demo Access →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: ADMINISTRATOR LOGIN FORM                                       */}
          {/* ========================================================================= */}
          {selectedRole === 'admin' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Central & State Administrator Portal Sign In
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  DoCA state procurement officers, policy planners & central control room.
                </p>
              </div>

              {/* Demo Credentials Callout */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">
                        Demo Credentials
                      </span>
                      <span className="text-xs font-bold text-purple-900">
                        Admin ID: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-purple-300">ADMIN001</span>
                        {' '}&bull;{' '}
                        Password: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-purple-300">demo123</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-700 mt-1">
                      Access multi-mandi congestion heatmaps, dynamic rebalancing simulation & DBT statistics.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleFillDemoAdmin}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    Auto-fill Demo Credentials
                  </button>
                </div>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Admin ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminId}
                    onChange={(e) => {
                      setAdminId(e.target.value);
                      setAdminError(null);
                    }}
                    placeholder="e.g. ADMIN001"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminError(null);
                    }}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                {adminError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{adminError}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={isAdminLoggingIn}
                    className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isAdminLoggingIn ? (
                      <span>Signing In...</span>
                    ) : (
                      <>
                        <span>Login as Administrator</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className="text-xs font-bold text-purple-700 hover:text-purple-800 hover:underline cursor-pointer"
                  >
                    Direct Admin Demo Access →
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Demo Access & Quick Navigation Shortcuts */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Instant Demo Access (Bypass Credentials)</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Judges and evaluators can instantly jump into any role dashboard without entering demo credentials:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setRole('farmer')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Farmer Demo
            </button>
            <button
              onClick={() => setRole('official')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Mandi Official Demo
            </button>
            <button
              onClick={() => setRole('admin')}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Admin Demo
            </button>
          </div>
        </div>
      </div>

      {/* Existing Farmer Registration Flow (Strictly Preserved) */}
      <FarmerRegisterLoginModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        initialTab="register"
      />
    </div>
  );
};

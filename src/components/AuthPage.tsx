import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon
} from "lucide-react";

interface AuthPageProps {
  onLoginSuccess: (email: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

type AuthStep = "email" | "password" | "otp" | "set-password";

interface AuthState {
  isAuthenticated: boolean;
  email: string;
  sessionToken?: string;
}

export default function AuthPage({ onLoginSuccess, isDarkMode, onToggleDarkMode }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Auth state flow
  const [step, setStep] = useState<AuthStep>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false, email: "" });

  // Submit Step 1: Check Email
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Check if user exists and has a password
      const checkRes = await fetch("/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const checkJson = await checkRes.json();
      if (!checkRes.ok) {
        throw new Error(checkJson.error || "Failed to check email status.");
      }

      if (checkJson.hasPassword) {
        // User exists and has a password -> Go to password verification
        setStep("password");
      } else {
        // User is new -> Request OTP first to verify identity
        await sendOtpRequest();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to check user account status.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger OTP delivery
  const sendOtpRequest = async () => {
    setError(null);
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const json = await res.json();
    if (res.ok && json.success) {
      setSuccessMsg(`We've sent a 6-digit verification code to ${email}`);
      setStep("otp");
    } else {
      throw new Error(json.error || "Failed to deliver security OTP.");
    }
  };

  // Handle Resend OTP manually
  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await sendOtpRequest();
      setSuccessMsg("A new verification code has been dispatched to your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Submit password sign-in (existing user)
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg("Welcome back! Logging you in...");
        setAuthState({ 
          isAuthenticated: true, 
          email: json.email,
          sessionToken: json.sessionToken 
        });
        // Store session for future validation
        if (json.sessionToken) {
          localStorage.setItem("authToken", json.sessionToken);
          localStorage.setItem("authEmail", json.email);
        }
        setTimeout(() => onLoginSuccess(json.email), 1000);
      } else {
        setError(json.error || "Invalid password. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Server connection failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP Verification (new user verification step)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode.trim() })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        // OTP verified successfully! Now prompt them to set a unique password
        setSuccessMsg("Email verified successfully! Now create a secure password for your account.");
        setStep("set-password");
        // Reset password field for new entry
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(json.error || "Invalid verification code. Please check and try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Server validation error. Please check your code and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit new secure password creation
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (!confirmPassword) {
      setError("Please confirm your password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg("Account created successfully! Logging you in...");
        setAuthState({ isAuthenticated: true, email: json.email, sessionToken: json.sessionToken });
        setTimeout(() => onLoginSuccess(json.email), 1000);
      } else {
        setError(json.error || "Failed to set unique password.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error saving secure password.");
    } finally {
      setLoading(false);
    }
  };

  // Optional bypass directly with OTP for existing users if requested
  const handleSwitchToOtpBypass = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await sendOtpRequest();
    } catch (err: any) {
      setError(err.message || "Failed to switch to OTP verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans antialiased overflow-hidden select-none transition-colors duration-300 ${
      isDarkMode ? "bg-[#030303] text-zinc-100" : "bg-white text-slate-800"
    }`}>
      
      {/* LEFT SIDE PANEL - Exact matching dark visual, illustration & testimonial */}
      <div className={`hidden md:flex md:w-1/2 lg:w-[48%] flex-col justify-between p-12 lg:p-16 text-white relative transition-all duration-300 ${
        isDarkMode ? "bg-[#09090b] border-r border-zinc-900" : "bg-[#0c2340]"
      }`}>
        
        {/* Subtle grid accent background */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
 
        {/* Top left mini logo */}
        <div className="flex items-center gap-2 z-10">
          <div className="flex gap-0.5 items-end">
            <span className="w-1 h-3 bg-blue-400 rounded-sm" />
            <span className="w-1 h-4 bg-blue-500 rounded-sm" />
            <span className="w-1 h-2 bg-blue-300 rounded-sm" />
          </div>
          <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">SECURE PASS PORTAL</span>
        </div>
 
        {/* Core Financial Illustration */}
        <div className="flex-1 flex flex-col items-center justify-center py-12 z-10">
          <div className="w-full max-w-[340px] aspect-square relative drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            <svg 
              viewBox="0 0 300 300" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
               <circle cx="150" cy="150" r="110" fill="url(#bgGrad)" opacity="0.15" />
              <circle cx="150" cy="150" r="90" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" opacity="0.4" />
              <circle cx="150" cy="150" r="120" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" opacity="0.3" />
 
              <rect x="52" y="140" width="12" height="40" rx="2" fill={isDarkMode ? "#71717a" : "#3b82f6"} fillOpacity="0.3" />
              <rect x="68" y="115" width="12" height="65" rx="2" fill={isDarkMode ? "#a1a1aa" : "#3b82f6"} fillOpacity="0.5" />
              <rect x="84" y="90" width="12" height="90" rx="2" fill="url(#barGrad)" />
 
              <g transform="translate(190, 205)" opacity="0.85">
                <rect x="0" y="0" width="65" height="36" rx="4" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1.5" />
                <circle cx="32.5" cy="18" r="7" fill="#10b981" fillOpacity="0.3" stroke="#10b981" strokeWidth="1" />
                <line x1="8" y1="8" x2="16" y2="8" stroke="#10b981" strokeWidth="1.5" />
                <line x1="49" y1="28" x2="57" y2="28" stroke="#10b981" strokeWidth="1.5" />
              </g>
 
              <path d="M100 180H190" stroke="#64748b" strokeWidth="7" strokeLinecap="round" opacity="0.5" />
              <path d="M100 180H160" stroke={isDarkMode ? "#e4e4e7" : "#38bdf8"} strokeWidth="7" strokeLinecap="round" />
 
              <path d="M110 240V120C110 100 130 80 160 80H230" stroke="url(#ribbonGrad1)" strokeWidth="10" strokeLinecap="round" />
              <path d="M130 240V140C130 125 145 110 170 110H210" stroke="url(#ribbonGrad2)" strokeWidth="8" strokeLinecap="round" />
 
              <path d="M225 74L236 80L225 86" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M205 105L213 110L205 115" stroke={isDarkMode ? "#a1a1aa" : "#38bdf8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M100 90L110 80L120 90" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
 
              <g transform="translate(50, 190)">
                <circle cx="12" cy="12" r="11" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="12" y="17" fill="#fbbf24" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">$</text>
              </g>
 
              <g transform="translate(235, 130)">
                <circle cx="12" cy="12" r="11" fill="#0f172a" stroke="#a7f3d0" strokeWidth="1.5" />
                <text x="12" y="16.5" fill="#a7f3d0" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">€</text>
              </g>
 
              <circle cx="150" cy="110" r="4" fill={isDarkMode ? "#e4e4e7" : "#38bdf8"} />
              <path d="M150 110C155 115 165 115 170 120" stroke={isDarkMode ? "#71717a" : "#38bdf8"} strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="190" cy="150" r="4" fill="#34d399" />
              <path d="M190 150C195 155 205 155 210 160" stroke="#34d399" strokeWidth="1.5" strokeDasharray="2 2" />
 
              <defs>
                <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor={isDarkMode ? "#52525b" : "#3b82f6"} />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="barGrad" x1="84" y1="180" x2="84" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor={isDarkMode ? "#27272a" : "#2563eb"} />
                  <stop offset="100%" stopColor={isDarkMode ? "#71717a" : "#60a5fa"} />
                </linearGradient>
                <linearGradient id="ribbonGrad1" x1="110" y1="240" x2="230" y2="80" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor={isDarkMode ? "#18181b" : "#1d4ed8"} />
                  <stop offset="50%" stopColor={isDarkMode ? "#3f3f46" : "#3b82f6"} />
                  <stop offset="100%" stopColor={isDarkMode ? "#a1a1aa" : "#38bdf8"} />
                </linearGradient>
                <linearGradient id="ribbonGrad2" x1="130" y1="240" x2="210" y2="110" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
 
        {/* Dynamic Testimonial */}
        <div className="z-10 text-center max-w-sm mx-auto">
          <blockquote className="text-[15px] lg:text-md text-slate-200 font-light leading-relaxed tracking-wide italic">
            "FinFlow makes personal wealth tracking incredibly safe, keeping our budgets perfectly optimized with complete security."
          </blockquote>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Owner Verified Suite</span>
          </div>
        </div>
 
      </div>
 
      {/* RIGHT SIDE PANEL - Adaptive light/dark clean container */}
      <div className={`flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-16 relative transition-colors duration-300 ${
        isDarkMode ? "bg-[#0b101c]" : "bg-[#fbfbfa]"
      }`}>
        
        {/* Floating Theme Toggle in top right */}
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={onToggleDarkMode}
            className={`p-2.5 rounded-full border transition-all cursor-pointer shadow-xs ${
              isDarkMode 
                ? "bg-slate-800 hover:bg-slate-700 text-yellow-400 border-slate-700" 
                : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
 
        {/* Empty placeholder at top to help center core content */}
        <div className="hidden md:block h-6" />
 
        {/* Content wrapper with width restriction */}
        <div className="w-full max-w-[380px] mx-auto my-auto py-8">
          
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3.5 mb-8">
            <div className="flex flex-col gap-1 items-end shrink-0">
              <div className="flex gap-1 items-end">
                <span className="w-1.5 h-3 bg-blue-500 rounded-xs" />
                <span className="w-1.5 h-4.5 bg-blue-600 rounded-xs" />
                <span className="w-1.5 h-2 bg-blue-400 rounded-xs" />
              </div>
            </div>
            <div>
              <h2 className={`text-xl font-bold tracking-tight font-sans transition-colors ${
                isDarkMode ? "text-white" : "text-slate-800"
              }`}>
                FinFlow
              </h2>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block -mt-1">
                Account Management Portal
              </span>
            </div>
          </div>

          {/* Auth Progress Steps */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-2 flex-1">
              {/* Step 1: Email */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === "email" || step === "password" || step === "otp" || step === "set-password"
                    ? isDarkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                    : isDarkMode ? "bg-zinc-700 text-zinc-400" : "bg-slate-300 text-slate-500"
                }`}>
                  1
                </div>
              </div>
              {/* Line 1 */}
              <div className={`flex-1 h-0.5 transition-all ${
                step === "password" || step === "otp" || step === "set-password"
                  ? isDarkMode ? "bg-blue-600" : "bg-blue-500"
                  : isDarkMode ? "bg-zinc-700" : "bg-slate-300"
              }`} />
              {/* Step 2: Password/OTP */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === "password" || step === "otp" || step === "set-password"
                    ? isDarkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                    : isDarkMode ? "bg-zinc-700 text-zinc-400" : "bg-slate-300 text-slate-500"
                }`}>
                  2
                </div>
              </div>
              {/* Line 2 */}
              <div className={`flex-1 h-0.5 transition-all ${
                step === "set-password"
                  ? isDarkMode ? "bg-blue-600" : "bg-blue-500"
                  : isDarkMode ? "bg-zinc-700" : "bg-slate-300"
              }`} />
              {/* Step 3: Final Setup */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === "set-password"
                    ? isDarkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                    : isDarkMode ? "bg-zinc-700 text-zinc-400" : "bg-slate-300 text-slate-500"
                }`}>
                  3
                </div>
              </div>
            </div>
          </div>
 
          {/* Step Labels */}
          <div className="flex items-center justify-between mb-4 px-2 text-[9px] font-bold uppercase tracking-wider">
            <span className={`transition-colors ${
              step === "email" ? (isDarkMode ? "text-blue-400" : "text-blue-600") : (isDarkMode ? "text-slate-600" : "text-slate-400")
            }`}>Email</span>
            <span className={`transition-colors ${
              step === "password" || step === "otp" ? (isDarkMode ? "text-blue-400" : "text-blue-600") : (isDarkMode ? "text-slate-600" : "text-slate-400")
            }`}>{step === "password" ? "Password" : "Verify"}</span>
            <span className={`transition-colors ${
              step === "set-password" ? (isDarkMode ? "text-blue-400" : "text-blue-600") : (isDarkMode ? "text-slate-600" : "text-slate-400")
            }`}>Secure</span>
          </div>

          {/* Dynamic informative headers based on current state step */}
          <div className="space-y-2 mb-6">
            <h1 className={`text-2xl font-bold tracking-tight transition-colors ${
              isDarkMode ? "text-white" : "text-slate-800"
            }`}>
              {step === "email" && "Get Started"}
              {step === "password" && "Enter Password"}
              {step === "otp" && "Verify Email Identity"}
              {step === "set-password" && "Secure Your Profile"}
            </h1>
            <p className={`text-xs leading-relaxed font-medium transition-colors ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              {step === "email" && "Enter your email. If you're new, we'll verify via an OTP; if registered, sign in directly with password."}
              {step === "password" && "Provide your unique account password to securely authorize this device session."}
              {step === "otp" && `Input the secure 6-digit cryptographic verification key sent directly to your inbox.`}
              {step === "set-password" && "Establish a secure, unique password to safeguard your personal financial data."}
            </p>
          </div>
 
          {/* Success Alerts */}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`mb-6 p-4 border rounded-2xl flex items-start gap-2 text-xs font-medium transition-colors ${
                isDarkMode 
                  ? "bg-emerald-950/30 border-emerald-900/30 text-emerald-300" 
                  : "bg-emerald-50 border-emerald-100/50 text-slate-700"
              }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{successMsg}</p>
            </motion.div>
          )}

          {/* Error Alerts */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`mb-6 p-4 border rounded-2xl flex items-start gap-2.5 text-xs font-medium transition-colors ${
                isDarkMode 
                  ? "bg-red-950/30 border-red-900/30 text-red-300" 
                  : "bg-red-50 border-red-100/50 text-red-700"
              }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <p className="leading-relaxed">{error}</p>
            </motion.div>
          )}
 
          {/* ANIMATED FORM AREA */}
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.form 
                key="email-form"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onSubmit={handleCheckEmail} 
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className={`w-full border rounded-xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none transition-all placeholder-slate-400 ${
                        isDarkMode 
                          ? "bg-zinc-900 border-zinc-800 text-white focus:bg-[#0c0c0c] focus:border-zinc-700" 
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500"
                      }`}
                    />
                  </div>
                </div>
 
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 mt-2 ${
                    isDarkMode ? "bg-zinc-800 hover:bg-zinc-750" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking registry...
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="mx-auto pl-6 font-semibold">Continue</span>
                      <ArrowRight className="w-4.5 h-4.5 shrink-0" />
                    </div>
                  )}
                </motion.button>
              </motion.form>
            )}
            {step === "password" && (
              <motion.form 
                key="password-form"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onSubmit={handlePasswordSignIn} 
                className="space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Account Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter unique password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className={`w-full border rounded-xl py-3 pl-10 pr-10 text-xs font-semibold focus:outline-none transition-all placeholder-slate-400 ${
                        isDarkMode 
                          ? "bg-zinc-900 border-zinc-800 text-white focus:bg-[#0c0c0c] focus:border-zinc-700" 
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
 
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 mt-2 ${
                    isDarkMode ? "bg-zinc-800 hover:bg-zinc-750" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authorizing...
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="mx-auto pl-6 font-semibold">Sign In</span>
                      <span className="bg-white/10 text-white/90 text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 uppercase">
                        ↵ Enter
                      </span>
                    </div>
                  )}
                </motion.button>
 
                <div className="flex flex-col gap-2.5 pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleSwitchToOtpBypass}
                    disabled={loading}
                    className="text-xs text-blue-500 hover:text-blue-450 font-semibold underline cursor-pointer"
                  >
                    Forgot password? Sign in with OTP verification
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setPassword("");
                      setError(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-300 font-semibold cursor-pointer"
                  >
                    Change Email Address
                  </button>
                </div>
              </motion.form>
            )}
            {step === "otp" && (
              <motion.form 
                key="otp-form"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onSubmit={handleVerifyOtp} 
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Verification Code (OTP)
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Enter 6-digit key"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      disabled={loading}
                      className={`w-full border rounded-xl py-3.5 pl-10 pr-4 text-sm font-mono font-bold tracking-[0.3em] text-center focus:outline-none transition-all placeholder-slate-400 ${
                        isDarkMode 
                          ? "bg-zinc-900 border-zinc-800 text-white focus:bg-[#0c0c0c] focus:border-zinc-700" 
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500"
                      }`}
                    />
                  </div>
                </div>
 
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError(null);
                    }}
                    disabled={loading}
                    className={`w-1/3 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                      isDarkMode ? "bg-zinc-900 hover:bg-zinc-850 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className={`flex-1 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50 ${
                      isDarkMode ? "bg-zinc-800 hover:bg-zinc-750" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Verify Code
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </div>
 
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-xs text-slate-500 hover:text-zinc-400 font-semibold underline flex items-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend verification code
                  </button>
                </div>
              </motion.form>
            )}
 
            {step === "set-password" && (
              <motion.form 
                key="set-password-form"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onSubmit={handleCreatePassword} 
                className="space-y-4"
              >
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                      Choose Your Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Choose unique password (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className={`w-full border rounded-xl py-3.5 pl-10 pr-10 text-xs font-semibold focus:outline-none transition-all placeholder-slate-400 ${
                          isDarkMode 
                            ? "bg-zinc-900 border-zinc-800 text-white focus:bg-[#0c0c0c] focus:border-zinc-700" 
                            : "bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
 
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                      Confirm Unique Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        className={`w-full border rounded-xl py-3.5 pl-10 pr-10 text-xs font-semibold focus:outline-none transition-all placeholder-slate-400 ${
                          isDarkMode 
                            ? "bg-zinc-900 border-zinc-800 text-white focus:bg-[#0c0c0c] focus:border-zinc-700" 
                            : "bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
 
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 mt-2 ${
                    isDarkMode ? "bg-emerald-700 hover:bg-emerald-650" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Password...
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="mx-auto pl-6 font-semibold">Complete Account Setup</span>
                      <ArrowRight className="w-4.5 h-4.5 shrink-0" />
                    </div>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
 
        </div>
 
        {/* FOOTER AT THE BOTTOM OF RIGHT HALF */}
        <footer className={`pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-semibold transition-colors ${
          isDarkMode ? "border-zinc-900 text-zinc-500" : "border-slate-100 text-slate-400"
        }`}>
          <span>© 2026 FinFlow Inc.</span>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:text-slate-600 dark:hover:text-zinc-400">Privacy Policy</a>
            <a href="#terms" className="hover:text-slate-600 dark:hover:text-zinc-400">Terms of Service</a>
          </div>
        </footer>
 
      </div>
 
    </div>
  );
}

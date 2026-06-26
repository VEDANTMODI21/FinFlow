import React, { useState, useEffect, useRef } from "react";
import { 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { FlowStep } from "../types";

interface OtpFlowProps {
  onStepChange: (step: FlowStep) => void;
  onOtpSent: () => void;
  onLoginSuccess?: (email: string) => void;
  onSignOut?: () => void;
}

export default function OtpFlow({ onStepChange, onOtpSent, onLoginSuccess, onSignOut }: OtpFlowProps) {
  const [stage, setStage] = useState<"request" | "verify" | "success">("request");
  const [email, setEmail] = useState("");
  const [otpVal, setOtpVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Expose step change events to visualizer
  const updateStep = (step: FlowStep) => {
    onStepChange(step);
  };

  // Timer countdown hook
  useEffect(() => {
    if (stage !== "verify" || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, timer]);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Focus OTP input helper
  const focusOtpInput = () => {
    if (otpInputRef.current) {
      otpInputRef.current.focus();
    }
  };

  // Request OTP endpoint call
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      updateStep("failed");
      return;
    }

    setLoading(true);
    setError(null);
    updateStep("requesting");

    // Mimic short latency for visual effect
    await new Promise((r) => setTimeout(r, 600));
    updateStep("generating");
    await new Promise((r) => setTimeout(r, 600));
    updateStep("sending");

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server is warming up or temporarily unavailable. Please retry in a moment.");
      }

      const data = await res.json();

      if (data.success) {
        setStage("verify");
        setTimer(300); // Reset countdown timer
        setOtpVal(""); // Reset input code
        updateStep("sent");
        onOtpSent(); // Notify parent to fetch mailbox
        // Focus OTP field slightly after state transitions
        setTimeout(focusOtpInput, 100);
      } else {
        setError(data.error || "Failed to generate authorization code.");
        updateStep("failed");
      }
    } catch (err: any) {
      setError("API Connection failure. Please ensure backend server is active.");
      updateStep("failed");
    } finally {
      setLoading(false);
    }
  };

  // Demo bypass handler for immediate previewing
  const handleDemoBypass = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    updateStep("requesting");
    await new Promise((r) => setTimeout(r, 400));
    updateStep("verifying");
    await new Promise((r) => setTimeout(r, 400));
    
    const demoEmail = "demo@example.com";
    setEmail(demoEmail);
    setStage("success");
    updateStep("verified");
    if (onLoginSuccess) {
      onLoginSuccess(demoEmail);
    }
    setLoading(false);
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    updateStep("sending");

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server is warming up or temporarily unavailable. Please retry in a moment.");
      }

      const data = await res.json();

      if (data.success) {
        setTimer(300); // Reset timer
        setOtpVal(""); // Clear pin
        updateStep("sent");
        onOtpSent(); // Notify parent
        focusOtpInput();
      } else {
        setError(data.error || "Failed to dispatch resend request.");
        updateStep("failed");
      }
    } catch (err) {
      setError("Connection failure while resending code.");
      updateStep("failed");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP endpoint call
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpVal.length !== 6) {
      setError("Please enter the 6-digit authorization code.");
      return;
    }

    setLoading(true);
    setError(null);
    updateStep("verifying");

    // Brief timeout for visualizer pathing
    await new Promise((r) => setTimeout(r, 800));

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpVal }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server is warming up or temporarily unavailable. Please retry in a moment.");
      }

      const data = await res.json();

      if (data.success) {
        setStage("success");
        updateStep("verified");
        if (onLoginSuccess) {
          onLoginSuccess(email.toLowerCase().trim());
        }
      } else {
        setError(data.error || "The code submitted is incorrect.");
        updateStep("failed");
      }
    } catch (err) {
      setError("Authorization server rejected request or offline.");
      updateStep("failed");
    } finally {
      setLoading(false);
    }
  };

  // Reset to initial stage
  const handleSignOut = () => {
    setStage("request");
    setEmail("");
    setOtpVal("");
    setError(null);
    updateStep("idle");
    if (onSignOut) {
      onSignOut();
    }
  };

  // Handle single hidden text inputs updating custom PIN squares
  const handleOtpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length <= 6) {
      setOtpVal(val);
    }
  };

  return (
    <div id="otp-device-card" className="bg-[#141414] border border-white/10 p-6 rounded-none relative flex flex-col justify-between h-[400px] shadow-2xl">
      {/* Decorative Phone-like Status Bar */}
      <div className="flex justify-between items-center text-[8.5px] font-mono text-white/30 uppercase tracking-widest pb-3 border-b border-white/5 mb-5 select-none">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Secure Link
        </span>
        <span className="font-bold flex items-center gap-1.5">
          {stage === "success" ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
          STAGES: {stage.toUpperCase()}
        </span>
      </div>

      {/* Main interactive container */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Error notification */}
        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* 1. Email Stage */}
        {stage === "request" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-2">
              <h2 className="font-display font-light text-xl text-white tracking-wide">
                Start Authorization
              </h2>
              <p className="text-[10px] font-sans text-white/40 leading-relaxed">
                Connect your account by entering your email. We will generate and dispatch a 6-digit security code.
              </p>
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/30">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="e.g. user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 hover:border-white/20 focus:border-white/30 text-white rounded-none text-xs font-mono focus:outline-none transition-all disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-white text-black hover:bg-white/90 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate OTP
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDemoBypass}
                disabled={loading}
                className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer border border-blue-500/20"
                title="Bypass login and open dashboard immediately"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Instant Demo
              </button>
            </div>
          </form>
        )}

        {/* 2. OTP Verification Stage */}
        {stage === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <h2 className="font-display font-light text-xl text-white tracking-wide">
                Security Pin
              </h2>
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest leading-relaxed flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                Code dispatched to <span className="text-white underline">{email}</span>
              </p>
            </div>

            {/* OTP Grid Squares - Single hidden input mapped */}
            <div className="relative py-1">
              <input
                ref={otpInputRef}
                type="text"
                pattern="[0-9]*"
                maxLength={6}
                value={otpVal}
                onChange={handleOtpInputChange}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-default select-none z-10"
                style={{ caretColor: "transparent" }}
              />

              <div 
                onClick={focusOtpInput}
                className="grid grid-cols-6 gap-2"
              >
                {Array.from({ length: 6 }).map((_, index) => {
                  const char = otpVal[index] || "";
                  const isFocused = otpVal.length === index;
                  return (
                    <div
                      key={index}
                      className={`h-11 border bg-black text-center text-lg font-mono font-bold text-white flex items-center justify-center transition-all ${
                        char ? "border-white/40" : "border-white/10"
                      } ${isFocused ? "border-white ring-1 ring-white/25" : ""}`}
                    >
                      {char}
                      {isFocused && (
                        <span className="w-[1.5px] h-4 bg-white/60 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resend and Countdown indicators */}
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-white/40">
                Expires in: <span className="text-white font-bold">{formatTime(timer)}</span>
              </span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || timer > 270} // limit resending to every 30 seconds
                className="text-white/60 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Resend Code
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otpVal.length !== 6}
              className="w-full py-3 bg-white text-black hover:bg-white/90 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verify OTP
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. Verified Success Stage */}
        {stage === "success" && (
          <div className="space-y-5 text-center py-2 animate-fade-in">
            <div className="flex justify-center">
              <div className="p-3 border border-emerald-500/30 bg-emerald-500/10 rounded-full animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="font-display font-light text-xl text-white tracking-wide">
                Authorized
              </h2>
              <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                Access Granted Successfully
              </p>
            </div>

            <div className="bg-black/30 p-3 border border-white/5 font-mono text-[9px] text-white/50 text-left space-y-1.5">
              <div className="flex justify-between">
                <span>Principal:</span>
                <span className="text-white font-medium select-all">{email}</span>
              </div>
              <div className="flex justify-between">
                <span>Authorization:</span>
                <span className="text-emerald-400 font-bold">VERIFIED</span>
              </div>
              <div className="flex justify-between">
                <span>Session ID:</span>
                <span className="text-white/80 select-all">sess_val_{Math.random().toString(36).substr(2, 6)}</span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer"
            >
              Terminate Session
            </button>
          </div>
        )}
      </div>

      {/* Security notice footer */}
      <div className="text-[8.5px] font-mono text-white/20 uppercase tracking-[0.1em] pt-3 border-t border-white/5 text-center select-none">
        Authorization Session Shield v1.0
      </div>
    </div>
  );
}

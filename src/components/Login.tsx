import React, { useState } from 'react';
import { Mail, ShieldCheck, ArrowRight, Loader2, KeyRound, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (email: string, userData: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isDevMode, setIsDevMode] = useState(false);
  const [fallbackCode, setFallbackCode] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }

      setIsDevMode(!!data.devMode);
      if (data.devMode) {
        setFallbackCode(data.fallbackOtp || '123456');
        setInfoMessage(
          'SMTP email credentials not set in Settings > Secrets. For testing, we have printed the code to the server terminal console.'
        );
      } else {
        setInfoMessage(`A secure verification code has been sent directly to ${email}!`);
      }

      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('Please enter the full verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code.');
      }

      onLoginSuccess(data.email, data.user);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_container" className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4 transition-colors duration-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.02),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.01),transparent_40%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#141414] border border-white/10 p-8 relative overflow-hidden rounded-none shadow-2xl"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white/5 border border-white/10 text-white rounded-none mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl font-light tracking-wide text-white">
            Fin<span className="text-white/50">Flow</span>
          </h1>
          <p className="text-white/40 mt-2 text-xs font-mono uppercase tracking-widest">
            Secure Passwordless Entry
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded-none text-xs font-mono uppercase tracking-wider"
          >
            {error}
          </motion.div>
        )}

        {infoMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 rounded-none text-xs leading-relaxed"
          >
            {infoMessage}
          </motion.div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-2">
                Gmail Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/30">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-none focus:outline-none focus:border-white/30 text-white placeholder-white/20 text-sm transition-all"
                />
              </div>
              <p className="mt-2.5 text-[11px] text-white/30 leading-normal flex items-start gap-1.5 font-light">
                <span>•</span>
                <span>The verification code will arrive directly in your Gmail inbox.</span>
              </p>
            </div>

            <button
              id="send_otp_btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black hover:bg-white/90 font-bold text-[10px] font-mono uppercase tracking-widest disabled:opacity-30 cursor-pointer transition-all rounded-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  Sending secure code...
                </>
              ) : (
                <>
                  Send Verification Code
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="otp" className="block text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">
                  Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-[10px] text-white/60 hover:text-white font-mono uppercase tracking-widest transition-colors"
                >
                  Change Email
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/30">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  id="otp"
                  type="text"
                  required
                  maxLength={8}
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-none focus:outline-none focus:border-white/30 text-white placeholder-white/20 text-sm font-mono tracking-widest text-center transition-all"
                />
              </div>
            </div>

            <button
              id="verify_otp_btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black hover:bg-white/90 font-bold text-[10px] font-mono uppercase tracking-widest disabled:opacity-30 cursor-pointer transition-all rounded-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Log In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {isDevMode && (
              <div className="mt-6 p-4 rounded-none bg-amber-950/20 border border-amber-900/30">
                <div className="flex gap-2 items-start">
                  <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400">Review/Developer Helper</h4>
                    <p className="text-xs text-amber-300/70 mt-1 leading-relaxed">
                      SMTP credentials are not active. For testing convenience, use the generated code: <code className="font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white font-bold">{fallbackCode}</code> to sign in instantly.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest leading-relaxed">
            Production ready with Gmail OTP delivery configured in Secrets
          </p>
        </div>
      </motion.div>
    </div>
  );
}

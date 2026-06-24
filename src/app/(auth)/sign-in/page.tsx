'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, ArrowLeft, Send, KeyRound, Check, Loader } from 'lucide-react';

export default function SignInPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Forgot password state
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'newpw'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const result = await signIn(email, password);
    setBusy(false);
    if (result.success) router.push('/dashboard');
    else setError(result.error || 'Invalid email or password.');
  }

  function handleForgot() {
    setView('forgot');
    setResetStep('email');
    setResetEmail('');
    setOtpCode('');
    setNewPassword('');
    setResetMsg('');
    setError('');
  }

  function handleBackToSignIn() {
    setView('signin');
    setError('');
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, purpose: 'password_reset' }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetMsg(data.emailSent
          ? `A code has been sent to ${resetEmail}`
          : `Demo code: ${data.demoCode}`
        );
        setResetStep('otp');
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setBusy(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: otpCode, purpose: 'password_reset' }),
      });
      if (res.ok) {
        setResetMsg('');
        setResetStep('newpw');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid or expired code');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setBusy(false);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must be at least 8 characters with an uppercase letter and a number');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, newPassword, otp: otpCode }),
      });
      if (res.ok) {
        setView('signin');
        setEmail(resetEmail);
        setResetMsg('Password reset successful. Sign in with your new password.');
      } else {
        const data = await res.json();
        setError(data.error || 'Reset failed');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setBusy(false);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-xl border border-border p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
            <span className="text-white font-bold text-lg">BL</span>
          </div>
          <h1 className="text-lg font-bold text-brand">BiasharaLedger</h1>
        </div>

        {view === 'signin' ? (
          <>
            <h2 className="text-sm font-semibold text-brand mb-5">Sign in to your account</h2>

            {resetMsg && <p className="text-xs text-green-600 mb-4 bg-green-50 px-3 py-2 rounded-lg">{resetMsg}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Business Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-[#555555]"
                  placeholder="you@company.co.ke"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    required
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#000000] hover:text-brand">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button type="button" onClick={handleForgot} className="text-xs text-brand hover:text-[#000000] mt-1.5 transition-colors">
                  Forgot Password?
                </button>
              </div>

              {error && <p className="text-xs text-brand">{error}</p>}

              <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
                {busy ? <Loader className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {busy ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-xs text-[#000000] text-center mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/sign-up" className="text-brand font-medium hover:text-[#000000] transition-colors">Sign Up</Link>
            </p>
          </>
        ) : (
          <>
            <button onClick={handleBackToSignIn} className="flex items-center gap-1 text-xs text-brand hover:text-[#000000] mb-4 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </button>
            <h2 className="text-sm font-semibold text-brand mb-5">Reset Password</h2>

            {resetStep === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="you@company.co.ke"
                    required
                  />
                </div>
                {error && <p className="text-xs text-brand">{error}</p>}
                <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
                  {busy ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {busy ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            )}

            {resetStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {resetMsg && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">{resetMsg}</p>}
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Enter Code</label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm text-[#000000] text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="0 0 0 0 0 0"
                    maxLength={6}
                    required
                  />
                </div>
                {error && <p className="text-xs text-brand">{error}</p>}
                <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
                  {busy ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {busy ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
            )}

            {resetStep === 'newpw' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <Check className="h-3.5 w-3.5 shrink-0" /> Code verified successfully
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="Min. 8 characters, uppercase & number"
                      required
                    />
                    <button type="button" onClick={() => setShowNewPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#000000] hover:text-brand">
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs text-brand">{error}</p>}
                <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
                  {busy ? <Loader className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {busy ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

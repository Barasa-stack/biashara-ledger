'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Send, Check, Loader, RefreshCw } from 'lucide-react';

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  async function sendOtp() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.emailSent
          ? `A 6-digit code has been sent to ${email.trim().toLowerCase()}`
          : `Demo code: ${data.demoCode}`
        );
        setStep('otp');
        startCooldown();
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setBusy(false);
  }

  function startCooldown() {
    setResendCooldown(30);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^07\d{8}$/.test(phone) && !/^\+2547\d{8}$/.test(phone)) {
      setError('Please enter a valid Kenyan phone number (e.g. 0712345678).');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    await sendOtp();
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setOtp('');
    setError('');
    await sendOtp();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setBusy(true);
    const result = await signUp(
      email.trim().toLowerCase(),
      password,
      phone,
      firstName,
      lastName,
      otp.trim()
    );
    setBusy(false);
    if (result.success) {
      if (result.requiresPackageSelection) {
        router.push('/select-package');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(result.error || 'Verification failed.');
    }
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

        <div className="bg-brand/5 border border-[#df1c1c]/20 rounded-lg px-3 py-2 mb-4">
          <p className="text-xs text-brand font-medium">14-day free trial</p>
          <p className="text-[10px] text-[#000000]">No credit card required. Cancel anytime.</p>
        </div>

        {step === 'form' ? (
          <>
            <h2 className="text-sm font-semibold text-brand mb-5">Create your account</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-[#555555]"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#000000] mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-[#555555]"
                    placeholder="Doe"
                  />
                </div>
              </div>

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
                <label className="block text-xs font-medium text-[#000000] mb-1">Kenyan Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-[#555555]"
                  placeholder="0712 345 678"
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
              </div>

              {error && <p className="text-xs text-brand">{error}</p>}

              <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
                {busy ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {busy ? 'Sending code...' : 'Send Verification Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <button onClick={() => setStep('form')} className="flex items-center gap-1 text-xs text-brand hover:text-[#000000] mb-4 transition-colors">
              ← Back
            </button>
            <h2 className="text-sm font-semibold text-brand mb-5">Verify Your Email</h2>

            {message && (
              <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-4">{message}</p>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Enter 6-Digit Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm text-[#000000] text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="0 0 0 0 0 0"
                  maxLength={6}
                  required
                />
              </div>

              {error && <p className="text-xs text-brand">{error}</p>}

              <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
                {busy ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {busy ? 'Creating account...' : 'Verify & Create Account'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || busy}
                className="inline-flex items-center gap-1.5 text-xs text-brand hover:text-[#000000] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${resendCooldown > 0 ? '' : ''}`} />
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend code'}
              </button>
            </div>
          </>
        )}

        <p className="text-xs text-[#000000] text-center mt-6">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-brand font-medium hover:text-[#000000] transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

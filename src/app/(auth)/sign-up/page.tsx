'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Send, Check, Loader, RefreshCw, Bug, Search, CheckCircle2 } from 'lucide-react';
import { countries, filterCountries, getCountryByCode, getDialCode } from '@/lib/countries';

const SHOW_OTP = true;

function stripDialCode(phone: string, dial: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith(dial.replace(/[\s\-]/g, ''))) {
    return cleaned.slice(dial.replace(/[\s\-]/g, '').length);
  }
  if (cleaned.startsWith('+')) return cleaned;
  return phone;
}

function isValidPhone(phone: string, dial: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) return false;
  const knownPrefix = dial.replace(/[\s\-]/g, '');
  if (cleaned.startsWith('+') && !cleaned.startsWith(knownPrefix)) return false;
  return true;
}

function SignUpForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState(searchParams?.get('plan') || 'Premium');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('KE');
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [trialKey, setTrialKey] = useState('');

  const countryRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedCountry = getCountryByCode(country);
  const dialCode = selectedCountry?.dial || '+254';

  const filteredCountries = filterCountries(countrySearch);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showCountryDropdown && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showCountryDropdown]);

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
        const otpCode = data.demoCode || '';
        setDevOtp(otpCode);
        setMessage(data.emailSent
          ? `A 6-digit code has been sent to ${email.trim().toLowerCase()}. If you don't see it, please check your spam folder.`
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

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value;
    const dial = selectedCountry?.dial || '+254';
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith(dial.replace(/[\s\-]/g, '')) && cleaned.length > dial.replace(/[\s\-]/g, '').length) {
      value = cleaned.slice(dial.replace(/[\s\-]/g, '').length);
    } else if (value.startsWith('+') && !value.startsWith(dial.replace(/[\s\-]/g, ''))) {
      const otherCountry = countries.find(c => value.startsWith(c.dial.replace(/[\s\-]/g, '')));
      if (otherCountry) {
        setCountry(otherCountry.code);
        value = value.slice(otherCountry.dial.replace(/[\s\-]/g, '').length);
      }
    }
    value = value.replace(/[^0-9]/g, '');
    setPhone(value);
  }

  function handleCountrySelect(code: string) {
    setCountry(code);
    setShowCountryDropdown(false);
    setCountrySearch('');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!country) {
      setError('Please select your country.');
      return;
    }
    const dial = selectedCountry?.dial || '+254';
    const fullPhone = dial + phone;
    if (!phone || !isValidPhone(fullPhone, dial)) {
      setError(`Please enter a valid phone number for ${selectedCountry?.name || 'your country'}.`);
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters with an uppercase letter and a number');
      return;
    }
    await sendOtp();
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setOtp('');
    setError('');
    setDevOtp('');
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
    const dial = selectedCountry?.dial || '+254';
    const fullPhone = dial + phone;
    const result = await signUp(
      email.trim().toLowerCase(),
      password,
      fullPhone,
      firstName,
      lastName,
      otp.trim(),
      selectedPlan,
      country
    );
    setBusy(false);
    if (result.success) {
      setShowTrialPopup(true);
      setTrialKey((result as any).trial_key || '');
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

        {step === 'form' ? (
          <>
            <h2 className="text-sm font-semibold text-brand mb-1">Create your free account</h2>
            <p className="text-[11px] text-[#555555] mb-5">
              Start your 3-day free trial. No payment required.
            </p>

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
                <label className="block text-xs font-medium text-[#000000] mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-[#555555]"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Phone</label>
                <div className="flex gap-2">
                  <div className="relative w-28" ref={countryRef}>
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="w-full flex items-center gap-1 bg-white border border-border rounded-lg px-2.5 py-2.5 text-xs text-[#000000] focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      <span className="text-base leading-none">{selectedCountry?.flag || '🌍'}</span>
                      <span>{dialCode}</span>
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-border rounded-lg shadow-xl z-50">
                        <div className="p-2 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555555]" />
                            <input
                              ref={searchRef}
                              type="text"
                              value={countrySearch}
                              onChange={e => setCountrySearch(e.target.value)}
                              placeholder="Search countries..."
                              className="w-full bg-gray-50 border border-border rounded-md pl-8 pr-2.5 py-1.5 text-xs text-[#000000] focus:outline-none focus:ring-1 focus:ring-brand"
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredCountries.map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => handleCountrySelect(c.code)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors ${country === c.code ? 'bg-brand/5 text-brand font-medium' : 'text-[#000000]'}`}
                            >
                              <span className="text-base leading-none">{c.flag}</span>
                              <span>{c.name}</span>
                              <span className="ml-auto text-[#555555]">{c.dial}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="flex-1 bg-white border border-border rounded-lg px-3 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-[#555555]"
                    placeholder="712 345 678"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#000000] mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Min. 8 characters, uppercase & number"
                    required
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#000000] hover:text-brand">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Plan selector */}
              <div>
                <label className="block text-xs font-medium text-[#000000] mb-2">Choose your trial plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Basic', label: 'Basic', desc: 'Core + Inventory' },
                    { id: 'Standard', label: 'Standard', desc: 'Basic + CRM' },
                    { id: 'Premium', label: 'Premium', desc: 'Everything' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlan(p.id)}
                      className={`relative flex flex-col items-center gap-0.5 p-2.5 rounded-lg border text-center transition-all ${
                        selectedPlan === p.id
                          ? 'border-brand bg-red-50 ring-1 ring-brand'
                          : 'border-border hover:border-gray-300 bg-white'
                      }`}
                    >
                      {selectedPlan === p.id && (
                        <CheckCircle2 className="absolute top-1 right-1 h-3.5 w-3.5 text-brand" />
                      )}
                      <span className="text-xs font-semibold text-[#000000]">{p.label}</span>
                      <span className="text-[10px] text-gray-500 leading-tight">{p.desc}</span>
                    </button>
                  ))}
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
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{message}</p>
            )}

            {SHOW_OTP && devOtp && (
              <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-4">
                <Bug className="h-3.5 w-3.5 shrink-0" />
                <span>Dev OTP: <strong className="tracking-wider text-sm">{devOtp}</strong></span>
              </div>
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

      {showTrialPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Account Created Successfully!</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please check your email at <strong>{email}</strong> for your 3-day trial activation key.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">Your Trial License Key</p>
              <p className="text-lg font-bold tracking-widest font-mono text-brand">{trialKey}</p>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Enter this key on the activation page to start your free trial.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowTrialPopup(false); router.push('/activate-license'); }}
                className="flex-1 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                Activate Now
              </button>
              <button
                onClick={() => { setShowTrialPopup(false); router.push('/sign-in'); }}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign In Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-sm mx-auto mt-12 flex items-center justify-center">
        <Loader className="h-6 w-6 animate-spin text-brand" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader, Shield, Key, ArrowRight, Mail } from 'lucide-react';

export default function ActivateLicensePage() {
  const [email, setEmail] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [step, setStep] = useState<'idle' | 'activating' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const formatKey = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const groups = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      groups.push(cleaned.slice(i, i + 4));
    }
    return groups.join('-');
  };

  const handleChange = (val: string) => {
    const formatted = formatKey(val);
    if (formatted.replace(/-/g, '').length <= 20) {
      setLicenseKey(formatted);
    }
  };

  const handleActivate = async () => {
    if (!email.trim()) { setError('Please enter your email address'); return; }
    const clean = licenseKey.replace(/-/g, '');
    if (clean.length < 16) { setError('Please enter a valid license key (16 characters)'); return; }

    setStep('activating');
    setError('');

    try {
      const res = await fetch('/api/license/activate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), licenseKey: licenseKey.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setStep('success');
      } else {
        setError(data.error || 'Activation failed');
        setStep('error');
      }
    } catch {
      setError('Network error. Please try again.');
      setStep('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {step === 'success' ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">License Activated! ✅</h2>
            <p className="text-sm text-gray-600 mb-4">{result?.message}</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-gray-500 mb-1">Plan</p>
              <p className="text-sm font-medium text-gray-800">{result?.plan}</p>
              <p className="text-xs text-gray-500 mt-2 mb-1">Expires</p>
              <p className="text-sm font-medium text-gray-800">{result?.expires_at ? new Date(result.expires_at).toLocaleDateString() : 'N/A'}</p>
            </div>
            <Link href="/sign-in" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
              Sign In <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-brand to-red-600 p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-3">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-lg font-bold text-white">Activate Your License</h1>
              <p className="text-sm text-white/80 mt-1">Enter the license key sent to your email</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  <Mail className="h-3 w-3 inline mr-1" /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  <Key className="h-3 w-3 inline mr-1" /> License Key
                </label>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={e => handleChange(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-gray-800 tracking-widest font-mono text-center focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  maxLength={29}
                />
                <p className="text-xs text-gray-400 mt-1">Enter the full key from your email (e.g. XXXX-XXXX-XXXX-XXXX or TRIAL-XXXXXXXX-XXXXXXXX)</p>
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}
              <button
                onClick={handleActivate}
                disabled={step === 'activating'}
                className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {step === 'activating' ? (
                  <><Loader className="h-4 w-4 animate-spin" /> Activating...</>
                ) : (
                  <><Key className="h-4 w-4" /> Activate License</>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-brand font-medium hover:underline">Sign In</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

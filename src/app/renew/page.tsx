'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Check, Loader, Smartphone, ArrowLeft, Key, Sparkles, Copy } from 'lucide-react';

const plans = [
  { name: 'Monthly', price: '1,500', period: 'month', popular: false },
  { name: 'Quarterly', price: '3,600', period: 'quarter', popular: true, saved: 'Save 20%' },
  { name: 'Yearly', price: '12,000', period: 'year', popular: false, saved: 'Save 33%' },
];

export default function RenewPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Monthly');
  const [step, setStep] = useState<'plans' | 'payment' | 'confirm' | 'success' | 'license'>('plans');
  const [transactionId, setTransactionId] = useState('');
  const [message, setMessage] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseError, setLicenseError] = useState('');
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/sign-in');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand animate-pulse" />
          <span className="text-sm text-[#000000]">Loading...</span>
        </div>
      </div>
    );
  }

  const MPESA_NUMBER = '+254 115 804 761';

  async function handleConfirmPayment() {
    setBusy(true);
    setMessage('');
    const plan = selectedPlan === 'Monthly' ? 'Basic' : selectedPlan === 'Quarterly' ? 'Standard' : 'Premium';
    const txId = `MPESA-${selectedPlan}-${Date.now()}`;
    setTransactionId(txId);
    try {
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, paymentMethod: 'mpesa', transactionId: txId }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/activation-success');
      } else {
        setMessage(data.error || 'Confirmation failed');
      }
    } catch {
      setMessage('Network error. Please try again.');
    }
    setBusy(false);
  }

  async function handleActivateLicense() {
    if (!licenseKey.trim()) {
      setLicenseError('Please enter your license key');
      return;
    }
    setActivating(true);
    setLicenseError('');
    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKey.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        // Redirect to dedicated success page that handles cookie refresh
        router.push('/activation-success');
      } else {
        setLicenseError(data.error || 'Failed to activate license');
      }
    } catch {
      setLicenseError('Network error. Please try again.');
    }
    setActivating(false);
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff]">
        <div className="text-center max-w-sm mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-[#000000] mb-2">Subscription Active!</h1>
          <p className="text-sm text-gray-600 mb-6">{selectedPlan} plan activated. You now have full access.</p>
          <Link
            href="/dashboard"
            className="inline-block bg-brand hover:bg-brand-hover text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#ffffff] px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
              <span className="text-white font-bold text-lg">BL</span>
            </div>
            <h1 className="text-lg font-bold text-brand">BiasharaLedger</h1>
          </div>
          <button onClick={signOut} className="text-xs text-[#000000] hover:text-brand transition-colors">Sign Out</button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm font-medium text-amber-800">Your subscription has expired</p>
          <p className="text-xs text-amber-700 mt-0.5">Activate a license key or choose a plan below to renew access.</p>
        </div>

        {/* License Key Activation Section */}
        {step === 'license' ? (
          <div className="bg-white border-2 border-brand/20 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                <Key className="h-4 w-4 text-brand" />
              </div>
              <h2 className="text-sm font-semibold text-[#000000]">Activate License Key</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Enter the license key you received from BiasharaLedger to activate your subscription.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#000000] mb-1">License Key</label>
              <input
                type="text"
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !activating) handleActivateLicense(); }}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="BL-2026-XXXXXXXX-XXXXXXXX"
                autoFocus
              />
              {licenseError && (
                <p className="text-xs text-red-500 mt-2">{licenseError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('plans'); setLicenseError(''); }}
                className="flex-1 border border-border text-[#000000] rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActivateLicense}
                disabled={activating || !licenseKey.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {activating ? <Loader className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                {activating ? 'Activating...' : 'Activate'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setStep('license')}
            className="w-full flex items-center justify-between bg-gradient-to-r from-brand/5 to-brand/10 border border-brand/20 rounded-xl p-4 mb-6 hover:border-brand/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center">
                <Key className="h-4 w-4 text-brand" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#000000]">Have a license key?</p>
                <p className="text-xs text-gray-500">Activate your subscription instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-brand text-xs font-medium group-hover:gap-2 transition-all">
              <Sparkles className="h-3.5 w-3.5" />
              Activate
            </div>
          </button>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or pay below</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {step === 'plans' && (
          <>
            <div className="grid gap-3 mb-6">
              {plans.map((plan) => (
                <button
                  key={plan.name}
                  onClick={() => { setSelectedPlan(plan.name); setStep('payment'); }}
                  className={`relative border-2 rounded-xl p-4 text-left transition-all ${
                    selectedPlan === plan.name
                      ? 'border-[#df1c1c] bg-brand/5'
                      : 'border-border hover:border-[#df1c1c]/50'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 right-4 bg-brand text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                      {plan.saved}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#000000]">{plan.name}</p>
                      <p className="text-xs text-gray-500">{plan.price}/{plan.period}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === plan.name ? 'border-[#df1c1c]' : 'border-gray-300'
                    }`}>
                      {selectedPlan === plan.name && <div className="w-2.5 h-2.5 rounded-full bg-brand" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-500 mt-4">
              Need help? <a href="mailto:support@biasharaledger.com" className="text-brand">Contact Support</a>
            </p>
          </>
        )}

        {step === 'payment' && (
          <>
            <button onClick={() => setStep('plans')} className="flex items-center gap-1 text-xs text-brand hover:text-[#000000] mb-4 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Change Plan
            </button>

            <div className="border border-border rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-500 mb-0.5">{selectedPlan} Plan</p>
              <p className="text-lg font-bold text-[#000000]">{plans.find(p => p.name === selectedPlan)?.price}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold text-green-800">Pay via M-Pesa Send Money</p>
              </div>
              <p className="text-xs text-green-700 mb-3">
                Send the exact amount to the M-Pesa number below using the <strong>Send Money</strong> (Lipa na M-Pesa) option on your M-Pesa menu.
              </p>
              <div className="bg-white rounded-lg border border-green-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">M-Pesa Number</p>
                  <p className="text-lg font-bold text-[#000000] tracking-wide">{MPESA_NUMBER}</p>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(MPESA_NUMBER); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {busy ? <Loader className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Please wait...' : 'I\'ve Sent the Payment'}
            </button>

            {message && (
              <p className="text-xs text-center mt-3 text-gray-600">{message}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Smartphone, Check, Loader, ArrowLeft, Sparkles, Copy } from 'lucide-react';

const MPESA_NUMBER = '+254 115 804 761';

const plans: Record<string, { price: number; label: string; features: string[] }> = {
  Basic: { price: 1500, label: 'Basic', features: ['Invoicing & Quotations', 'Expense Tracking', 'Customer Management'] },
  Standard: { price: 3000, label: 'Standard', features: ['Everything in Basic', 'HR & Payroll', 'Inventory Management', 'Advanced Reports'] },
  Premium: { price: 5000, label: 'Premium', features: ['Everything in Standard', 'All Financial Reports', 'Priority Support', 'API Access'] },
};

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const planName = searchParams.get('plan') || 'Basic';
  const plan = plans[planName] || plans.Basic;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'choose' | 'success'>('choose');

  async function handlePay() {
    setBusy(true);
    setError('');

    try {
      const confirmRes = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planName,
          paymentMethod: 'mpesa',
          transactionId: `MPESA-${planName}-${Date.now()}`,
        }),
      });

      if (confirmRes.ok) {
        setStep('success');
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        const err = await confirmRes.json();
        setError(err.error || 'Payment confirmation failed');
        setBusy(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-[#555555] hover:text-brand mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {step === 'success' ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-[#000000] mb-2">Payment Successful!</h2>
            <p className="text-[#555555] mb-2">
              Your {planName} plan has been activated. Redirecting to dashboard...
            </p>
            <p className="text-xs text-[#555555]">
              Transaction ID: {method?.toUpperCase()}-{Date.now()}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-border p-6 mb-6">
              <div className="flex items-center gap-2 text-brand text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                Complete your subscription
              </div>
              <h1 className="text-2xl font-bold text-[#000000] mb-1">
                {planName} Plan
              </h1>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-[#000000]">{plan.price.toLocaleString()}</span>
                <span className="text-sm text-[#555555]">/month</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#000000]">
                    <Check className="h-4 w-4 text-red-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <h2 className="text-lg font-semibold text-[#000000] mb-4">Pay via M-Pesa</h2>

            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold text-green-800">Send Money to M-Pesa</p>
              </div>
              <p className="text-xs text-green-700 mb-3">
                Use the <strong>Send Money</strong> (Lipa na M-Pesa) option on your M-Pesa menu to send the amount to:
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 py-3.5 text-base font-semibold transition-colors disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  I've Sent {plan.price.toLocaleString()}
                </>
              )}
            </button>

            <p className="text-xs text-[#555555] text-center mt-4">
              Send the exact amount via M-Pesa Send Money to <strong>{MPESA_NUMBER}</strong>. Click the button above after sending.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center"><Loader className="h-6 w-6 animate-spin text-brand" /></div>}>
      <PaymentContent />
    </Suspense>
  );
}

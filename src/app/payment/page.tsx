'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { CreditCard, Smartphone, Globe, Building2, Check, Loader, ArrowLeft, Sparkles } from 'lucide-react';

const plans: Record<string, { price: number; label: string; features: string[] }> = {
  Basic: { price: 1500, label: 'Basic', features: ['Invoicing & Quotations', 'Expense Tracking', 'Customer Management'] },
  Standard: { price: 3000, label: 'Standard', features: ['Everything in Basic', 'HR & Payroll', 'Inventory Management', 'Advanced Reports'] },
  Premium: { price: 5000, label: 'Premium', features: ['Everything in Standard', 'All Financial Reports', 'Priority Support', 'API Access'] },
};

type PaymentMethod = 'card' | 'paypal' | 'mpesa_till' | 'mpesa_paybill';

const methods: { id: PaymentMethod; label: string; icon: typeof CreditCard; desc: string }[] = [
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Pay securely with your card' },
  { id: 'paypal', label: 'PayPal', icon: Globe, desc: 'Pay with your PayPal account' },
  { id: 'mpesa_till', label: 'M-Pesa Till Number', icon: Smartphone, desc: 'Pay via M-Pesa till number' },
  { id: 'mpesa_paybill', label: 'M-Pesa Paybill', icon: Building2, desc: 'Pay via M-Pesa business number' },
];

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const planName = searchParams.get('plan') || 'Basic';
  const plan = plans[planName] || plans.Basic;

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'choose' | 'processing' | 'success'>('choose');

  async function handlePay() {
    if (!method) return;
    setBusy(true);
    setError('');

    try {
      let apiRoute = '';
      let paymentMethod = '';

      switch (method) {
        case 'card':
          apiRoute = '/api/payments/stripe';
          paymentMethod = 'card';
          break;
        case 'paypal':
          apiRoute = '/api/payments/paypal';
          paymentMethod = 'paypal';
          break;
        case 'mpesa_till':
          apiRoute = '/api/payments/mpesa';
          paymentMethod = 'mpesa_till';
          break;
        case 'mpesa_paybill':
          apiRoute = '/api/payments/mpesa';
          paymentMethod = 'mpesa_paybill';
          break;
      }

      const payRes = await fetch(apiRoute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName }),
      });

      if (!payRes.ok) {
        const err = await payRes.json();
        setError(err.error || 'Payment initiation failed');
        setBusy(false);
        return;
      }

      setStep('processing');

      const confirmRes = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName, paymentMethod, transactionId: `${method.toUpperCase()}-${Date.now()}` }),
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
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
                <span className="text-3xl font-bold text-[#000000]">KES {plan.price.toLocaleString()}</span>
                <span className="text-sm text-[#555555]">/month</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#000000]">
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <h2 className="text-lg font-semibold text-[#000000] mb-4">Choose payment method</h2>

            <div className="space-y-3 mb-6">
              {methods.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      method === m.id
                        ? 'border-brand bg-brand/5'
                        : 'border-border bg-white hover:border-brand/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      method === m.id ? 'bg-brand text-white' : 'bg-brand/10 text-brand'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[#000000]">{m.label}</div>
                      <div className="text-xs text-[#555555]">{m.desc}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      method === m.id ? 'border-brand' : 'border-border'
                    }`}>
                      {method === m.id && <div className="w-2.5 h-2.5 rounded-full bg-brand" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={!method || busy}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white rounded-xl px-6 py-3.5 text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Pay KES {plan.price.toLocaleString()}
                </>
              )}
            </button>

            <p className="text-xs text-[#555555] text-center mt-4">
              Your payment is secure and encrypted. You won't be charged until your 14-day trial ends.
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

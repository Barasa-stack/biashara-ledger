'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: '5',
    period: '/month',
    features: ['Double-entry bookkeeping', 'Invoicing & quotations', 'Profit & Loss report', 'Balance Sheet', 'Trial Balance', 'Expense tracking'],
  },
  {
    name: 'Standard',
    price: '10',
    period: '/month',
    popular: true,
    features: ['Everything in Basic', 'HR & Payroll management', 'General Ledger', 'Inventory management', 'Multi-user access (up to 5)', 'Cash flow statements'],
  },
  {
    name: 'Premium',
    price: '15',
    period: '/month',
    features: ['Unlimited users', 'Everything in Standard', 'API access', 'Multi-branch support', 'Budget vs actual reports', "Owner's equity statements"],
  },
];

export default function SelectPackagePage() {
  const router = useRouter();
  const { user } = useAuth();

  function handleSelect(packageName: string) {
    router.push(`/payment?plan=${packageName}`);
  }

  function handleSkip() {
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            14-day free trial — no credit card required
          </div>
          <h1 className="text-3xl font-bold text-[#000000] mb-3">
            Choose your plan{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-[#555555] max-w-lg mx-auto">
            Start with a 14-day free trial on any plan. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-xl border-2 p-6 flex flex-col transition-shadow hover:shadow-lg ${
                plan.popular ? 'border-brand shadow-md' : 'border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#000000] mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#000000]">${plan.price}</span>
                  <span className="text-sm text-[#555555]">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#000000]">
                    <Check className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelect(plan.name)}
                className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  plan.popular
                    ? 'bg-brand hover:bg-brand-hover text-white'
                    : 'bg-white text-brand border border-brand hover:bg-brand/5'
                }`}
              >
                Choose {plan.name}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleSkip}
            className="text-sm text-[#555555] hover:text-brand transition-colors underline underline-offset-2"
          >
            Continue with trial for now
          </button>
        </div>
      </div>
    </div>
  );
}

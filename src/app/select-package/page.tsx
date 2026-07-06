'use client';

export const dynamic = 'force-dynamic';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';

const ALL_FEATURES = [
  'Dashboard', 'Customers & Suppliers', 'Sales', 'Purchases',
  'Other Income / Expenses', 'Projects', 'Developer Tools',
  'Financial Reports', 'Notifications', 'Subscription Management',
  'Company Settings', 'HR & Payroll Expenses', 'Capital Transactions',
  'Exchange Rates', 'Chart of Accounts', 'Fixed Assets',
  'Inventory Management', 'Budgets', 'Journal Entries', 'Banking',
  'Automation', 'CRM Pipeline',
];

export default function SelectPackagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [yearly, setYearly] = useState(false);

  function handleSelect() {
    router.push(`/payment?plan=Premium&billing=${yearly ? 'yearly' : 'monthly'}`);
  }

  function handleSkip() {
    router.push('/dashboard');
  }

  const displayPrice = yearly ? 'KES 5,000' : 'KES 500';
  const displayPeriod = yearly ? '/year' : '/month';

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            3-day free trial — no credit card required
          </div>
          <h1 className="text-3xl font-bold text-[#000000] mb-3">
            Your Plan{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-[#555555] max-w-lg mx-auto">
            All features included. Start your free trial today.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className={`text-sm font-medium ${!yearly ? 'text-[#000000]' : 'text-[#555555]'}`}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${yearly ? 'bg-brand' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${yearly ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-medium ${yearly ? 'text-[#000000]' : 'text-[#555555]'}`}>
            Yearly
            <span className="ml-1 text-xs text-brand font-semibold">Save ~17%</span>
          </span>
        </div>

        <div className="bg-white rounded-xl border-2 border-brand shadow-md p-8 mb-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-[#000000]">BiasharaLedger — All Features</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[#000000]">{displayPrice}</span>
              <span className="text-sm text-[#555555]">{displayPeriod}</span>
            </div>
          </div>
          <p className="text-sm text-[#555555] mb-6">The complete platform — no feature restrictions.</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-8">
            {ALL_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm text-[#000000]">
                <Check className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <button
            onClick={handleSelect}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white rounded-lg px-4 py-3 text-base font-semibold transition-colors"
          >
            Continue with {displayPrice}{displayPeriod}
            <ArrowRight className="h-4 w-4" />
          </button>
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

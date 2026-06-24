'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';

const monthly = [
  {
    name: 'Basic',
    price: '1,500',
    annualPrice: '15,000',
    period: 'month',
    desc: 'Essential accounting for solopreneurs and small shops.',
    features: [
      'Double-entry bookkeeping',
      'Invoicing & quotations',
      'Profit & Loss report',
      'Balance Sheet',
      'Trial Balance',
      'Expense tracking',
      'Customer & supplier management',
      'Email support',
    ],
  },
  {
    name: 'Standard',
    price: '3,000',
    annualPrice: '30,000',
    period: 'month',
    desc: 'Growing businesses with teams and payroll needs.',
    features: [
      'Everything in Basic',
      'HR & Payroll management',
      'General Ledger',
      'Inventory management',
      'Multi-user access (up to 5)',
      'Cash flow statements',
      'Receivables & payables aging',
      'Priority email & chat support',
    ],
    popular: true,
  },
  {
    name: 'Premium',
    price: '5,000',
    annualPrice: '50,000',
    period: 'month',
    desc: 'Full access for established businesses.',
    features: [
      'Everything in Standard',
      'Unlimited users',
      'API access',
      'Multi-branch support',
      'Budget vs actual reports',
      "Owner's equity statements",
      'Tax reports',
      'Audit trail',
      'Dedicated account manager',
      'Phone & priority support',
    ],
  },
];

const faqs = [
  { q: 'Can I switch plans anytime?', a: 'Yes. You can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
  { q: 'Is there a free trial?', a: 'Yes. All plans come with a 14-day free trial. No credit card required.' },
  { q: 'What payment methods do you accept?', a: 'We accept M-Pesa and international credit/debit cards.' },
  { q: 'Can I cancel my subscription?', a: 'Yes. You can cancel anytime. Your data remains accessible for the remainder of the billing period.' },
  { q: 'Is my data secure?', a: 'Absolutely. All data is encrypted at rest using AES-256-GCM. We use secure PostgreSQL databases with regular backups.' },
  { q: 'Do you offer discounts for annual billing?', a: 'Yes. Annual plans save you up to 33% compared to monthly billing.' },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span className="text-xs font-medium text-brand">Simple Pricing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#000000] leading-tight mb-6">
            Plans for Every
            <br />
            <span className="text-brand">Business Size</span>
          </h1>
          <p className="text-lg text-[#000000]/60 max-w-2xl mx-auto mb-8">
            Start free and upgrade as you grow. All prices in Kenyan Shillings.
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!annual ? 'text-[#000000]' : 'text-[#000000]/50'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-brand' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${annual ? 'translate-x-6' : ''}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-[#000000]' : 'text-[#000000]/50'}`}>
              Annual <span className="text-green-600 font-semibold">Save 17%</span>
            </span>
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {monthly.map((plan) => {
              const displayPrice = annual ? plan.annualPrice : plan.price;
              const periodLabel = annual ? 'year' : 'month';
              return (
                <div key={plan.name} className={`relative bg-white border-2 rounded-xl p-6 ${plan.popular ? 'border-brand md:-mt-4' : 'border-border'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                      Most Popular
                    </div>
                  )}
                  {annual && (
                    <div className="absolute -top-3 right-3 bg-green-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      Save 17%
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-[#000000]">{plan.name}</h3>
                  <p className="text-sm text-[#000000]/60 mt-1">{plan.desc}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-[#000000]">KES {displayPrice}</span>
                    <span className="text-sm text-[#000000]/60 ml-1">/{periodLabel}</span>
                    {annual && (
                      <p className="text-xs text-green-600 mt-1">KES {plan.price}/month billed annually</p>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-[#000000]">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/sign-up"
                    className={`mt-6 w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${plan.popular ? 'bg-brand hover:bg-brand-hover text-white' : 'bg-surface hover:bg-brand/10 text-[#000000] border border-border'}`}
                  >
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#000000] text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="border border-border rounded-xl overflow-hidden">
                <summary className="px-5 py-4 text-sm font-semibold text-[#000000] cursor-pointer hover:bg-surface transition-colors">
                  {faq.q}
                </summary>
                <div className="px-5 py-4 text-sm text-[#000000]/60 border-t border-border">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#000000] mb-4">Still have questions?</h2>
          <p className="text-lg text-[#000000]/60 mb-8">Our team is here to help you choose the right plan.</p>
          <Link
            href="/sign-up"
            className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-lg text-base font-semibold transition-colors inline-flex items-center gap-2"
          >
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Check, ArrowRight, HelpCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const PLANS = [
  {
    name: 'Starter',
    price: '0',
    period: '/month',
    desc: 'Perfect for small businesses just getting started.',
    features: ['Up to 50 transactions/month', 'Basic inventory management (up to 100 items)', 'Single user', 'Sales recording', 'Customer management', 'Email support', 'Mobile access', 'Dashboard & reports'],
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '15',
    period: '/month',
    desc: 'Best for growing businesses with increasing needs.',
    features: ['Unlimited transactions', 'Advanced inventory management (up to 1,000 items)', 'Up to 5 users', 'Sales & purchasing', 'Accounts receivable/payable', 'Multi-currency support', 'Advanced reporting', 'Priority email & chat support', 'Data export', 'API access', 'Custom invoice templates', 'Stock alerts'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '50',
    period: '/month',
    desc: 'For large organizations with complex requirements.',
    features: ['Everything in Professional', 'Unlimited inventory items', 'Unlimited users', 'Advanced permissions & roles', 'Dedicated account manager', 'Custom integrations', 'On-premise deployment option', 'SLA guarantee', 'White-label option', 'Custom reporting', 'Bulk operations', 'Audit logs', 'Priority phone support', 'Early access to new features'],
    highlighted: false,
  },
];

const FAQS = [
  { q: 'Can I upgrade or downgrade my plan at any time?', a: 'Yes, you can change your plan at any time. If you upgrade, you pay the prorated difference. If you downgrade, the change takes effect at the next billing cycle.' },
  { q: 'Is there a free trial?', a: 'Yes, all plans come with a 14-day free trial. All features are included during the trial period.' },
  { q: 'Do you offer discounts for annual billing?', a: 'Yes, choose annual billing and get 2 months free — pay for 10 months, get 12.' },
  { q: 'What payment methods do you accept?', a: 'We accept M-Pesa (preferred), credit/debit cards, and bank transfers for annual plans.' },
  { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel anytime from your account settings. You will continue to have access until the end of your billing period.' },
  { q: 'Do you offer custom plans?', a: 'Yes, for organizations with specific needs, we offer custom pricing. Contact our sales team for a quote.' },
];

export default function PricingPage() {
  const searchParams = useSearchParams();
  const billing = searchParams.get('billing') || 'monthly';
  const isAnnual = billing === 'annual';

  const getPrice = (monthlyPrice: string | number, annualPrice?: number) => {
    const base = Number(monthlyPrice);
    if (base === 0) return { amount: '0', period: '/month' };
    if (isAnnual && annualPrice) {
      return { amount: String(Math.round((annualPrice / 12) * 10) / 10), period: `/mo (annual)` };
    }
    return { amount: String(base), period: '/month' };
  };

  return (
    <div>
      <section className="py-20 bg-gradient-to-b from-brand/5 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-4"><span className="text-xs font-semibold text-brand">Pricing</span></div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Simple, Transparent Pricing</h1>
            <p className="text-lg text-gray-600">Choose the plan that fits your business. All plans include a 14-day free trial.</p>
          </div>
          <div className="flex items-center justify-center gap-4 mb-10">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
            <Link
              href={isAnnual ? '/pricing' : '/pricing?billing=annual'}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAnnual ? 'bg-brand' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`} />
            </Link>
            <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Annual <span className="text-brand text-xs font-semibold">Save 20%</span></span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.map((plan) => {
              const p = getPrice(plan.price);
              return (
                <div key={plan.name} className={`relative rounded-2xl p-8 ${plan.highlighted ? 'bg-white ring-2 ring-brand shadow-xl shadow-brand/10 scale-105' : 'bg-white border border-gray-200'}`}>
                  {plan.highlighted && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</div>}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">${p.amount}</span>
                    <span className="text-gray-500 text-sm">{p.period}</span>
                  </div>
                  <Link
                    href="/sign-up"
                    className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-center block transition-all ${plan.highlighted ? 'bg-brand text-white hover:bg-brand-hover shadow-md' : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200'}`}
                  >
                    Start Free Trial
                  </Link>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600"><Check className="h-4 w-4 text-brand mt-0.5 shrink-0" /><span>{f}</span></li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-gray-600">Everything you need to know about our pricing and plans.</p>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                  {faq.q}
                  <HelpCircle className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

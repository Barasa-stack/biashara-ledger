'use client';

import Link from 'next/link';
import { ArrowRight, Check, HelpCircle } from 'lucide-react';
import PageHero from '@/components/PageHero';
import type { CityImage } from '@/components/PageHero';
import { useEffect, useState } from 'react';
import { pricingPlans } from '@/lib/marketing-data';
import { useAuth } from '@/lib/auth-context';

const pricingImages: CityImage[] = [
  { url: '/images/hero/hero-skyscraper-glass-modern.jpg', label: 'Simple Pricing' },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const displayPlans = pricingPlans.filter(p => p.name !== 'Custom');
  const customPlan = pricingPlans.find(p => p.name === 'Custom');

  return (
    <div>
      <style jsx>{`
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-on-scroll.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .stagger-children > * {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .stagger-children.visible > *:nth-child(1) { transition-delay: 0.1s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(2) { transition-delay: 0.2s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(3) { transition-delay: 0.3s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(4) { transition-delay: 0.4s; opacity: 1; transform: translateY(0); }
        
        .pricing-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: white;
          border: 1px solid #e5e7eb;
        }
        
        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }
        
        .pricing-card.popular {
          border: 2px solid #df1c1c;
          position: relative;
        }
        
        .pricing-card.popular::before {
          content: 'Most Popular';
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #df1c1c, #ff6b6b);
          color: white;
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          z-index: 10;
        }
        
        .gradient-text-shine {
          background: linear-gradient(90deg, #df1c1c, #ff6b6b, #feca57, #df1c1c);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shine 4s ease-in-out infinite;
        }
        
        @keyframes gradient-shine {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .floating-text {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(10px); }
          100% { transform: translateY(0px); }
        }
        
        .cta-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .cta-button:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
        }
        
        .cta-button:active {
          transform: scale(0.95);
        }
      `}</style>

      <PageHero
        images={pricingImages}
        title={
          <div className="floating-text">
            Simple
            <br />
            <span className="gradient-text-shine">Pricing</span>
            <br />
            for Every Business
          </div>
        }
        subtitle="Choose the plan that fits your business needs. All plans include a 3-day free trial."
        badge="Pricing"
        badgeWithoutTrust
      />

      {/* ─── BILLING TOGGLE ─── */}
      <div className="flex items-center justify-center gap-3 pt-12 bg-gray-50">
        <span className={`text-sm font-medium ${!yearly ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
        <button
          onClick={() => setYearly(!yearly)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${yearly ? 'bg-brand' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${yearly ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
        <span className={`text-sm font-medium ${yearly ? 'text-gray-900' : 'text-gray-400'}`}>
          Yearly
          <span className="ml-1 text-xs text-brand font-semibold">Save ~17%</span>
        </span>
      </div>

      {/* ─── PRICING CARDS ─── */}
      <section className="py-12 bg-gray-50" aria-labelledby="pricing-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children animate-on-scroll items-start">
            {displayPlans.map((plan) => {
              const displayPrice = yearly ? plan.priceYearly : plan.price;
              const periodLabel = yearly ? '/year' : '/month';
              return (
                <div key={plan.name} className={`pricing-card rounded-xl p-6 flex flex-col ${plan.popular ? 'popular' : ''}`}>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 min-h-[2.5rem]">{plan.desc}</p>
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-gray-900">KES {displayPrice}</span>
                    <span className="text-gray-500 text-sm">{periodLabel}</span>
                  </div>
                  {yearly && plan.priceYearly && (
                    <p className="text-xs text-brand font-medium mb-4">KES {plan.price}/month when billed yearly</p>
                  )}
                  {!yearly && <div className="mb-4" />}
                  <Link
                    href={plan.name === 'Custom' ? '/contact' : user ? '/dashboard/subscription' : `/sign-up?plan=${plan.name}`}
                    className={`block text-center px-6 py-3 rounded-xl text-sm font-semibold transition-all mb-6 ${
                      plan.popular
                        ? 'bg-brand hover:bg-brand-hover text-white hover:shadow-lg hover:shadow-brand/25'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                  <ul className="space-y-2.5 border-t border-gray-100 pt-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-brand flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {/* ─── CUSTOM PLAN ─── */}
            {customPlan && (
              <div className="pricing-card rounded-xl p-6 flex flex-col border-dashed border-2 border-brand/30 bg-brand/5">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{customPlan.name}</h3>
                <p className="text-sm text-gray-500 mb-4 min-h-[2.5rem]">{customPlan.desc}</p>
                <div className="mb-1">
                  <span className="text-3xl font-bold text-gray-900">Custom</span>
                </div>
                <div className="mb-4" />
                <Link
                  href="/contact"
                  className="block text-center px-6 py-3 rounded-xl text-sm font-semibold transition-all mb-6 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30"
                >
                  Contact Us
                </Link>
                <ul className="space-y-2.5 border-t border-gray-100 pt-6 flex-1">
                  {customPlan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-brand flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 text-center bg-white" aria-labelledby="cta-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight animate-on-scroll">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-500 mb-8 animate-on-scroll">
            3-day free trial. No credit card required. All features included.
          </p>
          <Link
            href={user ? '/dashboard' : '/sign-up'}
            className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:shadow-lg hover:shadow-brand/25 inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 cta-button"
          >
            {user ? 'Go to Dashboard' : 'Start Free Trial'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

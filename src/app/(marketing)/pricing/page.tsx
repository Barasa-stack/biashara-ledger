'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import PageHero from '@/components/PageHero';
import type { CityImage } from '@/components/PageHero';
import { useEffect } from 'react';

const pricingImages: CityImage[] = [
  { url: '/images/hero/hero-skyscraper-glass-modern.jpg', label: 'Simple Pricing' },
];

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Perfect for small businesses just getting started.',
    features: [
      'Up to 5 users',
      'Basic inventory management',
      'Sales & invoicing',
      'Email support',
      '1 GB storage',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$79',
    period: '/month',
    description: 'For growing businesses that need more power.',
    features: [
      'Up to 25 users',
      'Advanced inventory management',
      'Sales & invoicing',
      'Accounting & reporting',
      'Priority support',
      '10 GB storage',
      'API access',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with complex needs.',
    features: [
      'Unlimited users',
      'Full platform access',
      'Custom integrations',
      'Dedicated support',
      'Unlimited storage',
      'Advanced security',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function PricingPage() {
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
        
        .pricing-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          background: white;
          border: 1px solid #e5e7eb;
        }
        
        .pricing-card:hover {
          transform: translateY(10px);
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
        subtitle="Choose the plan that fits your business needs. All plans include a 14-day free trial."
        badge="Pricing"
        badgeWithoutTrust
      />

      {/* ─── PRICING PLANS ─── */}
      <section className="py-20 bg-gray-50" aria-labelledby="pricing-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children animate-on-scroll">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`pricing-card rounded-xl p-8 ${plan.popular ? 'popular' : ''}`}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.id === 'enterprise' ? '/contact' : '/sign-up'}
                  className={`w-full text-center px-6 py-3 rounded-xl font-semibold transition-all inline-block ${
                    plan.popular
                      ? 'bg-brand hover:bg-brand-hover text-white hover:shadow-lg hover:shadow-brand/25'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 text-center bg-white" aria-labelledby="cta-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight animate-on-scroll">
            Not sure which plan is right for you?
          </h2>
          <p className="text-lg text-gray-500 mb-8 animate-on-scroll">
            Contact our sales team for a personalized consultation.
          </p>
          <Link
            href="/contact"
            className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:shadow-lg hover:shadow-brand/25 inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 cta-button"
          >
            Contact Sales <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

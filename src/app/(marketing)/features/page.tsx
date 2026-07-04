'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, Users, BarChart3, Clock, Smartphone } from 'lucide-react';
import PageHero from '@/components/PageHero';
import type { CityImage } from '@/components/PageHero';
import { useEffect } from 'react';

const featuresImages: CityImage[] = [
  { url: '/images/hero/hero-skyscraper-glass-modern.jpg', label: 'Modern Features' },
];

const FEATURES = [
  {
    id: 'real-time',
    icon: Zap,
    title: 'Real-time Analytics',
    desc: 'Get instant insights into your business performance with live dashboards and reports.',
  },
  {
    id: 'secure',
    icon: Shield,
    title: 'Enterprise Security',
    desc: 'Bank-grade encryption and security protocols to keep your data safe.',
  },
  {
    id: 'collaboration',
    icon: Users,
    title: 'Team Collaboration',
    desc: 'Work together seamlessly with real-time updates and team permissions.',
  },
  {
    id: 'reporting',
    icon: BarChart3,
    title: 'Advanced Reporting',
    desc: 'Custom reports and analytics to understand your business better.',
  },
  {
    id: 'automation',
    icon: Clock,
    title: 'Smart Automation',
    desc: 'Automate repetitive tasks and focus on what matters most.',
  },
  {
    id: 'mobile',
    icon: Smartphone,
    title: 'Mobile First',
    desc: 'Access your business from anywhere with our mobile-optimized platform.',
  },
];

export default function FeaturesPage() {
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
        .stagger-children.visible > *:nth-child(4) { transition-delay: 0.4s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(5) { transition-delay: 0.5s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(6) { transition-delay: 0.6s; opacity: 1; transform: translateY(0); }
        
        .feature-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          background: white;
          border: 1px solid #e5e7eb;
        }
        
        .feature-card:hover {
          transform: translateY(10px) scale(1.02);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          border-color: #your-brand-color;
        }
        
        .feature-card:hover .feature-icon {
          transform: scale(1.2) rotate(10deg);
        }
        
        .feature-icon {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .gradient-text-shine {
          background: linear-gradient(90deg, #your-brand-color, #ff6b6b, #feca57, #your-brand-color);
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
        images={featuresImages}
        title={
          <div className="floating-text">
            Powerful
            <br />
            <span className="gradient-text-shine">Features</span>
            <br />
            for Your Business
          </div>
        }
        subtitle="Everything you need to manage, grow, and scale your business — all in one powerful platform."
        badge="Features"
        badgeWithoutTrust
      />

      {/* ─── FEATURES GRID ─── */}
      <section className="py-20 bg-gray-50" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-4 animate-on-scroll">
              <span className="text-xs font-semibold text-brand">Why Choose Us</span>
            </div>
            <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight animate-on-scroll">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-on-scroll">
              Powerful features designed to help you manage your business more efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children animate-on-scroll">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  className="feature-card rounded-xl p-6"
                >
                  <div className="feature-icon bg-brand/10 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-brand" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 text-center bg-gradient-to-b from-gray-50 to-white" aria-labelledby="cta-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight animate-on-scroll">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-500 mb-8 animate-on-scroll">
            Join thousands of businesses already using BiasharaLedger.
          </p>
          <Link
            href="/sign-up"
            className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:shadow-lg hover:shadow-brand/25 inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 cta-button"
            aria-label="Start your free trial"
          >
            Start Free Trial <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

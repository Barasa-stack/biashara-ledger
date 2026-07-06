'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import PageHero from '@/components/PageHero';
import type { CityImage } from '@/components/PageHero';

const aboutImages: CityImage[] = [
  { url: '/images/hero/hero-skyscraper-glass-modern.jpg', label: 'Modern Glass Architecture' },
];

const VALUES = [
  { id: 'local-first', title: 'Local First', desc: 'Built for businesses everywhere. Local compliance, multi-currency, and payment methods are first-class features.' },
  { id: 'security-trust', title: 'Security & Trust', desc: 'Your data is protected with enterprise-grade encryption and strict access controls.' },
  { id: 'customer-obsession', title: 'Customer Obsession', desc: 'We answer support queries within hours. Our team includes accountants who understand your challenges.' },
  { id: 'continuous-improvement', title: 'Continuous Improvement', desc: 'We ship updates every two weeks. Our roadmap is driven by what businesses actually need.' },
] as const;

export default function AboutPage() {
  useEffect(() => {
    // Intersection Observer for scroll animations
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

    // Observe all elements with animate-on-scroll class
    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <style jsx>{`
        /* Base animation styles */
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-on-scroll.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* Stagger children animations */
        .stagger-children > * {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .stagger-children.visible > *:nth-child(1) { 
          transition-delay: 0.1s; 
          opacity: 1; 
          transform: translateY(0); 
        }
        .stagger-children.visible > *:nth-child(2) { 
          transition-delay: 0.2s; 
          opacity: 1; 
          transform: translateY(0); 
        }
        .stagger-children.visible > *:nth-child(3) { 
          transition-delay: 0.3s; 
          opacity: 1; 
          transform: translateY(0); 
        }
        .stagger-children.visible > *:nth-child(4) { 
          transition-delay: 0.4s; 
          opacity: 1; 
          transform: translateY(0); 
        }
        
        /* Value card hover effects */
        .value-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        
        .value-card:hover {
          transform: translateY(-8px) scale(1.03);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          border-color: #df1c1c;
        }
        
        /* CTA button animations */
        .cta-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .cta-button:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
        }
        
        .cta-button:active {
          transform: scale(0.95);
        }
        
        /* Floating animation for the hero text */
        .floating-text {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(10px); }
          100% { transform: translateY(0px); }
        }
        
        /* Gradient shine effect */
        .shine-effect {
          background: linear-gradient(90deg, 
            transparent 0%,
            rgba(255,255,255,0.3) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shine 3s ease-in-out infinite;
        }
        
        @keyframes shine {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <PageHero
        images={aboutImages}
        title={
          <div className="floating-text">
            Building the Future of
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-red-300 to-orange-200">
              Business Management
            </span>
          </div>
        }
        subtitle="We built BiasharaLedger because businesses deserve tools that understand their market — tax compliance, payment reconciliation, and the real way business works across the globe."
        badge="About Us"
        badgeWithoutTrust
      />

      {/* ─── OUR STORY ─── */}
      <section className="py-20 bg-surface" aria-labelledby="story-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-4 animate-on-scroll">
              <span className="text-xs font-semibold text-brand">Our Story</span>
            </div>
            <h2 id="story-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 tracking-tight animate-on-scroll">
              By Entrepreneurs, for Entrepreneurs
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed stagger-children animate-on-scroll">
              <p>
                BiasharaLedger was founded by a team of software engineers and accountants who saw firsthand 
                how businesses struggled with expensive, foreign tools that didn't understand the local market.
              </p>
              <p>
                Most business software is built for Western markets — it doesn't handle local tax compliance, 
                mobile money reconciliation, or the way business actually works here. Owners end up juggling 
                spreadsheets, paper receipts, and manual bank reconciliations.
              </p>
              <p>
                We set out to build one platform that does it all — inventory management, sales, accounting, 
                payroll, and reporting — designed for businesses everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── OUR VALUES ─── */}
      <section className="py-20 bg-white" aria-labelledby="values-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-4 animate-on-scroll">
              <span className="text-xs font-semibold text-brand">Our values</span>
            </div>
            <h2 id="values-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 tracking-tight animate-on-scroll">
              The Principles That Guide Us
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children animate-on-scroll">
              {VALUES.map((v) => (
                <div 
                  key={v.id} 
                  className="bg-gray-50 rounded-xl p-5 border border-gray-100 value-card"
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{v.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 text-center bg-gradient-to-b from-gray-50 to-white" aria-labelledby="cta-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight animate-on-scroll">
            Ready to grow your business?
          </h2>
          <p className="text-lg text-gray-500 mb-8 animate-on-scroll">
            Join thousands of businesses using BiasharaLedger to manage their operations.
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

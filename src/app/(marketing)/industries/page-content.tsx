'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag, Building2, Stethoscope, GraduationCap, Plane, Store } from 'lucide-react';
import { useEffect } from 'react';
import PageHero from '@/components/PageHero';
import type { CityImage } from '@/components/PageHero';

const industriesImages: CityImage[] = [
  { url: '/images/hero/hero-skyscraper-glass-modern.jpg', label: 'Industries' },
];

const INDUSTRIES = [
  { id: 'retail', icon: Store, title: 'Retail & Wholesale', desc: 'Manage inventory, sales, and customer relationships across multiple locations with real-time synchronization.' },
  { id: 'manufacturing', icon: Building2, title: 'Manufacturing', desc: 'Track raw materials, production orders, and finished goods with complete visibility into your supply chain.' },
  { id: 'healthcare', icon: Stethoscope, title: 'Healthcare', desc: 'Manage patient records, appointments, billing, and inventory for clinics, pharmacies, and medical practices.' },
  { id: 'education', icon: GraduationCap, title: 'Education', desc: 'Handle student records, fee management, attendance tracking, and academic reporting for schools and colleges.' },
  { id: 'hospitality', icon: Plane, title: 'Hospitality & Tourism', desc: 'Manage bookings, reservations, guest profiles, and billing for hotels, restaurants, and travel agencies.' },
  { id: 'ecommerce', icon: ShoppingBag, title: 'E-commerce', desc: 'Integrate with your online store to manage orders, inventory, and customer data across all sales channels.' },
];

export default function IndustriesPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add('visible'); }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.animate-on-scroll').forEach((el) => { observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <style jsx>{`
        .animate-on-scroll { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-on-scroll.visible { opacity: 1; transform: translateY(0); }
        .stagger-children > * { opacity: 0; transform: translateY(20px); transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .stagger-children.visible > *:nth-child(1) { transition-delay: 0.1s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(2) { transition-delay: 0.2s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(3) { transition-delay: 0.3s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(4) { transition-delay: 0.4s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(5) { transition-delay: 0.5s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(6) { transition-delay: 0.6s; opacity: 1; transform: translateY(0); }
        .industry-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .industry-card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); border-color: #df1c1c; }
        .cta-button { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: inline-flex; align-items: center; gap: 0.5rem; }
        .cta-button:hover { transform: scale(1.05); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); }
        .cta-button:active { transform: scale(0.95); }
        .floating-text { animation: float 3s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(10px); } 100% { transform: translateY(0px); } }
        .gradient-text-shine { background: linear-gradient(90deg, #df1c1c, #ff6b6b, #feca57, #df1c1c); background-size: 300% 100%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: gradient-shine 4s ease-in-out infinite; }
        @keyframes gradient-shine { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>
      <PageHero images={industriesImages} title={<div className="floating-text">Solutions for Every<br /><span className="gradient-text-shine">Industry</span></div>} subtitle="BiasharaLedger adapts to your industry with specialized features and workflows designed for your specific needs." badge="Industries" badgeWithoutTrust />
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-4 animate-on-scroll"><span className="text-xs font-semibold text-brand">Industries We Serve</span></div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight animate-on-scroll">Built for Your Industry</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-on-scroll">No matter your industry, BiasharaLedger has the tools you need to streamline operations and drive growth.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children animate-on-scroll">
            {INDUSTRIES.map((industry) => {
              const Icon = industry.icon;
              return (
                <div key={industry.id} className="bg-white border border-gray-200 rounded-xl p-6 industry-card">
                  <div className="bg-brand/10 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4"><Icon className="h-6 w-6 text-brand" /></div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{industry.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{industry.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="py-20 text-center bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight animate-on-scroll">Not Sure If We Fit Your Industry?</h2>
          <p className="text-lg text-gray-500 mb-8 animate-on-scroll">Contact us and we'll show you how BiasharaLedger can work for your specific business.</p>
          <Link href="/contact" className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:shadow-lg hover:shadow-brand/25 inline-flex items-center gap-2 cta-button">Contact Us <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
}

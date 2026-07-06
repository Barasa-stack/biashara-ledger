'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHero from '@/components/PageHero';
import type { CityImage } from '@/components/PageHero';

const industryImages: CityImage[] = [
  { url: '/images/backgrounds/industries/bg.jpg', label: 'Modern Skyline · Development' },
];

const industries = [
  { name: 'Retail Shops', desc: 'POS, inventory, customer loyalty, and sales analytics.' },
  { name: 'Supermarkets', desc: 'Multi-department inventory, barcode scanning, supplier management.' },
  { name: 'Hardware Stores', desc: 'Stock tracking, supplier orders, job costing, quotations.' },
  { name: 'Pharmacies', desc: 'Expiry tracking, prescription management, supplier orders.' },
  { name: 'Restaurants', desc: 'Menu management, table orders, inventory, staff scheduling.' },
  { name: 'Wholesalers', desc: 'Bulk pricing, volume discounts, delivery management.' },
  { name: 'Manufacturers', desc: 'BOM, production costing, raw material tracking.' },
  { name: 'Bookshops', desc: 'Stock management, supplier orders, student accounts.' },
  { name: 'Electronics Stores', desc: 'Serial number tracking, warranty management, repairs.' },
  { name: 'Fashion Stores', desc: 'Size/color variants, seasonal inventory, supplier management.' },
  { name: 'Agribusiness', desc: 'Crop tracking, supplier payments, harvest recording.' },
  { name: 'Distributors', desc: 'Route management, delivery tracking, customer accounts.' },
];

export default function IndustriesPage() {
  return (
    <div>
      <style jsx>{`
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
      `}</style>
      <PageHero
        images={industryImages}
        title={
          <div className="floating-text">
            Solutions for Every
            <br />
            <span className="gradient-text-shine">Industry</span>
          </div>
        }
        subtitle="No matter your industry, BiasharaLedger adapts to your specific needs with customizable features and workflows."
      />

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Built for Your Industry
            </h2>
            <p className="text-lg text-white/60 leading-relaxed">
              Each industry has tailored features designed to streamline your specific workflows.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {industries.map((industry) => (
              <div
                key={industry.name}
                className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-brand/30 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-brand/10 hover:-translate-y-1"
              >
                <h3 className="text-sm font-bold text-white mb-1">{industry.name}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{industry.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Ready to streamline your business?</h2>
          <p className="text-lg text-white/60 mb-8">Start your 14-day free trial. No credit card required.</p>
          <Link
            href="/sign-up"
            className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:shadow-lg hover:shadow-brand/25 inline-flex items-center gap-2"
          >
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

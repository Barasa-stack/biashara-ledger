'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag, Store, Warehouse, Stethoscope, PackageOpen, Factory, GraduationCap, Monitor, Palette, Truck, Box, type LucideIcon, type LucideProps } from 'lucide-react';
import PageHero, { defaultCityImages } from '@/components/PageHero';

const ChefHat = ((props: LucideProps) => <ShoppingBag {...props} />) as LucideIcon;
const Leaf = ((props: LucideProps) => <Box {...props} />) as LucideIcon;

const industries = [
  { name: 'Retail Shops', icon: ShoppingBag, desc: 'POS, inventory, customer loyalty, and sales analytics.' },
  { name: 'Supermarkets', icon: Store, desc: 'Multi-department inventory, barcode scanning, supplier management.' },
  { name: 'Hardware Stores', icon: Warehouse, desc: 'Stock tracking, supplier orders, job costing, quotations.' },
  { name: 'Pharmacies', icon: Stethoscope, desc: 'Expiry tracking, prescription management, supplier orders.' },
  { name: 'Restaurants', icon: ChefHat, desc: 'Menu management, table orders, inventory, staff scheduling.' },
  { name: 'Wholesalers', icon: PackageOpen, desc: 'Bulk pricing, volume discounts, delivery management.' },
  { name: 'Manufacturers', icon: Factory, desc: 'BOM, production costing, raw material tracking.' },
  { name: 'Bookshops', icon: GraduationCap, desc: 'Stock management, supplier orders, student accounts.' },
  { name: 'Electronics Stores', icon: Monitor, desc: 'Serial number tracking, warranty management, repairs.' },
  { name: 'Fashion Stores', icon: Palette, desc: 'Size/color variants, seasonal inventory, supplier management.' },
  { name: 'Agribusiness', icon: Leaf, desc: 'Crop tracking, supplier payments, harvest recording.' },
  { name: 'Distributors', icon: Truck, desc: 'Route management, delivery tracking, customer accounts.' },
];

export default function IndustriesPage() {
  return (
    <div>
      <PageHero
        images={defaultCityImages}
        title={
          <>
            Solutions for Every
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-red-300 to-orange-200">Industry</span>
          </>
        }
        subtitle="No matter your industry, BiasharaLedger adapts to your specific needs with customizable features and workflows."
      />

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Built for Your Industry
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Each industry has tailored features designed to streamline your specific workflows.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {industries.map((industry) => (
              <div
                key={industry.name}
                className="group bg-gray-50 hover:bg-white border border-gray-100 hover:border-brand/20 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-1"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <industry.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{industry.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{industry.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 text-center bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Ready to streamline your business?</h2>
          <p className="text-lg text-gray-500 mb-8">Start your 14-day free trial. No credit card required.</p>
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

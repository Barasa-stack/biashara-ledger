'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, CheckCircle, Star, ChevronRight, Shield, HeadphonesIcon,
  Globe, Download, Monitor, Smartphone, Tablet, Cloud, Wifi,
  ShoppingCart, Calculator, FileText, Users, BarChart3,
  Box, Store, Warehouse, PackageOpen, Layers, RefreshCw, Lock,
  UserCheck, HardDrive, Zap, TrendingUp, HeartHandshake, Award, Building2,
  ChevronDown, Play, Quote, Server, CreditCard, Settings,
  Palette, Truck, ShoppingBag, GraduationCap, Stethoscope, Factory
} from 'lucide-react';

// ─── DATA ───

const heroImages = [
  { src: 'https://images.unsplash.com/photo-1574227492706-f65b24c3688a?w=1920&q=80', alt: 'Marina Bay financial district skyline, Singapore' },
  { src: 'https://images.unsplash.com/photo-1693464550496-8a6b114585b8?w=1920&q=80', alt: 'Upper Hill business district skyline, Nairobi' },
  { src: 'https://images.unsplash.com/photo-1749058388308-744fdc8991ed?w=1920&q=80', alt: 'Victoria Island waterfront skyline, Lagos' },
  { src: 'https://images.unsplash.com/photo-1573422565615-e3d0b3c0d7c3?w=1920&q=80', alt: 'Sandton financial district skyline, Johannesburg' },
  { src: 'https://images.unsplash.com/photo-1680198276344-3e820e68c825?w=1920&q=80', alt: 'Beach resort aerial view, Cancún' },
  { src: 'https://images.unsplash.com/photo-1771868453049-b7b4a4680b5c?w=1920&q=80', alt: 'Construction workers on building site' },
  { src: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1920&q=80', alt: 'Cavo Tagoo luxury resort, Mykonos' },
  { src: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1920&q=80', alt: 'Rodeo Drive luxury shopping, Beverly Hills' },
  { src: 'https://images.unsplash.com/photo-1765246312031-87e7a216a543?w=1920&q=80', alt: 'Chicago skyline across Lake Michigan' },
  { src: 'https://images.unsplash.com/photo-1746208440749-b25fcc19e025?w=1920&q=80', alt: 'Aerial view of tropical beach, Antigua' },
  { src: 'https://images.unsplash.com/photo-1706921255467-4236b197b530?w=1920&q=80', alt: 'Starlux Airlines business class cabin' },
  { src: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=1920&q=80', alt: 'Melbourne city skyline, Australia' },
  { src: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80', alt: 'Global city financial district skyline at dusk' },
  { src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80', alt: 'Modern metropolitan skyline with skyscrapers' },
  { src: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&q=80', alt: 'Downtown cityscape with towering glass buildings' },
  { src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80', alt: 'Corporate architecture modern business district' },
  { src: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&q=80', alt: 'Urban city corridor between skyscrapers' },
  { src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1920&q=80', alt: 'Modern glass office building architecture' },
];

const businessTeamImages = [
  {
    src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
    alt: 'Diverse business team collaborating in modern office',
  },
  {
    src: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
    alt: 'Professional team meeting in corporate office',
  },
  {
    src: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
    alt: 'Business team working with laptops in modern office',
  },
  {
    src: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=80',
    alt: 'Diverse professionals having discussion in office',
  },
];

const statsData = [
  { value: 12500, suffix: '+', label: 'Businesses Served', icon: Building2 },
  { value: 47, suffix: '+', label: 'Countries Worldwide', icon: Globe },
  { value: 28, suffix: 'M+', label: 'Daily Transactions', icon: TrendingUp },
  { value: 4.2, suffix: 'M+', label: 'Invoices Generated', icon: FileText },
];

const features = [
  { title: 'Inventory Management', desc: 'Real-time stock tracking, low-stock alerts, barcode scanning, and multi-warehouse management.', icon: Box },
  { title: 'Sales & POS', desc: 'Fast point-of-sale with customer management, receipts, and integrated payment processing.', icon: ShoppingCart },
  { title: 'Accounting', desc: 'Double-entry accounting, general ledger, trial balance, and financial statements.', icon: Calculator },
  { title: 'Expense Tracking', desc: 'Capture and categorize expenses, receipt scanning, and approval workflows.', icon: FileText },
  { title: 'Payroll Management', desc: 'Automated payroll with tax calculations, payslips, and statutory deductions.', icon: Users },
  { title: 'Employee Management', desc: 'Employee records, attendance, leave management, and performance tracking.', icon: UserCheck },
  { title: 'Supplier Management', desc: 'Vendor records, purchase orders, supplier payments, and performance ratings.', icon: Truck },
  { title: 'Customer Management', desc: 'Customer database, communication history, credit limits, and loyalty programs.', icon: HeartHandshake },
  { title: 'Reports & Analytics', desc: 'Customizable reports, dashboards, KPIs, and business intelligence insights.', icon: BarChart3 },
  { title: 'Cloud Sync', desc: 'Secure cloud backup with real-time synchronization across all your devices.', icon: Cloud },
  { title: 'Offline Desktop', desc: 'Full functionality without internet. Sync automatically when reconnected.', icon: HardDrive },
  { title: 'Multi-Branch Support', desc: 'Manage multiple locations from one account with centralized reporting.', icon: Layers },
];

const industries = [
  { name: 'Retail Shops', icon: ShoppingBag, desc: 'POS, inventory, customer loyalty, and sales analytics.' },
  { name: 'Supermarkets', icon: Store, desc: 'Multi-department inventory, barcode scanning, supplier management.' },
  { name: 'Hardware Stores', icon: Warehouse, desc: 'Stock tracking, supplier orders, job costing, quotations.' },
  { name: 'Pharmacies', icon: Stethoscope, desc: 'Expiry tracking, prescription management, supplier orders.' },
  { name: 'Restaurants', icon: ShoppingBag, desc: 'Menu management, table orders, inventory, staff scheduling.' },
  { name: 'Wholesalers', icon: PackageOpen, desc: 'Bulk pricing, volume discounts, delivery management.' },
  { name: 'Manufacturers', icon: Factory, desc: 'BOM, production costing, raw material tracking.' },
  { name: 'Bookshops', icon: GraduationCap, desc: 'Stock management, supplier orders, student accounts.' },
  { name: 'Electronics Stores', icon: Monitor, desc: 'Serial number tracking, warranty management, repairs.' },
  { name: 'Fashion Stores', icon: Palette, desc: 'Size/color variants, seasonal inventory, supplier management.' },
  { name: 'Agribusiness', icon: Layers, desc: 'Crop tracking, supplier payments, harvest recording.' },
  { name: 'Distributors', icon: Truck, desc: 'Route management, delivery tracking, customer accounts.' },
];



const benefits = [
  { icon: Zap, title: 'Fast', desc: 'Lightning-quick performance even with large datasets.' },
  { icon: Shield, title: 'Reliable', desc: '99.9% uptime with automatic failover protection.' },
  { icon: Lock, title: 'Secure', desc: 'AES-256 encryption, role-based access, audit trails.' },
  { icon: Wifi, title: 'Offline Capable', desc: 'Work without internet. Sync when connected.' },
  { icon: Cloud, title: 'Cloud Sync', desc: 'Real-time synchronization across all devices.' },
  { icon: Award, title: 'Enterprise Ready', desc: 'Scalable from 1 to 1,000+ users.' },
  { icon: CreditCard, title: 'Affordable', desc: 'Competitive pricing with no hidden fees.' },
  { icon: HeartHandshake, title: 'Easy to Learn', desc: 'Intuitive interface with video tutorials.' },
  { icon: RefreshCw, title: 'Auto Updates', desc: 'Always up-to-date with the latest features.' },
  { icon: HeadphonesIcon, title: 'Professional Support', desc: 'Dedicated support team ready to help.' },
  { icon: TrendingUp, title: 'Regular Improvements', desc: 'New features and updates every month.' },
  { icon: Settings, title: 'Scalable', desc: 'Grows with your business. No migration needed.' },
];

const testimonials = [
  {
    quote: 'BiasharaLedger transformed our operations. We manage 5 retail outlets from one dashboard — inventory, sales, payroll, and accounting. The offline desktop mode is a lifesaver when internet goes down.',
    name: 'James Kiprop',
    role: 'Owner',
    business: 'Nairobi Hardware Solutions',
    country: 'Kenya',
    industry: 'Hardware Store',
    rating: 5,
    initials: 'JK',
    color: 'from-brand/30 to-brand/10',
  },
  {
    quote: 'We switched from manual records to BiasharaLedger and saw immediate improvement. Stock management, supplier payments, and daily sales reports are now automated. Highly recommended for supermarkets.',
    name: 'Faith Nyambura',
    role: 'Operations Manager',
    business: 'Mombasa Fresh Mart',
    country: 'Kenya',
    industry: 'Supermarket',
    rating: 5,
    initials: 'FN',
    color: 'from-blue-600/30 to-blue-600/10',
  },
  {
    quote: 'As a wholesale distributor with 2,000+ SKUs, we needed robust inventory control. BiasharaLedger delivers. Barcode scanning, batch tracking, and automated reordering saved us countless hours.',
    name: 'Samuel Ochieng',
    role: 'Director',
    business: 'Lake Basin Wholesalers',
    country: 'Kenya',
    industry: 'Wholesale',
    rating: 5,
    initials: 'SO',
    color: 'from-amber-600/30 to-amber-600/10',
  },
  {
    quote: 'Managing prescriptions, expiries, and supplier orders was chaotic. BiasharaLedger streamlined everything. Our pharmacy now runs efficiently with real-time stock visibility.',
    name: 'Dr. Amina Hassan',
    role: 'Lead Pharmacist',
    business: 'Coastal Chemists Ltd',
    country: 'Kenya',
    industry: 'Pharmacy',
    rating: 5,
    initials: 'AH',
    color: 'from-emerald-600/30 to-emerald-600/10',
  },
];

const pricingPlans = [
  {
    name: 'Basic',
    price: '1,500',
    period: '/month',
    desc: 'Perfect for small retail shops and startups.',
    popular: false,
    features: [
      'Up to 2 users', 'Inventory management', 'Sales & POS', 'Basic reporting',
      'Supplier management', 'Customer management', 'Email support',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Standard',
    price: '3,500',
    period: '/month',
    desc: 'Ideal for growing businesses with multiple needs.',
    popular: true,
    features: [
      'Up to 10 users', 'Everything in Basic', 'Payroll management',
      'Employee management', 'Advanced reporting & analytics',
      'Multi-branch support', 'Cloud sync & backup', 'Phone & email support',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Premium',
    price: '7,500',
    period: '/month',
    desc: 'For enterprises requiring full capabilities.',
    popular: false,
    features: [
      'Unlimited users', 'Everything in Standard', 'Offline desktop app',
      'Advanced security & permissions', 'Custom reports & dashboards',
      'Dedicated account manager', 'Priority support', 'API access',
      'On-premise deployment option',
    ],
    cta: 'Contact Sales',
  },
];

// ─── COMPONENTS ───

function Counter({ value, suffix, label, icon: Icon }: { value: number; suffix: string; label: string; icon: any }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true;
        const duration = 2000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= value) {
            setCount(value);
            clearInterval(timer);
          } else {
            setCount(current);
          }
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  const display = value >= 1000
    ? `${(count / 1000).toFixed(1)}${suffix.replace('+', '')}${suffix.includes('+') ? '+' : ''}`
    : `${Math.round(count)}${suffix}`;

  return (
    <div ref={ref} className="text-center group">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-7 w-7 text-brand" />
      </div>
      <p className="text-4xl md:text-5xl font-bold text-gray-900 mb-1 tabular-nums">{display}</p>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
    </div>
  );
}

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  );
}

function HeroBackground() {
  const [current, setCurrent] = useState(0);
  const total = heroImages.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 6000);
    return () => clearInterval(timer);
  }, [total]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {heroImages.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />

      {/* Subtle city name label */}
      <div className="absolute bottom-8 right-8 text-white/10 text-xs font-medium tracking-[0.3em] uppercase select-none">
        {['Marina Bay · Singapore', 'Upper Hill · Nairobi', 'Victoria Island · Lagos', 'Sandton · Johannesburg', 'Cancún · Mexico', 'Construction · Urban Dev', 'Cavo Tagoo · Mykonos', 'Rodeo Drive · Beverly Hills', 'Chicago · Lake Michigan', 'Antigua · Tropical Beach', 'Business Class · Starlux', 'Melbourne · Australia', 'Financial District · Global', 'Metropolitan · Skyline', 'Downtown · Cityscape', 'Corporate · Architecture', 'Urban · Corridor', 'Glass · Office Tower'][current]}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/15 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* ─── HERO ─── */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
        <HeroBackground />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-4xl">
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-medium text-white/80">Trusted by 12,500+ businesses across 47+ countries</span>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-6">
                Build Smarter
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-red-300 to-orange-200">
                  Businesses
                </span>
                <br />
                with BiasharaLedger
              </h1>
            </AnimatedSection>

            <AnimatedSection>
              <p className="text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed mb-10">
                The complete cloud and desktop business management platform designed for modern retailers,
                wholesalers, pharmacies, supermarkets, manufacturers, distributors, hardware stores,
                and growing enterprises. Manage your business anytime, anywhere&mdash;even without an internet connection.
              </p>
            </AnimatedSection>

            <AnimatedSection>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/sign-up"
                  className="bg-brand hover:bg-brand-hover text-white px-8 py-4 rounded-xl text-base font-semibold transition-all hover:shadow-xl hover:shadow-brand/30 inline-flex items-center gap-2 group"
                >
                  Start Free Trial <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 px-8 py-4 rounded-xl text-base font-semibold transition-all inline-flex items-center gap-2"
                >
                  Book a Demo <Play className="h-4 w-4" />
                </Link>
                <Link
                  href="/download"
                  className="text-white/60 hover:text-white border border-white/10 hover:border-white/20 px-8 py-4 rounded-xl text-base font-semibold transition-all inline-flex items-center gap-2"
                >
                  <Download className="h-4 w-4" /> Desktop App
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="flex flex-wrap items-center gap-8 text-sm text-white/40 mt-10">
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> No credit card</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> 14-day free trial</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Cloud & Desktop</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Cancel anytime</div>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-white/30" />
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-gray-400 text-center uppercase tracking-[0.2em] font-semibold mb-10">Trusted by businesses worldwide</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-10 items-center justify-items-center opacity-30">
            {['Nairobi Hardware', 'Mombasa Fresh Mart', 'Lake Basin Wholesalers', 'Coastal Chemists', 'Highland Distributors', 'Savannah Retail'].map((name) => (
              <div key={name} className="text-xs font-bold text-gray-500 text-center leading-tight tracking-tight uppercase">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATISTICS ─── */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-semibold text-brand">Our impact by numbers</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Growing Every Day
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Businesses across Africa and beyond trust BiasharaLedger to manage their operations.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {statsData.map((stat) => (
              <Counter key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── BUSINESS ENVIRONMENT ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src={businessTeamImages[0].src}
                  alt={businessTeamImages[0].alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </AnimatedSection>
            <AnimatedSection>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5">
                  <span className="text-xs font-semibold text-brand">Trusted by professionals</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  Built by Business Experts for Business Leaders
                </h2>
                <p className="text-gray-500 leading-relaxed">
                  From construction sites in Nairobi's Upper Hill to corporate offices in Johannesburg's Sandton,
                  from retail chains in Lagos to distribution centers in Durban &mdash; BiasharaLedger powers
                  businesses across Africa and beyond.
                </p>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  {[
                    { label: 'Construction & Engineering', value: '500+' },
                    { label: 'Retail & Wholesale', value: '3,200+' },
                    { label: 'Manufacturing', value: '850+' },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-xl font-bold text-brand">{item.value}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Everything you need</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                One Platform. Endless Possibilities.
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                From inventory to payroll, sales to accounting — manage every aspect of your business from a single, unified platform.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <AnimatedSection key={feature.title}>
                <div className="group bg-gray-50 hover:bg-white border border-gray-100 hover:border-brand/20 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-1 h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-6 w-6 text-brand" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HYBRID PLATFORM ─── */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Our competitive advantage</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Cloud & Desktop. Seamlessly Connected.
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                The only platform that gives you the power of cloud with the reliability of desktop — working together as one.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-600/5 flex items-center justify-center shrink-0">
                    <Cloud className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Cloud Version</h3>
                    <p className="text-gray-500 leading-relaxed">Access your business securely from anywhere. Real-time data, automatic backups, and team collaboration — all through your browser.</p>
                    <ul className="mt-4 space-y-2">
                      {['Access from any device', 'Real-time synchronization', 'Automatic cloud backups', 'Team collaboration'].map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-200 via-brand/20 to-brand-200" />
                </div>

                <div className="flex gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600/20 to-amber-600/5 flex items-center justify-center shrink-0">
                    <Monitor className="h-8 w-8 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Desktop Version</h3>
                    <p className="text-gray-500 leading-relaxed">Continue working even without internet. Full offline functionality with automatic synchronization when you reconnect.</p>
                    <ul className="mt-4 space-y-2">
                      {['Works offline completely', 'Full feature parity with cloud', 'Automatic sync on reconnect', 'Windows & macOS support'].map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="relative">
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold">BL</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">BiasharaLedger</p>
                        <p className="text-xs text-white/50">Cloud Sync Active</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Cloud className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Monitor className="h-4 w-4 text-amber-400" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/50">Cloud Database</span>
                        <span className="text-xs text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Synced</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-brand to-orange-400 rounded-full" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Online Sales</p>
                        <p className="text-lg font-bold text-white">KES 184,500</p>
                        <p className="text-[10px] text-green-400">+12.3% today</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Offline Queue</p>
                        <p className="text-lg font-bold text-white">0 items</p>
                        <p className="text-[10px] text-white/40">All synced</p>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-5 w-5 text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Last Sync: Just now</p>
                          <p className="text-xs text-white/40">Cloud and desktop are in perfect sync</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative arrows */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-brand rounded-full flex items-center justify-center shadow-lg shadow-brand/30">
                  <RefreshCw className="h-4 w-4 text-white" />
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Business team image below hybrid section */}
          <AnimatedSection>
            <div className="mt-16 grid lg:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl order-2 lg:order-1">
                <Image
                  src={businessTeamImages[1].src}
                  alt={businessTeamImages[1].alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Trusted by Industry Leaders</h3>
                <p className="text-gray-500 leading-relaxed mb-4">
                  From engineering firms managing complex construction projects in Nairobi to retail chains
                  in Johannesburg and manufacturing plants in Lagos — businesses rely on BiasharaLedger
                  for their daily operations.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Engineering & Construction', pct: '35%' },
                    { label: 'Retail & Wholesale', pct: '28%' },
                    { label: 'Manufacturing', pct: '18%' },
                    { label: 'Professional Services', pct: '19%' },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-brand">{item.pct}</p>
                      <p className="text-xs text-gray-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── INDUSTRIES ─── */}
      <section id="industries" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Built for your industry</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Solutions for Every Business
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                No matter your industry, BiasharaLedger adapts to your specific needs with customizable features and workflows.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {industries.map((industry, i) => (
              <AnimatedSection key={industry.name}>
                <div className="group bg-gray-50 hover:bg-white border border-gray-100 hover:border-brand/20 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <industry.icon className="h-5 w-5 text-brand" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{industry.name}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{industry.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE ─── */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Why businesses choose us</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Built for Performance. Designed for Growth.
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Thousands of businesses trust BiasharaLedger for its reliability, security, and ease of use.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <AnimatedSection key={benefit.title}>
                <div className="text-center group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="h-7 w-7 text-brand" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{benefit.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEVICE MOCKUPS ─── */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/[0.02] to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">See it in action</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Beautiful on Every Device
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Access BiasharaLedger from your laptop, desktop, tablet, or phone. The same powerful features, optimized for every screen.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-4 gap-6 items-end">
            <AnimatedSection>
              <div className="group text-center">
                <div className="bg-gradient-to-b from-gray-100 to-white rounded-2xl p-6 border border-gray-200 hover:border-brand/20 transition-all duration-300 hover:shadow-xl">
                  <div className="relative mx-auto w-[160px] aspect-[9/19]">
                    <Image
                      src="https://images.unsplash.com/photo-1695639509828-d4260075e370?w=400&q=80"
                      alt="iPhone 15 Pro Max"
                      fill
                      className="object-contain drop-shadow-xl"
                      sizes="160px"
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-500 mt-3">iPhone</p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="group text-center translate-y-4">
                <div className="bg-gradient-to-b from-gray-100 to-white rounded-2xl p-6 border border-gray-200 hover:border-brand/20 transition-all duration-300 hover:shadow-xl">
                  <div className="relative mx-auto w-[200px] aspect-[3/4]">
                    <Image
                      src="https://images.unsplash.com/photo-1589159881123-c1f6f048ded0?w=500&q=80"
                      alt="iPad Pro with Magic Keyboard"
                      fill
                      className="object-contain drop-shadow-xl"
                      sizes="200px"
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-500 mt-3">iPad</p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="group text-center -translate-y-4 md:col-span-2">
                <div className="bg-gradient-to-b from-gray-100 to-white rounded-2xl p-6 border border-gray-200 hover:border-brand/20 transition-all duration-300 hover:shadow-xl">
                  <div className="relative mx-auto w-full max-w-[380px] aspect-[16/10]">
                    <Image
                      src="https://images.unsplash.com/photo-1559163479-98365644374a?w=700&q=80"
                      alt="MacBook Pro"
                      fill
                      className="object-contain drop-shadow-xl"
                      sizes="380px"
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-500 mt-3">MacBook Pro</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">What our clients say</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Trusted by Business Owners Like You
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Hear from business owners who transformed their operations with BiasharaLedger.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedSection key={t.name}>
                <div className="bg-white border border-gray-100 rounded-2xl p-8 hover:border-brand/20 transition-all duration-300 hover:shadow-lg hover:shadow-brand/5 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-1.5 bg-brand/5 text-brand text-xs font-semibold px-3 py-1 rounded-full">
                      {t.industry}
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <Quote className="h-8 w-8 text-brand/15 mb-3" />
                  <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-sm font-bold text-gray-800`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}, {t.business}</p>
                      <p className="text-xs text-gray-400">{t.country}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECURITY ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Enterprise-grade security</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Your Data is Safe With Us
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                We take security seriously. Your business data is protected by industry-leading encryption, access controls, and monitoring.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Lock, title: 'Encrypted Data', desc: 'AES-256-GCM encryption at rest and TLS 1.3 in transit.' },
              { icon: Server, title: 'Automatic Backup', desc: 'Daily encrypted backups with point-in-time recovery.' },
              { icon: Shield, title: 'Access Control', desc: 'Role-based permissions with granular feature access.' },
              { icon: Cloud, title: 'Secure Cloud', desc: 'ISO 27001 certified data centers with 24/7 monitoring.' },
              { icon: HardDrive, title: 'Offline Protection', desc: 'Local data encrypted on device. Never compromised.' },
              { icon: Lock, title: 'License Security', desc: 'One license per computer with hardware binding.' },
              { icon: RefreshCw, title: 'Regular Updates', desc: 'Continuous security patches and feature updates.' },
              { icon: Award, title: 'Compliance Ready', desc: 'KRA, tax compliance, and audit trail support.' },
            ].map((item) => (
              <div key={item.title} className="group bg-gray-50 hover:bg-white border border-gray-100 hover:border-brand/20 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-brand/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600/20 to-green-600/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Simple, transparent pricing</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Plans That Scale With You
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Start small and upgrade as you grow. No hidden fees, no surprises.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <AnimatedSection key={plan.name}>
                <div className={`relative bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-brand shadow-lg shadow-brand/10'
                    : 'border-gray-100 hover:border-brand/20'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-4 py-1.5 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mb-6">{plan.desc}</p>
                    <div className="flex items-baseline mb-6">
                      <span className="text-4xl font-bold text-gray-900">KES</span>
                      <span className="text-5xl font-bold text-gray-900 ml-1">{plan.price}</span>
                      <span className="text-sm text-gray-400 ml-1">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/sign-up"
                      className={`block text-center px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                        plan.popular
                          ? 'bg-brand hover:bg-brand-hover text-white hover:shadow-lg hover:shadow-brand/25'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection>
            <div className="text-center mt-12">
              <p className="text-sm text-gray-400">
                Need a custom plan? <Link href="/contact" className="text-brand font-semibold hover:underline">Contact our sales team</Link>
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#0a0a0a] to-gray-900">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/15 via-transparent to-transparent" />
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand/10 blur-[150px]" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand/5 blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-white/80">Join 12,500+ businesses</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Ready to Transform
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-red-300 to-orange-200">Your Business?</span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed">
              Start your free trial today. No credit card required. Full access to all features.
              Join thousands of businesses already growing with BiasharaLedger.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="bg-brand hover:bg-brand-hover text-white px-10 py-4 rounded-xl text-base font-semibold transition-all hover:shadow-xl hover:shadow-brand/30 inline-flex items-center gap-2 group"
              >
                Get Started <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 px-10 py-4 rounded-xl text-base font-semibold transition-all inline-flex items-center gap-2"
              >
                Schedule Demo <Play className="h-4 w-4" />
              </Link>
              <Link
                href="/download"
                className="text-white/60 hover:text-white border border-white/10 hover:border-white/20 px-10 py-4 rounded-xl text-base font-semibold transition-all inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Download Desktop
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/40 mt-10">
              <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Free 14-day trial</div>
              <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> No credit card</div>
              <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Free onboarding</div>
              <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Cancel anytime</div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Got questions?</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Frequently Asked Questions</h2>
              <p className="text-gray-500">Everything you need to know about BiasharaLedger.</p>
            </div>
          </AnimatedSection>
          <div className="space-y-3">
            {[
              { q: 'How does the cloud and desktop sync work?', a: 'BiasharaLedger automatically synchronizes your data between cloud and desktop whenever an internet connection is available. You can work offline on the desktop app, and all changes will sync automatically when you reconnect. No manual steps needed.' },
              { q: 'Can I use BiasharaLedger without internet?', a: 'Yes! Our desktop application works fully offline. You can manage inventory, process sales, generate invoices, and run reports without any internet connection. When you reconnect, everything syncs automatically.' },
              { q: 'What industries does BiasharaLedger support?', a: 'We support 12+ industries including retail shops, supermarkets, hardware stores, pharmacies, restaurants, wholesalers, manufacturers, bookshops, electronics stores, fashion stores, agribusiness, and distributors. Each industry has tailored features.' },
              { q: 'Is my data secure?', a: 'Absolutely. We use AES-256-GCM encryption for data at rest and TLS 1.3 for data in transit. We perform daily encrypted backups, offer role-based access controls, and maintain strict security protocols across our infrastructure.' },
              { q: 'How does licensing work?', a: 'Each license is tied to one computer for the desktop version. The cloud version can be accessed from any device with your login credentials. Licenses are secure and can be managed from your account dashboard.' },
              { q: 'Can I try before buying?', a: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required. You can explore the cloud version, download the desktop app, and see if BiasharaLedger is right for your business.' },
            ].map((faq) => (
              <details key={faq.q} className="group border border-gray-200 rounded-xl overflow-hidden hover:border-brand/20 transition-colors">
                <summary className="px-6 py-4 text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors list-none flex items-center justify-between">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform shrink-0" />
                </summary>
                <div className="px-6 py-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

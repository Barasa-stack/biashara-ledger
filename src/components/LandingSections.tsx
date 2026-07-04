'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, ChevronRight, Download, Play, ChevronDown } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  );
}

function Counter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);
  const counted = useRef(false);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (!inView || counted.current) return;
    counted.current = true;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else { setCount(current); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  const display = value >= 1000
    ? `${(count / 1000).toFixed(1)}${suffix.replace('+', '')}${suffix.includes('+') ? '+' : ''}`
    : `${Math.round(count)}${suffix}`;

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl md:text-5xl font-bold text-white mb-1 tabular-nums">{display}</p>
      <p className="text-sm text-white/60 font-medium">{label}</p>
    </div>
  );
}

import {
  statsData, businessTeamImages, features, industries, benefits,
  testimonials, pricingPlans, hostingPlans, backupPlans,
} from '@/lib/marketing-data';

export default function LandingSections() {
  return (
    <>
      {/* ─── TRUST BAR ─── */}
      <section className="relative py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-white/40 text-center uppercase tracking-[0.2em] font-semibold mb-10">Trusted by businesses worldwide</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-10 items-center justify-items-center opacity-40">
            {['Safaricom PLC', 'KCB Bank Group', 'Equity Bank', 'Java House', 'Naivas Supermarket', 'Coca-Cola Beverages'].map((name) => (
              <div key={name} className="text-xs font-bold text-white/60 text-center leading-tight tracking-tight uppercase">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATISTICS ─── */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-semibold text-brand">Our impact by numbers</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Growing Every Day</h2>
            <p className="text-lg text-white/60 leading-relaxed">Businesses across Africa and beyond trust BiasharaLedger to manage their operations.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {statsData.map((stat) => <Counter key={stat.label} {...stat} />)}
          </div>
        </div>
      </section>

      {/* ─── BUSINESS ENVIRONMENT ─── */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-xl">
                <Image src={businessTeamImages[0].src} alt={businessTeamImages[0].alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </AnimatedSection>
            <AnimatedSection>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
                  <span className="text-xs font-semibold text-brand">Trusted by professionals</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Built by Business Experts for Business Leaders</h2>
                <p className="text-white/60 leading-relaxed">From construction sites in Nairobi&rsquo;s Upper Hill to corporate offices in Johannesburg&rsquo;s Sandton, from retail chains in Lagos to distribution centers in Durban — BiasharaLedger powers businesses across Africa and beyond.</p>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  {[
                    { label: 'Construction & Engineering', value: '500+' },
                    { label: 'Retail & Wholesale', value: '3,200+' },
                    { label: 'Manufacturing', value: '850+' },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                      <p className="text-xl font-bold text-brand">{item.value}</p>
                      <p className="text-[10px] text-white/50 mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Everything you need</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">One Platform. Endless Possibilities.</h2>
              <p className="text-lg text-white/60 leading-relaxed">From inventory to payroll, sales to accounting — manage every aspect of your business from a single, unified platform.</p>
            </div>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <AnimatedSection key={feature.title}>
                <div className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:border-brand/30 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-brand/10 hover:-translate-y-1 h-full" style={{ transitionDelay: `${i * 60}ms` }}>
                  <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HYBRID PLATFORM ─── */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Our competitive advantage</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Cloud & Desktop. Seamlessly Connected.</h2>
              <p className="text-lg text-white/60 leading-relaxed">The only platform that gives you the power of cloud with the reliability of desktop — working together as one.</p>
            </div>
          </AnimatedSection>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Cloud Version</h3>
                  <p className="text-white/60 leading-relaxed">Access your business securely from anywhere. Real-time data, automatic backups, and team collaboration — all through your browser.</p>
                </div>
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-400/30 via-brand/30 to-amber-400/30" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Desktop Version</h3>
                  <p className="text-white/60 leading-relaxed">Continue working even without internet. Full offline functionality with automatic synchronization when you reconnect.</p>
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

                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/50">Cloud Database</span>
                        <span className="text-xs text-red-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Synced</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-brand to-orange-400 rounded-full" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Online Sales</p>
                        <p className="text-lg font-bold text-white">$184,500</p>
                        <p className="text-[10px] text-red-400">+12.3% today</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Offline Queue</p>
                        <p className="text-lg font-bold text-white">0 items</p>
                        <p className="text-[10px] text-white/40">All synced</p>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-sm font-medium text-white">Last Sync: Just now</p>
                      <p className="text-xs text-white/40">Cloud and desktop are in perfect sync</p>
                    </div>
                  </div>
                </div>

              </div>
            </AnimatedSection>
          </div>
          <AnimatedSection>
            <div className="mt-16 grid lg:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-xl order-2 lg:order-1">
                <Image src={businessTeamImages[1].src} alt={businessTeamImages[1].alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-2xl font-bold text-white mb-3">Trusted by Industry Leaders</h3>
                <p className="text-white/60 leading-relaxed mb-4">From engineering firms managing complex construction projects in Nairobi to retail chains in Johannesburg and manufacturing plants in Lagos — businesses rely on BiasharaLedger for their daily operations.</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Engineering & Construction', pct: '35%' },
                    { label: 'Retail & Wholesale', pct: '28%' },
                    { label: 'Manufacturing', pct: '18%' },
                    { label: 'Professional Services', pct: '19%' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                      <p className="text-lg font-bold text-brand">{item.pct}</p>
                      <p className="text-xs text-white/50">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── INDUSTRIES ─── */}
      <section id="industries" className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Built for your industry</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Solutions for Every Business</h2>
              <p className="text-lg text-white/60 leading-relaxed">No matter your industry, BiasharaLedger adapts to your specific needs with customizable features and workflows.</p>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {industries.map((industry, i) => (
              <AnimatedSection key={industry.name}>
                <div className="group bg-white/10 backdrop-blur-sm border border-white/10 hover:border-brand/30 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-brand/10 hover:-translate-y-1 hover:bg-white/15" style={{ transitionDelay: `${i * 50}ms` }}>
                  <h3 className="text-sm font-bold text-white mb-1">{industry.name}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{industry.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE ─── */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Why businesses choose us</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Built for Performance. Designed for Growth.</h2>
              <p className="text-lg text-white/60 leading-relaxed">Thousands of businesses trust BiasharaLedger for its reliability, security, and ease of use.</p>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <AnimatedSection key={benefit.title}>
                <div className="text-center" style={{ transitionDelay: `${i * 60}ms` }}>
                  <h3 className="text-sm font-bold text-white mb-1">{benefit.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{benefit.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEVICE MOCKUPS ─── */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">See it in action</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Beautiful on Every Device</h2>
              <p className="text-lg text-white/50 leading-relaxed">Access BiasharaLedger from your laptop, desktop, tablet, or phone. The same powerful features, optimized for every screen.</p>
            </div>
          </AnimatedSection>
          <div className="grid md:grid-cols-4 gap-6 items-end">
            <AnimatedSection>
              <div className="group text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-brand/30 transition-all duration-300 hover:shadow-xl hover:shadow-brand/10 h-full flex flex-col items-center justify-between">
                  <div className="relative w-full flex-1 flex items-center justify-center">
                    <div className="relative w-[140px] aspect-[9/19]">
                      <Image src="/images/mockups/iphone.png" alt="iPhone 15 Pro Max" fill className="object-contain drop-shadow-xl" sizes="140px" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-white/60 mt-4">iPhone</p>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection>
              <div className="group text-center translate-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-brand/30 transition-all duration-300 hover:shadow-xl hover:shadow-brand/10 h-full flex flex-col items-center justify-between">
                  <div className="relative w-full flex-1 flex items-center justify-center">
                    <div className="relative w-[180px] aspect-[3/4]">
                      <Image src="/images/mockups/ipad.png" alt="iPad Pro" fill className="object-contain drop-shadow-xl" sizes="180px" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-white/60 mt-4">iPad</p>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection>
              <div className="group text-center -translate-y-4 md:col-span-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-brand/30 transition-all duration-300 hover:shadow-xl hover:shadow-brand/10 h-full flex flex-col items-center justify-between">
                  <div className="relative w-full flex-1 flex items-center justify-center">
                    <div className="relative w-full max-w-[340px] aspect-[4/3]">
                      <Image src="/images/mockups/macbook.jpg" alt="MacBook Pro" fill className="object-contain drop-shadow-xl" sizes="340px" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-white/60 mt-4">MacBook Pro</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">What our clients say</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Trusted by Business Owners Like You</h2>
              <p className="text-lg text-white/60 leading-relaxed">Hear from business owners who transformed their operations with BiasharaLedger.</p>
            </div>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <AnimatedSection key={t.name}>
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:border-brand/30 transition-all duration-300 hover:shadow-lg hover:shadow-brand/10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-1.5 bg-brand/20 text-brand text-xs font-semibold px-3 py-1 rounded-full">{t.industry}</div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: t.rating }).map((_, j) => (<Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />))}
                    </div>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-sm font-bold text-gray-800`}>{t.initials}</div>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-xs text-white/50">{t.role}, {t.business}</p>
                      <p className="text-xs text-white/40">{t.country}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECURITY ─── */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Enterprise-grade security</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Your Data is Safe With Us</h2>
              <p className="text-lg text-white/60 leading-relaxed">We take security seriously. Your business data is protected by industry-leading encryption, access controls, and monitoring.</p>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { title: 'Encrypted Data', desc: 'AES-256-GCM encryption at rest and TLS 1.3 in transit.' },
              { title: 'Automatic Backup', desc: 'Daily encrypted backups with point-in-time recovery.' },
              { title: 'Access Control', desc: 'Role-based permissions with granular feature access.' },
              { title: 'Secure Cloud', desc: 'ISO 27001 certified data centers with 24/7 monitoring.' },
              { title: 'Offline Protection', desc: 'Local data encrypted on device. Never compromised.' },
              { title: 'License Security', desc: 'One license per computer with hardware binding.' },
              { title: 'Regular Updates', desc: 'Continuous security patches and feature updates.' },
              { title: 'Compliance Ready', desc: 'KRA, tax compliance, and audit trail support.' },
            ].map((item) => (
                <div key={item.title} className="group bg-white/10 backdrop-blur-sm border border-white/10 hover:border-brand/30 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-brand/10">
                  <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Simple, transparent pricing</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Plans That Scale With You</h2>
              <p className="text-lg text-white/60 leading-relaxed">Start small and upgrade as you grow. No hidden fees, no surprises.</p>
            </div>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <AnimatedSection key={plan.name}>
                <div className={`relative bg-white/10 backdrop-blur-sm rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:shadow-brand/10 ${plan.popular ? 'border-brand shadow-lg shadow-brand/20' : 'border-white/20 hover:border-brand/30'}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-4 py-1.5 rounded-full">Most Popular</div>
                  )}
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-sm text-white/60 mb-6">{plan.desc}</p>
                    <div className="flex items-baseline mb-6">
                      <span className="text-4xl font-bold text-white">$</span>
                      <span className="text-5xl font-bold text-white ml-1">{plan.price}</span>
                      <span className="text-sm text-white/40 ml-1">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm text-white/70">
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/sign-up" className={`block text-center px-6 py-3 rounded-xl text-sm font-semibold transition-all ${plan.popular ? 'bg-brand hover:bg-brand-hover text-white hover:shadow-lg hover:shadow-brand/25' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}>{plan.cta}</Link>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection>
            <div className="text-center mt-12">
              <p className="text-sm text-white/40">Need a custom plan? <Link href="/contact" className="text-brand font-semibold hover:underline">Contact our sales team</Link></p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── DATA HOSTING & BACKUP PLANS ─── */}
      <section id="hosting" className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Data Hosting &amp; Backup Plans</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Secure, Scalable Cloud Storage</h2>
              <p className="text-lg text-white/60 leading-relaxed">Choose a hosting plan that fits your data needs. All plans include enterprise-grade security and automatic backups.</p>
            </div>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {hostingPlans.map((plan) => (
              <AnimatedSection key={plan.name}>
                <div className={`relative bg-white/10 backdrop-blur-sm rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:shadow-brand/10 flex flex-col h-full ${plan.popular ? 'border-brand shadow-lg shadow-brand/20' : 'border-white/20 hover:border-brand/30'}`}>
                  {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-4 py-1.5 rounded-full">Most Popular</div>}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-white/60 mb-4 flex-1">{plan.desc}</p>
                    <div className="mb-1"><span className="text-sm font-medium text-white/40">{plan.storage}</span></div>
                    <div className="flex items-baseline mb-1">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      {plan.price !== 'Free' && plan.price !== 'Custom' && <span className="text-sm text-white/40 ml-1">/month</span>}
                    </div>
                    <p className="text-xs text-white/40 mb-5">{plan.overage}</p>
                    <Link href={plan.price === 'Custom' ? '/contact' : '/sign-up'} className={`block text-center px-4 py-2.5 rounded-xl text-xs font-semibold transition-all mt-auto ${plan.popular ? 'bg-brand hover:bg-brand-hover text-white hover:shadow-lg hover:shadow-brand/25' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}>{plan.cta}</Link>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-4">
                <span className="text-xs font-semibold text-brand">Backup Services</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">Protect Your Data with Automated Backups</h3>
              <p className="text-sm text-white/60">Add an extra layer of protection with our managed backup services.</p>
            </div>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {backupPlans.map((plan) => (
              <AnimatedSection key={plan.name}>
                <div className={`relative bg-white/10 backdrop-blur-sm rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:shadow-brand/10 ${plan.popular ? 'border-brand shadow-lg shadow-brand/20' : 'border-white/20 hover:border-brand/30'}`}>
                  {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-4 py-1.5 rounded-full">Recommended</div>}
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                        <p className="text-sm text-white/60">{plan.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white">{plan.price}</p>
                        <p className="text-xs text-white/40">{plan.period}</p>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/sign-up" className={`block text-center px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${plan.popular ? 'bg-brand hover:bg-brand-hover text-white hover:shadow-lg hover:shadow-brand/25' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}>{plan.cta}</Link>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection>
            <div className="text-center mt-12">
              <p className="text-sm text-white/40">Need a custom hosting or backup solution? <Link href="/contact" className="text-brand font-semibold hover:underline">Contact our sales team</Link></p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-sm font-medium text-white/80">Join 12,500+ businesses</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Ready to Transform<br />Your Business?</h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed">Start your free trial today. No credit card required. Full access to all features. Join thousands of businesses already growing with BiasharaLedger.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/sign-up" className="bg-brand hover:bg-brand-hover text-white px-10 py-4 rounded-xl text-base font-semibold transition-all hover:shadow-xl hover:shadow-brand/30 inline-flex items-center gap-2 group">Get Started <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></Link>
              <Link href="/contact" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 px-10 py-4 rounded-xl text-base font-semibold transition-all inline-flex items-center gap-2">Schedule Demo <Play className="h-4 w-4" /></Link>
              <Link href="/download" className="text-white/60 hover:text-white border border-white/10 hover:border-white/20 px-10 py-4 rounded-xl text-base font-semibold transition-all inline-flex items-center gap-2"><Download className="h-4 w-4" /> Download Desktop</Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/40 mt-10">
              <span>Free 14-day trial</span>
              <span>No credit card</span>
              <span>Free onboarding</span>
              <span>Cancel anytime</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="relative py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-xs font-semibold text-brand">Got questions?</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Frequently Asked Questions</h2>
              <p className="text-white/60">Everything you need to know about BiasharaLedger.</p>
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
              <details key={faq.q} className="group border border-white/20 rounded-xl overflow-hidden hover:border-brand/30 transition-colors bg-white/10 backdrop-blur-sm">
                <summary className="px-6 py-4 text-sm font-semibold text-white cursor-pointer hover:bg-white/5 transition-colors list-none flex items-center justify-between">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 text-white/40 group-open:rotate-90 transition-transform shrink-0" />
                </summary>
                <div className="px-6 py-4 text-sm text-white/70 leading-relaxed border-t border-white/10">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

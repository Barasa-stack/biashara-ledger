import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Heart, Target, Shield, Users } from 'lucide-react';
import PageHero, { defaultCityImages } from '@/components/PageHero';

export default function AboutPage() {
  return (
    <div>
      <PageHero
        images={defaultCityImages}
        title={
          <>
            Building the Future of
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-red-300 to-orange-200">
              Business Management
            </span>
          </>
        }
        subtitle="We built BiasharaLedger because businesses deserve tools that understand their market — KRA compliance, M-Pesa reconciliation, and the real way business works across Africa."
        badge="About Us"
        badgeWithoutTrust
      />

      {/* ─── OUR STORY ─── */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl order-2 lg:order-1">
              <Image
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80"
                alt="Diverse team collaborating in modern office space"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-4">
                <span className="text-xs font-semibold text-brand">Our Story</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 tracking-tight">
                By Entrepreneurs, for Entrepreneurs
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
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
                  payroll, and reporting — designed specifically for African businesses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TEAM ENVIRONMENT ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-4">
                <span className="text-xs font-semibold text-brand">Our values</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 tracking-tight">
                The Principles That Guide Us
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Target, title: 'Local First', desc: 'Built for African businesses. Local tax compliance and payment methods are first-class features.' },
                  { icon: Shield, title: 'Security & Trust', desc: 'Your data is protected with enterprise-grade encryption and strict access controls.' },
                  { icon: Heart, title: 'Customer Obsession', desc: 'We answer support queries within hours. Our team includes accountants who understand your challenges.' },
                  { icon: Users, title: 'Continuous Improvement', desc: 'We ship updates every two weeks. Our roadmap is driven by what businesses actually need.' },
                ].map((v) => (
                  <div key={v.title} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-3">
                      <v.icon className="h-5 w-5 text-brand" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{v.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80"
                alt="Professional team working in modern office environment"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── OUR TEAM ─── */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-4">
              <span className="text-xs font-semibold text-brand">Our Team</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Meet the People Behind BiasharaLedger</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">A passionate team building the future of business management in Africa.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Enock Shimakabara', role: 'Founder & CEO', bio: 'Full-stack developer and accountant passionate about digitizing African SMEs.' },
              { name: 'Muthoni Wanjiku', role: 'Head of Product', bio: 'Former accountant turned product manager with deep experience in business finance.' },
              { name: 'Kevin Omondi', role: 'Lead Engineer', bio: 'Software engineer specializing in scalable financial systems for the African market.' },
              { name: 'Amina Hassan', role: 'Customer Success', bio: 'Dedicated to ensuring every business gets the most out of BiasharaLedger.' },
            ].map((member) => (
              <div key={member.name} className="bg-white border border-gray-100 rounded-2xl p-6 text-center hover:border-brand/20 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-brand">{member.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900">{member.name}</h3>
                <p className="text-xs text-brand font-semibold mb-2">{member.role}</p>
                <p className="text-sm text-gray-500">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 text-center bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Ready to grow your business?</h2>
          <p className="text-lg text-gray-500 mb-8">Join thousands of businesses using BiasharaLedger to manage their operations.</p>
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

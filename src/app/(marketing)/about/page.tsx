import Link from 'next/link';
import { ArrowRight, Heart, Target, Shield, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div>
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span className="text-xs font-medium text-brand">About Us</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#000000] leading-tight mb-6">
            Accounting Software
            <br />
            <span className="text-brand">by Kenyans, for Kenyans</span>
          </h1>
          <p className="text-lg text-[#000000]/60 max-w-2xl mx-auto mb-10">
            We built BiasharaLedger because Kenyan small businesses deserve accounting tools that understand KRA, M-Pesa, and the real way business works here.
          </p>
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#000000] mb-4">Our Story</h2>
              <div className="space-y-4 text-[#000000]/60 leading-relaxed">
                <p>
                  BiasharaLedger was founded in 2024 by a team of Kenyan software engineers and accountants who
                  saw firsthand how small businesses struggled with expensive, foreign accounting tools that didn't
                  understand the local market.
                </p>
                <p>
                  Most accounting software is built for Western markets — it doesn't handle M-Pesa reconciliation,
                  KRA-compliant invoicing, or PAYE/NHIF/NSSF calculations. Business owners end up juggling
                  spreadsheets, receipts in a box, and manual bank reconciliations.
                </p>
                <p>
                  We set out to build one platform that does it all — proper double-entry accounting, invoicing,
                  payroll, inventory, and financial reporting — designed specifically for the Kenyan market.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-brand/10 to-brand/5 rounded-2xl p-8 text-center">
              <div className="text-6xl font-bold text-brand mb-2">500+</div>
              <p className="text-sm text-[#000000]/60">Businesses Trust Us</p>
              <div className="mt-6 text-6xl font-bold text-brand mb-2">KES 50M+</div>
              <p className="text-sm text-[#000000]/60">Transactions Processed</p>
              <div className="mt-6 text-6xl font-bold text-brand mb-2">4.8</div>
              <p className="text-sm text-[#000000]/60">Average User Rating</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#000000] mb-4">Our Values</h2>
            <p className="text-[#000000]/60 max-w-2xl mx-auto">The principles that guide everything we build.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Target, title: 'Local First', desc: 'Built for Kenyan businesses. KRA compliance, M-Pesa, and local payment methods are first-class features, not afterthoughts.' },
              { icon: Shield, title: 'Security & Trust', desc: 'Your financial data is sacred. We use enterprise-grade encryption, regular backups, and strict access controls.' },
              { icon: Heart, title: 'Customer Obsession', desc: 'We answer support queries within hours, not days. Our team includes accountants who understand your challenges.' },
              { icon: Users, title: 'Continuous Improvement', desc: 'We ship updates every two weeks based on user feedback. Our roadmap is driven by what Kenyan businesses actually need.' },
            ].map((v) => (
              <div key={v.title} className="text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-base font-semibold text-[#000000] mb-2">{v.title}</h3>
                <p className="text-sm text-[#000000]/60">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#000000] mb-4">Our Team</h2>
            <p className="text-[#000000]/60 max-w-2xl mx-auto">A passionate team building the future of Kenyan business accounting.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Enock Shimakabara', role: 'Founder & CEO', bio: 'Full-stack developer and accountant passionate about digitizing Kenyan SMEs.' },
              { name: 'Muthoni Wanjiku', role: 'Head of Product', bio: 'Former accountant turned product manager with deep experience in business finance.' },
              { name: 'Kevin Omondi', role: 'Lead Engineer', bio: 'Software engineer specializing in building scalable financial systems for the African market.' },
              { name: 'Amina Hassan', role: 'Customer Success', bio: 'Dedicated to ensuring every business gets the most out of BiasharaLedger.' },
            ].map((member) => (
              <div key={member.name} className="bg-white border border-border rounded-xl p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-brand">{member.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <h3 className="text-base font-semibold text-[#000000]">{member.name}</h3>
                <p className="text-xs text-brand font-medium mb-2">{member.role}</p>
                <p className="text-sm text-[#000000]/60">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#000000] mb-4">Ready to grow your business?</h2>
          <p className="text-lg text-[#000000]/60 mb-8">Join 500+ Kenyan businesses using BiasharaLedger.</p>
          <Link
            href="/sign-up"
            className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-lg text-base font-semibold transition-colors inline-flex items-center gap-2"
          >
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

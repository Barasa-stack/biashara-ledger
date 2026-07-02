import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHero from '@/components/PageHero';
import type { CityImage } from '@/components/PageHero';

const aboutImages: CityImage[] = [
  { url: '/images/hero/hero-skyscraper-glass-modern.jpg', label: 'Modern Glass Architecture' },
];

export default function AboutPage() {
  return (
    <div>
      <PageHero
        images={aboutImages}
        title={
          <>
            Building the Future of
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-red-300 to-orange-200">
              Business Management
            </span>
          </>
        }
        subtitle="We built BiasharaLedger because businesses deserve tools that understand their market — tax compliance, M-Pesa reconciliation, and the real way business works across Africa."
        badge="About Us"
        badgeWithoutTrust
      />

      {/* ─── OUR STORY ─── */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
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
      </section>

      {/* ─── OUR VALUES ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-4">
              <span className="text-xs font-semibold text-brand">Our values</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 tracking-tight">
              The Principles That Guide Us
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Local First', desc: 'Built for African businesses. Local tax compliance and payment methods are first-class features.' },
                { title: 'Security & Trust', desc: 'Your data is protected with enterprise-grade encryption and strict access controls.' },
                { title: 'Customer Obsession', desc: 'We answer support queries within hours. Our team includes accountants who understand your challenges.' },
                { title: 'Continuous Improvement', desc: 'We ship updates every two weeks. Our roadmap is driven by what businesses actually need.' },
              ].map((v) => (
                <div key={v.title} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{v.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
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

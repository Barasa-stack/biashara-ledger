import Link from 'next/link';
import { ArrowRight, CheckCircle, BarChart3, Shield, Smartphone, Users, FileText, TrendingUp, Star, Quote, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div>
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <span className="text-xs font-medium text-brand">KES Accounting for Kenyan Businesses</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-[#000000] leading-tight mb-6">
              Accounting Software
              <br />
              <span className="text-brand">Built for Kenya</span>
            </h1>
            <p className="text-lg text-[#000000]/60 max-w-2xl mx-auto mb-10">
              BiasharaLedger helps Kenyan small businesses manage bookkeeping, invoicing, payroll, and tax compliance — all in one place.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-lg text-base font-semibold transition-colors inline-flex items-center gap-2"
              >
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/features"
                className="bg-surface hover:bg-brand/10 text-[#000000] border border-border px-8 py-3.5 rounded-lg text-base font-semibold transition-colors"
              >
                View Features
              </Link>
            </div>
            <p className="text-sm text-[#000000]/50 mt-4">14-day free trial &bull; No credit card &bull; Cancel anytime</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#000000] mb-4">Why BiasharaLedger?</h2>
            <p className="text-[#000000]/60 max-w-2xl mx-auto">Purpose-built for the way Kenyan businesses operate.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: 'Double-Entry Bookkeeping', desc: 'Proper accounting with trial balance, P&L, and balance sheet reports.' },
              { icon: FileText, title: 'Invoicing & Quotations', desc: 'Professional invoices, credit notes, and quotations with KRA-compliant formatting.' },
              { icon: Users, title: 'HR & Payroll', desc: 'Employee management, salary processing, payslips, and PAYE calculations.' },
              { icon: Smartphone, title: 'M-Pesa Integration', desc: 'Accept payments via M-Pesa. Automatic reconciliation with invoices.' },
              { icon: TrendingUp, title: 'Financial Reports', desc: 'Cash flow statements, aging reports, expense analysis, and inventory valuation.' },
              { icon: Shield, title: 'Multi-User Access', desc: 'Role-based access for admins, accountants, HR managers, and employees.' },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-border rounded-xl p-6 hover:border-brand/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="text-base font-semibold text-[#000000] mb-2">{item.title}</h3>
                <p className="text-sm text-[#000000]/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#000000] mb-4">Trusted by Kenyan Business Owners</h2>
            <p className="text-[#000000]/60 max-w-2xl mx-auto">See what our customers have to say.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: 'BiasharaLedger has completely transformed how we manage our books. M-Pesa reconciliation alone saves us 5 hours every week.', name: 'Jane Wanjiku', role: 'Owner, Mama Mboga Groceries', rating: 5 },
              { quote: 'The payroll features are a lifesaver. PAYE calculations used to take me hours. Now it\'s automated and I never make mistakes.', name: 'Peter Kamau', role: 'Accountant, Kamau Enterprises', rating: 5 },
              { quote: 'I tried QuickBooks and Zoho but they don\'t understand Kenyan accounting. BiasharaLedger just gets it.', name: 'Grace Akinyi', role: 'CFO, Lake Basin Traders', rating: 5 },
            ].map((t) => (
              <div key={t.name} className="bg-surface border border-border rounded-xl p-6">
                <Quote className="h-8 w-8 text-brand/20 mb-3" />
                <p className="text-sm text-[#000000]/70 mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#000000]">{t.name}</p>
                  <p className="text-xs text-[#000000]/50">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#000000] mb-4">See BiasharaLedger in Action</h2>
              <p className="text-[#000000]/60 mb-6">
                Our intuitive dashboard gives you a complete view of your business finances at a glance.
                Track revenue, expenses, cash flow, and key metrics — all from one screen.
              </p>
              <ul className="space-y-2">
                {[
                  'Real-time revenue and expense tracking',
                  'Cash flow monitoring with forecasts',
                  'Accounts receivable & payable aging',
                  'Profit & loss and balance sheet reports',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#000000]/70">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-hover transition-colors"
              >
                Start your free trial <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="bg-gradient-to-br from-brand/10 to-brand/5 rounded-2xl p-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-brand/40 mx-auto mb-3" />
                <p className="text-sm text-[#000000]/40">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-[#000000] mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-[#000000]/60">Plans for every stage of your business growth.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Basic', price: '1,500', period: 'month', desc: 'Essential accounting for solopreneurs.', features: ['Bookkeeping', 'Invoicing', 'P&L & Balance Sheet', 'Trial Balance'] },
              { name: 'Standard', price: '3,000', period: 'month', desc: 'Growing businesses with teams.', features: ['Everything in Basic', 'HR & Payroll', 'General Ledger', 'Inventory', 'Multi-User Access'], popular: true },
              { name: 'Premium', price: '5,000', period: 'month', desc: 'Full access for established businesses.', features: ['Everything in Standard', 'API Access', 'Multi-Branch', 'Priority Support'] },
            ].map((plan) => (
              <div key={plan.name} className={`relative bg-white border-2 rounded-xl p-6 ${plan.popular ? 'border-brand md:-mt-4' : 'border-border'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-[#000000]">{plan.name}</h3>
                <p className="text-sm text-[#000000]/60 mt-1">{plan.desc}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-[#000000]">KES {plan.price}</span>
                  <span className="text-sm text-[#000000]/60 ml-1">/{plan.period}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-[#000000]">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link
                  href="/sign-up"
                  className={`mt-6 w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-brand hover:bg-brand-hover text-white'
                      : 'bg-surface hover:bg-brand/10 text-[#000000] border border-border'
                  }`}
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#000000] text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Is BiasharaLedger suitable for my business?', a: 'If you\'re a Kenyan small business owner who needs bookkeeping, invoicing, payroll, or inventory management — yes. We serve retail shops, service providers, manufacturers, and professional firms.' },
              { q: 'How does the free trial work?', a: 'You get full access to all features for 14 days. No credit card required. At the end of the trial, choose a plan that fits your business.' },
              { q: 'Can I import my existing data?', a: 'Yes. We support importing data from Excel/CSV files. Our onboarding team can help you migrate from QuickBooks, Zoho Books, or spreadsheets.' },
              { q: 'Do you handle M-Pesa payments?', a: 'Yes. Connect your M-Pesa paybill/till number and invoices are automatically reconciled when payments come in.' },
              { q: 'Is my financial data secure?', a: 'Absolutely. All data is encrypted at rest (AES-256-GCM) and in transit (TLS 1.3). We perform daily backups and our infrastructure is ISO 27001 certified.' },
              { q: 'Can I cancel anytime?', a: 'Yes. No long-term contracts. Cancel anytime and your data remains accessible for the remainder of your billing period.' },
            ].map((faq) => (
              <details key={faq.q} className="border border-border rounded-xl overflow-hidden">
                <summary className="px-5 py-4 text-sm font-semibold text-[#000000] cursor-pointer hover:bg-surface transition-colors">
                  {faq.q}
                </summary>
                <div className="px-5 py-4 text-sm text-[#000000]/60 border-t border-border">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-[#000000] mb-4">Ready to streamline your accounting?</h2>
          <p className="text-lg text-[#000000]/60 mb-8 max-w-2xl mx-auto">
            Join hundreds of Kenyan businesses using BiasharaLedger. Start your free trial today.
          </p>
          <Link
            href="/sign-up"
            className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-lg text-base font-semibold transition-colors inline-flex items-center gap-2"
          >
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-sm text-[#000000]/50 mt-4">14-day free trial &bull; No credit card required</p>
        </div>
      </section>
    </div>
  );
}

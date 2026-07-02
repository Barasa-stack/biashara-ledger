import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHero, { defaultCityImages } from '@/components/PageHero';

const categories = [
  {
    title: 'Accounting & Bookkeeping',
    desc: 'Full double-entry accounting with KRA-compliant reporting.',
    features: [
      { title: 'Double-Entry Bookkeeping', desc: 'Full double-entry accounting with automatic trial balance, profit & loss, and balance sheet reports. KRA-compliant chart of accounts included.' },
      { title: 'Financial Reports', desc: 'Generate cash flow statements, aging reports, expense analysis, inventory valuation, and budget vs actual comparisons.' },
      { title: 'Audit Trail', desc: 'Complete audit log of all financial transactions, user actions, and data changes for compliance and transparency.' },
    ],
  },
  {
    title: 'Sales & Invoicing',
    desc: 'Professional invoices and payment tracking.',
    features: [
      { title: 'Invoicing & Quotations', desc: 'Create professional invoices, quotations, and credit notes with automatic numbering, KRA-compliant formatting, and PDF export.' },
      { title: 'M-Pesa Integration', desc: 'Accept payments via M-Pesa paybill. Automatic reconciliation with outstanding invoices and real-time payment tracking.' },
      { title: 'Sales Analytics', desc: 'Track sales performance, customer payment patterns, and revenue trends with visual dashboards and exportable reports.' },
    ],
  },
  {
    title: 'Expenses & Purchases',
    desc: 'Track every shilling going out.',
    features: [
      { title: 'Expense Tracking', desc: 'Record and categorize all business expenses. Attach receipts, track tax-deductible items, and monitor spending by category.' },
      { title: 'Purchase Orders', desc: 'Create and manage purchase orders, track supplier deliveries, and maintain a complete purchase history.' },
      { title: 'Inventory Management', desc: 'Track stock levels, manage reorder points, and get automated alerts when inventory runs low. Supports FIFO and weighted average costing.' },
    ],
  },
  {
    title: 'HR, Payroll & Access',
    desc: 'Manage your team and control access.',
    features: [
      { title: 'HR & Payroll', desc: 'Manage employees, process salaries, generate payslips, and calculate PAYE, NSSF, and NHIF deductions automatically.' },
      { title: 'Multi-User Access', desc: 'Role-based access control for admins, accountants, HR managers, and employees. Granular permissions for every feature.' },
      { title: 'Multi-Branch Support', desc: 'Manage multiple business branches or locations under one account. Consolidated or per-branch reporting.' },
    ],
  },
  {
    title: 'Data & Security',
    desc: 'Your data is safe and always accessible.',
    features: [
      { title: 'Data Export', desc: 'Export all reports to PDF, Excel, CSV, or Word. Print invoices and statements directly from the dashboard.' },
      { title: 'Data Encryption', desc: 'End-to-end encryption for sensitive employee and financial data. AES-256-GCM encryption at rest.' },
      { title: 'Automatic Backups', desc: 'Daily automated backups with point-in-time recovery. Your data is never more than 24 hours old.' },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div>
      <PageHero
        images={defaultCityImages}
        title={
          <>
            Everything You Need to
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-red-300 to-orange-200">Run Your Business</span>
          </>
        }
        subtitle="From bookkeeping to payroll, BiasharaLedger provides all the tools Kenyan SMEs need in one platform."
        badge="All Features"
        badgeWithoutTrust
      />

      {categories.map((cat, i) => (
        <section key={cat.title} className={`py-16 ${i % 2 === 0 ? 'bg-white' : 'bg-surface'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-[#000000] mb-2">{cat.title}</h2>
              <p className="text-[#000000]/60">{cat.desc}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cat.features.map((f) => (
                <div key={f.title} className="bg-white border border-border rounded-xl p-6 hover:border-brand/30 transition-colors">
                  <h3 className="text-base font-semibold text-[#000000] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#000000]/60">{f.desc}</p>
                </div>
              ))}
            </div>
            {i === 0 && (
              <div className="mt-8 bg-gradient-to-br from-brand/5 to-brand/10 rounded-xl p-6 text-center">
                <span className="text-sm text-[#000000]/70">Dashboard showing real-time P&L, cash flow, and key metrics</span>
              </div>
            )}
          </div>
        </section>
      ))}

        <section className="py-16 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-lg text-white/60 mb-8">Start your 14-day free trial. No credit card required.</p>
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

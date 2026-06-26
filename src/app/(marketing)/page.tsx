import Link from 'next/link';
import { ArrowRight, CheckCircle, Building2, Factory, HardHat, BarChart3, Users, TrendingUp, Star, Quote, ChevronRight, Shield, Clock, HeadphonesIcon, Globe, Leaf, GraduationCap, Stethoscope, ShoppingBag, Truck, Warehouse } from 'lucide-react';

const industries = [
  { icon: Building2, name: 'Real Estate', desc: 'Property management, tenant billing, contractor payments', color: 'from-blue-600/20 to-blue-600/5' },
  { icon: HardHat, name: 'Construction', desc: 'Project costing, material procurement, subcontractor payroll', color: 'from-amber-600/20 to-amber-600/5' },
  { icon: Factory, name: 'Manufacturing', desc: 'Production costing, inventory, supply chain accounting', color: 'from-emerald-600/20 to-emerald-600/5' },
  { icon: BarChart3, name: 'Financial Services', desc: 'Portfolio tracking, regulatory compliance, audit trails', color: 'from-purple-600/20 to-purple-600/5' },
  { icon: ShoppingBag, name: 'Retail & E-commerce', desc: 'POS integration, stock management, supplier payments', color: 'from-rose-600/20 to-rose-600/5' },
  { icon: Truck, name: 'Logistics', desc: 'Fleet expenses, route costing, driver payroll, fuel tracking', color: 'from-sky-600/20 to-sky-600/5' },
  { icon: Stethoscope, name: 'Healthcare', desc: 'Patient billing, insurance claims, medical supply inventory', color: 'from-teal-600/20 to-teal-600/5' },
  { icon: GraduationCap, name: 'Education', desc: 'Fee management, payroll for staff, grant accounting', color: 'from-indigo-600/20 to-indigo-600/5' },
  { icon: Warehouse, name: 'Agriculture', desc: 'Crop costing, harvest tracking, cooperative accounting', color: 'from-green-600/20 to-green-600/5' },
  { icon: Globe, name: 'Professional Services', desc: 'Project billing, time tracking, expense reporting', color: 'from-violet-600/20 to-violet-600/5' },
];

const stats = [
  { value: '12,500+', label: 'Businesses onboarded' },
  { value: 'KES 2.8B', label: 'Transactions processed' },
  { value: '47+', label: 'Industries served' },
  { value: '99.9%', label: 'Platform uptime' },
];

const testimonials = [
  {
    quote: 'We manage 14 concurrent construction sites across Nairobi, Mombasa, and Kisumu. BiasharaLedger gives us real-time project costing, material procurement tracking, and subcontractor payroll — all from one dashboard. It revolutionized our financial operations.',
    name: 'Eng. James Kiprop',
    role: 'Finance Director, Seven Stones Construction Ltd',
    company: 'Seven Stones Construction',
    industry: 'Construction',
    rating: 5,
    image: null,
  },
  {
    quote: 'As a manufacturing firm with 200+ SKUs, we needed an accounting system that understood Kenyan tax law. BiasharaLedger\'s automated VAT calculations, excise duty tracking, and KRA-compliant reporting saved us from a costly audit. This is enterprise-grade software at an SME price.',
    name: 'Dr. Faith Nyambura',
    role: 'CFO, Nairobi Food Industries Ltd',
    company: 'Nairobi Food Industries',
    industry: 'Manufacturing',
    rating: 5,
    image: null,
  },
  {
    quote: 'We migrated from Sage 50 and never looked back. BiasharaLedger handles our multi-branch accounting, inter-company transfers, consolidated reporting, and M-Pesa reconciliation across 5 retail outlets. The onboarding team migrated 7 years of historical data in under 48 hours.',
    name: 'Samuel Ochieng',
    role: 'Group Accountant, Mombasa Retail Holdings',
    company: 'Mombasa Retail Holdings',
    industry: 'Retail',
    rating: 5,
    image: null,
  },
];

const features = [
  {
    title: 'Multi-Entity Consolidation',
    desc: 'Manage multiple companies, branches, or cost centers from one login. Generate consolidated financial statements with elimination entries automatically.',
    icon: Building2,
  },
  {
    title: 'Industry-Specific Automation',
    desc: 'Construction project accounting, manufacturing job costing, retail inventory valuation, service revenue recognition — tailored for your sector.',
    icon: Factory,
  },
  {
    title: 'Real-Time Consolidation',
    desc: 'Cash flow, P&L, balance sheet, and KPIs updated in real time. Drill down from group-level to transaction-level in one click.',
    icon: TrendingUp,
  },
  {
    title: 'Integrated Payroll & HR',
    desc: 'PAYE, NSSF, NHIF, Housing Levy, and SHIF calculated automatically. Digital payslips, statutory filings, and approval workflows included.',
    icon: Users,
  },
  {
    title: 'Bank & M-Pesa Reconciliation',
    desc: 'Connect MPESA paybill/till, bank accounts, and credit cards. Transactions match automatically. AI suggests categorizations based on history.',
    icon: Shield,
  },
  {
    title: 'Enterprise-Grade Security',
    desc: 'AES-256-GCM encryption, role-based access controls, audit trails, IP whitelisting, and SOC 2 compliance. ISO 27001 certified data centers.',
    icon: Clock,
  },
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#1a1a1a] overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand/5 blur-[100px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium text-white/70">Trusted by 12,500+ businesses across 47 industries</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight">
                Enterprise-Grade
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-red-300 to-brand">Accounting for Africa</span>
              </h1>
              <p className="text-lg text-white/50 max-w-xl leading-relaxed">
                BiasharaLedger powers finance teams at construction firms, manufacturers, banks, hospitals, schools, and retail chains across Kenya. Multi-entity, multi-currency, multi-industry — one platform.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/sign-up"
                  className="bg-brand hover:bg-brand-hover text-white px-8 py-4 rounded-xl text-base font-semibold transition-all hover:shadow-lg hover:shadow-brand/25 inline-flex items-center gap-2 group"
                >
                  Start Free Trial <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/features"
                  className="text-white/60 hover:text-white border border-white/10 hover:border-white/20 px-8 py-4 rounded-xl text-base font-semibold transition-all inline-flex items-center gap-2"
                >
                  Watch Demo <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-white/40 pt-4">
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> No credit card</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> 14-day free trial</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Cancel anytime</div>
              </div>
            </div>

            {/* Hero Image — City Skyline + Dashboard Preview */}
            <div className="hidden lg:block relative">
              <div className="relative z-10">
                {/* City Buildings */}
                <div className="relative h-[520px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] border border-white/10 shadow-2xl shadow-brand/5">
                  {/* Skyline Buildings */}
                  <div className="absolute bottom-0 left-0 right-0 h-[65%] flex items-end gap-1.5 px-4 pb-4">
                    {[18, 32, 24, 44, 20, 50, 28, 38, 16, 48, 22, 34, 40, 26, 52, 30, 20, 36, 44, 28, 46, 32, 24, 50, 18].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm relative group"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-white/5 to-transparent rounded-t-sm transition-all duration-300" />
                        {/* Windows */}
                        <div className="absolute inset-2 grid grid-cols-2 gap-1.5 content-start pt-2 opacity-40">
                          {Array.from({ length: Math.floor(height / 10) }).map((_, j) => (
                            <div key={j} className="h-1.5 rounded-sm bg-amber-300/60" />
                          ))}
                        </div>
                        {/* Brand overlay on hover */}
                        <div className="absolute inset-0 bg-brand/0 hover:bg-brand/10 transition-all duration-300 rounded-t-sm" />
                      </div>
                    ))}
                  </div>

                  {/* Glowing dashboard panel overlay */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[85%] bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 shadow-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-brand" />
                        <span className="text-xs text-white/60 font-medium">Dashboard Overview</span>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-[10px] text-white/40">Revenue</p>
                        <p className="text-sm font-bold text-green-400">KES 2.4M</p>
                        <p className="text-[10px] text-green-400/60">+12.5%</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-[10px] text-white/40">Expenses</p>
                        <p className="text-sm font-bold text-white">KES 1.1M</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-[10px] text-white/40">Net Profit</p>
                        <p className="text-sm font-bold text-amber-400">KES 1.3M</p>
                      </div>
                    </div>
                    <div className="h-6 bg-white/5 rounded-lg flex items-center justify-center">
                      <div className="w-[90%] h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-[73%] h-full bg-gradient-to-r from-brand to-red-400 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Floating badges */}
                  <div className="absolute bottom-24 right-6 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      1,247 transactions today
                    </div>
                  </div>
                  <div className="absolute top-32 left-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-green-400" />
                      SOC 2 Compliant
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow behind the image */}
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-brand/20 blur-[100px] rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="py-12 bg-white border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-gray-400 text-center uppercase tracking-widest font-medium mb-8">Trusted by finance teams at</p>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-8 items-center justify-items-center opacity-40">
            {['Seven Stones Construction', 'Nairobi Food Industries', 'Mombasa Retail Holdings', 'Lake Basin Traders', 'Kamau Enterprises', 'East Africa Logistics', 'Coastal Properties Ltd', 'Highlands Agribusiness'].map((name) => (
              <div key={name} className="text-xs font-semibold text-gray-500 text-center leading-tight tracking-tight">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center group">
                <p className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand to-red-500 mb-2 group-hover:scale-105 transition-transform">{stat.value}</p>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INDUSTRIES ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-medium text-brand">Built for every industry</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              One Platform. Every Sector.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              From construction sites in Nairobi to manufacturing plants in Athi River, retail chains in Mombasa to hospitals in Kisumu — our industry-specific modules adapt to how you work.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {industries.map((industry) => (
              <div
                key={industry.name}
                className="group relative bg-gray-50 hover:bg-white border border-gray-100 hover:border-brand/20 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${industry.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <industry.icon className="h-6 w-6 text-gray-700" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{industry.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{industry.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-400 mb-4">Don&apos;t see your industry? We probably serve it.</p>
            <Link href="/contact" className="text-brand text-sm font-semibold hover:text-brand-hover inline-flex items-center gap-1">
              Talk to our team <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-medium text-brand">Why enterprises choose us</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Accounting Infrastructure for Africa
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Purpose-built for the complexity of African business — multi-entity structures, diverse tax regimes, informal supply chains, and rapid growth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white border border-gray-100 rounded-2xl p-8 hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-medium text-brand">Client success stories</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Trusted by Industry Leaders
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              From construction giants to manufacturing powerhouses — see how Kenyan businesses run on BiasharaLedger.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-gray-50 border border-gray-100 rounded-2xl p-8 hover:border-brand/20 transition-all duration-300 hover:shadow-lg flex flex-col">
                {/* Industry badge */}
                <div className="inline-flex items-center gap-1.5 bg-brand/5 text-brand text-xs font-semibold px-3 py-1 rounded-full self-start mb-4">
                  <Factory className="h-3 w-3" />
                  {t.industry}
                </div>
                <Quote className="h-8 w-8 text-brand/20 mb-4" />
                <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center text-sm font-bold text-brand">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DASHBOARD PREVIEW ─── */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5">
                <span className="text-xs font-medium text-brand">See it in action</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                A Command Center for Your Entire Operation
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                One dashboard to monitor revenue, expenses, cash flow, project profitability, payroll costs, and tax obligations across all your entities — updated in real time.
              </p>
              <ul className="space-y-4">
                {[
                  'Multi-entity financial consolidation with inter-company eliminations',
                  'Real-time cash flow forecasting with scenario modeling',
                  'Automated revenue recognition per ASC 606 / IFRS 15',
                  'AI-powered anomaly detection and fraud prevention',
                  'Custom report builder with drag-and-drop interface',
                  'Board-ready presentations generated in one click',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 text-brand font-semibold text-sm hover:text-brand-hover transition-colors group mt-4"
              >
                Start your free trial <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="relative">
              {/* Dashboard mockup */}
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-xs text-gray-400 ml-2 font-mono">biasharaledger.com/dashboard</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    Live
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">KES 8,423,500</p>
                      <p className="text-xs text-green-600 font-medium">+18.3% vs last month</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-600">1M</div>
                      <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-600">3M</div>
                      <div className="bg-brand text-white rounded-lg px-3 py-2 text-xs font-semibold">6M</div>
                      <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-600">1Y</div>
                    </div>
                  </div>
                  {/* Chart bars */}
                  <div className="flex items-end gap-3 h-32 pt-4">
                    {[40, 55, 45, 70, 60, 85, 65, 90, 75, 95, 80, 100].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full bg-gradient-to-t from-brand/80 to-brand/30 rounded-t-md transition-all duration-300 group-hover:from-brand cursor-pointer"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[10px] text-gray-400 font-medium">J{String(i + 1).padStart(2, '0')}</span>
                      </div>
                    ))}
                  </div>
                  {/* Bottom metrics */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    {[
                      { label: 'Cash Flow', value: 'KES 2.1M', change: '+8.2%', positive: true },
                      { label: 'Gross Margin', value: '64.3%', change: '+2.1%', positive: true },
                      { label: 'AR Aging', value: '23 days', change: '-3 days', positive: true },
                    ].map((m) => (
                      <div key={m.label}>
                        <p className="text-xs text-gray-400">{m.label}</p>
                        <p className="text-sm font-bold text-gray-900">{m.value}</p>
                        <p className={`text-xs ${m.positive ? 'text-green-600' : 'text-red-500'}`}>{m.change}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-3 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <HeadphonesIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">24/7 Support</p>
                    <p className="text-[10px] text-gray-400">Dedicated account manager</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-3 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">SOC 2 Type II</p>
                    <p className="text-[10px] text-gray-400">Certified security</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#1a1a1a] relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand/5 blur-[100px]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-white/70">Join 12,500+ businesses</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Ready to Transform Your Finance Operations?
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join the growing number of African enterprises that have modernized their accounting with BiasharaLedger. Free trial, no commitment, dedicated onboarding.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="bg-brand hover:bg-brand-hover text-white px-8 py-4 rounded-xl text-base font-semibold transition-all hover:shadow-lg hover:shadow-brand/25 inline-flex items-center gap-2 group"
            >
              Start Free Trial <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="text-white/60 hover:text-white border border-white/10 hover:border-white/20 px-8 py-4 rounded-xl text-base font-semibold transition-all inline-flex items-center gap-2"
            >
              Talk to Sales <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-white/40 mt-8">
            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> 14-day free trial</div>
            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Dedicated onboarding</div>
            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Cancel anytime</div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-500">Everything you need to know about BiasharaLedger.</p>
          </div>
          <div className="space-y-3">
            {[
              { q: 'How does BiasharaLedger handle multi-entity accounting?', a: 'You can manage unlimited companies, branches, or cost centers from one login. Each entity maintains its own books while supporting inter-company transactions, consolidated reporting, and elimination entries — all automated.' },
              { q: 'Is BiasharaLedger suitable for my industry?', a: 'We have specialized modules for 47+ industries including construction (project costing, subcontractor mgmt), manufacturing (BOM, job costing, inventory valuation), retail (POS integration, multi-branch), financial services (portfolio tracking, compliance), healthcare (patient billing, insurance), and more.' },
              { q: 'How does the migration work?', a: 'Our onboarding team handles the full migration. We support data import from Excel/CSV, QuickBooks, Sage 50, Zoho Books, and Xero. Historical data is migrated, mapped, and verified before you go live — typically within 48 hours.' },
              { q: 'What about tax compliance?', a: 'We handle KRA compliance including VAT (16%), withholding VAT, income tax, PAYE, NSSF, NHIF, Housing Levy, and SHIF. Automated tax calculations, statutory reports, and KRA-format exports for all returns.' },
              { q: 'How secure is my financial data?', a: 'Data is encrypted at rest (AES-256-GCM) and in transit (TLS 1.3). We maintain SOC 2 Type II certification, perform daily encrypted backups, and offer IP whitelisting, MFA, and role-based access controls. Our data centers are ISO 27001 certified.' },
              { q: 'Can I integrate with my existing systems?', a: 'Yes. We offer REST APIs, webhooks, and pre-built integrations with M-Pesa, banks, POS systems, payroll providers, CRMs, and ERP platforms. Our integration team can build custom connectors for enterprise clients.' },
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

import { NextResponse } from 'next/server';

const KB = {

  intro:
    "BiasharaLedger is a cloud and desktop business management platform for businesses worldwide. It covers inventory, sales & POS, accounting, payroll, CRM, reporting, and more. Built by software engineers and accountants who understand local tax compliance, mobile money reconciliation, and how business actually works across markets like Kenya, Nigeria, South Africa, and beyond.",

  company: {
    story:
      "BiasharaLedger was founded by software engineers and accountants who saw firsthand how businesses struggled with expensive foreign tools that didn't understand local markets. Most business software is built for Western markets — it doesn't handle local tax compliance, mobile money reconciliation, or the way business actually works in Africa and other regions. Owners end up juggling spreadsheets, paper receipts, and manual bank reconciliations. BiasharaLedger was built to solve this.",
    values: [
      "Local First — local compliance, multi-currency, and payment methods as first-class features",
      "Security & Trust — enterprise-grade encryption and strict access controls",
      "Customer Obsession — support queries answered within hours; the team includes accountants who understand your challenges",
      "Continuous Improvement — updates every two weeks; roadmap driven by what businesses actually need",
    ],
    stats: "12,500+ businesses served across 47+ countries, processing 28M+ daily transactions and 4.2M+ invoices generated.",
  },

  pricing: [
    {
      name: 'Basic',
      price: 'KES 600/month',
      yearlyPrice: 'KES 6,000/year',
      desc: 'Complete accounting and inventory for small businesses.',
      popular: false,
      features: [
        'Double-entry bookkeeping',
        'Sales: invoices, quotations, payments, credit notes',
        'Purchases: orders, invoices, debit notes',
        'Expense tracking & categorization',
        'Chart of Accounts & Journal Entries',
        'Financial Reports: P&L, Balance Sheet, Cash Flow',
        'Trial Balance, General Ledger, Aging reports',
        'Tax Reports, Budget vs Actual, Audit Trail',
        'Banking: accounts, reconciliation',
        'Inventory: stock items, valuation',
        'Fixed Assets & depreciation',
        'Multi-currency support',
        'Customer & supplier management',
      ],
    },
    {
      name: 'Standard',
      price: 'KES 1,000/month',
      yearlyPrice: 'KES 10,000/year',
      desc: 'Best for growing businesses. Includes everything in Basic plus CRM.',
      popular: true,
      features: [
        'Everything in Basic',
        'CRM Pipeline & Deal management',
        'Lead tracking & scoring',
        'CRM Activities & analytics',
        'Enhanced customer view',
      ],
    },
    {
      name: 'Premium',
      price: 'KES 1,500/month',
      yearlyPrice: 'KES 15,000/year',
      desc: 'For established businesses needing HR, payroll, projects, and automation.',
      popular: false,
      features: [
        'Everything in Standard',
        'HR & Payroll: employees, attendance, leave',
        'Salary processing & payslip generation',
        'Payroll Reports: P9, deduction summaries',
        'Project costing & management',
        'Automation: recurring transactions, approval workflows',
        'API Keys & Webhooks',
      ],
    },
    {
      name: 'Custom',
      price: 'Varies',
      desc: 'Choose any combination of modules: Core Accounting, Inventory, CRM, HR & Payroll, Projects, Automation & API Access.',
      popular: false,
    },
  ],

  hosting: [
    { name: 'Free Tier', storage: '0.5 GB', price: 'KES 0' },
    { name: 'Starter Hosting', storage: '5 GB', price: 'KES 750/month', popular: true },
    { name: 'Growth Hosting', storage: '20 GB', price: 'KES 2,250/month' },
    { name: 'Enterprise Hosting', storage: '100 GB+', price: 'Custom pricing' },
  ],

  backup: [
    { name: 'Basic Backup', price: 'KES 750/month', desc: 'Daily snapshots up to 10 GB, 7-day retention' },
    { name: 'Advanced Backup', price: 'KES 2,250/month', desc: 'Real-time continuous backups, 30-day retention, multi-server redundancy', popular: true },
  ],

  trial: "All plans come with a 3-day free trial — no credit card required. All features are included during the trial period. Sign up at /sign-up to get started.",

  features: {
    core: [
      'Dashboard — real-time business overview with KPIs',
      'Inventory Management — real-time stock tracking, low-stock alerts, barcode scanning, multi-warehouse support, inventory valuation',
      'Sales & POS — fast point-of-sale with customer management, receipts, integrated payments, quotations, invoices, credit notes',
      'Purchases — purchase orders, purchase invoices, debit notes, supplier payments',
      'Accounting — double-entry accounting, general ledger, trial balance, financial statements (P&L, Balance Sheet, Cash Flow)',
      'Expense Tracking — capture and categorize expenses, receipt scanning, approval workflows',
      'Banking — bank accounts, reconciliation, transaction matching',
      'Chart of Accounts — customizable GL accounts with asset, liability, equity, revenue, expense types',
      'Journal Entries — manual entries with line items and audit trail',
      'Fixed Assets — asset tracking with straight-line and declining balance depreciation',
      'Multi-currency — support for 21+ currencies including KES, USD, UGX, TZS, NGN, ZAR, EUR, GBP',
      'VAT/GST Compliance — tax rates for 83 countries including Kenya 16%, Nigeria 7.5%, South Africa 15%, UK 20%',
      'Customer Management — customer database, communication history, credit limits, loyalty programs',
      'Supplier Management — vendor records, purchase orders, supplier payments, performance ratings',
    ],
    crm: [
      'CRM Pipeline & Deal management — track deals through stages: Lead → Qualified → Proposal → Negotiation → Closed Won/Lost',
      'Lead tracking & scoring',
      'CRM Activities & analytics',
      'Enhanced customer view with communication history',
    ],
    hr: [
      'Employee Management — records, attendance, leave, performance tracking',
      'Payroll — automated payroll with Kenyan statutory deductions',
      'PAYE calculation — progressive tax brackets: 10% up to KES 24,000, 25% up to KES 32,333, 30% up to KES 500,000, 32.5% up to KES 800,000, 35% above',
      'Personal Relief: KES 2,400/month, Insurance Relief: 15% of premium up to KES 5,000/month',
      'NSSF — 6% employee + 6% employer (Phase 4, Feb 2026): Tier I max KES 540, Tier II max KES 5,940 per side',
      'SHIF — 2.75% of gross salary (replaced NHIF from July 2024)',
      'Affordable Housing Levy — 1.5% of gross salary',
      'Payslips, P9 forms, deduction summaries',
      'Leave management: 21 days annual, 30 days sick, 12 weeks maternity, 2 weeks paternity',
      'Employment types: full-time, part-time, contract, intern, casual',
    ],
    advanced: [
      'Projects — project costing, management, and transaction tracking',
      'Automation — recurring transactions, approval workflows',
      'API Keys & Webhooks — integrate with external systems',
      'Budgets — create and track budgets vs actuals',
      'Financial Reports — P&L, Balance Sheet, Cash Flow, Trial Balance, General Ledger, Receivables Aging, Payables Aging, Expense Report, Sales Report, Inventory Valuation, Budget vs Actual, Owner\'s Equity, Tax Report, Audit Trail',
    ],
    platform: [
      'Cloud Sync — secure cloud backup with real-time sync across all devices',
      'Offline Desktop — full functionality without internet, auto-syncs when reconnected',
      'Mobile access — access your business from anywhere via browser',
      'Multi-branch — manage multiple locations from one account with centralized reporting',
      'AES-256 encryption for data at rest and in transit',
      'Role-based access control — admin, hr_manager, accountant, employee roles',
    ],
  },

  industries: [
    'Retail Shops & Supermarkets',
    'Hardware Stores',
    'Pharmacies',
    'Restaurants & Hospitality',
    'Wholesalers & Distributors',
    'Manufacturers',
    'Bookshops & Stationery',
    'Electronics Stores',
    'Fashion & Clothing Stores',
    'Agribusiness & Agriculture',
    'Healthcare & Medical Practices',
    'E-commerce businesses',
    'Education & Schools',
    'Construction & Building Materials',
  ],

  plans: {
    basic: 'core-accounting, financial-reports, inventory',
    standard: 'core-accounting, financial-reports, inventory, crm',
    premium: 'core-accounting, financial-reports, inventory, crm, hr-payroll, projects, automation, api-access',
    custom: 'configurable — pick any combination of modules',
  },

  billing: {
    methods: 'We accept M-Pesa (preferred), credit/debit cards, and bank transfers for annual plans.',
    cycle: 'Choose monthly or yearly billing. Yearly saves approximately 17% (pay for 10 months, get 12).',
    trial: '3-day free trial with no credit card required. All features included.',
  },

  support: {
    email: 'support@biasharaledger.com — our team typically responds within 24 hours',
    phone: '+254 115 804 761 — Mon-Fri, 8:00 AM - 6:00 PM EAT',
    office: 'Nairobi, Kenya',
    contact_form: 'Available on the /contact page',
    response_time: 'Support queries answered within hours. The team includes accountants who understand your challenges.',
  },

  desktop: "Desktop and mobile apps for Windows, macOS, Linux, and Android are coming soon. They will offer offline mode, automatic sync when online, desktop notifications, keyboard shortcuts, and local file backups. In the meantime, you can use all BiasharaLedger features online from any browser at /dashboard.",

  onboarding: "After signing up at /sign-up, you get instant access to the dashboard. Your 3-day trial starts immediately. You can set up your company profile, add inventory items, create customers, and start recording sales. The system includes a chart of accounts pre-configured for your region.",

  security: "BiasharaLedger uses AES-256 encryption for data at rest and in transit. Features include enterprise-grade access controls, automatic backups, secure cloud storage, offline protection, license security, regular updates, and compliance readiness. The platform is built on Cloudflare infrastructure with DDoS protection.",

  faq: [
    { q: 'Can I upgrade or downgrade my plan?', a: 'Yes, you can change your plan at any time. Upgrades take effect immediately (prorated difference charged). Downgrades take effect at the next billing cycle.' },
    { q: 'Is there a free trial?', a: 'Yes, all plans include a 3-day free trial with no credit card required. All features are included during the trial.' },
    { q: 'Do you offer discounts for annual billing?', a: 'Yes, choose annual billing and save approximately 17% — pay for 10 months, get 12.' },
    { q: 'What payment methods do you accept?', a: 'We accept M-Pesa (preferred), credit/debit cards, and bank transfers for annual plans.' },
    { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel anytime from your account settings. You continue to have access until the end of your billing period.' },
    { q: 'Do you offer custom plans?', a: 'Yes, for organizations with specific needs, we offer custom pricing. You choose any combination of modules.' },
    { q: 'How does sync work?', a: 'Your data syncs automatically across all devices in real time. The desktop app works offline and syncs when reconnected.' },
    { q: 'Which industries do you serve?', a: 'BiasharaLedger serves retail, supermarkets, hardware stores, pharmacies, restaurants, wholesale, manufacturing, bookshops, electronics, fashion, agribusiness, healthcare, education, construction, e-commerce, and more.' },
    { q: 'How secure is my data?', a: 'Your data is encrypted with AES-256, stored securely on Cloudflare infrastructure, and backed up automatically. We use strict access controls and regular security updates.' },
    { q: 'How does the license system work?', a: 'After subscribing, you receive a license key (format: BL-YYYY-UUID-HMAC). You can activate it online through your account or offline via a signed license file for the desktop app.' },
    { q: 'What are the PAYE tax brackets?', a: 'Kenyan PAYE brackets: 10% up to KES 24,000, 25% up to KES 32,333, 30% up to KES 500,000, 32.5% up to KES 800,000, 35% above KES 800,000. Personal relief: KES 2,400/month.' },
    { q: 'What are NSSF rates?', a: 'NSSF Phase 4 (Feb 2026): 6% employee + 6% employer. Tier I: first KES 9,000 (max KES 540/side). Tier II: KES 9,001-108,000 (max KES 5,940/side). Combined max: KES 6,480/side.' },
    { q: 'What is SHIF?', a: 'SHIF (Social Health Insurance Fund) replaced NHIF from July 2024. It is 2.75% of gross salary.' },
    { q: 'What is the Affordable Housing Levy?', a: 'AHL is 1.5% of gross salary. The employer matches this contribution.' },
  ],
};

function getRelevantContext(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi ') || lower.includes('hey') || lower.includes('good')) {
    return "Hello! Welcome to BiasharaLedger. I can help you with pricing, features, plans, industries, billing, support, payroll calculations, or anything else about our platform. What would you like to know?";
  }

  if (lower.includes('price') || lower.includes('cost') || lower.includes('plan') || lower.includes('pricing') || lower.includes('kes') || lower.includes('how much') || lower.includes('subscription') || lower.includes('subscribe') || lower.includes('package')) {
    const plans = KB.pricing.filter(p => p.name !== 'Custom').map(p =>
      `*${p.name}* — ${p.price} (${p.yearlyPrice} yearly): ${p.desc}\n  Features: ${p.features.slice(0, 4).join(', ')}${p.features.length > 4 ? '...' : ''}`
    ).join('\n\n');
    const custom = KB.pricing.find(p => p.name === 'Custom');
    return `**Pricing Plans (Monthly):**\n\n${plans}\n\n*${custom!.name}: ${custom!.desc}*\n\n**Hosting:** ${KB.hosting.map(h => `${h.name} (${h.storage}) ${h.price}`).join(', ')}\n\n**Backup:** ${KB.backup.map(b => `${b.name} ${b.price} — ${b.desc}`).join(', ')}\n\nAll plans include a 3-day free trial. Yearly billing saves ~17%.`;
  }

  if (lower.includes('trial') || lower.includes('free') || lower.includes('try') || lower.includes('demo') || lower.includes('sample')) {
    return KB.trial;
  }

  if (lower.includes('feature') || lower.includes('what can') || lower.includes('do you') || lower.includes('capabilities') || lower.includes('function') || lower.includes('tool') || lower.includes('module') || lower.includes('what does')) {
    return `BiasharaLedger includes these modules:\n\n**Core Accounting:** ${KB.features.core.slice(0, 5).join(', ')}, and more.\n\n**CRM (Standard+):** ${KB.features.crm.join(', ')}.\n\n**HR & Payroll (Premium):** ${KB.features.hr.slice(0, 4).join(', ')}, and more.\n\n**Advanced (Premium):** ${KB.features.advanced.join(', ')}.\n\n**Platform:** ${KB.features.platform.join(', ')}.\n\n\nFeature availability depends on your plan. Basic covers core accounting + inventory, Standard adds CRM, Premium adds HR, payroll, projects, automation, and API access.`;
  }

  if (lower.includes('inventory') || lower.includes('stock') || lower.includes('warehouse') || lower.includes('barcode') || lower.includes('item') || lower.includes('product')) {
    return "**Inventory Management** is available from the Basic plan. Features include: real-time stock tracking, low-stock alerts, barcode scanning, multi-warehouse support, inventory valuation, stock items with categories, inventory transactions (receipts, issues, transfers), and inventory settings. You can manage inventory from /dashboard/inventory.";
  }

  if (lower.includes('account') || lower.includes('bookkeep') || lower.includes('ledger') || lower.includes('journal') || lower.includes('chart of account') || lower.includes('gl ') || lower.includes('trial balance') || lower.includes('p&l') || lower.includes('profit') || lower.includes('balance sheet')) {
    return "**Core Accounting** is included in all plans. Features: double-entry bookkeeping, chart of accounts (asset, liability, equity, revenue, expense types), journal entries with line items, general ledger, trial balance, financial statements (P&L, Balance Sheet, Cash Flow), accounts receivable/payable aging, budget vs actual, tax reports, audit trail, and multi-currency support.";
  }

  if (lower.includes('payroll') || lower.includes('salary') || lower.includes('payslip') || lower.includes('employee') || lower.includes('nssf') || lower.includes('shif') || lower.includes('paye') || lower.includes('ahl') || lower.includes('deduction') || lower.includes('tax') && lower.includes('payroll') || lower.includes('p9')) {
    return `**HR & Payroll** is available from the Premium plan.\n\n**Kenyan Statutory Deductions (2026):**\n- **PAYE:** Progressive brackets: 10% (0-24,000), 25% (24,001-32,333), 30% (32,334-500,000), 32.5% (500,001-800,000), 35% (800,001+). Personal relief KES 2,400/month.\n- **NSSF:** 6% employee + 6% employer. Tier I: max KES 540/side. Tier II: max KES 5,940/side.\n- **SHIF:** 2.75% of gross salary.\n- **AHL:** 1.5% of gross salary (employer matches).\n\n**Features:** Employee records, attendance tracking, leave management (21 days annual, 30 days sick, 12 weeks maternity, 2 weeks paternity), salary processing, payslip generation, P9 forms, deduction summaries, and payroll reports.\n\nEmployment types: full-time, part-time, contract, intern, casual.`;
  }

  if (lower.includes('crm') || lower.includes('pipeline') || lower.includes('lead') || lower.includes('deal') || lower.includes('customer relationship')) {
    return "**CRM** is available from the Standard plan. Features: Pipeline & Deal management (Lead → Qualified → Proposal → Negotiation → Closed Won/Lost with percentage stages), lead tracking & scoring, CRM Activities & analytics, enhanced customer view with communication history.";
  }

  if (lower.includes('sales') || lower.includes('pos') || lower.includes('point of sale') || lower.includes('invoice') || lower.includes('quotation') || lower.includes('payment') || lower.includes('receipt') || lower.includes('credit note')) {
    return "**Sales & POS** is included in all plans. Features: fast point-of-sale with customer management, sales invoices, quotations, payments recording, credit notes, sales receipts, integrated payment support, and customer payment history. All sales transactions flow into your accounting automatically.";
  }

  if (lower.includes('project') || lower.includes('task') || lower.includes('time tracking')) {
    return "**Projects** is available from the Premium plan. Features: project creation and costing, project transaction tracking, and project management. Link project costs to specific clients or internal initiatives.";
  }

  if (lower.includes('api') || lower.includes('webhook') || lower.includes('developer') || lower.includes('integrate') || lower.includes('connect') || lower.includes('third party')) {
    return "**API & Webhooks** are available from the Premium plan. You can generate API keys for programmatic access and configure webhooks to receive real-time event notifications. Documentation is available once subscribed.";
  }

  if (lower.includes('automat') || lower.includes('recurring') || lower.includes('approval') || lower.includes('workflow')) {
    return "**Automation** is available from the Premium plan. Features: recurring transactions (for regular invoices, bills, etc.) and approval workflows for expense approvals, purchase approvals, and more.";
  }

  if (lower.includes('support') || lower.includes('help') || lower.includes('contact') || lower.includes('email') || lower.includes('phone') || lower.includes('call') || lower.includes('reach')) {
    return `**Get in Touch:**\n\n📧 Email: ${KB.support.email}\n📞 Phone: ${KB.support.phone}\n📍 Location: ${KB.support.office}\n📝 Contact form: /contact\n\nOur support team typically responds within hours. The team includes accountants who understand your business challenges.`;
  }

  if (lower.includes('industr') || lower.includes('sector') || lower.includes('retail') || lower.includes('restaurant') || lower.includes('pharmacy') || lower.includes('manufactur') || lower.includes('wholesale') || lower.includes('hospital') || lower.includes('school') || lower.includes('farm') || lower.includes('agri')) {
    return `BiasharaLedger serves these industries:\n\n${KB.industries.map(i => `• ${i}`).join('\n')}\n\nThe platform adapts to your industry with specialized features and workflows. For example, retail gets POS + inventory, healthcare gets patient billing, manufacturing gets raw material tracking.`;
  }

  if (lower.includes('desktop') || lower.includes('download') || lower.includes('app') || lower.includes('mobile') || lower.includes('offline') || lower.includes('native') || lower.includes('electron')) {
    return KB.desktop;
  }

  if (lower.includes('security') || lower.includes('secure') || lower.includes('safe') || lower.includes('encrypt') || lower.includes('privacy') || lower.includes('data') && (lower.includes('protect') || lower.includes('safe'))) {
    return KB.security;
  }

  if (lower.includes('backup') || lower.includes('restore') || lower.includes('recover') || lower.includes('snapshot')) {
    return `**Backup Plans:**\n\n• **Basic Backup** (KES 750/month): Daily snapshots up to 10 GB, 7-day retention\n• **Advanced Backup** (KES 2,250/month — Most Popular): Real-time continuous backups, 30-day retention, multi-server redundancy\n\nAll backups are encrypted with AES-256-GCM before storage.`;
  }

  if (lower.includes('hosting') || lower.includes('storage') || lower.includes('space') || lower.includes('gb') || lower.includes('tier')) {
    return `**Hosting Plans:**\n\n• Free Tier: 0.5 GB (KES 0)\n• Starter Hosting: 5 GB (KES 750/month)\n• Growth Hosting: 20 GB (KES 2,250/month)\n• Enterprise Hosting: 100 GB+ (Custom pricing)`;
  }

  if (lower.includes('multi') && (lower.includes('branch') || lower.includes('location') || lower.includes('store') || lower.includes('warehouse'))) {
    return "**Multi-Branch Support** is included. You can manage multiple locations from one account with centralized reporting. Each branch can have its own inventory, sales, and settings while you see consolidated reports across all branches.";
  }

  if (lower.includes('license') || lower.includes('activate') || lower.includes('key') || lower.includes('bl-')) {
    return "**License System:** After subscribing, you receive a license key in the format BL-YYYY-UUID-HMAC. You can activate it online through your account dashboard. For the desktop app, you can also activate offline using a signed license file (.lic). The system supports trial licenses (3 days), which auto-convert to paid subscriptions. License expiry reminders are sent at 30, 7, 3, and 1 day before expiry.";
  }

  if (lower.includes('onboard') || lower.includes('get started') || lower.includes('start') || lower.includes('setup') || lower.includes('sign up') || lower.includes('register') || lower.includes('create account')) {
    return KB.onboarding;
  }

  if (lower.includes('vat') || lower.includes('tax') || lower.includes('compliance') || lower.includes('kra') || lower.includes('gst') || lower.includes('sales tax')) {
    return "BiasharaLedger supports VAT/GST/Sales Tax for 83 countries. Key rates: Kenya 16%, Uganda 18%, Tanzania 18%, Nigeria 7.5%, Ghana 12.5%, South Africa 15%, Rwanda 18%, UK 20%. The system generates tax reports, VAT returns data, and ensures compliance with local tax authorities like KRA in Kenya. Tax reports are available from the Basic plan.";
  }

  if (lower.includes('report') || lower.includes('analytics') || lower.includes('dashboard') || lower.includes('kpi') || lower.includes('insight') || lower.includes('chart')) {
    return "**Reports & Analytics** are included in all plans. Available reports: Profit & Loss, Balance Sheet, Cash Flow Statement, Trial Balance, General Ledger, Accounts Receivable Aging, Accounts Payable Aging, Expense Report, Sales Report, Inventory Valuation, Budget vs Actual, Owner's Equity, Tax Report, and Audit Trail. The dashboard gives you real-time KPIs of your business performance.";
  }

  if (lower.includes('country') || lower.includes('currency') || lower.includes('multi-currency') || lower.includes('exchange rate') || lower.includes('usd') || lower.includes('eur') || lower.includes('gbp') || lower.includes('kes')) {
    return "BiasharaLedger supports 21 currencies including KES, USD, UGX, TZS, RWF, NGN, ZAR, GHS, EUR, GBP, and more. Multi-currency is included in all plans. You can transact in different currencies and the system handles exchange rate tracking and reporting.";
  }

  if (lower.includes('m-pesa') || lower.includes('mpesa') || lower.includes('mobile money') || lower.includes('payment method') || lower.includes('how to pay')) {
    return "We accept M-Pesa (preferred), credit/debit cards, and bank transfers (for annual plans). M-Pesa is our most popular payment method. After payment, your account is activated by an admin review process.";
  }

  if (lower.includes('sign in') || lower.includes('login') || lower.includes('log in') || lower.includes('forgot password') || lower.includes('reset')) {
    return "You can sign in at /sign-in. If you forgot your password, click 'Forgot Password' on the sign-in page to reset it via OTP verification. New users can sign up for a free trial at /sign-up — no credit card required.";
  }

  if (lower.includes('thank') || lower.includes('thanks') || lower.includes('appreciate') || lower.includes('great') || lower.includes('helpful')) {
    return "You're welcome! Is there anything else I can help you with? If you ever need more assistance, you can always reach us at support@biasharaledger.com.";
  }

  if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('see you')) {
    return "Goodbye! Feel free to come back anytime if you have more questions. You can also email support@biasharaledger.com for further assistance.";
  }

  const allFaqQ = KB.faq.map(f => f.q.toLowerCase());
  for (let i = 0; i < KB.faq.length; i++) {
    const words = KB.faq[i].q.toLowerCase().split(' ');
    for (const word of words) {
      if (word.length > 3 && lower.includes(word)) {
        return KB.faq[i].a;
      }
    }
  }

  return `I'm not sure I understood that. You can ask me about:\n\n• **Pricing** — plans, costs, billing\n• **Features** — what BiasharaLedger can do\n• **Industries** — which sectors we serve\n• **Payroll** — salaries, NSSF, SHIF, PAYE, AHL\n• **Trial** — free trial details\n• **Support** — how to reach us\n• **Desktop app** — download and offline access\n• **CRM, Inventory, Accounting** — specific modules\n\nOr email support@biasharaledger.com for more help.`;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ reply: 'Please send a text message.' }, { status: 400 });
    }
    const reply = getRelevantContext(message.slice(0, 1000));
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: 'Sorry, something went wrong. Please try again or email support@biasharaledger.com.' }, { status: 500 });
  }
}

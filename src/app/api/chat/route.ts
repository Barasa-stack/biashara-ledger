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
  const lower = message.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = lower.split(' ');

  const matches = (...kws: string[]) => kws.some(kw => lower.includes(kw));

  function wordMatch(...kws: string[]) {
    return kws.some(kw => words.some(w => w === kw));
  }

  // ─── GREETINGS ───
  if (matches('hello', 'hi ', 'hey', 'good morning', 'good evening', 'good afternoon', 'howdy')) {
    return "Hello! Welcome to BiasharaLedger. I can help you with pricing, features, plans, industries, billing, support, payroll calculations, or anything else about our platform. What would you like to know?";
  }

  // ─── COMPANY / FOUNDERS / ABOUT ───
  if (matches('founder', 'founders', 'who created', 'who built', 'who started', 'who founded', 'who made', 'team behind', 'story', 'history', 'origin')) {
    return KB.company.story;
  }

  // ─── DESCRIBE / OVERVIEW / INTRO ───
  if (matches('describe', 'overview', 'tell me about', 'introduction', 'what is biasharaledger', 'what is this', 'explain biasharaledger', 'about biasharaledger', 'summarize', 'summary')) {
    return `${KB.intro}\n\n**Key Facts:** ${KB.company.stats}\n\n**Values:** ${KB.company.values.join(' | ')}\n\n**Modules:** Core Accounting & Inventory (Basic), plus CRM (Standard), plus HR/Payroll, Projects, Automation & API (Premium).\n\nAll plans include a 3-day free trial.`;
  }

  // ─── PRICING / PLANS / PACKAGES ───
  if (matches('price', 'pricing', 'cost', 'plan', 'plans', 'package', 'packages', 'subscription', 'subscribe', 'kes', 'how much', 'how much does', 'what are the', ' monthly', ' yearly', 'billing')) {
    const plans = KB.pricing.filter(p => p.name !== 'Custom').map(p =>
      `*${p.name}* — ${p.price} (${p.yearlyPrice} yearly): ${p.desc}\n  Features: ${p.features.slice(0, 4).join(', ')}${p.features.length > 4 ? '...' : ''}`
    ).join('\n\n');
    const custom = KB.pricing.find(p => p.name === 'Custom');
    return `**Pricing Plans (Monthly):**\n\n${plans}\n\n*${custom!.name}: ${custom!.desc}*\n\n**Hosting:** ${KB.hosting.map(h => `${h.name} (${h.storage}) ${h.price}`).join(', ')}\n\n**Backup:** ${KB.backup.map(b => `${b.name} ${b.price} — ${b.desc}`).join(', ')}\n\nAll plans include a 3-day free trial. Yearly billing saves ~17%.`;
  }

  // ─── TRIAL ───
  if (matches('trial', 'free trial', 'try', 'demo', 'sample', 'test it', 'test out')) {
    return KB.trial;
  }

  // ─── WHAT DO YOU OFFER / FEATURES OVERVIEW ───
  if (matches('what do you offer', 'what do you do', 'offer', 'capabilities', 'what can', 'what does', 'modules', 'tools')) {
    return `BiasharaLedger is a complete business management platform. Here is what we offer:\n\n**Core (All plans):** Inventory, Sales & POS, Purchases, Accounting (double-entry, GL, financial reports), Expense tracking, Banking, Multi-currency, Customer & Supplier management, Fixed Assets.\n\n**CRM (Standard+):** Pipeline management, Lead tracking, Deal stages, Customer analytics.\n\n**HR & Payroll (Premium):** Employee records, Attendance, Leave management, Salary processing, Payslips, Kenyan statutory deductions (PAYE, NSSF, SHIF, AHL), P9 forms.\n\n**Advanced (Premium):** Projects, Automation (recurring transactions, approvals), API keys & Webhooks, Budgeting.\n\n**Platform:** Cloud sync, Offline desktop (coming soon), Multi-branch, AES-256 encryption, Role-based access.\n\nFeature availability depends on your plan. Visit /features for full details.`;
  }

  // ─── SPECIFIC FEATURE: INVENTORY ───
  if (matches('inventory', 'stock', 'warehouse', 'barcode', 'item', 'items', 'products')) {
    return "**Inventory Management** is available from the Basic plan. Features include: real-time stock tracking, low-stock alerts, barcode scanning, multi-warehouse support, inventory valuation, stock items with categories, inventory transactions (receipts, issues, transfers), and inventory settings. You can manage inventory from /dashboard/inventory.";
  }

  // ─── SPECIFIC FEATURE: ACCOUNTING ───
  if (matches('accounting', 'bookkeep', 'bookkeeping', 'ledger', 'journal', 'chart of account', 'chart of accounts', 'trial balance', 'profit and loss', 'p&l', 'balance sheet', 'cash flow', 'general ledger')) {
    return "**Core Accounting** is included in all plans. Features: double-entry bookkeeping, chart of accounts (asset, liability, equity, revenue, expense types), journal entries with line items, general ledger, trial balance, financial statements (P&L, Balance Sheet, Cash Flow), accounts receivable/payable aging, budget vs actual, tax reports, audit trail, and multi-currency support.";
  }

  // ─── SPECIFIC FEATURE: PAYROLL / HR ───
  if (matches('payroll', 'salary', 'salaries', 'payslip', 'payslips', 'employee', 'employees', 'nssf', 'shif', 'paye', 'ahl', 'deduction', 'deductions', 'p9', 'hr', 'human resource', 'leave', 'attendance', 'overtime')) {
    return `**HR & Payroll** is available from the Premium plan.\n\n**Kenyan Statutory Deductions (2026):**\n- **PAYE:** Progressive brackets: 10% (0-24,000), 25% (24,001-32,333), 30% (32,334-500,000), 32.5% (500,001-800,000), 35% (800,001+). Personal relief KES 2,400/month.\n- **NSSF:** 6% employee + 6% employer. Tier I: max KES 540/side. Tier II: max KES 5,940/side.\n- **SHIF:** 2.75% of gross salary.\n- **AHL:** 1.5% of gross salary (employer matches).\n\n**Features:** Employee records, attendance tracking, leave management (21 days annual, 30 days sick, 12 weeks maternity, 2 weeks paternity), salary processing, payslip generation, P9 forms, deduction summaries, and payroll reports.\n\nEmployment types: full-time, part-time, contract, intern, casual.`;
  }

  // ─── SPECIFIC FEATURE: CRM ───
  if (matches('crm', 'pipeline', 'lead', 'leads', 'deal', 'deals', 'customer relationship')) {
    return "**CRM** is available from the Standard plan. Features: Pipeline & Deal management (Lead → Qualified → Proposal → Negotiation → Closed Won/Lost with percentage stages), lead tracking & scoring, CRM Activities & analytics, enhanced customer view with communication history.";
  }

  // ─── SPECIFIC FEATURE: SALES / POS ───
  if (matches('sales', 'pos', 'point of sale', 'invoice', 'invoices', 'quotation', 'quotations', 'payment', 'payments', 'receipt', 'receipts', 'credit note', 'sell')) {
    return "**Sales & POS** is included in all plans. Features: fast point-of-sale with customer management, sales invoices, quotations, payments recording, credit notes, sales receipts, integrated payment support, and customer payment history. All sales transactions flow into your accounting automatically.";
  }

  // ─── SPECIFIC FEATURE: PROJECTS ───
  if (matches('project', 'projects', 'task', 'tasks', 'time tracking', 'costing')) {
    return "**Projects** is available from the Premium plan. Features: project creation and costing, project transaction tracking, and project management. Link project costs to specific clients or internal initiatives.";
  }

  // ─── API / WEBHOOKS ───
  if (matches('api', 'apis', 'api key', 'api keys', 'webhook', 'webhooks', 'developer', 'developers', 'integrate', 'integration', 'connect', 'third party')) {
    return "**API & Webhooks** are available from the Premium plan. You can generate API keys for programmatic access and configure webhooks to receive real-time event notifications. Documentation is available once subscribed.";
  }

  // ─── AUTOMATION ───
  if (matches('automation', 'automate', 'recurring', 'approval', 'approvals', 'workflow', 'workflows')) {
    return "**Automation** is available from the Premium plan. Features: recurring transactions (for regular invoices, bills, etc.) and approval workflows for expense approvals, purchase approvals, and more.";
  }

  // ─── SUPPORT / CONTACT ───
  if (matches('support', 'help', 'contact', 'email', 'phone', 'call', 'reach', 'talk to', 'customer service')) {
    return `**Get in Touch:**\n\n📧 Email: ${KB.support.email}\n📞 Phone: ${KB.support.phone}\n📍 Location: ${KB.support.office}\n📝 Contact form: /contact\n\nOur support team typically responds within hours. The team includes accountants who understand your business challenges.`;
  }

  // ─── INDUSTRIES ───
  if (matches('industries', 'industry', 'sector', 'sectors', 'retail', 'restaurant', 'restaurants', 'pharmacy', 'pharmacies', 'manufacturing', 'manufacturer', 'wholesale', 'wholesaler', 'hospital', 'hospitals', 'school', 'schools', 'farm', 'farming', 'agriculture', 'ecommerce', 'e-commerce', 'construction', 'fashion', 'clothing', 'electronics', 'bookshop', 'supermarket', 'supermarkets', 'hardware', 'distributor', 'distributors', 'agribusiness')) {
    return `BiasharaLedger serves these industries:\n\n${KB.industries.map(i => `• ${i}`).join('\n')}\n\nThe platform adapts to your industry with specialized features and workflows. For example, retail gets POS + inventory, healthcare gets patient billing, manufacturing gets raw material tracking.`;
  }

  // ─── DESKTOP / DOWNLOAD / APP ───
  if (matches('desktop', 'download', 'app', 'mobile', 'offline', 'native', 'electron', 'windows', 'macos', 'linux', 'android', 'iphone')) {
    return KB.desktop;
  }

  // ─── SECURITY ───
  if (matches('security', 'secure', 'safe', 'encrypt', 'encryption', 'privacy', 'data protection', 'protected')) {
    return KB.security;
  }

  // ─── BACKUP ───
  if (matches('backup', 'backups', 'restore', 'recover', 'recovery', 'snapshot', 'snapshots')) {
    return `**Backup Plans:**\n\n• **Basic Backup** (KES 750/month): Daily snapshots up to 10 GB, 7-day retention\n• **Advanced Backup** (KES 2,250/month — Most Popular): Real-time continuous backups, 30-day retention, multi-server redundancy\n\nAll backups are encrypted with AES-256-GCM before storage.`;
  }

  // ─── HOSTING / STORAGE ───
  if (matches('hosting', 'storage', 'space', 'gb', 'tier', 'tiers', 'cloud')) {
    return `**Hosting Plans:**\n\n• Free Tier: 0.5 GB (KES 0)\n• Starter Hosting: 5 GB (KES 750/month)\n• Growth Hosting: 20 GB (KES 2,250/month)\n• Enterprise Hosting: 100 GB+ (Custom pricing)`;
  }

  // ─── MULTI-BRANCH ───
  if ((matches('multi', 'multiple') && matches('branch', 'location', 'store', 'stores', 'warehouse')) || matches('branches', 'locations', 'multi-branch', 'multibranch')) {
    return "**Multi-Branch Support** is included. You can manage multiple locations from one account with centralized reporting. Each branch can have its own inventory, sales, and settings while you see consolidated reports across all branches.";
  }

  // ─── LICENSE / ACTIVATION ───
  if (matches('license', 'licence', 'activate', 'activation', 'key', 'license key', 'licence key', 'bl-')) {
    return "**License System:** After subscribing, you receive a license key in the format BL-YYYY-UUID-HMAC. You can activate it online through your account dashboard. For the desktop app, you can also activate offline using a signed license file (.lic). The system supports trial licenses (3 days), which auto-convert to paid subscriptions. License expiry reminders are sent at 30, 7, 3, and 1 day before expiry.";
  }

  // ─── ONBOARDING / SIGN UP ───
  if (matches('onboard', 'onboarding', 'getting started', 'get started', 'setup', 'set up', 'sign up', 'signup', 'register', 'registration', 'create account', 'create an account', 'start using')) {
    return KB.onboarding;
  }

  // ─── TAX / VAT ───
  if (matches('vat', 'tax', 'taxes', 'compliance', 'kra', 'gst', 'sales tax', 'withholding')) {
    return "BiasharaLedger supports VAT/GST/Sales Tax for 83 countries. Key rates: Kenya 16%, Uganda 18%, Tanzania 18%, Nigeria 7.5%, Ghana 12.5%, South Africa 15%, Rwanda 18%, UK 20%. The system generates tax reports, VAT returns data, and ensures compliance with local tax authorities like KRA in Kenya. Tax reports are available from the Basic plan.";
  }

  // ─── REPORTS / ANALYTICS ───
  if (matches('report', 'reports', 'analytics', 'dashboard', 'kpi', 'kpis', 'insight', 'insights', 'chart', 'charts', 'graph', 'graphs')) {
    return "**Reports & Analytics** are included in all plans. Available reports: Profit & Loss, Balance Sheet, Cash Flow Statement, Trial Balance, General Ledger, Accounts Receivable Aging, Accounts Payable Aging, Expense Report, Sales Report, Inventory Valuation, Budget vs Actual, Owner's Equity, Tax Report, and Audit Trail. The dashboard gives you real-time KPIs of your business performance.";
  }

  // ─── CURRENCIES ───
  if (matches('currency', 'currencies', 'multi-currency', 'exchange rate', 'exchange rates', 'forex', 'usd', 'eur', 'gbp', 'kes', 'ngn', 'zar', 'ugx', 'tzs')) {
    return "BiasharaLedger supports 21 currencies including KES, USD, UGX, TZS, RWF, NGN, ZAR, GHS, EUR, GBP, and more. Multi-currency is included in all plans. You can transact in different currencies and the system handles exchange rate tracking and reporting.";
  }

  // ─── M-PESA / PAYMENT METHODS ───
  if (matches('m-pesa', 'mpesa', 'mobile money', 'payment method', 'payment methods', 'how to pay', 'pay', 'paying')) {
    return "We accept M-Pesa (preferred), credit/debit cards, and bank transfers (for annual plans). M-Pesa is our most popular payment method. After payment, your account is activated by an admin review process.";
  }

  // ─── SIGN IN / LOGIN ───
  if (matches('sign in', 'signin', 'login', 'log in', 'log into', 'forgot password', 'reset password', 'can\'t login', 'cannot login')) {
    return "You can sign in at /sign-in. If you forgot your password, click 'Forgot Password' on the sign-in page to reset it via OTP verification. New users can sign up for a free trial at /sign-up — no credit card required.";
  }

  // ─── THANKS ───
  if (matches('thank', 'thanks', 'thank you', 'appreciate', 'great', 'helpful', 'awesome', 'cool', 'perfect')) {
    return "You're welcome! Is there anything else I can help you with? If you ever need more assistance, you can always reach us at support@biasharaledger.com.";
  }

  // ─── BYE ───
  if (matches('bye', 'goodbye', 'see you', 'talk later', 'cya', 'farewell')) {
    return "Goodbye! Feel free to come back anytime if you have more questions. You can also email support@biasharaledger.com for further assistance.";
  }

  // ─── FAQ FALLBACK: check each FAQ question word-by-word ───
  for (let i = 0; i < KB.faq.length; i++) {
    const faqWords = KB.faq[i].q.toLowerCase().split(' ');
    const matchCount = faqWords.filter(w => w.length > 3 && lower.includes(w)).length;
    if (matchCount >= 2) {
      return KB.faq[i].a;
    }
  }

  return `I'm not sure I understood that. You can ask me about:\n\n• **Pricing / Packages** — plans, costs, billing\n• **What we offer** — features, modules, capabilities\n• **Company** — founders, story, history\n• **Industries** — which sectors we serve\n• **Payroll** — salaries, NSSF, SHIF, PAYE, AHL\n• **Trial** — free trial details\n• **Support** — how to reach us\n• **Desktop app** — download and offline access\n• **CRM, Inventory, Accounting** — specific modules\n\nOr email support@biasharaledger.com for more help.`;
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

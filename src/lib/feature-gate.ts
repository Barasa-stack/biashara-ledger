export type PlanTier = 'Basic' | 'Standard' | 'Premium';

export function normalizePlan(plan?: string): PlanTier | 'trial' {
  if (!plan) return 'trial';
  const normalized = plan.toString().trim().toLowerCase();
  if (normalized === 'basic') return 'Basic';
  if (normalized === 'standard') return 'Standard';
  if (normalized === 'premium') return 'Premium';
  if (normalized === 'trial') return 'trial';
  return 'trial';
}

type FeatureMap = Record<string, PlanTier[]>;

export const FEATURE_PLAN_MAP: FeatureMap = {
  'Dashboard': ['Basic', 'Standard', 'Premium'],

  'Customers & Suppliers': ['Basic', 'Standard', 'Premium'],
  '/dashboard/customers': ['Basic', 'Standard', 'Premium'],
  '/dashboard/clients': ['Basic', 'Standard', 'Premium'],

  'Sales': ['Basic', 'Standard', 'Premium'],
  '/dashboard/sales/quotations': ['Basic', 'Standard', 'Premium'],
  '/dashboard/sales/invoices': ['Basic', 'Standard', 'Premium'],
  '/dashboard/sales/payments': ['Basic', 'Standard', 'Premium'],
  '/dashboard/sales/credit-notes': ['Basic', 'Standard', 'Premium'],

  'Purchases': ['Basic', 'Standard', 'Premium'],
  '/dashboard/purchases/pos': ['Basic', 'Standard', 'Premium'],
  '/dashboard/purchases/invoices': ['Basic', 'Standard', 'Premium'],
  '/dashboard/purchases/debit-notes': ['Basic', 'Standard', 'Premium'],

  'Expenses': ['Basic', 'Standard', 'Premium'],
  '/dashboard/expenses': ['Basic', 'Standard', 'Premium'],

  'Subscription': ['Basic', 'Standard', 'Premium'],
  '/dashboard/subscription': ['Basic', 'Standard', 'Premium'],

  'Company Settings': ['Basic', 'Standard', 'Premium'],
  '/dashboard/settings': ['Basic', 'Standard', 'Premium'],

  'HR & Payroll': ['Standard', 'Premium'],
  '/dashboard/payroll': ['Standard', 'Premium'],
  '/dashboard/payroll/salaries': ['Standard', 'Premium'],

  'Financial Reports': ['Basic', 'Standard', 'Premium'],
  '/dashboard/reports?type=profit-loss': ['Basic', 'Standard', 'Premium'],
  '/dashboard/reports?type=balance-sheet': ['Basic', 'Standard', 'Premium'],
  '/dashboard/reports?type=trial-balance': ['Basic', 'Standard', 'Premium'],
  '/dashboard/reports?type=expenses': ['Basic', 'Standard', 'Premium'],
  '/dashboard/reports?type=sales': ['Basic', 'Standard', 'Premium'],

  '/dashboard/reports?type=general-ledger': ['Standard', 'Premium'],
  '/dashboard/reports?type=cash-flow': ['Standard', 'Premium'],
  '/dashboard/reports?type=receivables-aging': ['Standard', 'Premium'],
  '/dashboard/reports?type=payables-aging': ['Standard', 'Premium'],
  '/dashboard/reports?type=inventory': ['Standard', 'Premium'],

  '/dashboard/reports?type=budget-vs-actual': ['Premium'],
  '/dashboard/reports?type=equity': ['Premium'],
  '/dashboard/reports?type=tax': ['Premium'],
  '/dashboard/reports?type=audit-trail': ['Premium'],

  // New ERP modules (per strategic priority mapping)
  'Inventory': ['Standard', 'Premium'],
  '/dashboard/inventory': ['Standard', 'Premium'],

  'Other Income/Expenses': ['Standard', 'Premium'],
  '/dashboard/other-transactions': ['Standard', 'Premium'],

  'Capital Transactions': ['Premium'],
  '/dashboard/capital-transactions': ['Premium'],

  'Budgets': ['Premium'],
  '/dashboard/budgets': ['Premium'],

  // Phase 1: Multi-currency
  'Exchange Rates': ['Standard', 'Premium'],
  '/dashboard/exchange-rates': ['Standard', 'Premium'],

  // Phase 2: Chart of Accounts
  'Chart of Accounts': ['Standard', 'Premium'],
  '/dashboard/chart-of-accounts': ['Standard', 'Premium'],

  // Phase 3: Journal Entries
  'Journal Entries': ['Premium'],
  '/dashboard/journal-entries': ['Premium'],

  // Phase 4: Bank Reconciliation
  'Bank Accounts': ['Standard', 'Premium'],
  '/dashboard/bank-accounts': ['Standard', 'Premium'],
  'Bank Reconciliation': ['Standard', 'Premium'],
  '/dashboard/bank-reconciliation': ['Standard', 'Premium'],

  // Phase 5: Fixed Assets
  'Fixed Assets': ['Standard', 'Premium'],
  '/dashboard/fixed-assets': ['Standard', 'Premium'],

  // Phase 6: Recurring + Approvals
  'Recurring Transactions': ['Premium'],
  '/dashboard/recurring': ['Premium'],
  'Approvals': ['Premium'],
  '/dashboard/approvals': ['Premium'],

  // Phase 7: CRM / Deals
  'CRM Pipeline': ['Standard', 'Premium'],
  '/dashboard/deals': ['Standard', 'Premium'],

  // Phase 8: Projects
  'Projects': ['Premium'],
  '/dashboard/projects': ['Premium'],

  // Phase 9: Developer
  'API Keys': ['Premium'],
  '/dashboard/api-keys': ['Premium'],
  'Webhooks': ['Premium'],
  '/dashboard/webhooks': ['Premium'],

  // Notifications
  'Notifications': ['Basic', 'Standard', 'Premium'],
  '/dashboard/notifications': ['Basic', 'Standard', 'Premium'],
};

export function isFeatureAvailable(featureKey: string, plan: PlanTier | string | undefined): boolean {
  const normalizedPlan = normalizePlan(plan as string);
  if (normalizedPlan === 'trial') return false;
  if (normalizedPlan === 'Premium') return true;
  const allowed = FEATURE_PLAN_MAP[featureKey];
  if (!allowed) return false;
  return allowed.includes(normalizedPlan as PlanTier);
}

export function getFeaturePlan(featureKey: string): PlanTier | null {
  const allowed = FEATURE_PLAN_MAP[featureKey];
  if (!allowed || allowed.length === 0) return null;
  if (allowed.includes('Premium') && !allowed.includes('Standard')) return 'Premium';
  if (allowed.includes('Standard') && !allowed.includes('Basic')) return 'Standard';
  return 'Basic';
}

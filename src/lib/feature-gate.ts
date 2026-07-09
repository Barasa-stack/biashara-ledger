type Plan = 'trial' | 'basic' | 'premium';

const PLAN_HIERARCHY: Record<Plan, number> = { trial: 0, basic: 1, premium: 2 };

const FEATURE_PLANS: Record<string, Plan> = {
  dashboard: 'trial',
  'financial-reports': 'trial',
  customers: 'trial',
  sales: 'trial',
  purchases: 'trial',
  expenses: 'trial',
  employees: 'trial',
  attendance: 'basic',
  leave: 'basic',
  payroll: 'basic',
  payslips: 'basic',
  'payroll-reports': 'premium',
  inventory: 'basic',
  banking: 'basic',
  'chart-of-accounts': 'basic',
  'journal-entries': 'basic',
  budgets: 'basic',
  'fixed-assets': 'premium',
  'crm-pipeline': 'premium',
  projects: 'premium',
  'exchange-rates': 'basic',
  automation: 'premium',
  'api-keys': 'premium',
  notifications: 'trial',
  subscription: 'trial',
  settings: 'trial',
};

export function normalizePlan(plan?: string): Plan {
  const p = (plan || 'trial').toLowerCase();
  if (p === 'premium' || p === 'business' || p === 'enterprise') return 'premium';
  if (p === 'basic' || p === 'standard' || p === 'pro') return 'basic';
  return 'trial';
}

export function isFeatureAvailable(featureKey: string, plan?: string): boolean {
  const userPlan = normalizePlan(plan);
  const requiredPlan = FEATURE_PLANS[featureKey] || 'premium';
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

export function getFeaturePlan(featureKey: string): Plan {
  return FEATURE_PLANS[featureKey] || 'premium';
}

export function getAllFeatures(): [string, Plan][] {
  return Object.entries(FEATURE_PLANS);
}

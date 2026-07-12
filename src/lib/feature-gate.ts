export type Plan = 'trial' | 'basic' | 'standard' | 'premium' | 'custom';

const PLAN_HIERARCHY: Record<string, number> = { trial: 0, basic: 1, standard: 2, premium: 3, custom: 4 };

export type ModuleKey =
  | 'core-accounting'
  | 'financial-reports'
  | 'inventory'
  | 'crm'
  | 'hr-payroll'
  | 'projects'
  | 'automation'
  | 'api-access';

// Which plan each module is available in (for non-custom plans)
// Trial includes core-accounting + financial-reports (matches old trial feature set)
const MODULE_PLANS: Record<ModuleKey, Plan> = {
  'core-accounting': 'trial',
  'financial-reports': 'trial',
  inventory: 'basic',
  crm: 'standard',
  'hr-payroll': 'premium',
  projects: 'premium',
  automation: 'premium',
  'api-access': 'premium',
};

// Default module set for each built-in plan (when allowed_modules is not explicitly set)
const PLAN_MODULES: Record<string, ModuleKey[]> = {
  basic: ['core-accounting', 'financial-reports', 'inventory'],
  standard: ['core-accounting', 'financial-reports', 'inventory', 'crm'],
  premium: ['core-accounting', 'financial-reports', 'inventory', 'crm', 'hr-payroll', 'projects', 'automation', 'api-access'],
};

// Features mapped to their parent module
const FEATURE_MODULE: Record<string, ModuleKey> = {
  // core-accounting
  dashboard: 'core-accounting',
  customers: 'core-accounting',
  sales: 'core-accounting',
  purchases: 'core-accounting',
  expenses: 'core-accounting',
  banking: 'core-accounting',
  'chart-of-accounts': 'core-accounting',
  'journal-entries': 'core-accounting',
  'exchange-rates': 'core-accounting',
  'other-transactions': 'core-accounting',
  'capital-transactions': 'core-accounting',
  'fixed-assets': 'core-accounting',
  notifications: 'core-accounting',
  settings: 'core-accounting',
  subscription: 'core-accounting',
  // financial-reports
  'financial-reports': 'financial-reports',
  budgets: 'financial-reports',
  // inventory
  inventory: 'inventory',
  // crm
  'crm-pipeline': 'crm',
  // hr-payroll
  employees: 'hr-payroll',
  attendance: 'hr-payroll',
  leave: 'hr-payroll',
  payroll: 'hr-payroll',
  payslips: 'hr-payroll',
  'payroll-reports': 'hr-payroll',
  // projects
  projects: 'projects',
  // automation
  automation: 'automation',
  // api-access
  'api-keys': 'api-access',
  webhooks: 'api-access',
};

export function normalizePlan(plan?: string): Plan {
  const p = (plan || 'trial').toLowerCase();
  if (p === 'custom') return 'custom';
  if (['premium', 'business', 'enterprise'].includes(p)) return 'premium';
  if (['standard', 'growth'].includes(p)) return 'standard';
  if (['basic', 'pro'].includes(p)) return 'basic';
  return 'trial';
}

export function getFeatureModule(featureKey: string): ModuleKey {
  return FEATURE_MODULE[featureKey] || 'core-accounting';
}

export function getModulePlan(moduleKey: ModuleKey): Plan {
  return MODULE_PLANS[moduleKey] || 'premium';
}

export function getModuleName(moduleKey: ModuleKey): string {
  const names: Record<ModuleKey, string> = {
    'core-accounting': 'Core Accounting',
    'financial-reports': 'Financial Reports',
    inventory: 'Inventory',
    crm: 'CRM',
    'hr-payroll': 'HR & Payroll',
    projects: 'Projects',
    automation: 'Automation',
    'api-access': 'API Access',
  };
  return names[moduleKey];
}

export function getDefaultModules(plan: Plan): ModuleKey[] {
  return PLAN_MODULES[plan] || [];
}

export function isModuleAvailable(
  moduleKey: ModuleKey,
  plan?: string,
  allowedModules?: string[]
): boolean {
  const userPlan = normalizePlan(plan);

  if (userPlan === 'custom' && allowedModules?.length) {
    return allowedModules.includes(moduleKey);
  }

  const requiredPlan = MODULE_PLANS[moduleKey] || 'premium';
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

export function isFeatureAvailable(
  featureKey: string,
  plan?: string,
  allowedModules?: string[]
): boolean {
  const moduleKey = getFeatureModule(featureKey);
  return isModuleAvailable(moduleKey, plan, allowedModules);
}

export function getAllModules(): ModuleKey[] {
  return Object.keys(MODULE_PLANS) as ModuleKey[];
}

export function getAllFeatures(): [string, ModuleKey][] {
  return Object.entries(FEATURE_MODULE);
}

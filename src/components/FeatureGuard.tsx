'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Crown, ArrowRight } from 'lucide-react';

const planFeatureMap: Record<string, string[]> = {
  Basic: ['bookkeeping', 'profitLoss', 'balanceSheet', 'trialBalance', 'invoicing', 'expenses', 'customers', 'suppliers'],
  Standard: ['bookkeeping', 'profitLoss', 'balanceSheet', 'trialBalance', 'hrPayroll', 'generalLedger', 'expenseReport', 'invoicing', 'expenses', 'customers', 'suppliers', 'inventory', 'advancedReports', 'multiUser'],
  Premium: ['all'],
};

const featureLabels: Record<string, string> = {
  hrPayroll: 'HR & Payroll',
  generalLedger: 'General Ledger',
  expenseReport: 'Expense Reports',
  inventory: 'Inventory Management',
  advancedReports: 'Advanced Reports',
  multiUser: 'Multi-User Access',
};

type FeatureGuardProps = {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function FeatureGuard({ feature, children, fallback }: FeatureGuardProps) {
  const { user } = useAuth();

  if (!user) return <>{children}</>;

  const plan = user.subscriptionPlan || 'trial';
  const allowedFeatures = planFeatureMap[plan] || [];
  const hasAccess = allowedFeatures.includes('all') || allowedFeatures.includes(feature);

  if (hasAccess) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="bg-surface border border-border rounded-xl p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
        <Crown className="h-6 w-6 text-brand" />
      </div>
      <h3 className="text-base font-semibold text-[#000000] mb-1">Upgrade to Access {featureLabels[feature] || feature}</h3>
      <p className="text-sm text-[#000000]/60 mb-4">
        This feature is available on the {plan === 'trial' ? 'Standard' : plan === 'Basic' ? 'Standard' : 'Premium'} plan and above.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
      >
        Upgrade Now <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

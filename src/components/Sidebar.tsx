'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Users, ShoppingCart,
  Package, UsersRound, Receipt, FileBarChart, Settings,
  ChevronDown, ChevronRight, CreditCard, Lock, Sparkles,
  Archive, ArrowRightLeft, Banknote, Target,
  Globe, BookOpen, PenTool, Landmark, Building2,
  RotateCcw, CheckSquare, TrendingUp, Briefcase,
  Key, Webhook, Bell,
} from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { isFeatureAvailable, isModuleAvailable, normalizePlan, getModuleName } from '@/lib/feature-gate';
import type { Plan } from '@/lib/feature-gate';
import UpgradeModal from './UpgradeModal';

// Map nav item labels/modules to their required plan level for visibility
type NavItem = {
  href?: string;
  label: string;
  icon?: any;
  moduleKey?: string;
  children?: { href: string; label: string; moduleKey?: string }[];
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, moduleKey: 'core-accounting' },
  {
    label: 'Customers & Suppliers',
    icon: Users,
    moduleKey: 'core-accounting',
    children: [
      { href: '/dashboard/customers', label: 'Customers' },
      { href: '/dashboard/clients', label: 'Suppliers' },
    ],
  },
  {
    label: 'Sales',
    icon: ShoppingCart,
    moduleKey: 'core-accounting',
    children: [
      { href: '/dashboard/sales/quotations', label: 'Quotations' },
      { href: '/dashboard/sales/invoices', label: 'Invoices' },
      { href: '/dashboard/sales/payments', label: 'Payments' },
      { href: '/dashboard/sales/credit-notes', label: 'Credit Notes' },
    ],
  },
  {
    label: 'Purchases',
    icon: Package,
    moduleKey: 'core-accounting',
    children: [
      { href: '/dashboard/purchases/pos', label: 'Purchase Orders' },
      { href: '/dashboard/purchases/invoices', label: 'Purchase Invoices' },
      { href: '/dashboard/purchases/debit-notes', label: 'Debit Notes' },
    ],
  },
  {
    label: 'HR & Payroll',
    icon: UsersRound,
    moduleKey: 'hr-payroll',
    children: [
      { href: '/dashboard/payroll', label: 'Employees' },
      { href: '/dashboard/payroll/attendance', label: 'Attendance' },
      { href: '/dashboard/payroll/leave', label: 'Leave' },
      { href: '/dashboard/payroll/salaries', label: 'Salaries' },
      { href: '/dashboard/payroll/payslips', label: 'Payslips' },
      { href: '/dashboard/payroll/reports', label: 'Payroll Reports' },
    ],
  },
  { href: '/dashboard/expenses', label: 'Expenses', icon: Receipt, moduleKey: 'core-accounting' },
  {
    label: 'Inventory',
    icon: Archive,
    moduleKey: 'inventory',
    children: [
      { href: '/dashboard/inventory/items', label: 'Stock Items' },
      { href: '/dashboard/inventory/transactions', label: 'Stock Movements' },
      { href: '/dashboard/inventory/settings', label: 'Inventory Settings' },
    ],
  },
  { href: '/dashboard/other-transactions', label: 'Other Income/Expenses', icon: ArrowRightLeft, moduleKey: 'core-accounting' },
  { href: '/dashboard/capital-transactions', label: 'Capital Transactions', icon: Banknote, moduleKey: 'core-accounting' },
  { href: '/dashboard/budgets', label: 'Budgets', icon: Target, moduleKey: 'financial-reports' },
  { href: '/dashboard/exchange-rates', label: 'Exchange Rates', icon: Globe, moduleKey: 'core-accounting' },
  {
    label: 'Chart of Accounts',
    icon: BookOpen,
    moduleKey: 'core-accounting',
    children: [
      { href: '/dashboard/chart-of-accounts', label: 'Accounts' },
    ],
  },
  { href: '/dashboard/journal-entries', label: 'Journal Entries', icon: PenTool, moduleKey: 'core-accounting' },
  {
    label: 'Banking',
    icon: Landmark,
    moduleKey: 'core-accounting',
    children: [
      { href: '/dashboard/bank-accounts', label: 'Bank Accounts' },
      { href: '/dashboard/bank-reconciliation', label: 'Reconciliation' },
    ],
  },
  { href: '/dashboard/fixed-assets', label: 'Fixed Assets', icon: Building2, moduleKey: 'core-accounting' },
  {
    label: 'Automation',
    icon: RotateCcw,
    moduleKey: 'automation',
    children: [
      { href: '/dashboard/recurring', label: 'Recurring' },
      { href: '/dashboard/approvals', label: 'Approvals' },
    ],
  },
  {
    label: 'CRM',
    icon: TrendingUp,
    moduleKey: 'crm',
    children: [
      { href: '/dashboard/crm', label: 'Analytics Board' },
      { href: '/dashboard/crm/pipeline', label: 'Pipeline' },
      { href: '/dashboard/crm/leads', label: 'Leads' },
      { href: '/dashboard/crm/activities', label: 'Activities' },
      { href: '/dashboard/crm/reports', label: 'Reports' },
      { href: '/dashboard/crm/customers', label: 'CRM Customers' },
    ],
  },
  { href: '/dashboard/projects', label: 'Projects', icon: Briefcase, moduleKey: 'projects' },
  {
    label: 'Developer',
    icon: Key,
    moduleKey: 'api-access',
    children: [
      { href: '/dashboard/api-keys', label: 'API Keys' },
      { href: '/dashboard/webhooks', label: 'Webhooks' },
    ],
  },
  {
    label: 'Financial Reports',
    icon: FileBarChart,
    moduleKey: 'financial-reports',
    children: [
      { href: '/dashboard/reports?type=profit-loss', label: 'Profit & Loss' },
      { href: '/dashboard/reports?type=balance-sheet', label: 'Balance Sheet' },
      { href: '/dashboard/reports?type=cash-flow', label: 'Cash Flow' },
      { href: '/dashboard/reports?type=trial-balance', label: 'Trial Balance' },
      { href: '/dashboard/reports?type=general-ledger', label: 'General Ledger' },
      { href: '/dashboard/reports?type=receivables-aging', label: 'Receivables Aging' },
      { href: '/dashboard/reports?type=payables-aging', label: 'Payables Aging' },
      { href: '/dashboard/reports?type=expenses', label: 'Expense Report' },
      { href: '/dashboard/reports?type=sales', label: 'Sales Report' },
      { href: '/dashboard/reports?type=inventory', label: 'Inventory Valuation' },
      { href: '/dashboard/reports?type=budget-vs-actual', label: 'Budget vs Actual' },
      { href: '/dashboard/reports?type=equity', label: "Owner's Equity" },
      { href: '/dashboard/reports?type=tax', label: 'Tax Report' },
      { href: '/dashboard/reports?type=audit-trail', label: 'Audit Trail' },
    ],
  },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, moduleKey: 'core-accounting' },
  { href: '/dashboard/subscription', label: 'Subscription', icon: CreditCard, moduleKey: 'core-accounting' },
  { href: '/dashboard/settings', label: 'Company Settings', icon: Settings, moduleKey: 'core-accounting' },
];

function NavLink({ href, icon: Icon, label, locked }: { href: string; icon?: any; label: string; locked?: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (locked) {
    return (
      <div className="group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/30 cursor-not-allowed select-none">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span>{label}</span>
        <Lock className="h-3 w-3 ml-auto shrink-0 text-white/20" />
        <div className="absolute left-0 top-0 w-full h-full rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 bg-dark/80 transition-opacity pointer-events-none">
          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400">
            <Sparkles className="h-3 w-3" /> Upgrade to unlock
          </span>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
        isActive
          ? 'bg-brand/10 text-brand font-semibold'
          : 'text-white hover:bg-brand/10 hover:text-brand'
      }`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span>{label}</span>
    </Link>
  );
}

interface SidebarProps {
  subscriptionPlan?: string;
  allowedModules?: string[];
}

function Sidebar({ subscriptionPlan, allowedModules }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [upgradeFeature, setUpgradeFeature] = useState<{ name: string; requiredPlan: string } | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');

  const plan = normalizePlan(subscriptionPlan);

  // Check if a module is visible for the current plan
  function isModuleVisible(moduleKey?: string): boolean {
    if (!moduleKey) return true;
    return isModuleAvailable(moduleKey as any, plan, allowedModules);
  }

  useEffect(() => {
    setExpandedMenus(
      navItems.filter(item => 'children' in item && item.children?.some(c => fullPath === c.href)).map(i => i.label)
    );
  }, [fullPath]);

  // Filter nav items based on plan visibility
  const visibleNavItems = navItems.filter(item => isModuleVisible(item.moduleKey));

  function toggleMenu(label: string) {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  }

  function handleLockedClick(featureName: string) {
    const available = isFeatureAvailable(featureName, plan, allowedModules);
    if (!available) {
      const forPremium = isFeatureAvailable(featureName, 'premium');
      const forStandard = isFeatureAvailable(featureName, 'standard');
      const reqPlan = forPremium ? 'Premium' : forStandard ? 'Standard' : 'Basic';
      setUpgradeFeature({ name: featureName, requiredPlan: reqPlan });
    }
  }

  function isLocked(featureKey: string): boolean {
    return !isFeatureAvailable(featureKey, plan, allowedModules);
  }

  return (
    <aside className="w-60 border-r border-dark-border bg-dark flex flex-col shrink-0">
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" locked={isLocked('Dashboard')} />
        {visibleNavItems.slice(1).map((item) => {
          if ('children' in item && item.children) {
            const isExpanded = expandedMenus.includes(item.label);
            const isActive = item.children.some((c) => fullPath === c.href);

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`flex items-center justify-between w-full rounded-md px-3 py-2 text-sm transition-all ${
                    isActive
                      ? 'bg-brand/10 text-brand font-semibold'
                      : 'text-white hover:bg-brand/10 hover:text-brand'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white" />
                  )}
                </button>
                <div
                  className={`ml-7 mt-0.5 space-y-0.5 overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {item.children.map((child) => {
                    const isChildActive = fullPath === child.href;
                    const childLocked = isLocked(child.href);
                    return (
                      <div key={child.href} className="group relative">
                        {childLocked ? (
                          <button
                            onClick={() => handleLockedClick(child.label)}
                            className="w-full flex items-center gap-3 rounded-md px-3 py-1.5 text-sm text-white/30 cursor-not-allowed"
                          >
                            <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                            <span className="flex-1 text-left">{child.label}</span>
                            <Lock className="h-3 w-3 shrink-0 text-white/20" />
                          </button>
                        ) : (
                          <Link
                            href={child.href}
                            className={`flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-all ${
                              isChildActive
                                ? 'bg-brand/10 text-brand font-medium'
                                : 'text-white/60 hover:bg-brand/10 hover:text-brand'
                            }`}
                          >
                            <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          const itemLocked = isLocked(item.href || '');
          return itemLocked ? (
            <div key={item.href} className="group relative">
              <button
                onClick={() => handleLockedClick(item.label)}
                className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/30 cursor-not-allowed"
              >
                {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                <span className="flex-1 text-left">{item.label}</span>
                <Lock className="h-3 w-3 shrink-0 text-white/20" />
              </button>
            </div>
          ) : (
            <NavLink key={item.href || ''} href={item.href || '/'} icon={item.icon} label={item.label} />
          );
        })}
      </nav>

      {upgradeFeature && (
        <UpgradeModal
          featureName={upgradeFeature.name}
          currentPlan={plan}
          requiredPlan={upgradeFeature.requiredPlan}
          onClose={() => setUpgradeFeature(null)}
        />
      )}
    </aside>
  );
}

export default memo(Sidebar);

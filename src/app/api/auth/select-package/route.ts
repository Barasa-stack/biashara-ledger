import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { requireSubscription } from '@/lib/auth-guard';
import { normalizePlan, getDefaultModules } from '@/lib/feature-gate';

const PLAN_CONFIG: Record<string, { monthlyAmount: number; yearlyAmount: number; days: number }> = {
  basic: { monthlyAmount: 600, yearlyAmount: 6000, days: 30 },
  standard: { monthlyAmount: 1000, yearlyAmount: 10000, days: 30 },
  premium: { monthlyAmount: 1500, yearlyAmount: 15000, days: 30 },
};

export async function POST(request: Request) {
  try {
    const { session } = await requireSubscription();
    const { packageName, billing } = await request.json();

    if (!packageName) {
      return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
    }

    const normalizedPlan = normalizePlan(packageName);
    const config = PLAN_CONFIG[normalizedPlan];
    if (!config) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const isYearly = billing === 'yearly';
    const amount = isYearly ? config.yearlyAmount : config.monthlyAmount;
    const periodStart = new Date().toISOString();
    const periodEnd = new Date(Date.now() + (isYearly ? 365 : config.days) * 24 * 60 * 60 * 1000).toISOString();

    const defaultModules = JSON.stringify(getDefaultModules(normalizedPlan));

    await run(
      `UPDATE users SET subscription_plan = $1, subscription_status = 'active', subscription_expiry = $2, allowed_modules = $3 WHERE id = $4`,
      [normalizedPlan, periodEnd, defaultModules, session.user_id]
    );

    await run(
      `INSERT INTO billing_history (user_id, amount, plan_name, payment_method, transaction_id, status, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [session.user_id, amount, packageName, 'manual', `manual-${Date.now()}`, 'completed', periodStart, periodEnd]
    );

    await run(
      `INSERT INTO subscription_events (user_id, event_type, description, metadata)
       VALUES ($1, $2, $3, $4)`,
      [session.user_id, 'package_selected', `User selected ${packageName} (${billing || 'monthly'}) package`, JSON.stringify({ packageName, billing, periodStart, periodEnd })]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Package selection failed' }, { status: 500 });
  }
}

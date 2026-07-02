import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { requireSubscription } from '@/lib/auth-guard';

const PLAN_CONFIG: Record<string, { days: number; amount: number }> = {
  Basic: { days: 30, amount: 5 },
  Standard: { days: 30, amount: 10 },
  Premium: { days: 30, amount: 15 },
};

export async function POST(request: Request) {
  try {
    const { session } = await requireSubscription();
    const { packageName } = await request.json();

    if (!packageName) {
      return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
    }

    const config = PLAN_CONFIG[packageName as string];
    if (!config) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const periodStart = new Date().toISOString();
    const periodEnd = new Date(Date.now() + config.days * 24 * 60 * 60 * 1000).toISOString();

    await run(
      `UPDATE users SET subscription_plan = $1, subscription_status = 'active', subscription_expiry = $2 WHERE id = $3`,
      [packageName, periodEnd, session.user_id]
    );

    await run(
      `INSERT INTO billing_history (user_id, amount, plan_name, payment_method, transaction_id, status, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [session.user_id, config.amount, packageName, 'trial', `trial-${Date.now()}`, 'completed', periodStart, periodEnd]
    );

    await run(
      `INSERT INTO subscription_events (user_id, event_type, description, metadata)
       VALUES ($1, $2, $3, $4)`,
      [session.user_id, 'package_selected', `User selected ${packageName} package`, JSON.stringify({ packageName, periodStart, periodEnd })]
    );

    const response = NextResponse.json({ success: true });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: 'Package selection failed' }, { status: 500 });
  }
}

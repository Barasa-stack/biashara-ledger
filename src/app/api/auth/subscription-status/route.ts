import { NextResponse } from 'next/server';
import { get, query } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { normalizePlan } from '@/lib/feature-gate';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await get(
      'SELECT * FROM users WHERE id = $1',
      [session.user_id]
    ) as any;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const subscription_expiry = user.subscription_expiry ? new Date(user.subscription_expiry) : null;
    const daysUntilExpiry = subscription_expiry ? Math.ceil((subscription_expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const inGracePeriod = user.grace_period_end ? new Date(user.grace_period_end) > now : false;
    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;

    const billingRows = await query(
      'SELECT * FROM billing_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [user.id]
    );
    const billingHistory = (billingRows || []).map((r: any) => ({
      id: r.id,
      date: r.period_start || r.created_at,
      description: r.plan_name || 'Subscription payment',
      amount: r.amount,
      status: r.status || 'completed',
    }));

    const recentEvents = await query(
      'SELECT * FROM subscription_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [user.id]
    );

    const effectiveStatus = user.license_status === 'active' ? 'active' : user.subscription_status || 'active';
    const expiryDate = user.subscription_expiry || user.trial_end_date || null;
    const plan = normalizePlan(user.subscription_plan || 'trial');
    const daysRemaining = expiryDate
      ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    return NextResponse.json({
      plan,
      status: effectiveStatus,
      expiryDate,
      daysRemaining,
      billingHistory: billingHistory || [],
    });
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Subscription status error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

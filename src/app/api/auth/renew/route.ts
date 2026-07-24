import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth-server';
import { activateSubscription } from '@/lib/auth-guard';
import { normalizePlan } from '@/lib/feature-gate';

const planDurations: Record<string, { days: number; planName: string }> = {
  Monthly: { days: 30, planName: 'Basic' },
  Quarterly: { days: 90, planName: 'Standard' },
  Yearly: { days: 365, planName: 'Premium' },
  Basic: { days: 30, planName: 'Basic' },
  Standard: { days: 30, planName: 'Standard' },
  Premium: { days: 30, planName: 'Premium' },
};

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { plan } = await request.json();
    const planConfig = planDurations[plan];
    if (!planConfig) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    await activateSubscription(session.user_id, planConfig.planName, planConfig.days, 'manual', `renew-${Date.now()}`, session.tenant_id);

    const newExpiry = new Date(Date.now() + planConfig.days * 24 * 60 * 60 * 1000).toISOString();
    const normalizedPlan = normalizePlan(planConfig.planName);

    const response = NextResponse.json({ success: true });

    response.cookies.set('user_plan', normalizedPlan, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    response.cookies.set('user_subscription_expiry', newExpiry, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: 'Renewal failed' }, { status: 500 });
  }
}

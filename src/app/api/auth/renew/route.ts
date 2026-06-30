import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth-server';
import { activateSubscription } from '@/lib/auth-guard';

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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Renewal failed' }, { status: 500 });
  }
}

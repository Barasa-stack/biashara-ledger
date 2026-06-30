import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth-server';
import { activateSubscription } from '@/lib/auth-guard';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { plan, transactionId, paymentMethod } = await request.json();

    const planDurations: Record<string, number> = {
      Basic: 30,
      Standard: 30,
      Premium: 30,
    };

    const days = planDurations[plan] || 30;
    await activateSubscription(session.user_id, plan, days, paymentMethod || 'mpesa', transactionId || `demo-${Date.now()}`, session.tenant_id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Confirmation failed' }, { status: 500 });
  }
}

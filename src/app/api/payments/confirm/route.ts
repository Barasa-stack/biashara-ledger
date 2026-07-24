import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth-server';
import { adminRun } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { plan, transactionId } = await request.json();
    const planPrices: Record<string, number> = {
      Basic: 1500,
      Standard: 3000,
      Premium: 5000,
    };

    await adminRun(
      `INSERT INTO payment_requests (user_id, email, tenant_id, plan_name, amount, transaction_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [session.user_id, session.email, session.tenant_id, plan, planPrices[plan] || 1500, transactionId || `MPESA-${Date.now()}`]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Submission failed' }, { status: 500 });
  }
}

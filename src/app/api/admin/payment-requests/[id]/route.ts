import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth-server';
import { adminQuery, adminRun } from '@/lib/db';
import { activateSubscription } from '@/lib/auth-guard';
import { normalizePlan } from '@/lib/feature-gate';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json();

    const rows = await adminQuery(
      'SELECT * FROM payment_requests WHERE id = $1 AND status = $2',
      [id, 'pending']
    );
    const reqRow = rows?.[0];
    if (!reqRow) {
      return NextResponse.json({ error: 'Payment request not found or already processed' }, { status: 404 });
    }

    if (action === 'approve') {
      const planDurations: Record<string, number> = {
        Basic: 30, Standard: 30, Premium: 30,
      };
      const days = planDurations[normalizePlan(reqRow.plan_name)] || 30;
      await activateSubscription(
        reqRow.user_id, reqRow.plan_name, days, 'mpesa',
        reqRow.transaction_id, reqRow.tenant_id || ''
      );

      await adminRun(
        'UPDATE payment_requests SET status = $1, admin_id = $2, approved_at = NOW() WHERE id = $3',
        ['approved', session.user_id, id]
      );

      return NextResponse.json({ success: true, message: 'Payment approved. Subscription activated.' });
    } else if (action === 'reject') {
      await adminRun(
        'UPDATE payment_requests SET status = $1, admin_id = $2, notes = $3 WHERE id = $4',
        ['rejected', session.user_id, reqRow.notes || 'Rejected by admin', id]
      );

      return NextResponse.json({ success: true, message: 'Payment request rejected.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}

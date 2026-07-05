import { NextResponse } from 'next/server';
import { query, run, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const userId = session.user_id;
    const notifications = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM notification_log WHERE user_id=$1 OR user_id IS NULL ORDER BY created_at DESC LIMIT 50', [userId]);
    });
    const unread = notifications.filter((n: any) => !n.is_read).length;
    return NextResponse.json({ notifications, unread });
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    // error already logged above
    return NextResponse.json({ error: typeof __msg !== 'undefined' ? __msg : msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      if (body.markAllRead) {
        await run('UPDATE notification_log SET is_read=1 WHERE (user_id=$1 OR user_id IS NULL) AND is_read=0', [session.user_id]);
      } else if (body.id) {
        await run('UPDATE notification_log SET is_read=1 WHERE id=$1', [body.id]);
      } else if (body.preferences) {
        const prefs = body.preferences;
        await run(`INSERT INTO notification_preferences (tenant_id, user_id, email_notifications, sms_notifications, in_app_notifications, invoice_reminders, payment_confirmations, low_stock_alerts, approval_requests)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (tenant_id, id) DO UPDATE SET email_notifications=$3, sms_notifications=$4, in_app_notifications=$5, invoice_reminders=$6, payment_confirmations=$7, low_stock_alerts=$8, approval_requests=$9`,
          [session.tenant_id, session.user_id, prefs.email_notifications ?? 1, prefs.sms_notifications ?? 0, prefs.in_app_notifications ?? 1,
           prefs.invoice_reminders ?? 1, prefs.payment_confirmations ?? 1, prefs.low_stock_alerts ?? 1, prefs.approval_requests ?? 1]);
      }
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    // error already logged above
    return NextResponse.json({ error: typeof __msg !== 'undefined' ? __msg : msg }, { status: 500 });
  }
}

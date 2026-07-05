import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import crypto from 'crypto';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const webhooks = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM webhooks ORDER BY webhook_name');
    });
    return NextResponse.json(webhooks);
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    // error already logged above
    return NextResponse.json({ error: typeof __msg !== 'undefined' ? __msg : msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const result = await withTenantContext(session.tenant_id!, async () => {
      const secret = crypto.randomBytes(16).toString('hex');
      return await insertReturning<{ id: string }>(
        'INSERT INTO webhooks (tenant_id, webhook_name, url, events, secret) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [session.tenant_id, body.webhook_name, body.url, JSON.stringify(body.events || []), secret]
      );
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
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
      await run('UPDATE webhooks SET webhook_name=$1, url=$2, events=$3, is_active=$4 WHERE id=$5',
        [body.webhook_name, body.url, JSON.stringify(body.events || []), body.is_active ?? 1, body.id]);
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

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM webhooks WHERE id=$1', [id]);
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

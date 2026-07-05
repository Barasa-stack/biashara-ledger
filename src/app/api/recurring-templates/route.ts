import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const templates = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM recurring_templates ORDER BY template_name');
    });
    return NextResponse.json(templates);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const result = await withTenantContext(session.tenant_id!, async () => {
      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + (body.frequency === 'daily' ? 1 : body.frequency === 'weekly' ? 7 : body.frequency === 'yearly' ? 365 : 30));
      return await insertReturning<{ id: string }>(
        `INSERT INTO recurring_templates (tenant_id, template_name, entity_type, template_data, frequency, interval_count, next_run_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [session.tenant_id, body.template_name, body.entity_type || 'invoice', JSON.stringify(body.template_data || {}), body.frequency || 'monthly', Number(body.interval_count) || 1, nextRun.toISOString().split('T')[0]]
      );
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('UPDATE recurring_templates SET template_name=$1, entity_type=$2, template_data=$3, frequency=$4, interval_count=$5, next_run_date=$6, is_active=$7 WHERE id=$8',
        [body.template_name, body.entity_type || 'invoice', JSON.stringify(body.template_data || {}), body.frequency || 'monthly', Number(body.interval_count) || 1, body.next_run_date, body.is_active ?? 1, body.id]);
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM recurring_templates WHERE id=$1', [id]);
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

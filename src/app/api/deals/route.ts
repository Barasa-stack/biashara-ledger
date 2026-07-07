import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const deals = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT d.*, c.customer_name, c.company_name as customer_company FROM deals d LEFT JOIN customers c ON c.id=d.customer_id ORDER BY d.created_at DESC');
    });
    return NextResponse.json(deals);
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
      return await insertReturning<{ id: string }>(
        `INSERT INTO deals (tenant_id, deal_name, customer_id, contact_name, contact_email, contact_phone, deal_value, currency, pipeline_stage, probability, expected_close_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [session.tenant_id, body.deal_name, body.customer_id || null, body.contact_name || '', body.contact_email || '', body.contact_phone || '',
         Number(body.deal_value) || 0, body.currency || 'KES', body.pipeline_stage || 'lead', Number(body.probability) || 10, body.expected_close_date || '', body.notes || '']
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
      await run('UPDATE deals SET deal_name=$1, customer_id=$2, contact_name=$3, contact_email=$4, contact_phone=$5, deal_value=$6, pipeline_stage=$7, probability=$8, expected_close_date=$9, notes=$10, status=$11 WHERE id=$12',
        [body.deal_name, body.customer_id || null, body.contact_name || '', body.contact_email || '', body.contact_phone || '',
         Number(body.deal_value) || 0, body.pipeline_stage || 'lead', Number(body.probability) || 10, body.expected_close_date || '', body.notes || '', body.status || 'open', body.id]);
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
      await run('DELETE FROM deals WHERE id=$1', [id]);
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

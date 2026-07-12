import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const deals = await withTenantContext(session.tenant_id!, async () => {
      return await query(`SELECT d.*, c.customer_name, c.company_name as customer_company,
        l.name as lead_name, l.email as lead_email, l.phone as lead_phone
        FROM deals d
        LEFT JOIN customers c ON c.id=d.customer_id
        LEFT JOIN leads l ON l.id=d.lead_id
        ORDER BY d.created_at DESC`);
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
        `INSERT INTO deals (tenant_id, deal_name, lead_id, customer_id, contact_name, contact_email, contact_phone, deal_value, currency, pipeline_stage, probability, expected_close_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [session.tenant_id, body.deal_name, body.lead_id || null, body.customer_id || null, body.contact_name || '', body.contact_email || '', body.contact_phone || '',
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
      await run('UPDATE deals SET deal_name=$1, lead_id=$2, customer_id=$3, contact_name=$4, contact_email=$5, contact_phone=$6, deal_value=$7, pipeline_stage=$8, probability=$9, expected_close_date=$10, notes=$11, status=$12 WHERE id=$13',
        [body.deal_name, body.lead_id || null, body.customer_id || null, body.contact_name || '', body.contact_email || '', body.contact_phone || '',
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

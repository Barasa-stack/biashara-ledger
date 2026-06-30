import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const customers = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM customers ORDER BY created_at DESC');
    });
    return NextResponse.json(customers);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const result = await withTenantContext(session.tenant_id!, async () => {
      return await insertReturning<{ id: string }>(
        `INSERT INTO customers (tenant_id, customer_name, company_name, contact_person, email_address, phone_number, billing_address, shipping_address, tax_id, payment_terms, credit_limit, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [session.tenant_id,
          body.customer_name || body.company_name || ' ',
          body.company_name || ' ',
          body.contact_person || '',
          body.email_address || '',
          body.phone_number || '',
          body.billing_address || '',
          body.shipping_address || '',
          body.tax_id || '',
          body.payment_terms || 'Net 30',
          body.credit_limit ?? 0,
          body.notes || '']
      );
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run(
        'UPDATE customers SET customer_name=$1, company_name=$2, contact_person=$3, email_address=$4, phone_number=$5, billing_address=$6, shipping_address=$7, tax_id=$8, payment_terms=$9, credit_limit=$10, notes=$11 WHERE id=$12',
        [body.customer_name || ' ', body.company_name || ' ', body.contact_person || '', body.email_address || '',
          body.phone_number || '', body.billing_address || '', body.shipping_address || '', body.tax_id || '',
          body.payment_terms || 'Net 30', body.credit_limit ?? 0, body.notes || '', body.id]
      );
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM customers WHERE id=$1', [id]);
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

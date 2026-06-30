import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const clients = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM clients ORDER BY created_at DESC');
    });
    return NextResponse.json(clients);
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
      return await insertReturning(
        `INSERT INTO clients (tenant_id, supplier_name, company_name, contact_person, email_address, phone_number, address, bank_details, tax_id, payment_terms, supplier_category, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [session.tenant_id, body.supplier_name || body.company_name || ' ', body.company_name, body.contact_person, body.email_address,
         body.phone_number, body.address, body.bank_details, body.tax_id,
         body.payment_terms || 'Net 30', body.supplier_category || '', body.notes]
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
        `UPDATE clients SET supplier_name=$1, company_name=$2, contact_person=$3, email_address=$4, phone_number=$5, address=$6, bank_details=$7, tax_id=$8, payment_terms=$9, supplier_category=$10, notes=$11 WHERE id=$12`,
        [body.supplier_name, body.company_name, body.contact_person, body.email_address,
         body.phone_number, body.address, body.bank_details, body.tax_id,
         body.payment_terms || 'Net 30', body.supplier_category || '', body.notes, body.id]
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
      await run('DELETE FROM clients WHERE id=$1', [id]);
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

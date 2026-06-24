import { NextResponse } from 'next/server';
import { query, get, run, insertReturning } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

async function guard() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const g = await guard();
  if (g) return g;
  const clients = await query('SELECT * FROM clients ORDER BY created_at DESC');
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const g = await guard();
  if (g) return g;
  const body = await request.json();
  const result = await insertReturning(
    `INSERT INTO clients (supplier_name, company_name, contact_person, email_address, phone_number, address, bank_details, tax_id, payment_terms, supplier_category, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
    [body.supplier_name, body.company_name, body.contact_person, body.email_address,
     body.phone_number, body.address, body.bank_details, body.tax_id,
     body.payment_terms || 'Net 30', body.supplier_category || '', body.notes]
  );
  return NextResponse.json({ id: result.id }, { status: 201 });
}

export async function PUT(request: Request) {
  const g = await guard();
  if (g) return g;
  const body = await request.json();
  await run(
    `UPDATE clients SET supplier_name=$1, company_name=$2, contact_person=$3, email_address=$4, phone_number=$5, address=$6, bank_details=$7, tax_id=$8, payment_terms=$9, supplier_category=$10, notes=$11 WHERE id=$12`,
    [body.supplier_name, body.company_name, body.contact_person, body.email_address,
     body.phone_number, body.address, body.bank_details, body.tax_id,
     body.payment_terms || 'Net 30', body.supplier_category || '', body.notes, body.id]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const g = await guard();
  if (g) return g;
  const { id } = await request.json();
  await run('DELETE FROM clients WHERE id=$1', [id]);
  return NextResponse.json({ success: true });
}

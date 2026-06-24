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
  const data = await query('SELECT * FROM credit_notes ORDER BY created_at DESC');
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const g = await guard();
  if (g) return g;
  const body = await request.json();
  await run(
    `UPDATE credit_notes SET credit_note_number=$1, invoice_id=$2, customer_id=$3, customer_name=$4, customer_email=$5, description=$6, quantity=$7, unit_price=$8, subtotal=$9, tax_vat=$10, discounts=$11, amount=$12, reason=$13, notes=$14, payment_terms=$15, issue_date=$16 WHERE id=$17`,
    [body.credit_note_number || '', body.invoice_id, body.customer_id,
     body.customer_name, body.customer_email || '', body.description || '', body.quantity || 1,
     body.unit_price || 0, body.subtotal || 0, body.tax_vat || 0,
     body.discounts || 0, body.amount, body.reason || '',
     body.notes || '', body.payment_terms || 'Net 30', body.issue_date, body.id]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const g = await guard();
  if (g) return g;
  const { id } = await request.json();
  await run('DELETE FROM credit_notes WHERE id=$1', [id]);
  return NextResponse.json({ success: true });
}

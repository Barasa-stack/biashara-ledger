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
  const data = await query('SELECT * FROM purchase_orders ORDER BY created_at DESC');
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const g = await guard();
  if (g) return g;
  const body = await request.json();
  await run(
    `UPDATE purchase_orders SET po_number=$1, client_id=$2, client_name=$3, description=$4, quantity=$5, unit_price=$6, subtotal=$7, tax_vat=$8, amount=$9, delivery_date=$10, status=$11, notes=$12, issue_date=$13 WHERE id=$14`,
    [body.po_number || '', body.client_id, body.client_name,
     body.description || '', body.quantity || 1, body.unit_price || 0,
     body.subtotal || 0, body.tax_vat || 0, body.amount,
     body.delivery_date || '', body.status || 'pending',
     body.notes || '', body.issue_date, body.id]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const g = await guard();
  if (g) return g;
  const { id } = await request.json();
  await run('DELETE FROM purchase_orders WHERE id=$1', [id]);
  return NextResponse.json({ success: true });
}

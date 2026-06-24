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
  const expenses = await query('SELECT * FROM expenses ORDER BY created_at DESC');
  return NextResponse.json(expenses);
}

export async function POST(request: Request) {
  const g = await guard();
  if (g) return g;
  const body = await request.json();
  const result = await insertReturning(
    `INSERT INTO expenses (expense_code, category, description, supplier_vendor, invoice_receipt_number, amount, tax_vat, expense_date, payment_method, paid_by, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
    [body.expense_code || '', body.category, body.description || '',
     body.supplier_vendor || '', body.invoice_receipt_number || '',
     body.amount, body.tax_vat || 0, body.expense_date,
     body.payment_method || 'cash', body.paid_by || '',
     body.status || 'pending', body.notes || '']
  );
  return NextResponse.json({ id: result.id }, { status: 201 });
}

export async function PUT(request: Request) {
  const g = await guard();
  if (g) return g;
  const body = await request.json();
  await run(
    `UPDATE expenses SET expense_code=$1, category=$2, description=$3, supplier_vendor=$4, invoice_receipt_number=$5, amount=$6, tax_vat=$7, expense_date=$8, payment_method=$9, paid_by=$10, status=$11, notes=$12 WHERE id=$13`,
    [body.expense_code || '', body.category, body.description || '',
     body.supplier_vendor || '', body.invoice_receipt_number || '',
     body.amount, body.tax_vat || 0, body.expense_date,
     body.payment_method || 'cash', body.paid_by || '',
     body.status || 'pending', body.notes || '', body.id]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const g = await guard();
  if (g) return g;
  const { id } = await request.json();
  await run('DELETE FROM expenses WHERE id=$1', [id]);
  return NextResponse.json({ success: true });
}

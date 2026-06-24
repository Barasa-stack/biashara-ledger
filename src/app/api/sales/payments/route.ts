import { NextResponse } from 'next/server';
import { query, get, run, insertReturning } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

async function guard() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

async function recalcInvoiceStatus(invoiceId: number) {
  const invoice = await get('SELECT amount FROM sales_invoices WHERE id=$1', [invoiceId]) as { amount: number } | undefined;
  if (!invoice) return;
  const paid = await get('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id=$1', [invoiceId]) as { total: number };
  const status = paid.total >= invoice.amount ? 'paid' : paid.total > 0 ? 'partially_paid' : 'unpaid';
  await run('UPDATE sales_invoices SET status=$1 WHERE id=$2', [status, invoiceId]);
}

export async function GET() {
  const g = await guard();
  if (g) return g;
  const data = await query(
    `SELECT p.*, si.description AS invoice_description, si.invoice_number
    FROM payments p
    LEFT JOIN sales_invoices si ON si.id = p.invoice_id
    ORDER BY p.created_at DESC`
  );
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const g = await guard();
  if (g) return g;
  const body = await request.json();
  await run(
    `UPDATE payments SET invoice_id=$1, customer_id=$2, customer_name=$3, amount=$4, payment_date=$5, payment_method=$6, notes=$7 WHERE id=$8`,
    [body.invoice_id, body.customer_id, body.customer_name,
     body.amount, body.payment_date, body.payment_method || 'cash',
     body.notes || '', body.id]
  );
  await recalcInvoiceStatus(body.invoice_id);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const g = await guard();
  if (g) return g;
  const { id } = await request.json();
  const payment = await get('SELECT invoice_id FROM payments WHERE id=$1', [id]) as { invoice_id: number } | undefined;
  await run('DELETE FROM payments WHERE id=$1', [id]);
  if (payment) await recalcInvoiceStatus(payment.invoice_id);
  return NextResponse.json({ success: true });
}

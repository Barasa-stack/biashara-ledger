import { NextResponse } from 'next/server';
import { get, run, insertReturning, withTenantContext } from '@/lib/db';
import { requireSubscription } from '@/lib/auth-guard';

async function recalcPurchaseInvoiceStatus(invoiceId: number) {
  const invoice = await get('SELECT amount FROM purchase_invoices WHERE id=$1', [invoiceId]) as { amount: number } | undefined;
  if (!invoice) return;
  const paid = await get('SELECT COALESCE(SUM(amount), 0) as total FROM supplier_payments WHERE invoice_id=$1', [invoiceId]) as { total: number };
  const status = paid.total >= invoice.amount ? 'paid' : paid.total > 0 ? 'partially_paid' : 'unpaid';
  await run('UPDATE purchase_invoices SET status=$1 WHERE id=$2', [status, invoiceId]);
}

export async function POST(request: Request) {
  try {
    const { session } = await requireSubscription();
    return await withTenantContext(session.tenant_id!, async () => {
      const body = await request.json();
      const { type } = body;

      if (type === 'po') {
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO purchase_orders (tenant_id, po_number, client_id, client_name, description, quantity, unit_price, subtotal, tax_vat, amount, delivery_date, status, notes, issue_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
          [session.tenant_id, body.po_number || '', body.client_id, body.client_name,
           body.description || '', body.quantity || 1, body.unit_price || 0,
           body.subtotal || 0, body.tax_vat || 0, body.amount,
           body.delivery_date || '', body.status || 'pending',
           body.notes || '', body.issue_date]
        );
        return NextResponse.json({ id: result.id }, { status: 201 });
      }

      if (type === 'invoice') {
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO purchase_invoices (tenant_id, invoice_number, po_id, client_id, client_name, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status, issue_date, due_date, client_country, vat_rate)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id`,
          [session.tenant_id, body.invoice_number || '', body.po_id || null, body.client_id,
           body.client_name, body.description || '', body.quantity || 1,
           body.unit_price || 0, body.subtotal || 0, body.tax_vat || 0,
           body.discounts || 0, body.amount, body.payment_terms || 'Net 30',
           body.status || 'unpaid', body.issue_date, body.due_date,
           body.client_country || '', body.vat_rate || 0]
        );
        return NextResponse.json({ id: result.id }, { status: 201 });
      }

      if (type === 'supplier_payment') {
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO supplier_payments (tenant_id, invoice_id, client_id, client_name, amount, payment_date, payment_method, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [session.tenant_id, body.invoice_id, body.client_id, body.client_name,
           body.amount, body.payment_date, body.payment_method || 'cash',
           body.notes || '']
        );
        await recalcPurchaseInvoiceStatus(body.invoice_id);
        return NextResponse.json({ id: result.id }, { status: 201 });
      }

      if (type === 'debit_note') {
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO debit_notes (tenant_id, debit_note_number, purchase_invoice_id, client_id, client_name, description, quantity, unit_price, amount, reason, notes, issue_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
          [session.tenant_id, body.debit_note_number || '', body.purchase_invoice_id,
           body.client_id, body.client_name, body.description || '',
           body.quantity || 1, body.unit_price || 0, body.amount,
           body.reason || '', body.notes || '', body.issue_date]
        );
        return NextResponse.json({ id: result.id }, { status: 201 });
      }

      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    });
  } catch (e: any) {
    const errMsg = e instanceof Error ? e.message : String(e);
    if (errMsg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[purchases] Error:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

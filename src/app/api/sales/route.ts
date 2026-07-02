import { NextResponse } from 'next/server';
import { get, run, insertReturning, withTenantContext } from '@/lib/db';
import { generateNextNumber } from '@/lib/numbers';
import { requireSubscription } from '@/lib/auth-guard';

async function recalcInvoiceStatus(invoiceId: number) {
  const invoice = await get('SELECT amount FROM sales_invoices WHERE id=$1', [invoiceId]) as { amount: number } | undefined;
  if (!invoice) return;
  const paid = await get('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id=$1', [invoiceId]) as { total: number };
  const status = paid.total >= invoice.amount ? 'paid' : paid.total > 0 ? 'partially_paid' : 'unpaid';
  await run('UPDATE sales_invoices SET status=$1 WHERE id=$2', [status, invoiceId]);
}

export async function POST(request: Request) {
  try {
    const { session } = await requireSubscription();
    const body = await request.json();
    return await withTenantContext(session.tenant_id!, async () => {
      const { type } = body;

      if (type === 'quotation') {
        const qNumber = await generateNextNumber('quotation');
        const itemsJson = JSON.stringify(body.items || []);
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO quotations (quotation_number, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, amount, valid_until, due_date, status, notes, issue_date, items, customer_country)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
          [qNumber, body.customer_id, body.customer_name,
           body.description || '', body.quantity || 1, body.unit_price || 0,
           body.subtotal || 0, body.tax_vat || 0,
           body.amount, body.valid_until || '', body.due_date || '', body.status || 'draft',
           body.notes || '', body.issue_date, itemsJson, body.customer_country || '']
        );
        return NextResponse.json({ id: result.id }, { status: 201 });
      }

      if (type === 'invoice') {
        const invNumber = await generateNextNumber('invoice');
        const itemsJson = JSON.stringify(body.items || []);
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO sales_invoices (invoice_number, quotation_id, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status, issue_date, due_date, items, customer_country)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
          [invNumber, body.quotation_id || null, body.customer_id,
           body.customer_name, body.description || '', body.quantity || 1,
           body.unit_price || 0, body.subtotal || 0, body.tax_vat || 0,
           body.discounts || 0, body.amount, body.payment_terms || 'Net 30',
           body.status || 'unpaid', body.issue_date, body.due_date, itemsJson,
           body.customer_country || '']
        );
        return NextResponse.json({ id: result.id }, { status: 201 });
      }

      if (type === 'payment') {
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO payments (invoice_id, customer_id, customer_name, amount, payment_date, payment_method, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [body.invoice_id, body.customer_id, body.customer_name,
           body.amount, body.payment_date, body.payment_method || 'cash',
           body.notes || '']
        );
        await recalcInvoiceStatus(body.invoice_id);
        return NextResponse.json({ id: result.id }, { status: 201 });
      }

      if (type === 'credit_note') {
        const cnNumber = await generateNextNumber('credit_note');
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO credit_notes (credit_note_number, invoice_id, customer_id, customer_name, customer_email, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, reason, notes, payment_terms, issue_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
          [cnNumber, body.invoice_id, body.customer_id,
           body.customer_name, body.customer_email || '', body.description || '', body.quantity || 1,
           body.unit_price || 0, body.subtotal || 0, body.tax_vat || 0,
           body.discounts || 0, body.amount, body.reason || '',
           body.notes || '', body.payment_terms || 'Net 30', body.issue_date]
        );
        return NextResponse.json({ id: result.id, credit_note_number: cnNumber }, { status: 201 });
      }

      if (type === 'convert-quotation') {
        const q = await get('SELECT * FROM quotations WHERE id=$1', [body.quotation_id]) as any;
        if (!q) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        if (q.status !== 'accepted') return NextResponse.json({ error: 'Only accepted quotations can be converted' }, { status: 400 });
        const invNum = await generateNextNumber('invoice');
        const qItems = q.items ? (typeof q.items === 'string' ? q.items : JSON.stringify(q.items)) : '[]';
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO sales_invoices (invoice_number, quotation_id, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status, issue_date, due_date, items, customer_country)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
          [invNum, q.id, q.customer_id, q.customer_name, q.description, q.quantity, q.unit_price, q.subtotal || q.amount, q.tax_vat || 0, 0, q.amount, 'Net 30', 'unpaid', new Date().toISOString().split('T')[0], '', qItems, q.customer_country || '']
        );
        return NextResponse.json({ id: result.id, invoice_number: invNum }, { status: 201 });
      }

      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    });
  } catch (e: any) {
    if (e?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[sales] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

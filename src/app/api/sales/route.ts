import { NextResponse } from 'next/server';
import { get, run, insertReturning, withTenantContext } from '@/lib/db';
import { getVatRate } from '@/lib/vat-rates';
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
        const countryCode = body.customer_country || '';
        const vatRate = getVatRate(countryCode).rate;
        const computedSubtotal = Number(body.subtotal) || (Number(body.quantity || 1) * Number(body.unit_price || 0));
        const computedTaxVat = Number(body.tax_vat) || (computedSubtotal * vatRate / 100);
        const computedAmount = computedSubtotal + computedTaxVat - (Number(body.discounts) || 0);
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO quotations (tenant_id, quotation_number, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, amount, valid_until, due_date, status, notes, issue_date, items, customer_country, vat_rate)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id`,
          [session.tenant_id, qNumber, body.customer_id, body.customer_name,
           body.description || '', body.quantity || 1, body.unit_price || 0,
           computedSubtotal, computedTaxVat,
           computedAmount, body.valid_until || '', body.due_date || '', body.status || 'draft',
           body.notes || '', body.issue_date, itemsJson, countryCode, vatRate]
        );
        return NextResponse.json({ id: result.id }, { status: 201 });
      }

      if (type === 'invoice') {
        const invNumber = await generateNextNumber('invoice');
        const itemsJson = JSON.stringify(body.items || []);
        const countryCode = body.customer_country || '';
        const vatRate = getVatRate(countryCode).rate;
        const computedSubtotal = Number(body.subtotal) || (Number(body.quantity || 1) * Number(body.unit_price || 0));
        const computedTaxVat = Number(body.tax_vat) || (computedSubtotal * vatRate / 100);
        const computedAmount = computedSubtotal + computedTaxVat - (Number(body.discounts) || 0);
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO sales_invoices (tenant_id, invoice_number, quotation_id, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status, issue_date, due_date, items, customer_country, vat_rate)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id`,
          [session.tenant_id, invNumber, body.quotation_id || null, body.customer_id,
           body.customer_name, body.description || '', body.quantity || 1,
           body.unit_price || 0, computedSubtotal, computedTaxVat,
           body.discounts || 0, computedAmount, body.payment_terms || 'Net 30',
           body.status || 'unpaid', body.issue_date, body.due_date, itemsJson,
           countryCode, vatRate]
        );
        return NextResponse.json({ id: result.id }, { status: 201 });
      }

      if (type === 'payment') {
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO payments (tenant_id, invoice_id, customer_id, customer_name, amount, payment_date, payment_method, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [session.tenant_id, body.invoice_id, body.customer_id, body.customer_name,
           body.amount, body.payment_date, body.payment_method || 'cash',
           body.notes || '']
        );
        await recalcInvoiceStatus(body.invoice_id);
        return NextResponse.json({ id: result.id }, { status: 201 });
      }

      if (type === 'credit_note') {
        const cnNumber = await generateNextNumber('credit_note');
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO credit_notes (tenant_id, credit_note_number, invoice_id, customer_id, customer_name, customer_email, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, reason, notes, payment_terms, issue_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
          [session.tenant_id, cnNumber, body.invoice_id, body.customer_id,
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
        const computedSubtotal = Number(q.subtotal || q.amount || 0);
        const computedTaxVat = Number(q.tax_vat || 0);
        const computedDiscounts = Number(q.discounts || 0);
        const computedAmount = computedSubtotal + computedTaxVat - computedDiscounts;
        const result = await insertReturning<{ id: number }>(
          `INSERT INTO sales_invoices (tenant_id, invoice_number, quotation_id, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status, issue_date, due_date, items, customer_country, vat_rate)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id`,
          [session.tenant_id, invNum, q.id, q.customer_id, q.customer_name, q.description, q.quantity, q.unit_price, computedSubtotal, computedTaxVat, computedDiscounts, computedAmount, 'Net 30', 'unpaid', new Date().toISOString().split('T')[0], '', qItems, q.customer_country || '', q.vat_rate || 0]
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
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

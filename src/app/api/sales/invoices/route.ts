import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { generateNextNumber } from '@/lib/numbers';
import { validateBody } from '@/lib/validate';
import { getVatRate } from '@/lib/vat-rates';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await withTenantContext(session.tenant_id!, async () => {
      const today = new Date().toISOString().split('T')[0];
      await run(
        `UPDATE sales_invoices SET status='overdue' WHERE status IN ('unpaid','sent') AND due_date IS NOT NULL AND due_date < $1`,
        [today]
      );
      if (id) {
        return await get('SELECT * FROM sales_invoices WHERE id=$1', [id]);
      }
      return await query('SELECT * FROM sales_invoices ORDER BY created_at DESC');
    });
    return NextResponse.json(data || null);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[error] ' + msg);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const errors = validateBody(body, {
      customer_name: { type: 'string', required: true },
      amount: { type: 'number', required: true, min: 0 },
      customer_id: { type: 'string', required: true },
      quantity: { type: 'number', min: 0 },
      unit_price: { type: 'number', min: 0 },
      subtotal: { type: 'number', min: 0 },
      tax_vat: { type: 'number', min: 0 },
      discounts: { type: 'number', min: 0 },
    });
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }
    const result = await withTenantContext(session.tenant_id!, async () => {
      if (body.id && !body.invoice_number && !body.customer_id) {
        await run('DELETE FROM sales_invoices WHERE id=$1', [body.id]);
        return null;
      }
      const invNumber = body.invoice_number || await generateNextNumber('invoice');
      const itemsJson = JSON.stringify(body.items || []);
      const countryCode = body.customer_country || '';
      const vatRate = getVatRate(countryCode).rate;
      const computedSubtotal = Number(body.subtotal) || (Number(body.quantity || 1) * Number(body.unit_price || 0));
      const computedTaxVat = Number(body.tax_vat) || (computedSubtotal * vatRate / 100);
      const computedAmount = computedSubtotal + computedTaxVat - (Number(body.discounts) || 0);
      return await insertReturning<{ id: string }>(
        `INSERT INTO sales_invoices (tenant_id, invoice_number, quotation_id, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status, issue_date, due_date, items, customer_country, vat_rate)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id`,
        [session.tenant_id, invNumber, body.quotation_id || null, body.customer_id,
         body.customer_name, body.description || '', body.quantity || 1,
         body.unit_price || 0, computedSubtotal, computedTaxVat,
         body.discounts || 0, computedAmount, body.payment_terms || 'Net 30',
         body.status || 'unpaid', body.issue_date, body.due_date || ' ', itemsJson,
         countryCode, vatRate]
      );
    });
    if (!result) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[invoices] POST Error:', msg);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const errors = validateBody(body, {
      customer_name: { type: 'string', required: true },
      amount: { type: 'number', required: true, min: 0 },
      quantity: { type: 'number', min: 0 },
      unit_price: { type: 'number', min: 0 },
      subtotal: { type: 'number', min: 0 },
      tax_vat: { type: 'number', min: 0 },
      discounts: { type: 'number', min: 0 },
    });
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }
    await withTenantContext(session.tenant_id!, async () => {
      const itemsJson = JSON.stringify(body.items || []);
      const countryCode = body.customer_country || '';
      const vatRate = getVatRate(countryCode).rate;
      const computedSubtotal = Number(body.subtotal) || (Number(body.quantity || 1) * Number(body.unit_price || 0));
      const computedTaxVat = Number(body.tax_vat) || (computedSubtotal * vatRate / 100);
      const computedAmount = computedSubtotal + computedTaxVat - (Number(body.discounts) || 0);
      await run(
        `UPDATE sales_invoices SET invoice_number=$1, quotation_id=$2, customer_id=$3, customer_name=$4, description=$5, quantity=$6, unit_price=$7, subtotal=$8, tax_vat=$9, discounts=$10, amount=$11, payment_terms=$12, status=$13, issue_date=$14, due_date=$15, items=$16, customer_country=$17, vat_rate=$18 WHERE id=$19`,
        [body.invoice_number || '', body.quotation_id || null, body.customer_id,
         body.customer_name, body.description || '', body.quantity || 1,
         body.unit_price || 0, computedSubtotal, computedTaxVat,
         body.discounts || 0, computedAmount, body.payment_terms || 'Net 30',
         body.status || 'unpaid', body.issue_date, body.due_date, itemsJson,
         countryCode, vatRate, body.id]
      );
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[error] ' + msg);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM sales_invoices WHERE id=$1', [id]);
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[error] ' + msg);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

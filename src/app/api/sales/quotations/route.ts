import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { generateNextNumber } from '@/lib/numbers';
import { getVatRate } from '@/lib/vat-rates';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const data = await withTenantContext(session.tenant_id!, async () => {
      const today = new Date().toISOString().split('T')[0];
      await run(
        `UPDATE quotations SET status='overdue' WHERE status IN ('draft','sent') AND ((valid_until IS NOT NULL AND valid_until < $1) OR (due_date IS NOT NULL AND due_date < $1))`,
        [today]
      );
      return await query('SELECT * FROM quotations ORDER BY created_at DESC');
    });
    return NextResponse.json(data);
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
    const result = await withTenantContext(session.tenant_id!, async () => {
      const qNumber = body.quotation_number || await generateNextNumber('quotation');
      const itemsJson = JSON.stringify(body.items || []);
      const countryCode = body.customer_country || '';
      const vatRate = getVatRate(countryCode).rate;
      const computedSubtotal = Number(body.subtotal) || (Number(body.quantity || 1) * Number(body.unit_price || 0));
      const computedTaxVat = Number(body.tax_vat) || (computedSubtotal * vatRate / 100);
      const computedAmount = computedSubtotal + computedTaxVat - (Number(body.discounts) || 0);
      return await insertReturning<{ id: string }>(
        `INSERT INTO quotations (tenant_id, quotation_number, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, amount, valid_until, due_date, status, notes, issue_date, items, customer_country, vat_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id`,
        [session.tenant_id, qNumber, body.customer_id, body.customer_name,
         body.description || '', body.quantity || 1, body.unit_price || 0,
         computedSubtotal, computedTaxVat,
         computedAmount, body.valid_until || '', body.due_date || '', body.status || 'draft',
         body.notes || '', body.issue_date, itemsJson, countryCode, vatRate]
      );
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[quotations] POST Error:', msg);
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
    await withTenantContext(session.tenant_id!, async () => {
      const itemsJson = JSON.stringify(body.items || []);
      const countryCode = body.customer_country || '';
      const vatRate = getVatRate(countryCode).rate;
      const computedSubtotal = Number(body.subtotal) || (Number(body.quantity || 1) * Number(body.unit_price || 0));
      const computedTaxVat = Number(body.tax_vat) || (computedSubtotal * vatRate / 100);
      const computedAmount = computedSubtotal + computedTaxVat - (Number(body.discounts) || 0);
      await run(
        `UPDATE quotations SET quotation_number=$1, customer_id=$2, customer_name=$3, description=$4, quantity=$5, unit_price=$6, subtotal=$7, tax_vat=$8, amount=$9, valid_until=$10, due_date=$11, status=$12, notes=$13, issue_date=$14, items=$15, customer_country=$16, vat_rate=$17 WHERE id=$18`,
        [body.quotation_number || '', body.customer_id, body.customer_name,
         body.description || '', body.quantity || 1, body.unit_price || 0,
         computedSubtotal, computedTaxVat,
         computedAmount, body.valid_until || '', body.due_date || '', body.status || 'draft',
         body.notes || '', body.issue_date, itemsJson, countryCode, vatRate, body.id]
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
      await run('DELETE FROM quotations WHERE id=$1', [id]);
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

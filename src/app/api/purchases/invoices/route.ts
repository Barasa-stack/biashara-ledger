import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const data = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM purchase_invoices ORDER BY created_at DESC');
    });
    return NextResponse.json(data);
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run(
        `UPDATE purchase_invoices SET invoice_number=$1, po_id=$2, client_id=$3, client_name=$4, description=$5, quantity=$6, unit_price=$7, subtotal=$8, tax_vat=$9, discounts=$10, amount=$11, payment_terms=$12, status=$13, issue_date=$14, due_date=$15, client_country=$16, vat_rate=$17 WHERE id=$18`,
        [body.invoice_number || '', body.po_id || null, body.client_id,
         body.client_name, body.description || '', body.quantity || 1,
         body.unit_price || 0, body.subtotal || 0, body.tax_vat || 0,
         body.discounts || 0, body.amount, body.payment_terms || 'Net 30',
         body.status || 'unpaid', body.issue_date, body.due_date,
         body.client_country || '', body.vat_rate || 0, body.id]
      );
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM purchase_invoices WHERE id=$1', [id]);
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

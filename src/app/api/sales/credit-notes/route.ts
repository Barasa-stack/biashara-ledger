import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const data = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM credit_notes ORDER BY created_at DESC');
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run(
        `UPDATE credit_notes SET credit_note_number=$1, invoice_id=$2, customer_id=$3, customer_name=$4, customer_email=$5, description=$6, quantity=$7, unit_price=$8, subtotal=$9, tax_vat=$10, discounts=$11, amount=$12, reason=$13, notes=$14, payment_terms=$15, issue_date=$16 WHERE id=$17`,
        [body.credit_note_number || '', body.invoice_id, body.customer_id,
         body.customer_name, body.customer_email || '', body.description || '', body.quantity || 1,
         body.unit_price || 0, body.subtotal || 0, body.tax_vat || 0,
         body.discounts || 0, body.amount, body.reason || '',
         body.notes || '', body.payment_terms || 'Net 30', body.issue_date, body.id]
      );
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM credit_notes WHERE id=$1', [id]);
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { generateNextNumber } from '@/lib/numbers';

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
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return await insertReturning<{ id: string }>(
        `INSERT INTO quotations (tenant_id, quotation_number, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, amount, valid_until, due_date, status, notes, issue_date, items)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
        [session.tenant_id, qNumber, body.customer_id, body.customer_name,
         body.description || '', body.quantity || 1, body.unit_price || 0,
         body.subtotal || 0, body.tax_vat || 0,
         body.amount, body.valid_until || '', body.due_date || '', body.status || 'draft',
         body.notes || '', body.issue_date, itemsJson]
      );
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
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
      const itemsJson = JSON.stringify(body.items || []);
      await run(
        `UPDATE quotations SET quotation_number=$1, customer_id=$2, customer_name=$3, description=$4, quantity=$5, unit_price=$6, subtotal=$7, tax_vat=$8, amount=$9, valid_until=$10, due_date=$11, status=$12, notes=$13, issue_date=$14, items=$15 WHERE id=$16`,
        [body.quotation_number || '', body.customer_id, body.customer_name,
         body.description || '', body.quantity || 1, body.unit_price || 0,
         body.subtotal || 0, body.tax_vat || 0,
         body.amount, body.valid_until || '', body.due_date || '', body.status || 'draft',
         body.notes || '', body.issue_date, itemsJson, body.id]
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
      await run('DELETE FROM quotations WHERE id=$1', [id]);
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

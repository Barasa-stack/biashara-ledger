import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { validateBody } from '@/lib/validate';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const expenses = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM expenses ORDER BY created_at DESC');
    });
    return NextResponse.json(expenses);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const errors = validateBody(body, {
      amount: { type: 'number', required: true, min: 0 },
      expense_date: { type: 'string', required: true },
    });
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }
    const result = await withTenantContext(session.tenant_id!, async () => {
      return await insertReturning(
        `INSERT INTO expenses (tenant_id, expense_code, category, description, supplier_vendor, invoice_receipt_number, amount, tax_vat, expense_date, payment_method, paid_by, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [session.tenant_id, body.expense_code || '', body.category || ' ', body.description || '',
         body.supplier_vendor || '', body.invoice_receipt_number || '',
         body.amount, body.tax_vat || 0, body.expense_date,
         body.payment_method || 'cash', body.paid_by || '',
         body.status || 'pending', body.notes || '']
      );
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const errors = validateBody(body, {
      amount: { type: 'number', required: true, min: 0 },
      expense_date: { type: 'string', required: true },
    });
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }
    await withTenantContext(session.tenant_id!, async () => {
      await run(
        `UPDATE expenses SET expense_code=$1, category=$2, description=$3, supplier_vendor=$4, invoice_receipt_number=$5, amount=$6, tax_vat=$7, expense_date=$8, payment_method=$9, paid_by=$10, status=$11, notes=$12 WHERE id=$13`,
        [body.expense_code || '', body.category || ' ', body.description || '',
         body.supplier_vendor || '', body.invoice_receipt_number || '',
         body.amount, body.tax_vat || 0, body.expense_date,
         body.payment_method || 'cash', body.paid_by || '',
         body.status || 'pending', body.notes || '', body.id]
      );
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM expenses WHERE id=$1', [id]);
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

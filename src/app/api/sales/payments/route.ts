import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { validateBody } from '@/lib/validate';

async function recalcInvoiceStatus(invoiceId: string) {
  const invoice = await get('SELECT amount FROM sales_invoices WHERE id=$1', [invoiceId]) as { amount: number } | undefined;
  if (!invoice) return;
  const paid = await get('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id=$1', [invoiceId]) as { total: number };
  const status = paid.total >= invoice.amount ? 'paid' : paid.total > 0 ? 'partially_paid' : 'unpaid';
  await run('UPDATE sales_invoices SET status=$1 WHERE id=$2', [status, invoiceId]);
}

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const data = await withTenantContext(session.tenant_id!, async () => {
      return await query(
        `SELECT p.*, si.description AS invoice_description, si.invoice_number
        FROM payments p
        LEFT JOIN sales_invoices si ON si.id = p.invoice_id
        ORDER BY p.created_at DESC`
      );
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

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const errors = validateBody(body, {
      amount: { type: 'number', required: true, min: 0 },
      invoice_id: { type: 'string', required: true },
    });
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }
    const result = await withTenantContext(session.tenant_id!, async () => {
      return await insertReturning(
        `INSERT INTO payments (tenant_id, invoice_id, customer_id, customer_name, amount, payment_date, payment_method, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [session.tenant_id, body.invoice_id, body.customer_id || null,
         body.customer_name || '', body.amount, body.payment_date,
         body.payment_method || 'cash', body.notes || '']
      );
    });
    await recalcInvoiceStatus(body.invoice_id);
    return NextResponse.json({ id: result.id }, { status: 201 });
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
        `UPDATE payments SET invoice_id=$1, customer_id=$2, customer_name=$3, amount=$4, payment_date=$5, payment_method=$6, notes=$7 WHERE id=$8`,
        [body.invoice_id, body.customer_id, body.customer_name,
         body.amount, body.payment_date, body.payment_method || 'cash',
         body.notes || '', body.id]
      );
      await recalcInvoiceStatus(body.invoice_id);
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
      const payment = await get('SELECT invoice_id FROM payments WHERE id=$1', [id]) as { invoice_id: string } | undefined;
      await run('DELETE FROM payments WHERE id=$1', [id]);
      if (payment) await recalcInvoiceStatus(payment.invoice_id);
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

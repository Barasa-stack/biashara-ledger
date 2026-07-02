import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { validateBody } from '@/lib/validate';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const data = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM credit_notes ORDER BY created_at DESC');
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
      customer_name: { type: 'string', required: true },
    });
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }
    const result = await withTenantContext(session.tenant_id!, async () => {
      return await insertReturning(
        `INSERT INTO credit_notes (tenant_id, credit_note_number, invoice_id, customer_id, customer_name, customer_email, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, reason, notes, payment_terms, issue_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
        [session.tenant_id, body.credit_note_number || '', body.invoice_id || null,
         body.customer_id || null, body.customer_name, body.customer_email || '',
         body.description || '', body.quantity || 1, body.unit_price || 0,
         body.subtotal || 0, body.tax_vat || 0, body.discounts || 0,
         body.amount, body.reason || '', body.notes || '',
         body.payment_terms || 'Net 30', body.issue_date || '']
      );
    });
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
        `UPDATE credit_notes SET credit_note_number=$1, invoice_id=$2, customer_id=$3, customer_name=$4, customer_email=$5, description=$6, quantity=$7, unit_price=$8, subtotal=$9, tax_vat=$10, discounts=$11, amount=$12, reason=$13, notes=$14, payment_terms=$15, issue_date=$16 WHERE id=$17`,
        [body.credit_note_number || '', body.invoice_id, body.customer_id,
         body.customer_name, body.customer_email || '', body.description || '', body.quantity || 1,
         body.unit_price || 0, body.subtotal || 0, body.tax_vat || 0,
         body.discounts || 0, body.amount, body.reason || '',
         body.notes || '', body.payment_terms || 'Net 30', body.issue_date, body.id]
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
      await run('DELETE FROM credit_notes WHERE id=$1', [id]);
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

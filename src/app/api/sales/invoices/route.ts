import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, exec, withTenantContext, withoutTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { generateNextNumber } from '@/lib/numbers';
import { validateBody } from '@/lib/validate';
import { getVatRate } from '@/lib/vat-rates';

const ALLOWED_PAYMENT_METHODS = ['cash', 'mpesa', 'card', 'bank_transfer', 'cheque', 'other'];

const IMMUTABLE_STATUSES = ['paid', 'cancelled', 'declined'];

function validateIdempotencyKey(key: string | undefined): boolean {
  return typeof key === 'string' && key.length >= 16 && key.length <= 128;
}

async function ensureInvoiceTable() {
  try {
    await withoutTenantContext(async () => {
      await exec(`
        CREATE TABLE IF NOT EXISTS public.sales_invoices (
          tenant_id UUID NOT NULL REFERENCES public.tenants(id),
          id UUID DEFAULT gen_random_uuid(),
          invoice_number TEXT DEFAULT '',
          quotation_id UUID,
          customer_id UUID NOT NULL,
          customer_name TEXT NOT NULL,
          description TEXT DEFAULT '',
          quantity REAL DEFAULT 1,
          unit_price REAL DEFAULT 0,
          subtotal REAL DEFAULT 0,
          tax_vat REAL DEFAULT 0,
          discounts REAL DEFAULT 0,
          amount REAL NOT NULL DEFAULT 0,
          payment_terms TEXT DEFAULT 'Net 30',
          status TEXT DEFAULT 'unpaid',
          items TEXT DEFAULT '[]',
          issue_date TEXT NOT NULL,
          due_date TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (tenant_id, id)
        )
      `);
      await exec('ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ');
      await exec('ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS idempotency_key TEXT');
      await exec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS customer_country TEXT DEFAULT ''`);
      await exec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 0`);
      await exec('CREATE INDEX IF NOT EXISTS idx_sales_invoices_deleted_at ON public.sales_invoices (deleted_at)');
    });
  } catch {
    // table or columns already exist
  }
}

export async function GET(request: Request) {
  let session;
  try {
    session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    await ensureInvoiceTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const today = new Date().toISOString().split('T')[0];
    const data = await withTenantContext(session.tenant_id!, async () => {
      await run(
        `UPDATE sales_invoices SET status='overdue' WHERE status IN ('unpaid','sent') AND due_date IS NOT NULL AND due_date < $1`,
        [today]
      ).catch(() => {});
      if (id) {
        return await get(
          `SELECT si.*, c.billing_address, c.country as customer_city, c.email_address, c.phone_number, c.tax_id as customer_tax_id FROM sales_invoices si LEFT JOIN customers c ON c.id = si.customer_id WHERE si.id=$1`,
          [id]
        );
      }
      return await query(
        `SELECT si.*, c.billing_address, c.country as customer_city, c.email_address, c.phone_number, c.tax_id as customer_tax_id FROM sales_invoices si LEFT JOIN customers c ON c.id = si.customer_id WHERE si.deleted_at IS NULL ORDER BY si.created_at DESC`
      );
    });
    return NextResponse.json(data || null);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[error] ' + msg);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (msg.includes('deleted_at') || msg.includes('does not exist')) {
      if (!session) return NextResponse.json({ error: msg }, { status: 500 });
      try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const data = await withTenantContext(session.tenant_id!, async () => {
          if (id) {
            return await get(
              `SELECT si.*, c.billing_address, c.country as customer_city, c.email_address, c.phone_number, c.tax_id as customer_tax_id FROM sales_invoices si LEFT JOIN customers c ON c.id = si.customer_id WHERE si.id=$1`,
              [id]
            );
          }
          return await query(
            `SELECT si.*, c.billing_address, c.country as customer_city, c.email_address, c.phone_number, c.tax_id as customer_tax_id FROM sales_invoices si LEFT JOIN customers c ON c.id = si.customer_id ORDER BY si.created_at DESC`
          );
        });
        return NextResponse.json(data || null);
      } catch {}
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    await ensureInvoiceTable();
    const body = await request.json();
    const idempotencyKey = request.headers.get('x-idempotency-key') || body.idempotency_key || crypto.randomUUID();

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
      // Check for existing invoice with same idempotency key
      const existing = await get('SELECT id FROM sales_invoices WHERE idempotency_key=$1', [idempotencyKey]);
      if (existing) {
        return { id: existing.id, duplicate: true };
      }
      const invNumber = body.invoice_number || await generateNextNumber('invoice');
      const itemsJson = typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []);
      const countryCode = body.customer_country || '';
      const defaultVatRate = getVatRate(countryCode).rate;
      const vatRate = body.vat_rate !== undefined ? Number(body.vat_rate) : defaultVatRate;
      const computedSubtotal = Number(body.subtotal) || (Number(body.quantity || 1) * Number(body.unit_price || 0));
      const computedTaxVat = body.tax_vat !== undefined ? Number(body.tax_vat) : (computedSubtotal * vatRate / 100);
      const computedAmount = computedSubtotal + computedTaxVat - (Number(body.discounts) || 0);
      const inserted = await insertReturning<{ id: string }>(
        `INSERT INTO sales_invoices (tenant_id, invoice_number, quotation_id, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status, issue_date, due_date, items, customer_country, vat_rate, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING id`,
        [session.tenant_id, invNumber, body.quotation_id || null, body.customer_id,
          body.customer_name, body.description || '', body.quantity || 1,
          body.unit_price || 0, computedSubtotal, computedTaxVat,
          body.discounts || 0, computedAmount, body.payment_terms || 'Net 30',
          body.status || 'unpaid', body.issue_date || new Date().toISOString().split('T')[0], body.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], itemsJson,
          countryCode, vatRate, idempotencyKey]
      );

      // Auto-deduct inventory if status is not draft
      const invoiceStatus = body.status || 'unpaid';
      if (invoiceStatus !== 'draft') {
        let lineItems: any[] = [];
        try { lineItems = typeof body.items === 'string' ? JSON.parse(body.items) : (Array.isArray(body.items) ? body.items : []); } catch {}
        const today = new Date().toISOString().split('T')[0];
        for (const li of lineItems) {
          if (!li.item_id) continue;
          const invItem = await get('SELECT current_stock FROM inventory_items WHERE id=$1', [li.item_id]) as any;
          if (!invItem) continue;
          const qty = Number(li.quantity) || 0;
          const cost = Number(li.unit_price) || 0;
          const total = qty * cost;
          const newQty = Math.max(0, Number(invItem.current_stock) - qty);
          await run('UPDATE inventory_items SET current_stock=$1 WHERE id=$2', [newQty, li.item_id]);
          await run(
            `INSERT INTO inventory_transactions (tenant_id, item_id, transaction_type, quantity, unit_cost, total_cost, reference_type, reference_id, transaction_date, notes)
             VALUES ($1, $2, 'SALE', $3, $4, $5, 'invoice', $6, $7, '')`,
            [session.tenant_id, li.item_id, qty, cost, total, inserted.id, today]
          );
        }
      }

      return { id: inserted.id };
    });
    if (!result || result.duplicate) {
      return NextResponse.json({ id: result?.id, duplicate: true }, { status: result?.duplicate ? 200 : 201 });
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
    await ensureInvoiceTable();
    const body = await request.json();
    const errors = validateBody(body, {
      id: { type: 'string', required: true },
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
    await withTenantContext(session.tenant_id!, async () => {
      // Fetch current invoice to check status transition rules
      const current = await get('SELECT status, amount FROM sales_invoices WHERE id=$1', [body.id]);
      if (!current) {
        throw new Error('Invoice not found');
      }
      if (IMMUTABLE_STATUSES.includes(current.status)) {
        throw new Error(`Cannot modify invoice with status '${current.status}'`);
      }
      // Prevent changing amount on invoices with payments
      if (current.amount !== body.amount) {
        const payments = await get('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id=$1', [body.id]);
        if (payments && payments.total > 0) {
          throw new Error('Cannot change amount on invoice with existing payments');
        }
      }
      const itemsJson = typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []);
      const countryCode = body.customer_country || '';
      const defaultVatRate = getVatRate(countryCode).rate;
      const vatRate = body.vat_rate !== undefined ? Number(body.vat_rate) : defaultVatRate;
      const computedSubtotal = Number(body.subtotal) || (Number(body.quantity || 1) * Number(body.unit_price || 0));
      const computedTaxVat = body.tax_vat !== undefined ? Number(body.tax_vat) : (computedSubtotal * vatRate / 100);
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
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    await ensureInvoiceTable();
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      // Soft delete: set deleted_at timestamp
      const result = await run('UPDATE sales_invoices SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL', [id]);
      if (result.rowCount === 0) {
        throw new Error('Invoice not found or already deleted');
      }
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[error] ' + msg);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

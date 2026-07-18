import { NextResponse } from 'next/server';
import { query, get, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const data = await withTenantContext(session.tenant_id!, async () => {
      return await query('SELECT * FROM purchase_orders ORDER BY created_at DESC');
    });
    return NextResponse.json(data);
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
    const result = await withTenantContext(session.tenant_id!, async () => {
      return await insertReturning<{ id: string }>(
        `INSERT INTO purchase_orders (tenant_id, po_number, client_id, client_name, item_id, description, quantity, unit_price, subtotal, tax_vat, amount, delivery_date, status, notes, issue_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
        [session.tenant_id, body.po_number || body.po_id || '', body.client_id, body.client_name,
         body.item_id || null, body.description || '', body.quantity || 1, body.unit_price || 0,
         body.subtotal || 0, body.tax_vat || 0, body.amount,
         body.delivery_date || '', body.status || 'pending',
         body.notes || '', body.issue_date]
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

async function poApplyWeightedAverageCost(itemId: string, quantity: number, unitCost: number, transactionType: string) {
  const item = await get(
    'SELECT current_stock, unit_cost FROM inventory_items WHERE id=$1',
    [itemId]
  ) as { current_stock: number; unit_cost: number } | undefined;
  if (!item) return;

  if (transactionType === 'PURCHASE') {
    const currentQty = Number(item.current_stock) || 0;
    const currentCost = Number(item.unit_cost) || 0;
    const totalCost = (currentQty * currentCost) + (quantity * unitCost);
    const newQty = currentQty + quantity;
    const weightedAvgCost = newQty > 0 ? totalCost / newQty : 0;
    await run('UPDATE inventory_items SET current_stock=$1, unit_cost=$2 WHERE id=$3', [newQty, weightedAvgCost, itemId]);
  } else if (transactionType === 'SALE') {
    const newQty = Math.max(0, Number(item.current_stock) - quantity);
    await run('UPDATE inventory_items SET current_stock=$1 WHERE id=$2', [newQty, itemId]);
  } else if (transactionType === 'RETURN') {
    const newQty = Number(item.current_stock) + quantity;
    await run('UPDATE inventory_items SET current_stock=$1 WHERE id=$2', [newQty, itemId]);
  } else if (transactionType === 'ADJUSTMENT') {
    const newQty = Math.max(0, Number(item.current_stock) + quantity);
    await run('UPDATE inventory_items SET current_stock=$1 WHERE id=$2', [newQty, itemId]);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const result = await withTenantContext(session.tenant_id!, async () => {
      const po = await get(
        'SELECT status, item_id, quantity, unit_price FROM purchase_orders WHERE id=$1',
        [body.id]
      ) as { status: string; item_id: string | null; quantity: number; unit_price: number } | undefined;

      await run(
        `UPDATE purchase_orders SET po_number=$1, client_id=$2, client_name=$3, item_id=$4, description=$5, quantity=$6, unit_price=$7, subtotal=$8, tax_vat=$9, amount=$10, delivery_date=$11, status=$12, notes=$13, issue_date=$14 WHERE id=$15`,
        [body.po_number || body.po_id || '', body.client_id, body.client_name,
         body.item_id || null, body.description || '', body.quantity || 1, body.unit_price || 0,
         body.subtotal || 0, body.tax_vat || 0, body.amount,
         body.delivery_date || '', body.status || 'pending',
         body.notes || '', body.issue_date, body.id]
      );

      const itemId = body.item_id || po?.item_id || null;
      if (body.status === 'Received' && itemId) {
        const qty = Number(body.quantity || po?.quantity || 1);
        const cost = Number(body.unit_price || po?.unit_price || 0);
        const total = qty * cost;
        const txnDate = body.issue_date || new Date().toISOString().split('T')[0];

        await poApplyWeightedAverageCost(itemId, qty, cost, 'PURCHASE');

        await run(
          `INSERT INTO inventory_transactions (tenant_id, item_id, transaction_type, quantity, unit_cost, total_cost, reference_type, reference_id, transaction_date, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [session.tenant_id, itemId, 'PURCHASE', qty, cost, total,
           'PO', body.id, txnDate, `Auto-created from PO ${body.po_number || ''}`]
        );
      }
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
      await run('DELETE FROM purchase_orders WHERE id=$1', [id]);
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

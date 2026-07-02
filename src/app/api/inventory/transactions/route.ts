import { NextResponse } from 'next/server';
import { query, run, insertReturning, get, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

async function applyWeightedAverageCost(tenantId: string, itemId: string, quantity: number, unitCost: number, transactionType: string) {
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
    await run(
      'UPDATE inventory_items SET current_stock=$1, unit_cost=$2 WHERE id=$3',
      [newQty, weightedAvgCost, itemId]
    );
  } else if (transactionType === 'SALE') {
    const newQty = Math.max(0, Number(item.current_stock) - quantity);
    await run(
      'UPDATE inventory_items SET current_stock=$1 WHERE id=$2',
      [newQty, itemId]
    );
  } else if (transactionType === 'RETURN') {
    const newQty = Number(item.current_stock) + quantity;
    await run(
      'UPDATE inventory_items SET current_stock=$1 WHERE id=$2',
      [newQty, itemId]
    );
  } else if (transactionType === 'ADJUSTMENT') {
    const newQty = Math.max(0, quantity);
    await run(
      'UPDATE inventory_items SET current_stock=$1 WHERE id=$2',
      [newQty, itemId]
    );
  }
}

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const transactions = await withTenantContext(session.tenant_id!, async () => {
      return await query(`
        SELECT t.*, i.item_name, i.sku
        FROM inventory_transactions t
        JOIN inventory_items i ON i.id = t.item_id
        ORDER BY t.transaction_date DESC, t.created_at DESC
        LIMIT 500
      `);
    });
    return NextResponse.json(transactions);
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
    const result = await withTenantContext(session.tenant_id!, async () => {
      const qty = Number(body.quantity) || 0;
      const cost = Number(body.unit_cost) || 0;
      const total = qty * cost;

      await applyWeightedAverageCost(session.tenant_id!, body.item_id, qty, cost, body.transaction_type);

      return await insertReturning<{ id: string }>(
        `INSERT INTO inventory_transactions (tenant_id, item_id, transaction_type, quantity, unit_cost, total_cost, reference_type, reference_id, transaction_date, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [session.tenant_id, body.item_id, body.transaction_type || 'PURCHASE', qty, cost, total,
         body.reference_type || '', body.reference_id || '', body.transaction_date || new Date().toISOString().split('T')[0],
         body.notes || '']
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

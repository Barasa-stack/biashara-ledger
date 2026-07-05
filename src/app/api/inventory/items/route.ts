import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const items = await withTenantContext(session.tenant_id!, async () => {
      return await query(`
        SELECT i.*, 
          COALESCE(SUM(CASE WHEN t.transaction_type = 'PURCHASE' THEN t.quantity ELSE 0 END), 0) as total_purchased,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'SALE' THEN t.quantity ELSE 0 END), 0) as total_sold
        FROM inventory_items i
        LEFT JOIN inventory_transactions t ON t.item_id = i.id
        GROUP BY i.id, i.tenant_id, i.item_name, i.sku, i.category, i.unit_of_measure, i.opening_stock, i.current_stock, i.unit_cost, i.created_at
        ORDER BY i.item_name
      `);
    });
    return NextResponse.json(items);
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
      const unitCost = Number(body.unit_cost) || 0;
      const openingStock = Number(body.opening_stock) || 0;
      return await insertReturning<{ id: string }>(
        `INSERT INTO inventory_items (tenant_id, item_name, sku, category, unit_of_measure, opening_stock, current_stock, unit_cost) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [session.tenant_id, body.item_name || '', body.sku || '', body.category || '', body.unit_of_measure || 'pcs',
         openingStock, openingStock, unitCost]
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
    await withTenantContext(session.tenant_id!, async () => {
      await run(
        `UPDATE inventory_items SET item_name=$1, sku=$2, category=$3, unit_of_measure=$4, unit_cost=$5 WHERE id=$6`,
        [body.item_name || '', body.sku || '', body.category || '', body.unit_of_measure || 'pcs',
         Number(body.unit_cost) || 0, body.id]
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
      await run('DELETE FROM inventory_transactions WHERE item_id=$1', [id]);
      await run('DELETE FROM inventory_items WHERE id=$1', [id]);
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

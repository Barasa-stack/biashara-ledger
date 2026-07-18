import { NextResponse } from 'next/server';
import { query, run, insertReturning, get, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

async function generateSku(tenantId: string, category: string): Promise<string> {
  const prefix = category
    ? category.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 3)
    : 'GEN';
  const safePrefix = prefix || 'GEN';
  const existing = await query(
    `SELECT COUNT(*) as cnt FROM inventory_items WHERE tenant_id=$1 AND sku LIKE $2`,
    [tenantId, `${safePrefix}-%`]
  ) as any[];
  const count = Number(existing[0]?.cnt || 0);
  return `${safePrefix}-${String(count + 1).padStart(3, '0')}`;
}

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
        GROUP BY i.tenant_id, i.id, i.item_name, i.sku, i.category, i.category_id, i.unit_of_measure, i.purchase_uom, i.sale_uom, i.opening_stock, i.current_stock, i.unit_cost, i.reorder_level, i.custom_fields, i.created_at
        ORDER BY i.item_name
      `);
    });
    return NextResponse.json(items);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const result = await withTenantContext(session.tenant_id!, async () => {
      const existing = await get(
        'SELECT id FROM inventory_items WHERE tenant_id=$1 AND item_name=$2',
        [session.tenant_id, body.item_name || '']
      );
      if (existing) throw new Error('DUPLICATE_ITEM');

      const unitCost = Number(body.unit_cost) || 0;
      const openingStock = Number(body.opening_stock) || 0;
      const sku = body.sku || await generateSku(session.tenant_id!, body.category || '');

      return await insertReturning<{ id: string }>(
        `INSERT INTO inventory_items (tenant_id, item_name, sku, barcode, category, category_id, unit_of_measure, purchase_uom, sale_uom, opening_stock, current_stock, unit_cost, reorder_level, custom_fields) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
        [session.tenant_id, body.item_name || '', sku, body.barcode || '', body.category || '', body.category_id || null, body.unit_of_measure || 'pcs',
         body.purchase_uom || '', body.sale_uom || '',
         openingStock, openingStock, unitCost, Number(body.reorder_level) || 0,
         JSON.stringify(body.custom_fields || {})]
      );
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (msg === 'DUPLICATE_ITEM') return NextResponse.json({ error: 'An item with this name already exists' }, { status: 409 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      const existing = await get(
        'SELECT opening_stock, current_stock FROM inventory_items WHERE id=$1',
        [body.id]
      ) as { opening_stock: number; current_stock: number } | undefined;

      if (body.sku) {
        const dup = await get(
          'SELECT id FROM inventory_items WHERE tenant_id=$1 AND sku=$2 AND id!=$3',
          [session.tenant_id, body.sku, body.id]
        );
        if (dup) throw new Error('DUPLICATE_SKU');
      }

      let newCurrent = Number(body.current_stock) ?? Number(body.opening_stock) ?? 0;
      if (existing) {
        const diff = (Number(body.opening_stock) || 0) - (existing.opening_stock || 0);
        newCurrent = Math.max(0, (existing.current_stock || 0) + diff);
      }

      const sku = body.sku || await generateSku(session.tenant_id!, body.category || '');

      await run(
        `UPDATE inventory_items SET item_name=$1, sku=$2, barcode=$3, category=$4, category_id=$5, unit_of_measure=$6, purchase_uom=$7, sale_uom=$8, unit_cost=$9, opening_stock=$10, current_stock=$11, reorder_level=$12, custom_fields=$13 WHERE id=$14`,
        [body.item_name || '', sku, body.barcode || '', body.category || '', body.category_id || null,
         body.unit_of_measure || 'pcs', body.purchase_uom || '', body.sale_uom || '',
         Number(body.unit_cost) || 0, Number(body.opening_stock) || 0, newCurrent,
         Number(body.reorder_level) || 0, JSON.stringify(body.custom_fields || {}), body.id]
      );
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (msg === 'DUPLICATE_SKU') return NextResponse.json({ error: 'An item with this SKU already exists' }, { status: 409 });
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
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

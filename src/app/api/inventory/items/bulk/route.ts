import { NextResponse } from 'next/server';
import { get, withTenantContext, insertReturning } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

async function generateSku(tenantId: string, category: string): Promise<string> {
  const prefix = category
    ? category.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 3)
    : 'GEN';
  const safePrefix = prefix || 'GEN';
  const { query } = await import('@/lib/db');
  const existing = await query(
    `SELECT COUNT(*) as cnt FROM inventory_items WHERE tenant_id=$1 AND sku LIKE $2`,
    [tenantId, `${safePrefix}-%`]
  ) as any[];
  const count = Number(existing[0]?.cnt || 0);
  return `${safePrefix}-${String(count + 1).padStart(3, '0')}`;
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const items = body.items || [];
    let added = 0, skipped = 0;
    const errors: { item: string; error: string }[] = [];
    for (const item of items) {
      try {
        await withTenantContext(session.tenant_id!, async () => {
          const existing = await get(
            'SELECT id FROM inventory_items WHERE tenant_id=$1 AND item_name=$2',
            [session.tenant_id, item.item_name || '']
          );
          if (existing) { skipped++; return; }
          const sku = item.sku || await generateSku(session.tenant_id!, item.category || '');
          const unitCost = Number(item.unit_cost) || 0;
          const openingStock = Number(item.opening_stock) || 0;
          const catArr = item.categories || (item.category_id ? [{ id: item.category_id, name: item.category }] : []);
          const firstCat = catArr[0] || {};
          await insertReturning(
            `INSERT INTO inventory_items (tenant_id, item_name, sku, barcode, industry, category, category_id, categories, unit_of_measure, purchase_uom, sale_uom, opening_stock, current_stock, unit_cost, reorder_level, custom_fields) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
            [session.tenant_id, item.item_name || '', sku, item.barcode || '', item.industry || '', firstCat.name || '', firstCat.id || null, JSON.stringify(catArr), item.unit_of_measure || 'pcs',
             item.purchase_uom || '', item.sale_uom || '',
             openingStock, openingStock, unitCost, Number(item.reorder_level) || 0,
             JSON.stringify(item.custom_fields || {})]
          );
          added++;
        });
      } catch (e: any) {
        errors.push({ item: item.item_name || 'unknown', error: e.message });
      }
    }
    return NextResponse.json({ added, skipped, errors });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

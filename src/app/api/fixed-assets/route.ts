import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

function computeDepreciation(asset: any): number {
  const cost = Number(asset.purchase_cost) || 0;
  const salvage = Number(asset.salvage_value) || 0;
  const life = Number(asset.useful_life_years) || 1;
  const depr = Number(asset.accumulated_depreciation) || 0;
  const depreciableBase = cost - salvage;
  if (depreciableBase <= 0 || depr >= depreciableBase) return 0;
  if (asset.depreciation_method === 'declining-balance') {
    const rate = 2 / life;
    const nbv = cost - depr;
    return Math.min(nbv * rate, depreciableBase - depr);
  }
  return Math.min(depreciableBase / life, depreciableBase - depr);
}

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const assets = await withTenantContext(session.tenant_id!, async () => {
      const list = await query('SELECT * FROM fixed_assets ORDER BY purchase_date DESC') as any[];
      return list.map(a => ({ ...a, annual_depreciation: computeDepreciation(a) }));
    });
    return NextResponse.json(assets);
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
      const purchaseCost = Number(body.purchase_cost) || 0;
      const salvageValue = Number(body.salvage_value) || 0;
      const bookValue = purchaseCost;
      return await insertReturning<{ id: string }>(
        `INSERT INTO fixed_assets (tenant_id, asset_name, asset_type, purchase_date, purchase_cost, useful_life_years, depreciation_method, salvage_value, book_value, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [session.tenant_id, body.asset_name, body.asset_type || 'Equipment', body.purchase_date || new Date().toISOString().split('T')[0],
         purchaseCost, Number(body.useful_life_years) || 5, body.depreciation_method || 'straight-line', salvageValue, bookValue, body.notes || '']
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
      if (body.action === 'depreciate') {
        const asset = await query('SELECT * FROM fixed_assets WHERE id=$1', [body.id]) as any[];
        if (asset.length === 0) throw new Error('Asset not found');
        const annualDepr = computeDepreciation(asset[0]);
        const newAccumDepr = Number(asset[0].accumulated_depreciation || 0) + annualDepr;
        const newBookValue = Math.max(0, Number(asset[0].purchase_cost || 0) - newAccumDepr);
        await run('UPDATE fixed_assets SET accumulated_depreciation=$1, book_value=$2 WHERE id=$3', [newAccumDepr, newBookValue, body.id]);
      } else if (body.action === 'dispose') {
        await run('UPDATE fixed_assets SET status=$1, disposal_date=$2, disposal_amount=$3, book_value=$4 WHERE id=$5',
          ['disposed', body.disposal_date || new Date().toISOString().split('T')[0], Number(body.disposal_amount) || 0, 0, body.id]);
      } else {
        await run('UPDATE fixed_assets SET asset_name=$1, asset_type=$2, purchase_date=$3, purchase_cost=$4, useful_life_years=$5, depreciation_method=$6, salvage_value=$7, notes=$8 WHERE id=$9',
          [body.asset_name, body.asset_type || 'Equipment', body.purchase_date, Number(body.purchase_cost) || 0, Number(body.useful_life_years) || 5,
           body.depreciation_method || 'straight-line', Number(body.salvage_value) || 0, body.notes || '', body.id]);
      }
    });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed to update asset' }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM fixed_assets WHERE id=$1', [id]);
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

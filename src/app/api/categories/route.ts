import { NextResponse } from 'next/server';
import { query, run, insertReturning, get, exec, withTenantContext, withoutTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { getMergedIndustryPreset, getIndustryPreset, getAllIndustryKeys } from '@/lib/industry-presets';

async function ensureCategoryUniqueConstraint() {
  try {
    await withoutTenantContext(async () => {
      await exec('ALTER TABLE public.categories ADD CONSTRAINT categories_tenant_name_unique UNIQUE (tenant_id, name)');
    });
  } catch {
    // constraint already exists
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { searchParams } = new URL(request.url);
    const industryFilter = searchParams.get('industry');
    const activeFilter = searchParams.get('active');
    const data = await withTenantContext(session.tenant_id!, async () => {
      let categories: any[] = [];
      try {
        const conditions: string[] = [];
        const params: any[] = [];
        if (industryFilter) { conditions.push(`industry=$${params.length + 1}`); params.push(industryFilter); }
        if (activeFilter === 'true') { conditions.push('active=true'); }
        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        categories = await query(`SELECT * FROM categories ${where} ORDER BY sort_order, name`, params);
      } catch {
        await withoutTenantContext(async () => {
          await exec(`
            CREATE TABLE IF NOT EXISTS public.categories (
              tenant_id UUID NOT NULL REFERENCES public.tenants(id),
              id UUID DEFAULT gen_random_uuid(),
              name TEXT NOT NULL DEFAULT '',
              parent_id UUID,
              industry TEXT DEFAULT '',
              active BOOLEAN DEFAULT true,
              sort_order INT DEFAULT 0,
              created_at TIMESTAMP DEFAULT NOW(),
              PRIMARY KEY (tenant_id, id)
            )
          `);
          try { await exec(`ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT ''`); } catch {}
          try { await exec(`ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true`); } catch {}
          try {
            await exec(`ALTER TABLE public.categories ADD CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL`);
          } catch {}
          await ensureCategoryUniqueConstraint();
        });
        let presetIndustries: string[];
        try {
          const settings = await get('SELECT industries FROM company_settings') as any;
          presetIndustries = settings?.industries || ['general'];
          if (typeof presetIndustries === 'string') presetIndustries = [presetIndustries];
        } catch { presetIndustries = ['general']; }
        categories = await query('SELECT * FROM categories ORDER BY sort_order, name');
        if (categories.length === 0) {
          const preset = getMergedIndustryPreset(presetIndustries);
          for (const cat of preset.categories) {
            await run(
              `INSERT INTO categories (tenant_id, name, industry, sort_order) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
              [session.tenant_id, cat.name, 'general', 0]
            );
            if (cat.children) {
              for (let i = 0; i < cat.children.length; i++) {
                const child = cat.children[i];
                const parentRow = await query(`SELECT id FROM categories WHERE tenant_id=$1 AND name=$2 LIMIT 1`, [session.tenant_id, cat.name]);
                if (parentRow.length > 0) {
                  await run(
                    `INSERT INTO categories (tenant_id, name, parent_id, industry, sort_order) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
                    [session.tenant_id, child.name, parentRow[0].id, 'general', i + 1]
                  );
                }
              }
            }
          }
          categories = await query('SELECT * FROM categories ORDER BY sort_order, name');
        }
      }
      return { categories, presets: Object.fromEntries(getAllIndustryKeys().map(k => [k, getIndustryPreset(k)])) };
    });
    return NextResponse.json(data);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    try { await exec(`ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT ''`); } catch {}
    try { await exec(`ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true`); } catch {}
    await ensureCategoryUniqueConstraint();
    const result = await withTenantContext(session.tenant_id!, async () => {
      const dup = await get(
        'SELECT id FROM categories WHERE tenant_id=$1 AND LOWER(name)=LOWER($2)',
        [session.tenant_id, body.name]
      );
      if (dup) throw new Error('DUPLICATE_CATEGORY');
      return await insertReturning<{ id: string }>(
        `INSERT INTO categories (tenant_id, name, industry, parent_id, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [session.tenant_id, body.name, body.industry || '', body.parent_id || null, body.sort_order || 0]
      );
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (msg === 'DUPLICATE_CATEGORY') return NextResponse.json({ error: 'This category already exists. Please select it instead of adding again.' }, { status: 409 });
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
        'UPDATE categories SET name=$1, parent_id=$2, sort_order=$3 WHERE id=$4',
        [body.name, body.parent_id || null, body.sort_order || 0, body.id]
      );
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    try { await exec(`ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true`); } catch {}
    await withTenantContext(session.tenant_id!, async () => {
      if (body.id && body.active !== undefined) {
        await run('UPDATE categories SET active=$1 WHERE id=$2', [body.active ? true : false, body.id]);
      }
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { id, all } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      if (all) {
        await run('UPDATE inventory_items SET category_id=NULL, category=\'\', categories=\'[]\' WHERE category_id IS NOT NULL', []);
        await run('DELETE FROM categories WHERE tenant_id=$1', [session.tenant_id]);
        return;
      }
      const children = await query('SELECT id FROM categories WHERE parent_id=$1 LIMIT 1', [id]);
      if (children.length > 0) throw new Error('Cannot delete category with subcategories');
      await run('UPDATE inventory_items SET category_id=NULL, category=\'\' WHERE category_id=$1', [id]);
      await run(`
        UPDATE inventory_items SET categories = (
          SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
          FROM jsonb_array_elements(categories) AS elem
          WHERE elem->>'id' <> $1
        ) WHERE categories @> jsonb_build_array(jsonb_build_object('id', $1::text))
      `, [id]);
      await run('DELETE FROM categories WHERE id=$1', [id]);
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

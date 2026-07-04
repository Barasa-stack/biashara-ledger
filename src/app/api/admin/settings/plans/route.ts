import { NextRequest, NextResponse } from 'next/server';
import { adminQuery, adminRun } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const plans = await adminQuery(`
      SELECT id, name, price, description, features, is_active, sort_order
      FROM admin_plans ORDER BY sort_order ASC
    `);
    return NextResponse.json(plans);
  } catch (err) {
    console.error('Error loading plans:', err);
    return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'update') {
      const { id, name, price, description, is_active } = body;
      if (!id) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });

      await adminRun(
        `UPDATE admin_plans SET name = COALESCE($1, name), price = COALESCE($2, price),
         description = COALESCE($3, description), is_active = COALESCE($4, is_active)
         WHERE id = $5`,
        [name || null, price != null ? price : null, description ?? null, is_active != null ? is_active : null, id]
      );
      return NextResponse.json({ success: true, message: 'Plan updated' });
    }

    if (action === 'create') {
      const { name, price, description } = body;
      if (!name || price == null) return NextResponse.json({ error: 'Name and price required' }, { status: 400 });

      const maxSort = await adminQuery('SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM admin_plans');
      const sortOrder = maxSort[0]?.next || 1;

      await adminRun(
        `INSERT INTO admin_plans (name, price, description, sort_order) VALUES ($1, $2, $3, $4)`,
        [name, price, description || '', sortOrder]
      );
      return NextResponse.json({ success: true, message: 'Plan created' });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
      await adminRun('DELETE FROM admin_plans WHERE id = $1', [id]);
      return NextResponse.json({ success: true, message: 'Plan deleted' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Error managing plans:', err);
    return NextResponse.json({ error: 'Failed to manage plans' }, { status: 500 });
  }
}

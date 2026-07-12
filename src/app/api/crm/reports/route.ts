import { NextResponse } from 'next/server';
import { query, get, withTenantContext } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { session } = await requireRole('admin', 'hr_manager', 'user');
    const data = await withTenantContext(session.tenant_id!, async () => {
      const deals = await query(
        `SELECT pipeline_stage, COUNT(*) as count, SUM(deal_value) as total,
          AVG(deal_value) as avg_value, SUM(deal_value * probability / 100.0) as weighted
         FROM deals WHERE status = 'active' OR status = 'open'
         GROUP BY pipeline_stage ORDER BY pipeline_stage`
      ) as any[];

      const won = await get(
        `SELECT COUNT(*) as count, SUM(deal_value) as total FROM deals WHERE status = 'won'`
      ) as any;

      const lost = await get(
        `SELECT COUNT(*) as count, SUM(deal_value) as total FROM deals WHERE status = 'lost'`
      ) as any;

      const totalActive = await get(
        `SELECT COUNT(*) as count, SUM(deal_value) as total, SUM(deal_value * probability / 100.0) as weighted
         FROM deals WHERE status = 'active' OR status = 'open'`
      ) as any;

      const recentActivities = await query(
        `SELECT a.*, c.customer_name FROM activity_log a
         LEFT JOIN customers c ON c.id = a.customer_id
         ORDER BY a.created_at DESC LIMIT 20`
      ) as any[];

      return { deals, won, lost, totalActive, recentActivities };
    });
    return NextResponse.json(data);
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

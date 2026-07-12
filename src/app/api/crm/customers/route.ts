import { NextResponse } from 'next/server';
import { query, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const customers = await withTenantContext(session.tenant_id!, async () => {
      return await query(`SELECT DISTINCT c.* FROM customers c
        INNER JOIN deals d ON d.customer_id = c.id
        WHERE d.lead_id IS NOT NULL
        ORDER BY c.created_at DESC`);
    });
    return NextResponse.json(customers);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

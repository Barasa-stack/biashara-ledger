import { NextResponse } from 'next/server';
import { adminQuery } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const tenants = await adminQuery(`
      SELECT
        t.id,
        t.name,
        t.created,
        t.updated,
        COUNT(DISTINCT u.id) as user_count,
        MAX(u.last_login) as last_login,
        STRING_AGG(DISTINCT u.email, ', ') FILTER (WHERE u.email IS NOT NULL) as user_emails,
        BOOL_OR(u.license_status = 'active') as has_active_license
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      GROUP BY t.id, t.name, t.created, t.updated
      ORDER BY t.created DESC NULLS LAST
    `);

    // Also fetch admin_clients to cross-reference
    const clients = await adminQuery('SELECT id, company_name, email, is_active, expires_at FROM admin_clients ORDER BY created_at DESC');

    // Map clients to tenants where we can match by email
    const clientMap = new Map<string, any>();
    for (const c of clients) {
      clientMap.set(c.email?.toLowerCase(), c);
    }

    const enriched = tenants.map((t: any) => {
      const email = t.user_emails?.split(', ')?.[0]?.toLowerCase();
      const matchedClient = email ? clientMap.get(email) : null;
      return {
        ...t,
        client_id: matchedClient?.id || null,
        company_name: matchedClient?.company_name || t.name,
        is_active: matchedClient ? matchedClient.is_active : t.has_active_license,
        expires_at: matchedClient?.expires_at || null,
        source: matchedClient ? 'managed' : 'self_registered',
      };
    });

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error('Error fetching tenants:', err?.message || err);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

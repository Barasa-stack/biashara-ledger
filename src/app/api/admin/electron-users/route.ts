import { NextResponse } from 'next/server';
import { adminQuery } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const users = await adminQuery(`
      SELECT
        l.license_key, c.email, c.company_name,
        l.is_active, l.is_used, l.created_at, l.expires_at, l.activated_at,
        COALESCE(a.activity_count, 0) as activity_count,
        (SELECT created_at FROM electron_activity WHERE license_key = l.license_key ORDER BY created_at DESC LIMIT 1) as last_active
      FROM admin_license_keys l
      LEFT JOIN admin_clients c ON l.client_id = c.id
      LEFT JOIN (
        SELECT license_key, COUNT(*) as activity_count
        FROM electron_activity GROUP BY license_key
      ) a ON l.license_key = a.license_key
      ORDER BY l.created_at DESC
    `);
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

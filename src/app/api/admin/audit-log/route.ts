import { NextResponse } from 'next/server';
import { adminQuery, adminRun } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const entries = await adminQuery(`
      SELECT id, admin_email, action, entity_type, entity_id, details, ip_address, created_at
      FROM admin_audit_log
      ORDER BY created_at DESC
      LIMIT 50
    `);

    return NextResponse.json(entries);
  } catch (err) {
    console.error('Error loading audit log:', err);
    return NextResponse.json({ error: 'Failed to load audit log' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error, session } = await adminGuard();
  if (error) return error;

  try {
    const { action, entity_type, entity_id, details, ip_address } = await req.json();
    const result = await adminQuery(
      `INSERT INTO admin_audit_log (admin_id, admin_email, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [session?.user_id, session?.email || '', action, entity_type || '', entity_id || '', details || '', ip_address || '']
    );

    return NextResponse.json({ success: true, id: result[0]?.id });
  } catch (err) {
    console.error('Error creating audit entry:', err);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}

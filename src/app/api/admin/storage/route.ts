import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { adminQuery } from '@/lib/db';
import { measureStorageUsage } from '@/lib/tracking';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const usage = await adminQuery(
      `SELECT s.tenant_id, t.name as company_name, s.database_size_bytes, s.measured_at
       FROM storage_usage s
       LEFT JOIN tenants t ON t.id = s.tenant_id
       WHERE s.measured_at = (
         SELECT MAX(measured_at) FROM storage_usage su WHERE su.tenant_id = s.tenant_id
       )
       ORDER BY s.database_size_bytes DESC`
    );

    return NextResponse.json(usage);
  } catch (err: any) {
    console.error('admin/storage error:', err);
    return NextResponse.json({ error: 'Failed to fetch storage' }, { status: 500 });
  }
}

export async function POST() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    await measureStorageUsage();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('admin/storage POST error:', err);
    return NextResponse.json({ error: 'Failed to measure storage' }, { status: 500 });
  }
}

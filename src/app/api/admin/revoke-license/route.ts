import { NextResponse } from 'next/server';
import { adminRun } from '@/lib/db';
import { adminGuard } from '@/lib/admin';
import { logAdminAction } from '@/lib/admin-audit';

export async function POST(request: Request) {
  const { error, session } = await adminGuard();
  if (error) return error;

  try {
    const { licenseKey } = await request.json();
    if (!licenseKey) {
      return NextResponse.json({ error: 'License key is required' }, { status: 400 });
    }

    await adminRun(
      'UPDATE admin_license_keys SET is_active = false, is_used = false WHERE license_key = $1',
      [licenseKey]
    );

    logAdminAction({
      adminId: session?.user_id,
      adminEmail: session?.email,
      action: 'License Revoked',
      entityType: 'license',
      entityId: licenseKey,
      details: `License ${licenseKey} revoked`,
    });

    return NextResponse.json({ success: true, message: 'License revoked successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to revoke license' }, { status: 500 });
  }
}

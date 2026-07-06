import { NextResponse } from 'next/server';
import { adminRun, adminGet } from '@/lib/db';
import { adminGuard } from '@/lib/admin';
import { logAdminAction } from '@/lib/admin-audit';

export async function POST(request: Request) {
  const { error, session } = await adminGuard();
  if (error) return error;

  try {
    const { licenseKey, newClientEmail } = await request.json();

    if (!licenseKey || !newClientEmail) {
      return NextResponse.json({ error: 'License key and new client email are required' }, { status: 400 });
    }

    const license = await adminGet(
      'SELECT l.id, l.client_id, l.license_key, l.is_active, l.is_used, c.company_name FROM admin_license_keys l LEFT JOIN admin_clients c ON l.client_id = c.id WHERE l.license_key = $1',
      [licenseKey.trim()]
    ) as any;

    if (!license) {
      return NextResponse.json({ error: 'License key not found' }, { status: 404 });
    }

    if (!license.is_active) {
      return NextResponse.json({ error: 'Cannot transfer an inactive license' }, { status: 400 });
    }

    const newClient = await adminGet(
      'SELECT id, company_name, email FROM admin_clients WHERE LOWER(email) = LOWER($1)',
      [newClientEmail.trim().toLowerCase()]
    ) as any;

    if (!newClient) {
      return NextResponse.json({ error: 'No client found with that email' }, { status: 404 });
    }

    if (newClient.id === license.client_id) {
      return NextResponse.json({ error: 'License is already assigned to this client' }, { status: 400 });
    }

    await adminRun('UPDATE admin_license_keys SET client_id = $1 WHERE id = $2', [newClient.id, license.id]);

    await adminRun(
      'UPDATE admin_clients SET license_key = NULL WHERE license_key = $1',
      [licenseKey]
    );
    await adminRun(
      'UPDATE admin_clients SET license_key = $1 WHERE id = $2',
      [licenseKey, newClient.id]
    );

    await logAdminAction({
      adminId: session?.user_id,
      adminEmail: session?.email,
      action: 'License Transferred',
      entityType: 'license',
      entityId: licenseKey,
      details: `License ${licenseKey} transferred from ${license.company_name || 'unknown'} to ${newClient.company_name}`,
    });

    return NextResponse.json({
      success: true,
      message: `License ${licenseKey} transferred from ${license.company_name || 'unknown'} to ${newClient.company_name}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'License transfer failed' }, { status: 500 });
  }
}

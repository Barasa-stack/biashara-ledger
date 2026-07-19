import { NextResponse } from 'next/server';
import { LicenseService } from '@/lib/services/license.service';
import { getSessionFromCookies } from '@/lib/auth-server';
import { adminGet, adminRun } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, plan = 'standard', durationMonths = 12 } = await req.json();
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const client = await adminGet<{ id: string }>(
      `SELECT id FROM admin_clients WHERE id = $1`,
      [clientId]
    );
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    await adminRun(
      `UPDATE admin_license_keys SET is_active = false WHERE client_id = $1`,
      [clientId]
    );

    const result = await LicenseService.generateLicenseFile(clientId, plan, durationMonths);

    if (!result || 'error' in result) {
      return NextResponse.json({ error: result?.error || 'License generation failed' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      licenseKey: result.licenseKey,
      plan: result.plan,
      expiresAt: result.expiresAt,
    });
  } catch (err: any) {
    console.error('[Regenerate license error]', err?.message || err);
    return NextResponse.json({ error: 'Failed to regenerate license.' }, { status: 500 });
  }
}

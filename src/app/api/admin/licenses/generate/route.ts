import { NextResponse } from 'next/server';
import { LicenseService } from '@/lib/services/license.service';
import { adminGuard } from '@/lib/admin';
import { logAdminAction } from '@/lib/admin-audit';

export async function POST(req: Request) {
  try {
    const guard = await adminGuard();
    if (guard.error) return guard.error;
    const session = guard.session;

    const { clientId, plan = 'standard', durationMonths = 12 } = await req.json();

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const result = await LicenseService.generateLicenseFile(clientId, plan, durationMonths);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await logAdminAction({
      adminId: session?.user_id,
      adminEmail: session?.email,
      action: 'License Generated',
      entityType: 'license',
      entityId: result.license_key,
      details: `License ${result.license_key} generated for client ${clientId} (${plan})`,
    });

    return NextResponse.json(result, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="biasharaledger-${clientId}.lic"`,
      },
    });
  } catch (err: any) {
    console.error('[Generate license file error]', err?.message || err);
    return NextResponse.json({ error: 'Failed to generate license file.' }, { status: 500 });
  }
}

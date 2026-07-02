import { NextResponse } from 'next/server';
import { LicenseService } from '@/lib/services/license.service';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, plan = 'standard', durationMonths = 12 } = await req.json();

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const result = await LicenseService.generateLicenseFile(clientId, plan, durationMonths);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

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

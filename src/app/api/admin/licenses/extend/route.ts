import { NextResponse } from 'next/server';
import { LicenseService } from '@/lib/services/license.service';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, additionalMonths, newPlan } = await req.json();

    if (!clientId || !additionalMonths) {
      return NextResponse.json({ error: 'Client ID and additional months are required' }, { status: 400 });
    }

    const result = await LicenseService.extendLicense(clientId, additionalMonths, newPlan);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Extend license error]', err?.message || err);
    return NextResponse.json({ error: 'Failed to extend license.' }, { status: 500 });
  }
}

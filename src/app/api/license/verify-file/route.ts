import { NextResponse } from 'next/server';
import { LicenseService } from '@/lib/services/license.service';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { licenseFile } = await req.json();
    if (!licenseFile) {
      return NextResponse.json({ error: 'License file is required' }, { status: 400 });
    }

    const result = await LicenseService.activateOffline(licenseFile, session.email);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      plan: result.plan,
      expiresAt: result.expiresAt,
    });

    await LicenseService.refreshSessionCookie(session.email, response);

    return response;
  } catch (err: any) {
    console.error('[License file activation error]', err?.message || err);
    return NextResponse.json({ error: 'Failed to activate license file.' }, { status: 500 });
  }
}

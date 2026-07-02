import { NextResponse } from 'next/server';
import { LicenseService } from '@/lib/services/license.service';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { licenseKey } = await req.json();
    if (!licenseKey) {
      return NextResponse.json({ error: 'License key is required' }, { status: 400 });
    }

    const result = await LicenseService.activateOnline(licenseKey, session.email);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      plan: result.plan,
      expiresAt: result.expiresAt,
      companyName: result.companyName,
    });

    await LicenseService.refreshSessionCookie(session.email, response);

    return response;
  } catch (err: any) {
    console.error('[activate-web]', err?.message || err);
    return NextResponse.json({ error: 'Activation failed. Please try again.' }, { status: 500 });
  }
}

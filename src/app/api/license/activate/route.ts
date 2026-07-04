import { NextResponse } from 'next/server';
import { LicenseService } from '@/lib/services/license.service';
import { getSessionFromCookies } from '@/lib/auth-server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rl = await checkRateLimit(`license-activate:${session.email}:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
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
    console.error('[License activation error]', err?.message || err);
    return NextResponse.json({ error: 'Failed to activate license. Please try again.' }, { status: 500 });
  }
}

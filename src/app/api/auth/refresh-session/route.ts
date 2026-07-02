import { NextResponse } from 'next/server';
import { LicenseService } from '@/lib/services/license.service';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function POST() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    await LicenseService.refreshSessionCookie(session.email, response);

    return response;
  } catch (err: any) {
    console.error('[Refresh session error]', err?.message || err);
    return NextResponse.json({ error: 'Failed to refresh session' }, { status: 500 });
  }
}

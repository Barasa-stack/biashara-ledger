import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionFromCookies } from '@/lib/auth-server';
import { recordLogin } from '@/lib/tracking';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { deviceFingerprint, deviceInfo } = await request.json();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('bl_session')?.value || '';

    await recordLogin({
      userId: session.user_id,
      email: session.email,
      ip,
      userAgent,
      deviceFingerprint: deviceFingerprint || '',
      deviceInfo: deviceInfo || '',
      loginMethod: 'web',
      sessionToken,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('track/session-start error:', err);
    return NextResponse.json({ error: 'Failed to record session' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionFromCookies } from '@/lib/auth-server';
import { recordActiveTime } from '@/lib/tracking';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { activeSeconds } = await request.json();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('bl_session')?.value || '';

    await recordActiveTime(
      session.user_id,
      session.email,
      sessionToken,
      ip,
      Math.max(1, Math.min(600, activeSeconds || 60))
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('track/heartbeat error:', err);
    return NextResponse.json({ error: 'Heartbeat failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth-server';
import { recordLogout } from '@/lib/tracking';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('bl_session')?.value || '';
    await recordLogout(sessionToken);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('track/session-end error:', err);
    return NextResponse.json({ error: 'Failed to record logout' }, { status: 500 });
  }
}

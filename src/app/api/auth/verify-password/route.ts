import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { getSessionFromCookies, verifyPassword } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const user = await get('SELECT password_hash FROM users WHERE id = $1', [session.user_id]) as any;
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

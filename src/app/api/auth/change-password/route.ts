import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getSessionFromCookies, hashPassword, verifyPassword } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: 'Password must be at least 8 characters with an uppercase letter and a number' }, { status: 400 });
    }

    const user = await get('SELECT * FROM users WHERE id = $1', [session.user_id]) as any;
    if (!user || !verifyPassword(currentPassword, user.password_hash)) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const passwordHash = hashPassword(newPassword);
    await run('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, session.user_id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Password change failed' }, { status: 500 });
  }
}

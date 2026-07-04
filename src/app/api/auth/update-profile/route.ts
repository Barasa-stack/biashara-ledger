import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { firstName, lastName, email, phone } = await request.json();

    if (email && email.toLowerCase().trim() !== session.email.toLowerCase().trim()) {
      const existing = await get('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [email.toLowerCase().trim(), session.user_id]);
      if (existing) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    await run(
      'UPDATE users SET first_name = $1, last_name = $2, email = $3, phone = $4 WHERE id = $5',
      [
        firstName ?? session.first_name,
        lastName ?? session.last_name,
        email ? email.toLowerCase().trim() : session.email,
        phone ?? session.phone,
        session.user_id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

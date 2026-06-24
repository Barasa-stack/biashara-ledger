import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth-server';
import { checkRateLimit } from '@/lib/rate-limit';
export async function POST(request: Request) {
  try {
    let { email, password } = await request.json();
    if (email) email = email.trim().toLowerCase();

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = checkRateLimit(`signin:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await get('SELECT * FROM users WHERE email = $1', [email]) as any;
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.verified) {
      return NextResponse.json({ error: 'Please verify your email before signing in.' }, { status: 403 });
    }

    const { token } = await createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        subscriptionPlan: user.subscription_plan,
        subscriptionStatus: user.subscription_status,
        subscriptionExpiry: user.subscription_expiry,
        verified: !!user.verified,
      },
    });

    response.cookies.set('bl_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Sign in failed' }, { status: 500 });
  }
}

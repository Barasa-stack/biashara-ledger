import { NextResponse } from 'next/server';
import { get, run, insertReturning } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth-server';
import { checkRateLimit } from '@/lib/rate-limit';
export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { email, password, phone, firstName, lastName, otp } = body;
    if (email) email = email.trim().toLowerCase();

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = checkRateLimit(`signup:${ip}`, 3, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password must be at least 8 characters with an uppercase letter and a number' }, { status: 400 });
    }

    if (!otp) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const existing = await get('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const storedOtp = await get(
      "SELECT * FROM verification_codes WHERE email = $1 AND purpose = 'signup' AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [email]
    ) as any;

    if (!storedOtp) {
      return NextResponse.json({ error: 'No valid verification code found. Request a new one.' }, { status: 400 });
    }

    if (storedOtp.code !== otp) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    await run('UPDATE verification_codes SET used = 1 WHERE id = $1', [storedOtp.id]);

    const passwordHash = hashPassword(password);
    const subscriptionExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const result = await insertReturning<{ id: number }>(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, subscription_plan, subscription_status, verified, subscription_expiry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [email, passwordHash, firstName || '', lastName || '', phone || '', 'trial', 'active', 1, subscriptionExpiry]
    );

    const userId = result.id;
    const { token } = await createSession(userId);

    const response = NextResponse.json({
      user: { id: userId, email, firstName, lastName, phone, subscriptionPlan: 'trial', subscriptionStatus: 'active' },
      requiresPackageSelection: true,
    }, { status: 201 });

    response.cookies.set('bl_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { run } from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    let { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    email = email.trim().toLowerCase();

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rl = checkRateLimit(`send-otp:${email}:${ip}`, 3, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await run(
      'UPDATE verification_codes SET used = 1 WHERE email = $1 AND purpose = $2 AND used = 0',
      [email, 'signup']
    );

    await run(
      'INSERT INTO verification_codes (email, code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [email, code, 'signup', expiresAt]
    );

    const result = await sendOTPEmail(email, code);
    if (!result.sent) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send verification email. Please check your SMTP settings.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to email!',
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

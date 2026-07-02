import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendOTPEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    let { email, purpose } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    email = email.trim().toLowerCase();

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await checkRateLimit(`otp:${ip}`, 3, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const otpPurpose = purpose || 'signup';

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await run(
      'UPDATE verification_codes SET used = 1 WHERE email = $1 AND purpose = $2 AND used = 0',
      [email, otpPurpose]
    );

    await run(
      'INSERT INTO verification_codes (email, code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [email, code, otpPurpose, expiresAt]
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
      emailSent: true,
      message: `A 6-digit code has been sent to ${email}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to send verification code' }, { status: 500 });
  }
}

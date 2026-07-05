import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminRun } from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';
import { ensureDbInitialized } from '@/lib/init';

export async function POST(req: NextRequest) {
  const run = adminRun;
  try {
    await ensureDbInitialized();
    let { email, purpose } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    email = email.trim().toLowerCase();
    purpose = (purpose || 'signup').trim().toLowerCase();

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rl = await checkRateLimit(`send-otp:${email}:${ip}`, 3, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await run(
      'UPDATE verification_codes SET used = 1 WHERE email = $1 AND purpose = $2 AND used = 0',
      [email, purpose]
    );

    await run(
      'INSERT INTO verification_codes (email, code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [email, code, purpose, expiresAt]
    );

    const result = await sendOTPEmail(email, code);
    const isDev = process.env.NODE_ENV !== 'production';

    // Always include devCode in non-production for easy testing
    if (isDev) {
      return NextResponse.json({
        success: true,
        message: result.sent
          ? `A 6-digit code has been sent to ${email}`
          : `Demo code: ${code}`,
        demoCode: code,
        emailSent: result.sent,
      });
    }

    // In production, fail hard if email wasn't sent
    if (!result.sent) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send verification email. Please check your SMTP settings.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit code has been sent to ${email}`,
      emailSent: true,
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    // error already logged above
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}

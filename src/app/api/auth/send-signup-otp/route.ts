import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { createTransporter, getCompanyName } from '@/lib/email';
export async function POST(request: Request) {
  try {
    let { email, purpose } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    email = email.trim().toLowerCase();

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = checkRateLimit(`otp:${ip}`, 3, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const otpPurpose = purpose || 'signup';

    if (otpPurpose === 'signup') {
      const existing = await get('SELECT id FROM users WHERE email = $1', [email]);
      if (existing) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }
    }

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

    const companyName = await getCompanyName();
    let emailSent = false;

    const transporter = createTransporter();
    if (transporter) {
      try {
        const smtpUser = process.env.SMTP_USER || '';
        await transporter.sendMail({
          from: `"${companyName}" <${smtpUser}>`,
          to: email,
          subject: 'Your BiasharaLedger Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
              <div style="background: #df1c1c; padding: 20px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 20px;">${companyName}</h1>
              </div>
              <div style="padding: 24px; background: #fff; border: 1px solid #eee;">
                <p style="font-size: 14px; color: #333;">Your verification code is:</p>
                <div style="text-align: center; padding: 16px; margin: 16px 0; background: #f8f8f8; border-radius: 8px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #df1c1c;">${code}</div>
                <p style="font-size: 12px; color: #888;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
              </div>
            </div>
          `,
        });
        emailSent = true;
      } catch {
        // Email failed — fall through to show OTP in response
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent
        ? `A 6-digit code has been sent to ${email}`
        : `SMTP not configured. Use demo code: ${code}`,
      ...(emailSent ? {} : { demoCode: code }),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send code' }, { status: 500 });
  }
}

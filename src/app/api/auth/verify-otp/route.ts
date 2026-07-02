import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminGet, run } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    const { email, code, purpose } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await checkRateLimit(`verify-otp:${ip}:${email}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const otpPurpose = purpose || 'signup';
    const stored = await adminGet(
      "SELECT * FROM verification_codes WHERE email = $1 AND purpose = $2 AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [email, otpPurpose]
    );

    if (!stored) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    if (!timingSafeEqual(String(stored.code), String(code))) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    await run('UPDATE verification_codes SET used = 1 WHERE id = $1', [stored.id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

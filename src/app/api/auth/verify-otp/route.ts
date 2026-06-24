import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, code, purpose } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const otpPurpose = purpose || 'signup';
    const stored = await get(
      "SELECT * FROM verification_codes WHERE email = $1 AND purpose = $2 AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [email, otpPurpose]
    ) as any;

    if (!stored) {
      return NextResponse.json({ error: 'No valid verification code found. Request a new one.' }, { status: 400 });
    }

    if (stored.code !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    await run('UPDATE verification_codes SET used = 1 WHERE id = $1', [stored.id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}

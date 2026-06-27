import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// Store OTPs in memory (for demo; use Redis/DB in production)
const otpStore = new Map<string, { otp: string; expires: number }>();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists (optional)
    const sql = neon(process.env.DATABASE_URL!);
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'User already registered' },
        { status: 409 }
      );
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP (in-memory for demo – use a DB table or Redis in production)
    otpStore.set(email, { otp, expires });

    // In production, send the OTP via email/SMS here.
    // For now, we just return it (for testing – remove in production)
    console.log(`📧 OTP for ${email}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent (check console for demo)',
      // Remove `otp` in production – for testing only
      otp // ⚠️ Remove this line in production
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

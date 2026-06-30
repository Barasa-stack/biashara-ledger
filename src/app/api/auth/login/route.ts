import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminGet, adminRun } from '@/lib/db';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'digitalbaroz@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rl = checkRateLimit(`admin-login:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Access denied. This panel is for administrators only.' },
        { status: 403 }
      );
    }

    const user = await adminGet(
      'SELECT id, tenant_id, email, password_hash, role FROM users WHERE email = $1 LIMIT 1',
      [normalizedEmail]
    ) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.role !== 'super_admin') {
      await adminRun('UPDATE users SET role = $1 WHERE id = $2', ['super_admin', user.id]);
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await adminRun(
      'INSERT INTO sessions (tenant_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [user.tenant_id, user.id, sessionToken, expiresAt]
    );

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      token: jwtToken,
    });

    response.cookies.set('bl_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

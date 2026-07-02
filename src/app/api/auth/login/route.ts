import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminGet, adminRun, adminQuery } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rl = await checkRateLimit(`admin-login:${ip}`, 5, 60 * 1000);
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
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Admin login not configured' },
        { status: 500 }
      );
    }

    if (normalizedEmail !== adminEmail) {
      return NextResponse.json(
        { error: 'Access denied. This panel is for administrators only.' },
        { status: 403 }
      );
    }

    const adminUser = await adminGet(
      'SELECT id, email, password_hash, role FROM admin_users WHERE email = $1 LIMIT 1',
      [normalizedEmail]
    );

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, adminUser.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const rows = await adminQuery(
      `INSERT INTO users (tenant_id, email, password_hash, role, verified, subscription_plan, subscription_status)
       VALUES ('local-default', $1, $2, 'super_admin', 1, 'premium', 'active')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, tenant_id`,
      [normalizedEmail, adminUser.password_hash]
    );
    const appUser = rows[0];

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await adminRun(
      'INSERT INTO sessions (tenant_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [appUser.tenant_id, appUser.id, sessionToken, expiresAt]
    );

    const response = NextResponse.json({
      success: true,
      user: { id: appUser.id, email: normalizedEmail },
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

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminGet, adminRun, adminQuery } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rl = await checkRateLimit(`admin-login:${email ?? 'unknown'}:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        { status: 429 }
      );
    }

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

    let adminUser = await adminGet(
      'SELECT id, tenant_id, email, password_hash, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [normalizedEmail]
    );

    // Fall back to admin_users table
    if (!adminUser) {
      adminUser = await adminGet(
        'SELECT id, tenant_id, email, password_hash, role FROM admin_users WHERE email = $1 LIMIT 1',
        [normalizedEmail]
      );
    }

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

    // Use the existing user id and tenant_id for session creation
    const appUser = adminUser;

    const sessionToken = crypto.randomUUID();
    const sessionId = Math.floor(Math.random() * 2147483647) + 1;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await adminRun(
      'INSERT INTO sessions (id, tenant_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [sessionId, appUser.tenant_id, appUser.id, sessionToken, expiresAt]
    );

    const response = NextResponse.json({
      success: true,
      user: { id: appUser.id, email: normalizedEmail },
    });

    response.cookies.set('bl_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;

  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Login error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminRun, adminGet } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/init';

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rl = checkRateLimit(`signin:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await adminGet(
      'SELECT id, tenant_id, email, password_hash, first_name, last_name, verified FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    ) as any;

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.verified) {
      return NextResponse.json({ error: 'Please verify your email before signing in.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Ensure company_settings exists for this tenant (for email functionality)
    try {
      await adminRun(
        `INSERT INTO company_settings (tenant_id, company_name, email) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (tenant_id) DO NOTHING`,
        [user.tenant_id, user.first_name || user.last_name || 'Business', user.email]
      );
    } catch (settingsError) {
      console.warn('Could not ensure company_settings:', settingsError);
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await adminRun(
      'INSERT INTO sessions (tenant_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [user.tenant_id, user.id, sessionToken, expiresAt]
    );

    const displayName = user.first_name || user.last_name || '';
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: displayName, tenantId: user.tenant_id }
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
    console.error('Signin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

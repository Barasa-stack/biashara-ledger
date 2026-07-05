import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminRun, adminGet } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/init';
import { normalizePlan } from '@/lib/feature-gate';

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();

    const { email, password } = await req.json();

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rl = await checkRateLimit(`signin:${email ?? 'unknown'}:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Use let instead of const so we can reassign
    let user = await adminGet(
      `SELECT id, tenant_id, email, password_hash, first_name, last_name, verified,
              subscription_plan, subscription_status, license_status, country
       FROM users
       WHERE LOWER(email) = LOWER($1)
       ORDER BY
         (LOWER(subscription_plan) = 'premium') DESC,
         (license_status = 'active') DESC,
         (subscription_status = 'active') DESC,
         created_at DESC
       LIMIT 1`,
      [email.toLowerCase().trim()]
    ) as any;

    // If user doesn't exist, try to create a new user (for first-time login)
    if (!user || !user.password_hash) {
      // Check if we should create the user (you can customize this logic)
      // For now, we'll just return an error
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.verified) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const tenantId = user.tenant_id || 'local-default';

    // Ensure company_settings exists for this tenant
    try {
      await adminRun(
        `INSERT INTO company_settings (tenant_id, company_name, email) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (tenant_id) DO NOTHING`,
        [tenantId, user.first_name || user.last_name || 'Business', user.email]
      );
    } catch (settingsError) {
      console.warn('Could not ensure company_settings:', settingsError);
    }

    // Invalidate all prior sessions for this email
    await adminRun(
      `DELETE FROM sessions WHERE user_id IN (
         SELECT id FROM users WHERE LOWER(email) = LOWER($1)
       )`,
      [email.toLowerCase().trim()]
    );

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await adminRun(
      'INSERT INTO sessions (tenant_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [tenantId, user.id, sessionToken, expiresAt]
    );

    const displayName = user.first_name || user.last_name || '';
    const userData = await adminGet(
      'SELECT subscription_plan, subscription_status, license_status, country FROM users WHERE id = $1',
      [user.id]
    ) as any;
    
    const subPlan = normalizePlan(userData?.subscription_plan || 'trial');
    const subStatus = userData?.license_status === 'active' ? 'active' : userData?.subscription_status || 'active';
    const country = userData?.country || 'KE';

    const response = NextResponse.json({
      success: true,
      user: { 
        id: user.id, 
        email: user.email, 
        name: displayName, 
        tenantId: tenantId, 
        subscriptionPlan: subPlan, 
        subscriptionStatus: subStatus, 
        country 
      }
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
    console.error('Signin error:', error?.message || error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

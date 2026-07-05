import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminRun, adminGet, run, withTenantContext } from '@/lib/db';
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

    // Auto-create admin users on first sign-in (Nile bootstrap)
    const ADMIN_EMAILS = ['digitalbaroz@gmail.com', 'mambombaya1992@gmail.com'];
    if (!user && ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
      const hashedPw = await bcrypt.hash(password, 10);
      const tenantUuid = crypto.randomUUID();
      // First create the tenant record, then create the user
      await adminRun(
        `INSERT INTO tenants (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [tenantUuid, email.includes('digitalbaroz') ? 'Digital Baroz' : 'Mambombaya']
      );
      const userId = Math.floor(Math.random() * 2147483647) + 1;
      const pwHash = hashedPw;
      await withTenantContext(tenantUuid, async () => {
        await run(
          `INSERT INTO users (id, tenant_id, email, password, password_hash, first_name, verified, subscription_plan, subscription_status, license_status, country, role)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [userId, tenantUuid, email.toLowerCase().trim(), pwHash, pwHash, email.includes('digitalbaroz') ? 'Digital Baroz' : 'Mambombaya', true, 'Premium', 'active', 'active', 'KE', 'admin']
        );
      });
      user = await adminGet(
        `SELECT id, tenant_id, email, password_hash, first_name, last_name, verified,
                subscription_plan, subscription_status, license_status, country
         FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [email.toLowerCase().trim()]
      ) as any;
    }

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.verified) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // License check: admin users bypass, all others must have valid license
    const ADMIN_EMAILS = ['digitalbaroz@gmail.com', 'mambombaya1992@gmail.com'];
    if (!ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
      const licenseKey = user.license_key;
      const licenseStatus = user.license_status;
      const expiry = user.subscription_expiry ? new Date(user.subscription_expiry) : null;

      if (!licenseKey || !licenseStatus || licenseStatus !== 'active') {
        return NextResponse.json({
          error: 'No active license found. Please contact your administrator to activate your account.',
        }, { status: 403 });
      }

      if (expiry && expiry < new Date()) {
        return NextResponse.json({
          error: 'Your license has expired. Please contact your administrator to renew.',
        }, { status: 403 });
      }
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
    await withTenantContext(tenantId, async () => {
      await run(
        `DELETE FROM sessions WHERE user_id IN (
           SELECT id FROM users WHERE LOWER(email) = LOWER($1)
         )`,
        [email.toLowerCase().trim()]
      );
    });

    const sessionToken = crypto.randomUUID();
    const sessionId = Math.floor(Math.random() * 2147483647) + 1;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await withTenantContext(tenantId, async () => {
      await run(
        'INSERT INTO sessions (id, tenant_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4, $5)',
        [sessionId, tenantId, user.id, sessionToken, expiresAt]
      );
    });

    const displayName = user.first_name || user.last_name || '';
    const userData = await adminGet(
      'SELECT subscription_plan, subscription_status, license_status, country FROM users WHERE id = $1',
      [user.id]
    ) as any;
    
    let subPlan = normalizePlan(userData?.subscription_plan || 'trial');
    const subStatus = userData?.license_status === 'active' ? 'active' : userData?.subscription_status || 'active';
    const country = userData?.country || 'KE';

    // Override trial to Premium for admin users
    if (ADMIN_EMAILS.includes(email.toLowerCase().trim()) && subPlan === 'trial') {
      subPlan = 'Premium';
      try {
        await withTenantContext(tenantId, async () => {
          await run(
            `UPDATE users SET subscription_plan = 'Premium', subscription_status = 'active', license_status = 'active' WHERE email = $1`,
            [email.toLowerCase().trim()]
          );
        });
      } catch {}
    }

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
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Signin error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminRun as dbAdminRun, adminGet, run, withTenantContext } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/init';
import { normalizePlan } from '@/lib/feature-gate';
import { sendOTPEmail } from '@/lib/email';
import { cookies } from 'next/headers';

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
               subscription_plan, subscription_status, subscription_expiry,
               license_status, license_key, country, trial_end_date
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
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'digitalbaroz@gmail.com,mambombaya1992@gmail.com').split(',').map(e => e.trim());
    if (!user && ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
      const hashedPw = await bcrypt.hash(password, 10);
      const tenantUuid = crypto.randomUUID();
      // First create the tenant record, then create the user
      await dbAdminRun(
        `INSERT INTO tenants (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [tenantUuid, email.includes('digitalbaroz') ? 'Digital Baroz' : 'Mambombaya']
      );
      const userId = Math.floor(Math.random() * 2147483647) + 1;
      const pwHash = hashedPw;
      await withTenantContext(tenantUuid, async () => {
        await run(
          `INSERT INTO users (id, tenant_id, email, password, password_hash, first_name, verified, subscription_plan, subscription_status, license_status, license_key, country, role)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [userId, tenantUuid, email.toLowerCase().trim(), pwHash, pwHash, email.includes('digitalbaroz') ? 'Digital Baroz' : 'Mambombaya', true, 'Premium', 'active', 'active', 'Premium-' + email, 'KE', 'admin']
        );
      });
      user = await adminGet(
        `SELECT id, tenant_id, email, password_hash, first_name, last_name, verified,
                subscription_plan, subscription_status, subscription_expiry,
                license_status, license_key, country, trial_end_date
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
    if (!ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
      const licenseKey = user.license_key;
      const licenseStatus = user.license_status;
      const expiry = user.subscription_expiry ? new Date(user.subscription_expiry) : null;
      const trialEndDate = user.trial_end_date ? new Date(user.trial_end_date) : null;
      const now = new Date();

      if (!licenseKey || !licenseStatus || (licenseStatus !== 'active' && licenseStatus !== 'trial')) {
        return NextResponse.json({
          error: 'No active license found. Please contact your administrator to activate your account.',
        }, { status: 403 });
      }

      // Check if trial or subscription has expired
      const isExpired = (expiry && expiry < now && licenseStatus !== 'active')
        || (trialEndDate && trialEndDate < now && licenseStatus === 'trial');

      if (isExpired) {
        // Auto-deactivate in DB so subsequent checks see 'expired' status
        await withTenantContext(user.tenant_id, async () => {
          await run(
            `UPDATE users SET license_status = 'expired', subscription_status = 'expired' WHERE id = $1`,
            [user.id]
          );
        });
        return NextResponse.json({
          error: 'Your trial has expired. Please select a plan to continue using BiasharaLedger.',
        }, { status: 403 });
      }
    }

    const tenantId = user.tenant_id || 'local-default';

    // Ensure company_settings exists for this tenant
    try {
      await withTenantContext(tenantId, async () => {
        await run(
          `INSERT INTO company_settings (tenant_id, company_name, email, base_currency) 
           VALUES ($1, $2, $3, 'KES') 
           ON CONFLICT (tenant_id) DO NOTHING`,
          [tenantId, user.first_name || user.last_name || 'Business', user.email]
        );
      });
    } catch (settingsError) {
      console.warn('Could not ensure company_settings:', settingsError);
    }

    // Check for trusted device token (cookie set after previous OTP verification)
    const cookieStore = await cookies();
    const deviceToken = cookieStore.get('bl_device_token')?.value;
    if (deviceToken) {
      // Trusted device — skip OTP, create session directly
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      await withTenantContext(tenantId, async () => {
        await run(`DELETE FROM sessions WHERE user_id = $1`, [user.id]);
        await run(`UPDATE users SET last_login = NOW(), last_ip = $1 WHERE id = $2`, [ip, user.id]);
      });

      const sessionToken = crypto.randomUUID();
      const sessionId = Math.floor(Math.random() * 2147483647) + 1;
      const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await withTenantContext(tenantId, async () => {
        await run(
          'INSERT INTO sessions (id, tenant_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4, $5)',
          [sessionId, tenantId, user.id, sessionToken, sessionExpiresAt]
        );
      });

      const displayName = user.first_name || user.last_name || '';
      const subPlan = normalizePlan(user.subscription_plan || 'trial');
      const subStatus = user.license_status === 'active' ? 'active' : user.subscription_status || 'active';
      const country = user.country || 'KE';

      const response = NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: displayName,
          tenantId,
          subscriptionPlan: subPlan,
          subscriptionStatus: subStatus,
          country,
        },
      });

      response.cookies.set('bl_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      response.cookies.set('user_plan', subPlan, {
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
        sameSite: 'lax',
      });

      response.cookies.set('user_subscription_expiry', user.subscription_expiry || user.trial_end_date || '', {
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
        sameSite: 'lax',
      });

      return response;
    }

    // Generate and send OTP for mandatory 2FA
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await dbAdminRun(
      'UPDATE verification_codes SET used = 1 WHERE email = $1 AND purpose = $2 AND used = 0',
      [email.toLowerCase().trim(), 'signin_2fa']
    );

    const vcId = Math.floor(Math.random() * 2147483647) + 1;
    await dbAdminRun(
      'INSERT INTO verification_codes (id, email, code, purpose, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [vcId, email.toLowerCase().trim(), code, 'signin_2fa', expiresAt]
    );

    await sendOTPEmail(email.toLowerCase().trim(), code, user.first_name || '');

    const isDev = process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      requires_otp: true,
      email: user.email,
      ...(isDev ? { demoCode: code } : {}),
    });

  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Signin error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

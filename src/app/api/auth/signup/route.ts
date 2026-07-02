import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { get, run, withTenantContext, adminRun, adminGet } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth-server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getTrialDates } from '@/lib/license';
import { createTenant } from '@/lib/nile';
import { ensureDbInitialized } from '@/lib/init';
import { sendWelcomeEmail } from '@/lib/email';
import { logError } from '@/lib/logger';

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
    await ensureDbInitialized();
    const body = await request.json();
    let { email, password, phone, firstName, lastName, otp, selectedPackage, country } = body;
    if (email) email = email.trim().toLowerCase();

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await checkRateLimit(`signup:${ip}`, 3, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password must be at least 8 characters with an uppercase letter and a number' }, { status: 400 });
    }

    if (!otp) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const storedOtp = await adminGet(
      "SELECT * FROM verification_codes WHERE email = $1 AND purpose = 'signup' AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [email]
    ) as any;

    if (!storedOtp) {
      return NextResponse.json({ error: 'No valid verification code found. Request a new one.' }, { status: 400 });
    }

    if (!timingSafeEqual(String(storedOtp.code), String(otp))) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    const existing = await adminGet(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email]
    ) as any;
    if (existing) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 409 });
    }

    const plan = selectedPackage || 'Basic';
    const userCountry = country || 'KE';
    const tenantName = `${[firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0]}'s Business`;
    const tenant = await createTenant(tenantName, {
      email,
      plan: plan.toLowerCase(),
      created_at: new Date().toISOString(),
    });
    const tenantId = tenant.id;
    const { trialStartDate, trialEndDate } = getTrialDates();

    // Register in admin_clients so web signups appear in the admin dashboard
    await adminRun(
      `INSERT INTO admin_clients (company_name, email, database_name, is_trial, plan, trial_start_date, trial_end_date, expires_at, last_active)
       VALUES ($1, $2, $3, true, $4, $5, $6, $6, NOW())
       ON CONFLICT (email) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         plan = EXCLUDED.plan,
         last_active = NOW()`,
      [tenantName, email, `web-${tenantId}`, plan.toLowerCase(), trialStartDate, trialEndDate]
    );

    const passwordHash = await hashPassword(password);

    let userId!: string;
    await withTenantContext(tenantId!, async () => {
      const user = await get(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, country,
          subscription_plan, subscription_status, verified, subscription_expiry,
          trial_start_date, trial_end_date, trial_used, license_status, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'admin')
         RETURNING id`,
         [tenantId, email, passwordHash, firstName || '', lastName || '', phone || '', userCountry,
          plan, 'trial', 1, trialEndDate,
          trialStartDate, trialEndDate, 1, 'trial']
      ) as any;
      userId = user.id;

      // Ensure company_settings is created for email functionality
      await run(
        `INSERT INTO company_settings (tenant_id, company_name, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (tenant_id) DO UPDATE SET
           company_name = EXCLUDED.company_name,
           email = EXCLUDED.email`,
        [tenantId, tenantName, email]
      );
    });

    const { token } = await createSession(userId, tenantId);
    await adminRun('UPDATE verification_codes SET used = 1 WHERE id = $1', [storedOtp.id]);

    // Send welcome email using the centralized email utility
    try {
      await sendWelcomeEmail(email, firstName || '');
    } catch (emailError) {
      logError('email', 'Failed to send welcome email', { error: (emailError as Error).message });
    }

    const trialDaysRemaining = Math.ceil((new Date(trialEndDate).getTime() - Date.now()) / 86400000);

    const response = NextResponse.json({
      user: {
        id: userId, email, firstName, lastName, phone,
        country: userCountry,
        subscriptionPlan: plan, subscriptionStatus: 'trial',
        subscriptionExpiry: trialEndDate,
        trialEndDate,
        trialDaysRemaining,
        tenantId,
        licenseStatus: 'trial',
      },
      trialEndDate,
      trialDaysRemaining,
      requiresPackageSelection: false,
    }, { status: 201 });

    response.cookies.set('bl_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    response.cookies.set('bl_sub_status', `${plan}:trial`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    logError('signup', 'Signup error', { error: (err as Error).message });
    return NextResponse.json({ error: 'Internal server error. Our team has been notified.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminGet, adminRun, run, withTenantContext } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { normalizePlan } from '@/lib/feature-gate';

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
    const { email, code, purpose } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await checkRateLimit(`verify-otp:${ip}:${email}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const otpPurpose = purpose || 'signup';
    const stored = await adminGet(
      "SELECT * FROM verification_codes WHERE email = $1 AND purpose = $2 AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [email, otpPurpose]
    );

    if (!stored) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    if (!timingSafeEqual(String(stored.code), String(code))) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    await run('UPDATE verification_codes SET used = 1 WHERE id = $1', [stored.id]);

    // If this is a sign-in 2FA, complete the login by creating a session
    if (otpPurpose === 'signin_2fa') {
      const user = await adminGet(
        `SELECT id, tenant_id, email, first_name, last_name, 
                subscription_plan, subscription_status, license_status, license_key, country
         FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [email.toLowerCase().trim()]
      ) as any;

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 400 });
      }

      const tenantId = user.tenant_id || 'local-default';

      // Invalidate all prior sessions for this user
      await withTenantContext(tenantId, async () => {
        await run(
          `DELETE FROM sessions WHERE user_id = $1`,
          [user.id]
        );
      });

      // Track last login
      await withTenantContext(tenantId, async () => {
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
      let subPlan = normalizePlan(user.subscription_plan || 'trial');
      const subStatus = user.license_status === 'active' ? 'active' : user.subscription_status || 'active';
      const country = user.country || 'KE';

      const response = NextResponse.json({
        success: true,
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

      return response;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

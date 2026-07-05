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

    console.log('🔍 ===== SIGNIN ATTEMPT =====');
    console.log('🔍 Email:', email);
    console.log('🔍 Password provided:', password ? 'Yes (length: ' + password.length + ')' : 'No');


    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rl = await checkRateLimit(`signin:${email ?? 'unknown'}:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    
    console.log('🔍 Running query for:', email);
    console.log('🔍 Query: SELECT id, tenant_id, email, password_hash, first_name, last_name, verified, subscription_plan, subscription_status, license_status, country FROM users WHERE LOWER(email) = LOWER($1) ...');

    const user = await adminGet(
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

    console.log('🔍 Query result:', user ? '✅ User found' : '❌ User not found');
    if (user) {
      console.log('🔍 User email:', user.email);
      console.log('🔍 User verified:', user.verified);
      console.log('🔍 User has password_hash:', !!user.password_hash);
      console.log('🔍 User tenant_id:', user.tenant_id);
      console.log('🔍 User subscription_plan:', user.subscription_plan);
    }


    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.verified) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    
    console.log('🔍 Comparing password...');
    console.log('🔍 Password hash from DB:', user.password_hash ? 'Has value (length: ' + user.password_hash.length + ')' : 'EMPTY');
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('🔍 Password match result:', isMatch ? '✅ MATCH' : '❌ NO MATCH');

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const tenantId = user.tenant_id || 'local-default';

    // Ensure company_settings exists for this tenant (for email functionality)
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

    // Invalidate all prior sessions for this email across duplicate user records
    await withTenantContext(tenantId, async () => {
      await run(
        `DELETE FROM sessions WHERE user_id IN (
           SELECT id FROM users WHERE LOWER(email) = LOWER($1)
         )`,
        [email.toLowerCase().trim()]
      );
    });

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await withTenantContext(tenantId, async () => {
      await run(
        'INSERT INTO sessions (tenant_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
        [tenantId, user.id, sessionToken, expiresAt]
      );
    });

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
      user: { id: user.id, email: user.email, name: displayName, tenantId: tenantId, subscriptionPlan: subPlan, subscriptionStatus: subStatus, country }
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

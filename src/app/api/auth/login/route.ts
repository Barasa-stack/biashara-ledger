import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminGet, adminRun } from '@/lib/db';
import { verifyTOTP } from '@/lib/totp';
import { encryptField, decryptField } from '@/lib/encryption';

const TOTP_ENCRYPTION_ID = 'admin-totp-secret';

function getTOTPSecret(raw: string): string {
  try {
    return decryptField(TOTP_ENCRYPTION_ID, raw);
  } catch {
    return raw;
  }
}

const PENDING_2FA_SECRET = process.env.LICENSE_SECRET || 'biashara-ledger-2fa-pending';

function createPendingToken(userId: number, tenantId: string): string {
  const payload = JSON.stringify({ uid: userId, tid: tenantId, exp: Date.now() + 5 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', PENDING_2FA_SECRET).update(encoded).digest('hex');
  return `${encoded}.${sig}`;
}

function verifyPendingToken(token: string): { uid: number; tid: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', PENDING_2FA_SECRET).update(encoded).digest('hex');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return { uid: payload.uid, tid: payload.tid };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, code, pending_token } = await req.json();

    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    // If this is a 2FA verification step, rate-limit by user
    if (code && pending_token) {
      const rl = await checkRateLimit(`admin-2fa:${pending_token.substring(0, 16)}:${ip}`, 5, 60 * 1000);
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Too many 2FA attempts. Try again later.' },
          { status: 429 }
        );
      }
    }

    // Rate limit initial login attempts
    if (!code) {
      const rl = await checkRateLimit(`admin-login:${email ?? 'unknown'}:${ip}`, 5, 60 * 1000);
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Too many login attempts. Try again later.' },
          { status: 429 }
        );
      }
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

    // Handle 2FA verification step (code provided with pending token)
    if (code && pending_token) {
      const tokenData = verifyPendingToken(pending_token);
      if (!tokenData) {
        return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
      }

      const stored = await adminGet<{ value: string }>(
        "SELECT value FROM admin_settings WHERE key = 'admin_totp_secret'"
      );
      const rawSecret = (stored as any)?.value;
      if (!rawSecret) {
        return NextResponse.json({ error: 'Invalid two-factor authentication code' }, { status: 401 });
      }
      const totpSecret = getTOTPSecret(rawSecret);
      if (!verifyTOTP(code, totpSecret)) {
        return NextResponse.json({ error: 'Invalid two-factor authentication code' }, { status: 401 });
      }
      // Re-encrypt if it was stored as plaintext (migration)
      try {
        decryptField(TOTP_ENCRYPTION_ID, rawSecret);
      } catch {
        await adminRun(
          `UPDATE admin_settings SET value = $1 WHERE key = 'admin_totp_secret'`,
          [encryptField(TOTP_ENCRYPTION_ID, totpSecret)]
        );
      }

      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await adminRun(
        'INSERT INTO sessions (tenant_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
        [tokenData.tid, tokenData.uid, sessionToken, expiresAt]
      );

      const response = NextResponse.json({ success: true });
      response.cookies.set('bl_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
      return response;
    }

    let adminUser = await adminGet(
      'SELECT id, tenant_id, email, password_hash, role, two_factor_enabled FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [normalizedEmail]
    );

    if (!adminUser) {
      const fallback = await adminGet(
        'SELECT id, email, password_hash, role FROM admin_users WHERE email = $1 LIMIT 1',
        [normalizedEmail]
      ) as any;
      if (fallback) {
        adminUser = { ...fallback, tenant_id: fallback.id || '', two_factor_enabled: 0 };
      }
    }

    if (!adminUser) {
      // Auto-create admin on first login (rate-limited by the outer login rate limit)
      const hashedPw = await bcrypt.hash(password, 10);
      const adminId = Math.floor(Math.random() * 2147483647) + 1;
      const sentinelTenant = crypto.randomUUID();
      await adminRun(
        `INSERT INTO tenants (id, name) VALUES ($1::uuid, $2) ON CONFLICT DO NOTHING`,
        [sentinelTenant, 'Admin']
      );
      await adminRun(
        `INSERT INTO users (id, tenant_id, email, password_hash, first_name, verified, subscription_plan, subscription_status, license_status, license_key, country, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [adminId, sentinelTenant, normalizedEmail, hashedPw, 'Admin', true, 'Premium', 'active', 'active', 'Admin-License', 'KE', 'super_admin']
      );
      adminUser = { id: adminId, email: normalizedEmail, password_hash: hashedPw, role: 'super_admin', tenant_id: sentinelTenant, two_factor_enabled: 0 };
    }

    const isValid = await bcrypt.compare(password, (adminUser as any).password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const appUser = adminUser as any;

    // Ensure the tenant record exists
    const targetTenantId = (appUser.tenant_id && appUser.tenant_id !== '') ? appUser.tenant_id : crypto.randomUUID();
    try {
      const tenantCheck = await adminGet('SELECT id FROM tenants WHERE id = $1::uuid', [targetTenantId]);
      if (!tenantCheck) {
        const tenantName = appUser.email?.split('@')[0] || 'Admin';
        await adminRun('INSERT INTO tenants (id, name) VALUES ($1::uuid, $2) ON CONFLICT DO NOTHING', [targetTenantId, tenantName]);
      }
    } catch (e) {
      console.warn('[login] Tenant re-insert failed:', e);
    }

    // Ensure super_admin role
    try {
      if (appUser.role !== 'super_admin') {
        await adminRun('UPDATE users SET role = $1 WHERE id = $2', ['super_admin', appUser.id]);
        appUser.role = 'super_admin';
      }
    } catch {}

    const twoFactorEnabled = !!(appUser.two_factor_enabled);

    if (twoFactorEnabled) {
      const pendingToken = createPendingToken(appUser.id, targetTenantId);
      return NextResponse.json({ requires_2fa: true, pending_token: pendingToken });
    }

    // Create session with UUID token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await adminRun(
      'INSERT INTO sessions (tenant_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [targetTenantId, appUser.id, sessionToken, expiresAt]
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

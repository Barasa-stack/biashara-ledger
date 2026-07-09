import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminRun, adminGet, adminQuery, withTenantContext, run } from '@/lib/db';
import { adminGuard } from '@/lib/admin';
import { generateTOTPSecret, generateOTPAuthURL, verifyTOTP } from '@/lib/totp';

export async function GET() {
  const { error, session } = await adminGuard();
  if (error) return error;

  try {
    const user = await adminGet<{ two_factor_enabled: number }>(
      'SELECT two_factor_enabled FROM users WHERE id = $1',
      [session.user_id]
    );
    const enabled = !!(user as any)?.two_factor_enabled;

    let setupUrl = '';
    let secret = '';
    if (!enabled) {
      secret = generateTOTPSecret();
      setupUrl = generateOTPAuthURL(secret, session.email, 'BiasharaLedger Admin');
      // Store pending secret for verification step
      await adminRun(
        `INSERT INTO admin_settings (key, value) VALUES ('pending_totp_secret', $1)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [secret]
      );
    }

    return NextResponse.json({ enabled, setup_url: setupUrl, secret });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to load security settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { error, session } = await adminGuard();
  if (error) return error;

  try {
    const { action, code, password } = await request.json();

    if (action === 'enable') {
      if (!code || code.length !== 6) {
        return NextResponse.json({ error: 'A valid 6-digit verification code is required' }, { status: 400 });
      }

      // Get the secret that was generated during GET
      const stored = await adminGet<{ value: string }>(
        "SELECT value FROM admin_settings WHERE key = 'pending_totp_secret'"
      );
      const secret = (stored as any)?.value;
      if (!secret) {
        return NextResponse.json({ error: '2FA setup expired. Please refresh the page and try again.' }, { status: 400 });
      }

      if (!verifyTOTP(code, secret)) {
        return NextResponse.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 });
      }

      // Store the TOTP secret and enable 2FA
      await adminRun(
        `INSERT INTO admin_settings (key, value) VALUES ('admin_totp_secret', $1)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [secret]
      );
      await withTenantContext(session.tenant_id, async () => {
        await run(
          'UPDATE users SET two_factor_enabled = 1 WHERE id = $1',
          [session.user_id]
        );
      });
      await adminRun(
        "DELETE FROM admin_settings WHERE key = 'pending_totp_secret'"
      );

      return NextResponse.json({ success: true, enabled: true, message: 'Two-factor authentication enabled successfully.' });
    }

    if (action === 'disable') {
      if (!password) {
        return NextResponse.json({ error: 'Password is required to disable 2FA' }, { status: 400 });
      }

      const user = await adminGet<{ password_hash: string }>(
        'SELECT password_hash FROM users WHERE id = $1',
        [session.user_id]
      );
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isValid = await bcrypt.compare(password, (user as any).password_hash);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 403 });
      }

      await adminRun(
        "DELETE FROM admin_settings WHERE key = 'admin_totp_secret'"
      );
      await withTenantContext(session.tenant_id, async () => {
        await run(
          'UPDATE users SET two_factor_enabled = 0 WHERE id = $1',
          [session.user_id]
        );
      });

      return NextResponse.json({ success: true, enabled: false, message: 'Two-factor authentication disabled.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update security settings' }, { status: 500 });
  }
}

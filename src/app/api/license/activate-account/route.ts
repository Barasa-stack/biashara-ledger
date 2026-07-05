import { NextResponse } from 'next/server';
import { adminRun, adminGet } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, licenseKey } = await req.json();
    if (!email || !licenseKey) {
      return NextResponse.json({ error: 'Email and license key are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const key = licenseKey.trim();

    // Look up the license in admin_license_keys
    const license = await adminGet<any>(
      `SELECT id, license_key, plan, is_active, expires_at FROM admin_license_keys WHERE LOWER(license_key) = LOWER($1) LIMIT 1`,
      [key]
    );

    if (!license) {
      return NextResponse.json({ error: 'Invalid license key. Please check and try again.' }, { status: 404 });
    }

    if (!license.is_active) {
      return NextResponse.json({ error: 'This license has been revoked. Please contact support.' }, { status: 403 });
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This license has expired. Please contact support to renew.' }, { status: 403 });
    }

    // Check if the license is already used by someone else
    const existingUser = await adminGet<any>(
      `SELECT id, email FROM users WHERE license_key = $1 AND LOWER(email) != LOWER($2) LIMIT 1`,
      [key, normalizedEmail]
    );

    if (existingUser) {
      return NextResponse.json({ error: 'This license key is already activated by another user.' }, { status: 409 });
    }

    // Check if this email already has a different license
    const userWithLicense = await adminGet<any>(
      `SELECT id, email, license_key FROM users WHERE LOWER(email) = LOWER($1) AND license_key IS NOT NULL AND license_key != $2 LIMIT 1`,
      [normalizedEmail, key]
    );

    if (userWithLicense) {
      return NextResponse.json({ error: 'This email already has a different license key assigned. Please contact support.' }, { status: 409 });
    }

    // Update the user's license
    const today = new Date().toISOString();
    const plan = license.plan || 'Premium';
    const expiresAt = license.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    await adminRun(
      `UPDATE users SET license_key = $1, license_status = 'active', subscription_plan = $2, subscription_expiry = $3, subscription_status = 'active' WHERE LOWER(email) = LOWER($4)`,
      [key, plan, expiresAt, normalizedEmail]
    );

    // Mark license as used
    await adminRun(
      `UPDATE admin_license_keys SET is_used = true, activated_at = NOW() WHERE LOWER(license_key) = LOWER($1)`,
      [key]
    );

    return NextResponse.json({
      success: true,
      message: 'License activated successfully! You can now sign in.',
      plan,
      expires_at: expiresAt,
    });
  } catch (err: any) {
    console.error('[activate-account] Error:', err?.message || err);
    return NextResponse.json({ error: 'Activation failed: ' + (err?.message || 'Unknown error') }, { status: 500 });
  }
}

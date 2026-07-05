import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminRun, adminGet } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function POST(req: Request) {
  try {
    const guard = await adminGuard();
    if (guard.error) return guard.error;

    const { email, plan = 'Premium', durationDays = 365 } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if license already exists for this email
    const existing = await adminGet(
      `SELECT id FROM admin_license_keys WHERE license_key IN 
       (SELECT license_key FROM users WHERE LOWER(email) = LOWER($1))
       OR id IN (SELECT id FROM admin_clients WHERE LOWER(email) = LOWER($1))`,
      [normalizedEmail]
    );

    // Generate a unique license key based on email
    const hash = crypto.createHash('sha256').update(normalizedEmail + process.env.LICENSE_SECRET || 'default-secret').digest('hex');
    const licenseKey = `BL-${hash.substring(0, 8).toUpperCase()}-${hash.substring(8, 16).toUpperCase()}-${hash.substring(16, 24).toUpperCase()}`;

    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // Store in admin_license_keys
    await adminRun(
      `INSERT INTO admin_license_keys (license_key, plan, is_active, is_used, expires_at, created_at)
       VALUES ($1, $2, true, false, $3, NOW())
       ON CONFLICT (license_key) DO UPDATE SET is_active = true, expires_at = $3`,
      [licenseKey, plan.toLowerCase(), expiresAt]
    );

    // Update the user's license in users table
    await adminRun(
      `UPDATE users SET license_key = $1, license_status = 'active', subscription_plan = $2, subscription_expiry = $3
       WHERE LOWER(email) = LOWER($4)`,
      [licenseKey, plan, expiresAt, normalizedEmail]
    );

    return NextResponse.json({
      success: true,
      license_key: licenseKey,
      email: normalizedEmail,
      plan,
      expires_at: expiresAt,
      message: `License generated for ${normalizedEmail}. Key: ${licenseKey}`,
    });
  } catch (err: any) {
    console.error('[generate-by-email] Error:', err?.message || err);
    return NextResponse.json({ error: 'Failed to generate license: ' + (err?.message || 'Unknown error') }, { status: 500 });
  }
}

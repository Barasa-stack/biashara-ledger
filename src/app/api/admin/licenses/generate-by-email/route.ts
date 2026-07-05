import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminRun, adminGet } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function POST(req: Request) {
  try {
    const guard = await adminGuard();
    if (guard.error) return guard.error;

    const { email, contact_person, company_name, plan = 'Premium', durationDays = 365 } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate a unique license key based on email
    const hash = crypto.createHash('sha256').update(normalizedEmail + process.env.LICENSE_SECRET || 'default-secret').digest('hex');
    const licenseKey = `BL-${hash.substring(0, 8).toUpperCase()}-${hash.substring(8, 16).toUpperCase()}-${hash.substring(16, 24).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const planLower = plan.toLowerCase();

    // 1. Create/Update client in admin_clients
    let clientId = null;
    const existingClient = await adminGet(
      `SELECT id FROM admin_clients WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail]
    );

    if (existingClient) {
      clientId = (existingClient as any).id;
      await adminRun(
        `UPDATE admin_clients SET company_name = COALESCE($1, company_name), contact_person = COALESCE($2, contact_person), plan = $3, is_active = true, expires_at = $4, license_key = $5 WHERE id = $6`,
        [company_name || null, contact_person || null, planLower, expiresAt, licenseKey, clientId]
      );
    } else {
      const insertResult = await adminRun(
        `INSERT INTO admin_clients (company_name, email, contact_person, plan, is_active, expires_at, license_key, created_at)
         VALUES ($1, $2, $3, $4, true, $5, $6, NOW()) RETURNING id`,
        [company_name || 'Unknown Company', normalizedEmail, contact_person || '', planLower, expiresAt, licenseKey]
      );
      clientId = (insertResult as any).id || null;
    }

    // 2. Store in admin_license_keys
    await adminRun(
      `INSERT INTO admin_license_keys (license_key, client_id, plan, is_active, is_used, expires_at, created_at)
       VALUES ($1, $2, $3, true, false, $4, NOW())
       ON CONFLICT (license_key) DO UPDATE SET is_active = true, expires_at = $4, client_id = COALESCE($2, client_id)`,
      [licenseKey, clientId, planLower, expiresAt]
    );

    // 3. Update the user in users table
    const existingUser = await adminGet(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail]
    );

    if (existingUser) {
      await adminRun(
        `UPDATE users SET license_key = $1, license_status = 'active', subscription_plan = $2, subscription_expiry = $3, subscription_status = 'active' WHERE LOWER(email) = LOWER($4)`,
        [licenseKey, plan, expiresAt, normalizedEmail]
      );
    } else {
      await adminRun(
        `INSERT INTO users (email, license_key, license_status, subscription_plan, subscription_expiry, subscription_status, role, verified)
         VALUES ($1, $2, 'active', $3, $4, 'active', 'user', 1)`,
        [normalizedEmail, licenseKey, plan, expiresAt]
      );
    }

    return NextResponse.json({
      success: true,
      license_key: licenseKey,
      email: normalizedEmail,
      contact_person: contact_person || '',
      company_name: company_name || '',
      plan,
      expires_at: expiresAt,
      client_id: clientId,
      message: `License generated for ${normalizedEmail}. Key: ${licenseKey}`,
    });
  } catch (err: any) {
    console.error('[generate-by-email] Error:', err?.message || err);
    return NextResponse.json({ error: 'Failed to generate license: ' + (err?.message || 'Unknown error') }, { status: 500 });
  }
}

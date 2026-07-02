import { adminGet, adminRun } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { NextResponse } from 'next/server';
import * as crypto from 'crypto';

const SECRET = process.env.LICENSE_SECRET || 'your-very-secret-key-change-in-production';

export class LicenseService {
  // ─── ONLINE ACTIVATION (license key) ───
  static async activateOnline(licenseKey: string, sessionEmail: string) {
    const key = licenseKey.trim();

    // 1. Check admin_license_keys
    let license = await adminGet<{
      id: string;
      client_id: string;
      license_key: string;
      plan: string;
      is_active: boolean;
      is_used: boolean;
      expires_at: string;
    }>(
      `SELECT id, client_id, license_key, plan, is_active, is_used, expires_at
       FROM admin_license_keys
       WHERE LOWER(license_key) = LOWER($1)
       LIMIT 1`,
      [key]
    );

    // 2. If not found, check admin_clients
    let clientFromLicense: any = null;
    if (!license) {
      clientFromLicense = await adminGet<{
        id: string;
        company_name: string;
        email: string;
        license_key: string;
        plan: string;
        expires_at: string;
      }>(
        `SELECT id, company_name, email, license_key, plan, expires_at
         FROM admin_clients
         WHERE LOWER(license_key) = LOWER($1)`,
        [key]
      );

      if (clientFromLicense) {
        license = {
          id: clientFromLicense.id,
          client_id: clientFromLicense.id,
          license_key: clientFromLicense.license_key,
          plan: clientFromLicense.plan || 'standard',
          is_active: true,
          is_used: false,
          expires_at: clientFromLicense.expires_at,
        };
      }
    }

    if (!license) {
      return { error: 'License key not found' };
    }

    if (license.is_active === false) {
      return { error: 'This license key has been revoked. Please contact support.' };
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return { error: 'This license key has expired. Please contact support to renew.' };
    }

    // 3. Get client details
    const client = await adminGet<{ id: string; company_name: string; email: string }>(
      `SELECT id, company_name, email FROM admin_clients WHERE id = $1`,
      [license.client_id]
    );

    const actualClient = client || clientFromLicense;
    if (!actualClient) {
      return { error: 'Client record missing. Contact support.' };
    }

    // 4. Email match (case-insensitive)
    if (actualClient.email.toLowerCase() !== sessionEmail.toLowerCase()) {
      return { error: 'This license key belongs to a different account.' };
    }

    // 5. Update user
    await adminRun(
      `UPDATE users
       SET subscription_plan = $1,
           subscription_status = 'active',
           subscription_expiry = $2::timestamptz,
           license_status = 'active',
           license_key = $3,
           trial_used = 1
       WHERE email = $4`,
      [license.plan || 'standard', license.expires_at, key, sessionEmail]
    );

    // 6. Update admin_clients
    await adminRun(
      `UPDATE admin_clients SET is_active = true, expires_at = $1::timestamptz WHERE id = $2`,
      [license.expires_at, actualClient.id]
    );

    // 7. Mark license as used (if in admin_license_keys)
    if (license.id && license.is_used === false) {
      await adminRun(
        `UPDATE admin_license_keys SET is_used = true, activated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [license.id]
      );
    }

    return {
      success: true,
      plan: license.plan || 'standard',
      expiresAt: license.expires_at,
      companyName: actualClient.company_name,
      clientId: actualClient.id,
    };
  }

  // ─── OFFLINE ACTIVATION (signed .lic file) ───
  static async activateOffline(licenseFile: any, sessionEmail: string) {
    if (!licenseFile || !licenseFile.licenseKey || !licenseFile.signature) {
      return { error: 'Invalid license file format' };
    }

    const payload = { ...licenseFile };
    delete payload.signature;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (licenseFile.signature !== expectedSignature) {
      return { error: 'Invalid license signature' };
    }

    const expiresAt = new Date(licenseFile.expiresAt);
    if (expiresAt < new Date()) {
      return { error: 'License has expired' };
    }

    if (licenseFile.email.toLowerCase() !== sessionEmail.toLowerCase()) {
      return { error: 'This license belongs to a different account.' };
    }

    await adminRun(
      `UPDATE users
       SET subscription_plan = $1,
           subscription_status = 'active',
           subscription_expiry = $2::timestamptz,
           license_status = 'active',
           license_key = $3,
           trial_used = 1
       WHERE email = $4`,
      [licenseFile.plan, licenseFile.expiresAt, licenseFile.licenseKey, sessionEmail]
    );

    await adminRun(
      `UPDATE admin_clients SET is_active = true, expires_at = $1::timestamptz, license_key = $2
       WHERE id = $3`,
      [licenseFile.expiresAt, licenseFile.licenseKey, licenseFile.clientId]
    );

    await adminRun(
      `UPDATE admin_license_keys SET is_used = true, activated_at = CURRENT_TIMESTAMP
       WHERE LOWER(license_key) = LOWER($1)`,
      [licenseFile.licenseKey]
    );

    return {
      success: true,
      plan: licenseFile.plan,
      expiresAt: licenseFile.expiresAt,
      clientId: licenseFile.clientId,
    };
  }

  // ─── REFRESH SESSION COOKIE ───
  static async refreshSessionCookie(email: string, response: NextResponse) {
    const user = await adminGet<{
      subscription_plan: string;
      subscription_status: string;
      subscription_expiry: string;
    }>(
      `SELECT subscription_plan, subscription_status, subscription_expiry
       FROM users
       WHERE email = $1 AND role = 'admin'`,
      [email]
    );

    const plan = user?.subscription_plan || 'trial';
    const status = user?.subscription_status || 'expired';

    response.cookies.set('bl_sub_status', `${plan}:${status}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return { plan, status, expiry: user?.subscription_expiry };
  }

  // ─── GENERATE LICENSE FILE (Admin only) ───
  static async generateLicenseFile(clientId: string, plan: string, durationMonths: number) {
    const client = await adminGet<{ id: string; company_name: string; email: string }>(
      `SELECT id, company_name, email FROM admin_clients WHERE id = $1`,
      [clientId]
    );
    if (!client) return { error: 'Client not found' };

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
    const licenseKey = `BL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const payload = {
      licenseKey,
      clientId: client.id,
      email: client.email,
      plan,
      expiresAt: expiresAt.toISOString(),
      issuedAt: new Date().toISOString(),
    };

    const signature = crypto
      .createHmac('sha256', SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    await adminRun(
      `INSERT INTO admin_license_keys (license_key, client_id, plan, is_active, is_used, expires_at)
       VALUES ($1, $2, $3, true, false, $4::timestamptz)`,
      [licenseKey, client.id, plan, expiresAt.toISOString()]
    );

    return { ...payload, signature };
  }

  // ─── EXTEND EXISTING LICENSE ───
  static async extendLicense(clientId: string, additionalMonths: number, newPlan?: string) {
    const license = await adminGet<{
      id: string;
      license_key: string;
      plan: string;
      expires_at: string;
    }>(
      `SELECT id, license_key, plan, expires_at
       FROM admin_license_keys
       WHERE client_id = $1 AND is_active = true
       ORDER BY expires_at DESC LIMIT 1`,
      [clientId]
    );

    if (!license) {
      return { error: 'No active license found for this client' };
    }

    const newExpiry = new Date(license.expires_at);
    newExpiry.setMonth(newExpiry.getMonth() + additionalMonths);

    await adminRun(
      `UPDATE admin_license_keys
       SET expires_at = $1::timestamptz, plan = COALESCE($2, plan)
       WHERE id = $3`,
      [newExpiry.toISOString(), newPlan || license.plan, license.id]
    );

    await adminRun(
      `UPDATE admin_clients SET expires_at = $1::timestamptz, plan = COALESCE($2, plan)
       WHERE id = $3`,
      [newExpiry.toISOString(), newPlan || license.plan, clientId]
    );

    return {
      success: true,
      licenseKey: license.license_key,
      plan: newPlan || license.plan,
      expiresAt: newExpiry.toISOString(),
    };
  }

  // ─── GET LICENSE STATUS ───
  static async getStatus(email: string) {
    const user = await adminGet<{
      subscription_plan: string;
      subscription_status: string;
      subscription_expiry: string;
      license_key: string;
    }>(
      `SELECT subscription_plan, subscription_status, subscription_expiry, license_key
       FROM users WHERE email = $1`,
      [email]
    );

    if (!user) return { error: 'User not found' };

    return {
      plan: user.subscription_plan,
      status: user.subscription_status,
      expiry: user.subscription_expiry,
      licenseKey: user.license_key,
    };
  }
}

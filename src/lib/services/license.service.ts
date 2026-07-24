import { adminGet, adminRun } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { generateLicenseKey } from '@/lib/admin';
import { logLicenseActivation } from '@/lib/license';
import { normalizePlan } from '@/lib/feature-gate';
import { NextResponse } from 'next/server';
import * as crypto from 'crypto';

function getSecret() {
  const s = process.env.LICENSE_SECRET;
  if (!s) throw new Error('LICENSE_SECRET environment variable is required');
  return s;
}

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

    // 3. Fallback: check users table for trial keys
    if (!license) {
      const trialUser = await adminGet<{
        id: string;
        trial_end_date: string;
        subscription_plan: string;
      }>(
        `SELECT id, trial_end_date, subscription_plan
         FROM users
         WHERE LOWER(license_key) = LOWER($1) AND license_status = 'trial'
         LIMIT 1`,
        [key]
      );

      if (trialUser) {
        // Trial license activation — skip admin_clients checks
        const plan = normalizePlan(trialUser.subscription_plan || 'trial');
        await adminRun(
          `UPDATE users
           SET subscription_status = 'active',
               license_status = 'active',
               subscription_expiry = $2::timestamptz,
               trial_used = 1
           WHERE id = $1`,
          [trialUser.id, trialUser.trial_end_date]
        );

        await logLicenseActivation({
          licenseKey: key,
          userEmail: sessionEmail,
          ipAddress: '',
          deviceInfo: 'web',
          status: 'success',
        });

        return {
          success: true,
          plan,
          expiresAt: trialUser.trial_end_date,
          companyName: sessionEmail,
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

    const plan = normalizePlan(license.plan || 'standard');
    // 5. Update user
    await adminRun(
      `UPDATE users
       SET subscription_plan = $1,
           subscription_status = 'active',
           subscription_expiry = $2::timestamptz,
           license_status = 'active',
           license_key = $3,
           trial_used = 1
       WHERE LOWER(email) = LOWER($4)`,
      [plan, license.expires_at, key, sessionEmail]
    );

    // 6. Update admin_clients
    await adminRun(
      `UPDATE admin_clients SET is_active = true, expires_at = $1::timestamptz, plan = $2 WHERE id = $3`,
      [license.expires_at, plan, actualClient.id]
    );

    // 7. Mark license as used (if in admin_license_keys)
    if (license.id && license.is_used === false) {
      await adminRun(
        `UPDATE admin_license_keys SET is_used = true, activated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [license.id]
      );
    }

    // 8. Log activation for admin panel
    await logLicenseActivation({
      licenseKey: key,
      userEmail: sessionEmail,
      ipAddress: '',
      deviceInfo: 'web',
      status: 'success',
    });

    return {
      success: true,
      plan,
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
      .createHmac('sha256', getSecret())
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

    const plan = normalizePlan(licenseFile.plan);
    await adminRun(
      `UPDATE users
       SET subscription_plan = $1,
           subscription_status = 'active',
           subscription_expiry = $2::timestamptz,
           license_status = 'active',
           license_key = $3,
           trial_used = 1
       WHERE LOWER(email) = LOWER($4)`,
      [plan, licenseFile.expiresAt, licenseFile.licenseKey, sessionEmail]
    );

    await adminRun(
      `UPDATE admin_clients SET is_active = true, expires_at = $1::timestamptz, license_key = $2, plan = $3
       WHERE id = $4`,
      [licenseFile.expiresAt, licenseFile.licenseKey, plan, licenseFile.clientId]
    );

    await adminRun(
      `UPDATE admin_license_keys SET is_used = true, activated_at = CURRENT_TIMESTAMP
       WHERE LOWER(license_key) = LOWER($1)`,
      [licenseFile.licenseKey]
    );

    await logLicenseActivation({
      licenseKey: licenseFile.licenseKey,
      userEmail: sessionEmail,
      ipAddress: '',
      deviceInfo: 'desktop',
      status: 'success',
    });

    return {
      success: true,
      plan,
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
      license_status: string;
    }>(
      `SELECT subscription_plan, subscription_status, subscription_expiry, license_status
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    const plan = normalizePlan(user?.subscription_plan || 'trial');
    const status = user?.license_status === 'active' ? 'active' : user?.subscription_status || 'expired';
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
    const licenseKey = generateLicenseKey(client.email);

    const normalizedPlan = normalizePlan(plan);
    const payload = {
      licenseKey,
      clientId: client.id,
      email: client.email,
      plan: normalizedPlan,
      expiresAt: expiresAt.toISOString(),
      issuedAt: new Date().toISOString(),
    };

    const signature = crypto
      .createHmac('sha256', getSecret())
      .update(JSON.stringify(payload))
      .digest('hex');

    await adminRun(
      `INSERT INTO admin_license_keys (license_key, client_id, plan, is_active, is_used, expires_at)
       VALUES ($1, $2, $3, true, false, $4::timestamptz)`,
      [licenseKey, client.id, payload.plan, payload.expiresAt]
    );

    await adminRun(
      `UPDATE users
       SET subscription_plan = $1,
           subscription_status = 'active',
           subscription_expiry = $2::timestamptz,
           license_status = 'active',
           license_key = $3
       WHERE LOWER(email) = LOWER($4)`,
      [payload.plan, payload.expiresAt, licenseKey, client.email]
    );

    return {
      licenseKey,
      plan: payload.plan,
      expiresAt: payload.expiresAt,
      signature,
    };
  }

  // ─── EXTEND EXISTING LICENSE ───

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

    const normalizedNewPlan = newPlan ? normalizePlan(newPlan) : normalizePlan(license.plan);

    await adminRun(
      `UPDATE admin_license_keys
       SET expires_at = $1::timestamptz, plan = COALESCE($2, plan)
       WHERE id = $3`,
      [newExpiry.toISOString(), normalizedNewPlan, license.id]
    );

    await adminRun(
      `UPDATE admin_clients SET expires_at = $1::timestamptz, plan = COALESCE($2, plan)
       WHERE id = $3`,
      [newExpiry.toISOString(), normalizedNewPlan, clientId]
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
      plan: normalizePlan(user.subscription_plan),
      status: user.subscription_status,
      expiry: user.subscription_expiry,
      licenseKey: user.license_key,
    };
  }
}

import { NextResponse } from 'next/server';
import { adminGet, adminRun } from '@/lib/db';
import { createOfflineSession } from '@/lib/offline-session';
import { logLicenseActivation } from '@/lib/license';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const { licenseKey, hardwareFingerprint, userEmail, deviceInfo } = await req.json();

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rl = await checkRateLimit(`offline-activate:${userEmail ?? 'unknown'}:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    if (!licenseKey || !hardwareFingerprint || !userEmail) {
      return NextResponse.json({ error: 'licenseKey, hardwareFingerprint, and userEmail are required' }, { status: 400 });
    }

    const license = await adminGet<{
      id: string;
      client_id: string;
      plan: string;
      is_active: boolean;
      expires_at: string;
      modules?: string;
    }>(
      `SELECT l.id, l.client_id, l.plan, l.is_active, l.expires_at, l.modules
       FROM admin_license_keys l
       WHERE LOWER(l.license_key) = LOWER($1)
       LIMIT 1`,
      [licenseKey]
    );

    if (!license) {
      return NextResponse.json({ success: false, error: 'License key not found' }, { status: 400 });
    }

    if (!license.is_active) {
      return NextResponse.json({ success: false, error: 'License key has been revoked' }, { status: 400 });
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'License key has expired' }, { status: 400 });
    }

    const client = await adminGet<{ id: string; email: string; company_name: string }>(
      'SELECT id, email, company_name FROM admin_clients WHERE id = $1',
      [license.client_id]
    );

    if (client && client.email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'This license key belongs to a different account' }, { status: 403 });
    }

    const session = await createOfflineSession({
      clientId: String(license.client_id),
      licenseKey,
      hardwareFingerprint,
      userEmail,
      ipAddress: ip,
    });

    if (!session.success) {
      return NextResponse.json({ success: false, error: session.error || 'Failed to create session' }, { status: 500 });
    }

    const modulesJson = license.modules || '[]';
    await adminRun(
      `UPDATE users SET subscription_plan = $1, subscription_status = 'active',
       subscription_expiry = $2::timestamptz, license_status = 'active', license_key = $3,
       allowed_modules = $4
       WHERE LOWER(email) = LOWER($5)`,
      [license.plan, license.expires_at, licenseKey, modulesJson, userEmail]
    );

    await logLicenseActivation({
      licenseKey,
      userEmail,
      ipAddress: ip,
      deviceInfo: deviceInfo || 'desktop',
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
    });
  } catch (err: any) {
    console.error('[offline/activate]', err?.message || err);
    return NextResponse.json({ success: false, error: 'Activation failed' }, { status: 500 });
  }
}

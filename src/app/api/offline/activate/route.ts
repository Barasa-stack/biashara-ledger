import { NextResponse } from 'next/server';
import { adminGet, adminRun } from '@/lib/db';
import { validateLicenseKeyStructure, logLicenseActivation } from '@/lib/license';
import { createOfflineSession } from '@/lib/offline-session';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const { licenseKey, hardwareFingerprint, userEmail, deviceInfo } = await request.json();

    if (!licenseKey || !userEmail) {
      return NextResponse.json({ error: 'License key and email are required' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = checkRateLimit(`offline:activate:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many activation attempts. Try again later.' }, { status: 429 });
    }

    const structure = validateLicenseKeyStructure(licenseKey);
    if (!structure.valid) {
      await logLicenseActivation({
        licenseKey, userEmail, hardwareFingerprint, ipAddress: ip,
        deviceInfo, status: 'failed', errorReason: structure.reason,
      });
      return NextResponse.json({ error: structure.reason }, { status: 400 });
    }

    const lic = await adminGet(
      `SELECT l.*, c.id as client_id, c.database_name, c.is_active as client_active
       FROM admin_license_keys l
       JOIN admin_clients c ON l.client_id = c.id
       WHERE l.license_key = $1`,
      [licenseKey]
    );

    if (!lic) {
      await logLicenseActivation({
        licenseKey, userEmail, hardwareFingerprint, ipAddress: ip,
        deviceInfo, status: 'failed', errorReason: 'License key not found',
      });
      return NextResponse.json({ error: 'License key not found' }, { status: 404 });
    }

    const l = lic as any;
    if (!l.is_active) {
      await logLicenseActivation({
        licenseKey, userEmail, hardwareFingerprint, ipAddress: ip,
        deviceInfo, status: 'failed', errorReason: 'License key has been revoked',
      });
      return NextResponse.json({ error: 'License key has been revoked' }, { status: 403 });
    }

    if (l.expires_at && new Date(l.expires_at) < new Date()) {
      await logLicenseActivation({
        licenseKey, userEmail, hardwareFingerprint, ipAddress: ip,
        deviceInfo, status: 'failed', errorReason: 'License key expired',
      });
      return NextResponse.json({ error: 'License key has expired' }, { status: 403 });
    }

    if (!l.client_active) {
      return NextResponse.json({ error: 'Client account is inactive' }, { status: 403 });
    }

    if (l.hardware_fingerprint && l.hardware_fingerprint !== hardwareFingerprint && hardwareFingerprint) {
      await logLicenseActivation({
        licenseKey, userEmail, hardwareFingerprint, ipAddress: ip,
        deviceInfo, status: 'failed', errorReason: 'Hardware mismatch',
      });
      return NextResponse.json({ error: 'This license is already bound to a different device' }, { status: 403 });
    }

    if (hardwareFingerprint && !l.hardware_fingerprint) {
      await adminRun(
        'UPDATE admin_license_keys SET hardware_fingerprint = $1 WHERE id = $2',
        [hardwareFingerprint, l.id]
      );
    }

    const session = await createOfflineSession({
      clientId: l.client_id,
      licenseKey,
      hardwareFingerprint: hardwareFingerprint || '',
      userEmail,
      ipAddress: ip,
    });

    if (!session.success) {
      await logLicenseActivation({
        licenseKey, userEmail, hardwareFingerprint, ipAddress: ip,
        deviceInfo, status: 'failed', errorReason: session.error,
      });
      return NextResponse.json({ error: session.error }, { status: 500 });
    }

    await logLicenseActivation({
      licenseKey, userEmail, hardwareFingerprint, ipAddress: ip,
      deviceInfo, status: 'success',
    });

    await adminRun(
      'UPDATE admin_license_keys SET is_used = true WHERE id = $1',
      [l.id]
    );

    return NextResponse.json({
      success: true,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      licenseKey,
      userEmail,
      daysValid: 7,
      databaseName: l.database_name,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Activation failed' }, { status: 500 });
  }
}

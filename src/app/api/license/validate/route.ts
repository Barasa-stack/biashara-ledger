import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';

function daysRemaining(expiryDate: string | Date | null): number {
  if (!expiryDate) return 365;
  const exp = new Date(expiryDate);
  const now = new Date();
  return Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export async function POST(request: Request) {
  try {
    const { licenseKey, hardwareFingerprint } = await request.json();
    if (!licenseKey) return NextResponse.json({ valid: false, reason: 'License key required' });

    const license = await get('SELECT * FROM licenses WHERE license_key = $1', [licenseKey]) as any;
    if (!license) return NextResponse.json({ valid: false, reason: 'Invalid license key' });

    if (license.revoked) return NextResponse.json({ valid: false, reason: 'License revoked' });

    if (license.expiry_date && new Date(license.expiry_date) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'License expired' });
    }

    if (license.activated && hardwareFingerprint && license.hardware_fingerprint !== hardwareFingerprint) {
      return NextResponse.json({ valid: false, reason: 'Hardware mismatch' });
    }

    await run('UPDATE licenses SET last_validated = NOW(), last_seen = NOW() WHERE id = $1', [license.id]);

    return NextResponse.json({
      valid: true,
      type: license.type,
      status: license.status,
      expiryDate: license.expiry_date,
      daysRemaining: daysRemaining(license.expiry_date),
      features: license.features || [],
    });
  } catch (e: any) {
    return NextResponse.json({ valid: false, reason: e.message || 'Validation error' }, { status: 500 });
  }
}

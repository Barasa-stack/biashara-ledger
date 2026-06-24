import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import crypto from 'crypto';

function generateActivationToken(license: any): string {
  const payload = JSON.stringify({ id: license.id, key: license.license_key, exp: Date.now() + 365 * 24 * 60 * 60 * 1000 });
  const secret = process.env.ENCRYPTION_KEY || 'biashara-ledger-secret';
  return crypto.createHmac('sha256', secret).update(payload).digest('hex') + '.' + Buffer.from(payload).toString('base64');
}

export async function POST(request: Request) {
  try {
    const { licenseKey, hardwareFingerprint, userEmail } = await request.json();
    if (!licenseKey) return NextResponse.json({ error: 'License key required' }, { status: 400 });

    const license = await get('SELECT * FROM licenses WHERE license_key = $1', [licenseKey]);
    if (!license) return NextResponse.json({ error: 'Invalid license key' }, { status: 400 });

    if ((license as any).activated && (license as any).hardware_fingerprint !== hardwareFingerprint) {
      return NextResponse.json({ error: 'License already activated on another device' }, { status: 400 });
    }

    await run(
      `UPDATE licenses SET hardware_fingerprint = $1, activated = true, activation_date = NOW(), last_validated = NOW(), user_email = COALESCE($2, user_email) WHERE license_key = $3`,
      [hardwareFingerprint, userEmail, licenseKey]
    );

    const updated = await get('SELECT * FROM licenses WHERE license_key = $1', [licenseKey]);
    const token = generateActivationToken(updated);

    return NextResponse.json({
      success: true,
      token,
      licenseType: (updated as any).type,
      expiryDate: (updated as any).expiry_date,
      features: (updated as any).features || [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Activation failed' }, { status: 500 });
  }
}

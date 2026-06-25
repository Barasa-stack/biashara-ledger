import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { activateLicenseForUser } from '@/lib/license';

export async function POST(request: Request) {
  try {
    const { licenseKey, hardwareFingerprint, userEmail } = await request.json();
    if (!licenseKey || !userEmail) {
      return NextResponse.json({ error: 'License key and email are required' }, { status: 400 });
    }

    const result = await activateLicenseForUser(licenseKey, userEmail.trim().toLowerCase(), hardwareFingerprint || '');
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const updated = await get('SELECT * FROM license_keys WHERE license_key = $1', [licenseKey]);

    // Generate activation token for offline use
    const crypto = require('crypto');
    const payload = JSON.stringify({ id: (updated as any).id, key: licenseKey, exp: Date.now() + 365 * 24 * 60 * 60 * 1000 });
    const secret = process.env.ENCRYPTION_KEY || 'biashara-ledger-secret';
    const token = crypto.createHmac('sha256', secret).update(payload).digest('hex') + '.' + Buffer.from(payload).toString('base64');

    return NextResponse.json({
      success: true,
      token,
      licenseKey,
      userId: (updated as any).user_id,
      licenseType: (updated as any).license_type || 'standard',
      expiryDate: (updated as any).expires_at,
      features: [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Activation failed' }, { status: 500 });
  }
}

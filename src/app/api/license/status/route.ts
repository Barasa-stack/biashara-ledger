import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const licenseId = searchParams.get('licenseId');
  if (!licenseId) return NextResponse.json({ error: 'licenseId required' }, { status: 400 });

  const license = await get('SELECT * FROM licenses WHERE license_id = $1', [licenseId]) as any;
  if (!license) return NextResponse.json({ valid: false }, { status: 404 });

  await run(
    `UPDATE licenses SET last_seen = NOW(), last_known_ip = $1, device_info = $2 WHERE id = $3`,
    [request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '', request.headers.get('user-agent') || '', license.id]
  );

  const installations = await get('SELECT COUNT(*) as count FROM license_installations WHERE license_key = $1 AND status = \'active\'', [license.license_key]) as any;

  return NextResponse.json({
    valid: license.status === 'active' && !license.revoked,
    status: license.status,
    type: license.type,
    expiryDate: license.expiry_date,
    daysRemaining: license.expiry_date ? Math.max(0, Math.ceil((new Date(license.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 365,
    activeInstallations: installations?.count || 0,
    maxInstallations: license.allowed_installations,
  });
}

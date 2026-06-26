import { NextResponse } from 'next/server';
import { adminGet, adminRun } from '@/lib/db';
import { adminGuard } from '@/lib/admin';
import { generateLicenseKey } from '@/lib/license';

export async function POST(request: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const { email, plan, clientName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await adminGet(
      'SELECT id, company_name, email FROM admin_clients WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (!client) {
      return NextResponse.json({ error: 'No client found with this email' }, { status: 404 });
    }

    const c = client as any;
    const licenseKey = generateLicenseKey(email, plan || 'standard');

    const existing = await adminGet(
      'SELECT id FROM admin_license_keys WHERE license_key = $1',
      [licenseKey]
    );

    if (existing) {
      return NextResponse.json({ error: 'License key collision. Try again.' }, { status: 409 });
    }

    await adminRun(
      `INSERT INTO admin_license_keys (license_key, client_id, plan, expires_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '1 year')`,
      [licenseKey, c.id, plan || 'standard']
    );

    await adminRun(
      'UPDATE admin_clients SET license_key = $1 WHERE id = $2',
      [licenseKey, c.id]
    );

    return NextResponse.json({
      success: true,
      licenseKey,
      client: { id: c.id, companyName: c.company_name, email: c.email },
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

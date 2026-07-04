import { NextResponse } from 'next/server';
import { adminGet, adminRun } from '@/lib/db';
import { generateLicenseKey, adminGuard } from '@/lib/admin';
import { sendLicenseEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const guard = await adminGuard();
    if (guard.error) return guard.error;

    const { email, plan, name } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await adminGet('SELECT id, tenant_id FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    if (!user) {
      return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
    }

    const licensePlan = plan || 'standard';
    const licenseKey = generateLicenseKey(normalizedEmail);
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const client = await adminGet<{ id: string }>(
      `SELECT id FROM admin_clients WHERE LOWER(email) = LOWER($1)`,
      [normalizedEmail]
    );
    const clientId = client?.id || user.tenant_id;

    await adminRun(
      `INSERT INTO admin_license_keys (license_key, client_id, plan, is_active, is_used, expires_at)
       VALUES ($1, $2, $3, true, false, $4::timestamptz)
       ON CONFLICT (license_key) DO NOTHING`,
      [licenseKey, clientId, licensePlan, expiresAt]
    );

    const emailResult = await sendLicenseEmail(email, licenseKey, licensePlan, name || email);

    return NextResponse.json({
      success: true,
      licenseKey,
      plan: licensePlan,
      emailSent: emailResult.sent,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'License generation failed' }, { status: 500 });
  }
}

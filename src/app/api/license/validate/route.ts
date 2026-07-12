import { NextResponse } from 'next/server';
import { adminGet, adminRun } from '@/lib/db';
import { normalizePlan, getDefaultModules, getAllModules, getModuleName } from '@/lib/feature-gate';

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

    const license = await adminGet<{
      id: string;
      license_key: string;
      plan: string;
      is_active: boolean;
      is_used: boolean;
      expires_at: string;
      company_name: string;
      email: string;
    }>(
      `SELECT l.*, c.company_name, c.email
       FROM admin_license_keys l
       JOIN admin_clients c ON l.client_id = c.id
       WHERE LOWER(l.license_key) = LOWER($1)`,
      [licenseKey]
    );

    if (!license) return NextResponse.json({ valid: false, reason: 'Invalid license key' });

    if (!license.is_active) return NextResponse.json({ valid: false, reason: 'License revoked' });

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'License expired' });
    }

    if (hardwareFingerprint) {
      await adminRun(
        `UPDATE admin_license_keys SET last_validated = NOW(), last_seen = NOW() WHERE id = $1`,
        [license.id]
      );
    }

    const plan = normalizePlan(license.plan);
    const modules = getDefaultModules(plan);
    const featureList = modules.length > 0 ? modules.map(m => getModuleName(m)) : ['all'];

    return NextResponse.json({
      valid: true,
      type: plan,
      status: license.is_active ? 'active' : 'revoked',
      expiryDate: license.expires_at,
      daysRemaining: daysRemaining(license.expires_at),
      features: featureList,
    });
  } catch (e: any) {
    return NextResponse.json({ valid: false, reason: e.message || 'Validation error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { adminGet, adminQuery } from '@/lib/db';

export async function GET(request: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 });
    }

    const client = await adminGet(
      `SELECT c.id, c.company_name, c.email, c.plan, c.is_active, c.is_trial,
              c.trial_start_date, c.trial_end_date, c.expires_at, c.license_key,
              c.created_at, c.last_active,
              u.subscription_plan, u.subscription_status, u.subscription_expiry,
              u.license_status, u.verified, u.first_login,
              l.id as license_id, l.license_key, l.plan as license_plan,
              l.is_active as license_is_active, l.expires_at as license_expires_at,
              l.activated_at, l.is_used
       FROM admin_clients c
       LEFT JOIN users u ON u.email = c.email AND u.role = 'admin'
       LEFT JOIN admin_license_keys l ON l.client_id = c.id
       WHERE c.email ILIKE $1
       ORDER BY c.created_at DESC
       LIMIT 1`,
      [`%${email}%`]
    );

    if (!client) {
      return NextResponse.json({ found: false, message: 'No client found with this email' });
    }

    let trialStatus = 'none';
    if (client.is_trial && client.trial_end_date) {
      if (new Date(client.trial_end_date) > new Date()) {
        trialStatus = 'active';
      } else {
        trialStatus = 'expired';
      }
    }

    let licenseStatus = 'none';
    if (client.license_is_active === false) {
      licenseStatus = 'inactive';
    } else if (client.license_expires_at) {
      const expiry = new Date(client.license_expires_at);
      if (expiry < new Date()) {
        licenseStatus = 'expired';
      } else {
        const daysRemaining = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysRemaining <= 7) {
          licenseStatus = 'expiring_soon';
        } else if (daysRemaining <= 30) {
          licenseStatus = 'expiring';
        } else {
          licenseStatus = 'active';
        }
      }
    }

    return NextResponse.json({
      found: true,
      client: {
        id: client.id,
        companyName: client.company_name,
        email: client.email,
        phone: null,
        plan: client.plan || client.subscription_plan || 'trial',
        isActive: client.is_active,
        trialStatus,
        trialExpiresAt: client.trial_end_date,
        trialStartDate: client.trial_start_date,
        createdAt: client.created_at,
        lastActive: client.last_active,
      },
      currentLicense: {
        licenseId: client.license_id,
        licenseKey: client.license_key,
        planTier: client.license_plan || client.plan,
        status: licenseStatus,
        isActive: client.license_is_active,
        isUsed: client.is_used,
        expiresAt: client.license_expires_at || client.expires_at,
        activatedAt: client.activated_at,
      },
      user: {
        firstLogin: client.first_login,
        verified: client.verified,
        subscriptionStatus: client.subscription_status,
        licenseStatus: client.license_status,
      },
    });

  } catch (err: any) {
    console.error('Client search error:', err);
    return NextResponse.json({ error: 'Failed to search client' }, { status: 500 });
  }
}

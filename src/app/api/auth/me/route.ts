import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth-server';
import { normalizePlan } from '@/lib/feature-gate';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const expiry = session.subscription_expiry ? new Date(session.subscription_expiry) : null;
    const trialDaysRemaining = expiry ? Math.ceil((expiry.getTime() - Date.now()) / 86400000) : 0;
    const licenseStatus = session.license_status || 'trial';

    const effectiveStatus = session.license_status === 'active' ? 'active' : session.subscription_status;
    const response = NextResponse.json({
      user: {
        id: session.user_id,
        email: session.email,
        role: session.role,
        firstName: session.first_name,
        lastName: session.last_name,
        phone: session.phone,
        country: session.country,
        verified: session.verified,
        subscriptionPlan: normalizePlan(session.subscription_plan),
        subscriptionStatus: effectiveStatus,
        subscriptionExpiry: session.subscription_expiry,
        trialEndDate: session.subscription_expiry,
        trialDaysRemaining,
        licenseStatus,
        allowedModules: session.allowed_modules || '[]',
      }
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

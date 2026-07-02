import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth-server';

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
        subscriptionPlan: session.subscription_plan,
        subscriptionStatus: session.subscription_status,
        subscriptionExpiry: session.subscription_expiry,
        trialEndDate: session.subscription_expiry,
        trialDaysRemaining,
        licenseStatus,
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

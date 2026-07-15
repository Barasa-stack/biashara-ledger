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
    const trialEnd = session.trial_end_date ? new Date(session.trial_end_date) : null;
    const trialDaysRemaining = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / 86400000) : 0;
    const licenseStatus = session.license_status || 'trial';

    const effectiveStatus = session.license_status === 'active' ? 'active' : session.subscription_status;
    const normalizedPlan = normalizePlan(session.subscription_plan);
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
        subscriptionPlan: normalizedPlan,
        subscriptionStatus: effectiveStatus,
        subscriptionExpiry: session.subscription_expiry,
        trialEndDate: session.trial_end_date,
        trialDaysRemaining,
        licenseStatus,
        allowedModules: session.allowed_modules || '[]',
      }
    });

    response.cookies.set('user_plan', normalizedPlan, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

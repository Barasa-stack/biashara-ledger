import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth-server';
import { normalizePlan } from '@/lib/feature-gate';
import { run, withTenantContext } from '@/lib/db';

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
    const now = new Date();

    // Auto-expire in DB if trial/subscription has passed
    const isTrialExpired = trialEnd && trialEnd < now && licenseStatus === 'trial';
    const isSubExpired = expiry && expiry < now && licenseStatus !== 'active';

    if (isTrialExpired || isSubExpired) {
      try {
        await withTenantContext(session.tenant_id, async () => {
          await run(
            `UPDATE users SET license_status = 'expired', subscription_status = 'expired' WHERE id = $1`,
            [session.user_id]
          );
        });
      } catch { /* best-effort */ }
    }

    const effectiveStatus = isTrialExpired || isSubExpired
      ? 'expired'
      : session.license_status === 'active' ? 'active' : session.subscription_status;

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
        licenseStatus: isTrialExpired || isSubExpired ? 'expired' : licenseStatus,
        allowedModules: session.allowed_modules || '[]',
      }
    });

    response.cookies.set('user_plan', normalizedPlan, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    response.cookies.set('user_subscription_expiry', session.subscription_expiry || session.trial_end_date || '', {
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

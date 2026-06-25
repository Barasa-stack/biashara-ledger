import { NextResponse } from 'next/server';
import { getSessionFromCookies, checkUserSubscription } from '@/lib/auth-server';
import { checkUserTrialStatus } from '@/lib/license';

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const subscriptionCheck = await checkUserSubscription(session);
  const trialStatus = await checkUserTrialStatus(session.user_id);

  return NextResponse.json({
    user: {
      id: session.user_id,
      email: session.email,
      firstName: session.first_name,
      lastName: session.last_name,
      phone: session.phone,
      subscriptionPlan: session.subscription_plan,
      subscriptionStatus: session.subscription_status,
      subscriptionExpiry: session.subscription_expiry,
      verified: !!session.verified,
      licenseStatus: (session as any).license_status || 'trial',
      licenseKey: (session as any).license_key || null,
      trialEndDate: (session as any).trial_end_date || null,
      trialDaysRemaining: trialStatus.daysRemaining || 0,
    },
    subscriptionCheck,
    trial: trialStatus,
  });
}

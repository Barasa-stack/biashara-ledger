import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { checkUserSubscription, checkFeatureAccess, getSessionFromCookies } from '@/lib/auth-server';
import { normalizePlan } from '@/lib/feature-gate';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ active: false, reason: 'Not authenticated' }, { status: 401 });
    }

    const user = await get(
      'SELECT * FROM users WHERE id = $1',
      [session.user_id]
    ) as any;

    if (!user) {
      return NextResponse.json({ active: false, reason: 'User not found' }, { status: 404 });
    }

    const subscriptionCheck = await checkUserSubscription(user);

    if (subscriptionCheck.active) {
      const featureAccess = await checkFeatureAccess(user);
      return NextResponse.json({
        active: true,
        plan: normalizePlan(user.subscription_plan),
        role: user.role,
        featureAccess: {
          plan: featureAccess.plan,
          role: featureAccess.role,
          allowedFeatures: featureAccess.allowedFeatures,
        },
      });
    }

    return NextResponse.json(subscriptionCheck);
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

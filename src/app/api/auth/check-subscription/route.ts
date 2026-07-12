import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { checkUserSubscription, checkFeatureAccess, getSessionFromCookies } from '@/lib/auth-server';
import { normalizePlan, getAllModules, getModuleName } from '@/lib/feature-gate';

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
      const featureAccess = checkFeatureAccess(user);
      const plan = normalizePlan(user.subscription_plan);
      const allModules = getAllModules().map(m => ({
        key: m,
        name: getModuleName(m),
        available: featureAccess.canAccess(m),
      }));
      return NextResponse.json({
        active: true,
        plan,
        role: user.role,
        featureAccess: {
          plan: featureAccess.plan,
          role: featureAccess.role,
          allowedModules: featureAccess.allowedModules,
        },
        allModules,
      });
    }

    return NextResponse.json(subscriptionCheck);
  } catch (error) {
    console.error('Subscription status error:', error);
    const __eMsg = error instanceof Error ? error.message : String(error);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}

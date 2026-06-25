import { NextRequest, NextResponse } from 'next/server';
import { get, adminGet } from '@/lib/db';
import { checkUserSubscription, checkFeatureAccess } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie');
    const sessionToken = cookie?.split('bl_session=')[1]?.split(';')[0];

    if (!sessionToken) {
      return NextResponse.json({ active: false, reason: 'Not authenticated' }, { status: 401 });
    }

    const session = await adminGet(
      "SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()",
      [sessionToken]
    ) as any;

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
        plan: user.subscription_plan,
        role: user.role,
        featureAccess,
      });
    }

    return NextResponse.json(subscriptionCheck);
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

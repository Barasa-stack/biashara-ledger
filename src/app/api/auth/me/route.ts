import { NextResponse } from 'next/server';
import { getSessionFromCookies, checkUserSubscription } from '@/lib/auth-server';

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const subscriptionCheck = await checkUserSubscription(session);

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
    },
    subscriptionCheck,
  });
}

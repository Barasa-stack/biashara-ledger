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

    return NextResponse.json({
      user: {
        id: session.user_id,
        email: session.email,
        role: session.role,
        firstName: session.first_name,
        lastName: session.last_name,
        verified: session.verified,
        subscriptionStatus: session.subscription_status,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

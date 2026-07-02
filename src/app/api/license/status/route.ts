import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { checkUserTrialStatus } from '@/lib/license';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ valid: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = session as any;
    const trialStatus = await checkUserTrialStatus(user.user_id || user.id);

    const licenseData = await get(
      'SELECT license_key, license_status, subscription_plan, subscription_status, subscription_expiry FROM users WHERE id = $1',
      [user.user_id || user.id]
    );

    return NextResponse.json({
      valid: trialStatus.status !== 'expired',
      status: trialStatus.status,
      message: trialStatus.message,
      daysRemaining: trialStatus.daysRemaining || 0,
      license: licenseData || null,
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: 'License check failed' }, { status: 500 });
  }
}

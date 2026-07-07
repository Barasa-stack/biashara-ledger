import { NextResponse } from 'next/server';
import { adminQuery } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const guard = await adminGuard();
  if (guard.error) return guard.error;

  try {
    const now = new Date().toISOString();
    const in1d = new Date(Date.now() + 1 * 86400000).toISOString();
    const in3d = new Date(Date.now() + 3 * 86400000).toISOString();
    const in7d = new Date(Date.now() + 7 * 86400000).toISOString();

    const [expiring1d, expiring3d, expiring7d, expired, stats] = await Promise.all([
      adminQuery(
        `SELECT id, email, first_name, last_name, subscription_plan, subscription_expiry, license_status
         FROM users WHERE subscription_expiry BETWEEN $1 AND $2 AND license_status = 'trial'`,
        [now, in1d]
      ),
      adminQuery(
        `SELECT id, email, first_name, last_name, subscription_plan, subscription_expiry, license_status
         FROM users WHERE subscription_expiry BETWEEN $1 AND $2 AND license_status = 'trial'`,
        [in1d, in3d]
      ),
      adminQuery(
        `SELECT id, email, first_name, last_name, subscription_plan, subscription_expiry, license_status
         FROM users WHERE subscription_expiry BETWEEN $1 AND $2 AND license_status = 'trial'`,
        [in3d, in7d]
      ),
      adminQuery(
        `SELECT id, email, first_name, last_name, subscription_plan, subscription_expiry, license_status
         FROM users WHERE subscription_expiry < $1 AND license_status = 'trial'`,
        [now]
      ),
      adminQuery(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN license_status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN license_status = 'trial' AND subscription_expiry > NOW() THEN 1 ELSE 0 END) as trial_active,
          SUM(CASE WHEN license_status = 'trial' AND subscription_expiry < NOW() THEN 1 ELSE 0 END) as expired
         FROM users`
      ),
    ]);

    return NextResponse.json({
      expiring: {
        in1d: expiring1d,
        in3d: expiring3d,
        in7d: expiring7d,
      },
      expired,
      stats: stats[0] || { total: 0, active: 0, trial_active: 0, expired: 0 },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

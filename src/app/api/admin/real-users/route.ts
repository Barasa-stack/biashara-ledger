import { NextResponse } from 'next/server';
import { adminQuery, adminRun, run, withTenantContext } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const users = await adminQuery(`
      SELECT id, email, first_name, last_name, role, subscription_plan, subscription_status,
             license_key, license_status, subscription_expiry, verified, created_at, country
      FROM users ORDER BY created_at DESC
    `);
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const { action, userId, email } = await req.json();

    if (action === 'revoke') {
      await adminRun(
        `UPDATE users SET license_status = 'revoked', license_key = NULL WHERE id = $1`,
        [userId]
      );
      return NextResponse.json({ success: true, message: 'License revoked' });
    }

    if (action === 'reactivate') {
      await adminRun(
        `UPDATE users SET license_status = 'active', subscription_status = 'active' WHERE id = $1`,
        [userId]
      );
      return NextResponse.json({ success: true, message: 'User reactivated' });
    }

    if (action === 'delete') {
      const user = await adminQuery(`SELECT tenant_id FROM users WHERE id = $1`, [userId]) as any;
      const tenantId = user?.[0]?.tenant_id;
      if (tenantId) {
        await withTenantContext(tenantId, async () => {
          await run(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
          await run(`DELETE FROM users WHERE id = $1`, [userId]);
        });
      } else {
        await adminRun(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
        await adminRun(`DELETE FROM users WHERE id = $1`, [userId]);
      }
      return NextResponse.json({ success: true, message: 'User deleted' });
    }

    if (action === 'extend_trial') {
      const { days } = await req.json();
      const targetUser = await adminQuery(`SELECT tenant_id FROM users WHERE id = $1`, [userId]) as any;
      const tenantId = targetUser?.[0]?.tenant_id;
      if (tenantId) {
        await withTenantContext(tenantId, async () => {
          await run(
            `UPDATE users SET subscription_expiry = COALESCE(subscription_expiry, NOW()) + INTERVAL '1 day' * $1, license_status = 'trial' WHERE id = $2`,
            [days || 7, userId]
          );
        });
      } else {
        await adminRun(
          `UPDATE users SET subscription_expiry = COALESCE(subscription_expiry, NOW()) + INTERVAL '1 day' * $1, license_status = 'trial' WHERE id = $2`,
          [days || 7, userId]
        );
      }
      return NextResponse.json({ success: true, message: `Trial extended by ${days || 7} days` });
    }

    if (action === 'update') {
      const { first_name, last_name, role, subscription_plan } = await req.json();
      await adminRun(
        `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), role = COALESCE($3, role), subscription_plan = COALESCE($4, subscription_plan) WHERE id = $5`,
        [first_name || null, last_name || null, role || null, subscription_plan || null, userId]
      );
      return NextResponse.json({ success: true, message: 'User updated' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Action failed: ' + (err?.message || '') }, { status: 500 });
  }
}

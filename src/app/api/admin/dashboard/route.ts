import { NextResponse } from 'next/server';
import { adminQuery } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

    const [revenueResult, clientCounts, licenseCounts, notificationCounts, lastUpdate] = await Promise.all([
      adminQuery(`
        SELECT
          COALESCE((SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date::text >= $1), 0) as revenue_today,
          COALESCE((SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date::text >= $2), 0) as revenue_month,
          COALESCE((SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date::text >= $3), 0) as revenue_year,
          COALESCE((SELECT COALESCE(SUM(amount), 0) FROM billing_history WHERE created_at::date >= $2), 0) as billing_month
      `, [today, monthStart, yearStart]),
      adminQuery(`
        SELECT
          (SELECT COUNT(*) FROM admin_clients) as total_clients,
          (SELECT COUNT(*) FROM admin_clients WHERE is_active = true) as active_clients,
          (SELECT COUNT(*) FROM admin_clients WHERE is_trial = true) as trial_clients,
          (SELECT COUNT(*) FROM admin_clients WHERE created_at >= $1) as new_this_week,
          (SELECT COUNT(*) FROM admin_clients WHERE plan = 'basic' OR (plan IS NULL AND is_trial = false)) as basic_plan,
          (SELECT COUNT(*) FROM admin_clients WHERE plan = 'standard') as standard_plan,
          (SELECT COUNT(*) FROM admin_clients WHERE plan = 'premium') as premium_plan
      `, [new Date(Date.now() - 7 * 86400000).toISOString()]),
      adminQuery(`
        SELECT
          (SELECT COUNT(*) FROM admin_license_keys) as total_licenses,
          (SELECT COUNT(*) FROM admin_license_keys WHERE is_active = true) as active_licenses,
          (SELECT COUNT(*) FROM admin_license_keys WHERE is_active = false) as expired_licenses,
          (SELECT COUNT(*) FROM admin_license_keys WHERE is_active = true AND expires_at < NOW() + INTERVAL '7 days') as expiring_soon
      `),
      adminQuery(`
        SELECT COUNT(*) as unread FROM admin_notifications WHERE is_read = 0
      `),
      adminQuery(`
        SELECT version, release_date FROM app_updates ORDER BY created_at DESC LIMIT 1
      `),
    ]);

    const revenue = revenueResult[0] || { revenue_today: 0, revenue_month: 0, revenue_year: 0, billing_month: 0 };
    const clients = clientCounts[0] || {};
    const licenses = licenseCounts[0] || {};
    const unreadCount = notificationCounts[0]?.unread || 0;
    const latestUpdate = lastUpdate[0] || null;

    const lastMonthRevenue = await adminQuery(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date::text >= $1 AND payment_date::text < $2`,
      [new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0], monthStart]
    );
    const prevMonth = lastMonthRevenue[0]?.total || 0;
    const monthlyGrowth = prevMonth > 0 ? ((parseFloat(revenue.revenue_month) - parseFloat(prevMonth)) / parseFloat(prevMonth)) * 100 : 0;

    const activity = await adminQuery(`
      SELECT * FROM (
        SELECT 'license_generated' as type, 'License generated' as action, alk.license_key as entity, ac.company_name as client_name, alk.created_at
        FROM admin_license_keys alk LEFT JOIN admin_clients ac ON alk.client_id = ac.id
        WHERE alk.created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT 'client_created' as type, 'Client registered' as action, ac.company_name as entity, ac.company_name as client_name, ac.created_at
        FROM admin_clients ac
        WHERE ac.created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT 'update_published' as type, 'Update published' as action, au.version as entity, '' as client_name, au.created_at
        FROM app_updates au
        WHERE au.created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT 'license_revoked' as type, 'License revoked' as action, lh.license_id::text as entity, ac.company_name as client_name, lh.created_at
        FROM license_history lh LEFT JOIN admin_clients ac ON lh.client_id = ac.id
        WHERE lh.action = 'revoke' AND lh.created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT 'session_activated' as type, 'Offline session activated' as action, os.user_email as entity, ac.company_name as client_name, os.activated_at
        FROM offline_sessions os LEFT JOIN admin_clients ac ON os.client_id = ac.id
        WHERE os.activated_at >= NOW() - INTERVAL '30 days'
      ) sub ORDER BY created_at DESC LIMIT 20
    `);

    return NextResponse.json({
      revenue: {
        today: parseFloat(revenue.revenue_today),
        month: parseFloat(revenue.revenue_month),
        year: parseFloat(revenue.revenue_year),
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
        billingMonth: parseFloat(revenue.billing_month),
      },
      clients: {
        total: parseInt(clients.total_clients) || 0,
        active: parseInt(clients.active_clients) || 0,
        trial: parseInt(clients.trial_clients) || 0,
        newThisWeek: parseInt(clients.new_this_week) || 0,
        basicPlan: parseInt(clients.basic_plan) || 0,
        standardPlan: parseInt(clients.standard_plan) || 0,
        premiumPlan: parseInt(clients.premium_plan) || 0,
      },
      licenses: {
        total: parseInt(licenses.total_licenses) || 0,
        active: parseInt(licenses.active_licenses) || 0,
        expired: parseInt(licenses.expired_licenses) || 0,
        expiringSoon: parseInt(licenses.expiring_soon) || 0,
      },
      unreadNotifications: unreadCount,
      latestVersion: latestUpdate?.version || null,
      activity: activity.map((a: any) => ({
        type: a.type,
        action: a.action,
        entity: a.entity || '',
        client_name: a.client_name || '',
        created_at: a.created_at,
      })),
    });
  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}

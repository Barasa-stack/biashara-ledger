import { query, get, run, withTenantContext } from './db';
import { getSessionFromCookies } from './auth-server';
import { normalizePlan } from './feature-gate';

const GRACE_PERIOD_DAYS = 3;
const TRIAL_DAYS = 3;
const EXPIRY_WARNING_DAYS = 7;

export async function logSubscriptionEvent(userId: string, eventType: string, description: string, metadata: Record<string, any> = {}, tenantId?: string) {
  await run(
    'INSERT INTO subscription_events (tenant_id, user_id, event_type, description, metadata) VALUES ($1, $2, $3, $4, $5)',
    [tenantId || null, userId, eventType, description, JSON.stringify(metadata)]
  );
}

export async function requireAuth() {
  const session = await getSessionFromCookies();
  if (!session) {
    throw new AuthError('Authentication required', 'UNAUTHORIZED');
  }
  return session;
}

export async function requireSubscription() {
  const session = await requireAuth();

  if (!session.verified) {
    throw new AuthError('Email not verified', 'EMAIL_NOT_VERIFIED');
  }

  const expiry = session.subscription_expiry ? new Date(session.subscription_expiry) : null;
  const graceEnd = session.grace_period_end ? new Date(session.grace_period_end) : null;
  const now = new Date();

  if (expiry && expiry < now) {
    if (graceEnd && graceEnd > now) {
      return { session, active: true, gracePeriod: true, expiresAt: session.subscription_expiry };
    }
    await run('UPDATE users SET subscription_status = $1 WHERE id = $2', ['expired', session.user_id]);
    await run('UPDATE users SET grace_period_end = $1 WHERE id = $2', [
      new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      session.user_id,
    ]);
    await logSubscriptionEvent(session.user_id, 'expired', 'Subscription expired, grace period started', {}, session.tenant_id);
    throw new AuthError('Your subscription has expired. Renew within the grace period to restore access.', 'SUBSCRIPTION_EXPIRED');
  }

  if (session.subscription_status !== 'active' && session.subscription_status !== 'trial') {
    throw new AuthError('Your subscription is not active. Please renew.', 'SUBSCRIPTION_INACTIVE');
  }

  if (expiry) {
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= EXPIRY_WARNING_DAYS && daysUntilExpiry > 0) {
      const lastReminder = session.last_reminder_sent ? new Date(session.last_reminder_sent) : null;
      if (!lastReminder || (now.getTime() - lastReminder.getTime()) > 24 * 60 * 60 * 1000) {
        await run('UPDATE users SET last_reminder_sent = $1 WHERE id = $2', [
          now.toISOString(), session.user_id,
        ]);
        await logSubscriptionEvent(session.user_id, 'expiry_warning', `Subscription expires in ${daysUntilExpiry} days`, {}, session.tenant_id);
      }
    }
  }

  return { session, active: true, gracePeriod: false, expiresAt: session.subscription_expiry };
}

export async function requireRole(...allowedRoles: string[]) {
  const { session } = await requireSubscription();
  const user = await withTenantContext(session.tenant_id!, async () => {
    return await get<{ role: string }>('SELECT role FROM users WHERE id = $1', [session.user_id]);
  });
  const effectiveRole = user?.role || 'admin';
  if (effectiveRole === 'admin' || effectiveRole === 'super_admin') return { session, role: effectiveRole };
  if (!allowedRoles.includes(effectiveRole)) {
    throw new AuthError('You do not have permission to access this resource', 'FORBIDDEN');
  }
  return { session, role: effectiveRole };
}

export async function hasPermission(role: string, permission: string): Promise<boolean> {
  const roleRow = await get<{ permissions: string }>('SELECT permissions FROM roles WHERE name = $1', [role]);
  if (!roleRow) return false;
  const perms = JSON.parse(roleRow.permissions);
  return perms.includes('all') || perms.includes(permission);
}

export async function getBillingHistory(userId: string) {
  return query(
    'SELECT * FROM billing_history WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
}

export async function getSubscriptionEvents(userId: string, limit = 20) {
  return query(
    'SELECT * FROM subscription_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );
}

export async function getSubscriptionStatus(userId: string) {
  const user = await get(
    'SELECT id, email, subscription_plan, subscription_status, subscription_expiry, role, grace_period_end FROM users WHERE id = $1',
    [userId]
  );
  if (!user) return null;
  const u = user as any;

  const expiry = user.subscription_expiry ? new Date(user.subscription_expiry) : null;
  const now = new Date();
  const daysUntilExpiry = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const inGracePeriod = user.grace_period_end ? new Date(user.grace_period_end) > now : false;

  const billing = await getBillingHistory(userId);
  const events = await getSubscriptionEvents(userId, 10);

  return {
    ...u,
    daysUntilExpiry,
    inGracePeriod,
    isExpiringSoon: daysUntilExpiry !== null && daysUntilExpiry <= EXPIRY_WARNING_DAYS && daysUntilExpiry > 0,
    gracePeriodEnd: u.grace_period_end,
    billingHistory: billing,
    recentEvents: events,
  };
}

export async function createTrialSubscription(userId: string) {
  const expiry = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await run(
    'UPDATE users SET subscription_plan = $1, subscription_status = $2, subscription_expiry = $3, verified = $4 WHERE id = $5',
    ['trial', 'active', expiry, 1, userId]
  );
  await logSubscriptionEvent(userId, 'trial_started', '3-day trial started', { expiresAt: expiry });
}

export async function activateSubscription(userId: string, planName: string, durationDays: number, paymentMethod: string = 'mpesa', transactionId: string = '', tenantId: string = '', allowedModules: string[] = []) {
  const normalizedPlan = normalizePlan(planName);
  const now = new Date();
  const periodStart = now.toISOString();
  const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const modulesJson = normalizedPlan === 'custom' && allowedModules.length > 0 ? JSON.stringify(allowedModules) : '[]';

  await run(
    'UPDATE users SET subscription_plan = $1, subscription_status = $2, subscription_expiry = $3, grace_period_end = NULL, allowed_modules = $4 WHERE id = $5',
    [normalizedPlan, 'active', periodEnd, modulesJson, userId]
  );

  await run(
    'INSERT INTO billing_history (tenant_id, user_id, amount, plan_name, payment_method, transaction_id, period_start, period_end) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [tenantId, userId, getPlanPrice(normalizedPlan), normalizedPlan, paymentMethod, transactionId, periodStart, periodEnd]
  );

  await logSubscriptionEvent(userId, 'subscription_activated', `${normalizedPlan} plan activated`, {
    plan: normalizedPlan, durationDays, periodStart, periodEnd, modules: modulesJson,
  }, tenantId);
}

function getPlanPrice(planName: string): number {
  const prices: Record<string, number> = {
    Basic: 5,
    Standard: 10,
    Premium: 15,
    custom: 0,
  };
  return prices[planName] || 0;
}

export class AuthError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'AuthError';
  }
}

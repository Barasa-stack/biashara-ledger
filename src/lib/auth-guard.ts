import { query, get, run, insertReturning } from './db';
import { getSessionFromCookies } from './auth-server';

const GRACE_PERIOD_DAYS = 3;
const TRIAL_DAYS = 14;
const EXPIRY_WARNING_DAYS = 7;

export async function logSubscriptionEvent(userId: number, eventType: string, description: string, metadata: Record<string, any> = {}) {
  await run(
    'INSERT INTO subscription_events (user_id, event_type, description, metadata) VALUES ($1, $2, $3, $4)',
    [userId, eventType, description, JSON.stringify(metadata)]
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
    await logSubscriptionEvent(session.user_id, 'expired', 'Subscription expired, grace period started');
    throw new AuthError('Your subscription has expired. Renew within the grace period to restore access.', 'SUBSCRIPTION_EXPIRED');
  }

  if (session.subscription_status !== 'active') {
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
        await logSubscriptionEvent(session.user_id, 'expiry_warning', `Subscription expires in ${daysUntilExpiry} days`);
      }
    }
  }

  return { session, active: true, gracePeriod: false, expiresAt: session.subscription_expiry };
}

export async function requireRole(...allowedRoles: string[]) {
  const { session } = await requireSubscription();
  const user = await get<{ role: string }>('SELECT role FROM users WHERE id = $1', [session.user_id]);
  const role = user?.role || 'admin';
  if (role === 'admin') return { session, role };
  if (!allowedRoles.includes(role)) {
    throw new AuthError('You do not have permission to access this resource', 'FORBIDDEN');
  }
  return { session, role };
}

export async function hasPermission(role: string, permission: string): Promise<boolean> {
  const roleRow = await get<{ permissions: string }>('SELECT permissions FROM roles WHERE name = $1', [role]);
  if (!roleRow) return false;
  const perms = JSON.parse(roleRow.permissions);
  return perms.includes('all') || perms.includes(permission);
}

export async function getBillingHistory(userId: number) {
  return query(
    'SELECT * FROM billing_history WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
}

export async function getSubscriptionEvents(userId: number, limit = 20) {
  return query(
    'SELECT * FROM subscription_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );
}

export async function getSubscriptionStatus(userId: number) {
  const user = await get(
    'SELECT id, email, subscription_plan, subscription_status, subscription_expiry, role, grace_period_end FROM users WHERE id = $1',
    [userId]
  ) as any;
  if (!user) return null;

  const expiry = user.subscription_expiry ? new Date(user.subscription_expiry) : null;
  const now = new Date();
  const daysUntilExpiry = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const inGracePeriod = user.grace_period_end ? new Date(user.grace_period_end) > now : false;

  const billing = await getBillingHistory(userId);
  const events = await getSubscriptionEvents(userId, 10);

  return {
    ...user,
    daysUntilExpiry,
    inGracePeriod,
    isExpiringSoon: daysUntilExpiry !== null && daysUntilExpiry <= EXPIRY_WARNING_DAYS && daysUntilExpiry > 0,
    gracePeriodEnd: user.grace_period_end,
    billingHistory: billing,
    recentEvents: events,
  };
}

export async function createTrialSubscription(userId: number) {
  const expiry = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await run(
    'UPDATE users SET subscription_plan = $1, subscription_status = $2, subscription_expiry = $3, verified = $4 WHERE id = $5',
    ['trial', 'active', expiry, 1, userId]
  );
  await logSubscriptionEvent(userId, 'trial_started', '14-day trial started', { expiresAt: expiry });
}

export async function activateSubscription(userId: number, planName: string, durationDays: number, paymentMethod: string = 'mpesa', transactionId: string = '') {
  const now = new Date();
  const periodStart = now.toISOString();
  const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  await run(
    'UPDATE users SET subscription_plan = $1, subscription_status = $2, subscription_expiry = $3, grace_period_end = NULL WHERE id = $4',
    [planName, 'active', periodEnd, userId]
  );

  await run(
    'INSERT INTO billing_history (user_id, amount, plan_name, payment_method, transaction_id, period_start, period_end) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [userId, getPlanPrice(planName), planName, paymentMethod, transactionId, periodStart, periodEnd]
  );

  await logSubscriptionEvent(userId, 'subscription_activated', `${planName} plan activated`, {
    plan: planName, durationDays, periodStart, periodEnd,
  });
}

function getPlanPrice(planName: string): number {
  const prices: Record<string, number> = {
    Basic: 1500,
    Standard: 3000,
    Premium: 5000,
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

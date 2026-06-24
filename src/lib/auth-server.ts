import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { query, get, run } from './db';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(): string {
  return randomUUID();
}

export async function createSession(userId: number): Promise<{ token: string; expiresAt: string }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  await run(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
  return { token, expiresAt };
}

export async function getSession(token: string) {
  const session = await get(
    `SELECT s.id as session_id, s.token, s.expires_at,
            u.id as user_id, u.email, u.first_name, u.last_name, u.phone,
            u.subscription_plan, u.subscription_status,
            u.verified, u.subscription_expiry,
            u.grace_period_end, u.last_reminder_sent, u.role
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  );
  return session || null;
}

export async function deleteSession(token: string) {
  await run('DELETE FROM sessions WHERE token = $1', [token]);
}

export async function deleteExpiredSessions() {
  await run("DELETE FROM sessions WHERE expires_at <= NOW()");
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get('bl_session')?.value;
  if (!token) return null;
  return getSession(token);
}

export async function checkUserSubscription(user: {
  id?: number;
  user_id?: number;
  verified?: number;
  subscription_status?: string;
  subscription_expiry?: string;
}): Promise<{ active: boolean; reason?: string }> {
  if (!user.verified) {
    return { active: false, reason: 'Email not verified' };
  }
  if (user.subscription_expiry) {
    const expiry = new Date(user.subscription_expiry);
    if (expiry < new Date()) {
      const userId = user.user_id ?? user.id;
      if (userId) {
        await run('UPDATE users SET subscription_status = $1 WHERE id = $2', ['expired', userId]);
      }
      return { active: false, reason: 'Your subscription has expired. Please renew.' };
    }
  }
  if (user.subscription_status !== 'active') {
    return { active: false, reason: 'Your subscription is not active. Please renew.' };
  }
  return { active: true };
}

export async function checkFeatureAccess(user: {
  subscription_plan?: string;
  role?: string;
}): Promise<{ canAccess: (feature: string) => boolean; plan: string; role: string }> {
  const plan = user.subscription_plan || 'trial';
  const role = user.role || 'employee';

  const rolePermissions = await getRolePermissions(role);

  const featureAccess = (feature: string): boolean => {
    if (rolePermissions.includes('all')) return true;
    if (rolePermissions.includes(feature)) return true;

    if (plan === 'trial') return false;
    if (plan === 'Basic') {
      return ['bookkeeping', 'profitLoss', 'balanceSheet', 'trialBalance'].includes(feature);
    }
    if (plan === 'Standard') {
      return ['bookkeeping', 'profitLoss', 'balanceSheet', 'trialBalance', 'hrPayroll', 'generalLedger', 'expenseReport'].includes(feature);
    }
    if (plan === 'Premium') {
      return true;
    }
    return false;
  };

  return { canAccess: featureAccess, plan, role };
}

async function getRolePermissions(role: string): Promise<string[]> {
  const row = await get<{ permissions: string }>('SELECT permissions FROM roles WHERE name = $1', [role]);
  return row ? JSON.parse(row.permissions) : [];
}

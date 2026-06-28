import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { query, get, run, adminQuery, adminGet, adminRun, getOrCreatePool } from './db';

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

export async function createSession(userId: number, clientDb?: string): Promise<{ token: string; expiresAt: string }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  await adminRun(
    'INSERT INTO sessions (user_id, token, expires_at, client_db) VALUES ($1, $2, $3, $4)',
    [userId, token, expiresAt, clientDb || '']
  );
  return { token, expiresAt };
}

export async function getSession(token: string) {
  const row = await adminGet(
    'SELECT id, user_id, token, expires_at, client_db FROM sessions WHERE token = $1 AND expires_at > NOW()',
    [token]
  );
  if (!row) return null;

  const s = row as any;

  if (s.client_db) {
    const pool = getOrCreatePool(5, s.client_db);
    const userResult = await pool.query(
      `SELECT id as user_id, email, first_name, last_name, phone,
              subscription_plan, subscription_status,
              verified, subscription_expiry,
              grace_period_end, last_reminder_sent, role
       FROM users WHERE id = $1`,
      [s.user_id]
    );
    if (userResult.rows.length === 0) return null;
    const u = userResult.rows[0];
    return {
      session_id: s.id,
      token: s.token,
      expires_at: s.expires_at,
      client_db: s.client_db,
      user_id: u.user_id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      phone: u.phone,
      subscription_plan: u.subscription_plan,
      subscription_status: u.subscription_status,
      verified: u.verified,
      subscription_expiry: u.subscription_expiry,
      grace_period_end: u.grace_period_end,
      last_reminder_sent: u.last_reminder_sent,
      role: u.role,
    };
  }

  const session = await adminGet(
    `SELECT s.id as session_id, s.token, s.expires_at, s.client_db,
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
  const row = await adminGet('SELECT client_db FROM sessions WHERE token = $1', [token]);
  await adminRun('DELETE FROM sessions WHERE token = $1', [token]);
  if (row && (row as any).client_db) {
    const pool = getOrCreatePool(5, (row as any).client_db);
    pool.query('DELETE FROM sessions WHERE token = $1', [token]).catch(() => {});
  }
}

export async function deleteExpiredSessions() {
  await adminRun("DELETE FROM sessions WHERE expires_at <= NOW()");
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

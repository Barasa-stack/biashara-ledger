import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { get, run, adminGet, adminRun, withTenantContext } from './db';
import { normalizePlan, isFeatureAvailable } from './feature-gate';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const sessionCache = new Map<string, { data: any; expiresAt: number }>();
const SESSION_CACHE_TTL_MS = 120_000; // 2 minutes

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return randomUUID();
}

export async function createSession(userId: string, tenantId: string): Promise<{ token: string; expiresAt: string }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  await withTenantContext(tenantId, async () => {
    await run(
      'INSERT INTO sessions (tenant_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [tenantId, userId, token, expiresAt]
    );
  });
  return { token, expiresAt };
}

export async function getSession(token: string) {
  const now = Date.now();
  const cached = sessionCache.get(token);
  if (cached && cached.expiresAt > now) return cached.data;

  const session = await adminGet(
    `SELECT COALESCE(u.tenant_id, s.tenant_id) as tenant_id, s.id as session_id, s.token, s.expires_at,
            u.id as user_id, u.email, u.first_name, u.last_name, u.phone, u.country,
            u.subscription_plan, u.subscription_status,
            u.verified, u.subscription_expiry,
            u.grace_period_end, u.last_reminder_sent, u.role, u.license_status,
            u.trial_end_date, u.trial_used,
            u.allowed_modules
     FROM sessions s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [token]
  );

  const data = session || null;
  if (data) {
    sessionCache.set(token, { data, expiresAt: now + SESSION_CACHE_TTL_MS });
  }
  return data;
}

export async function deleteSession(token: string) {
  sessionCache.delete(token);
  await adminRun('DELETE FROM sessions WHERE token = $1', [token]);
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
  id?: string;
  user_id?: string;
  verified?: number;
  subscription_status?: string;
  subscription_expiry?: string;
  license_status?: string;
}): Promise<{ active: boolean; reason?: string }> {
  if (!user.verified) {
    return { active: false, reason: 'Email not verified' };
  }

  if (user.license_status === 'active') {
    return { active: true };
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
  if (user.subscription_status !== 'active' && user.subscription_status !== 'trial') {
    return { active: false, reason: 'Your subscription is not active. Please renew.' };
  }
  return { active: true };
}

export async function getRolePermissions(role: string): Promise<string[]> {
  const row = await get<{ permissions: string }>('SELECT permissions FROM roles WHERE name = $1', [role]);
  return row ? JSON.parse(row.permissions) : [];
}

export function checkFeatureAccess(user: {
  subscription_plan?: string;
  role?: string;
  allowed_modules?: string;
}): { canAccess: (feature: string) => boolean; plan: string; role: string; allowedModules: string[] } {
  const plan = normalizePlan(user.subscription_plan);
  const role = user.role || 'employee';

  let allowedModules: string[] = [];
  if (plan === 'custom' && user.allowed_modules) {
    try { allowedModules = JSON.parse(user.allowed_modules); } catch { allowedModules = []; }
  }

  const featureAccess = (feature: string): boolean => {
    return isFeatureAvailable(feature, plan, allowedModules);
  };

  return { canAccess: featureAccess, plan, role, allowedModules };
}

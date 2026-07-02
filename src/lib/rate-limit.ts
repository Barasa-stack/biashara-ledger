import { adminQuery, adminRun } from './db';

const inMemoryMap = new Map<string, { count: number; resetAt: number }>();
let dbAvailable = true;

export async function checkRateLimit(key: string, max: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
  if (dbAvailable) {
    try {
      return await dbCheckRateLimit(key, max, windowMs);
    } catch {
      dbAvailable = false;
    }
  }
  return memoryCheckRateLimit(key, max, windowMs);
}

async function dbCheckRateLimit(key: string, max: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  await adminRun(
    `INSERT INTO rate_limits (key, expires_at) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.expires_at < NOW() THEN 1 ELSE rate_limits.count + 1 END,
       expires_at = CASE WHEN rate_limits.expires_at < NOW() THEN $2 ELSE rate_limits.expires_at END,
       updated_at = NOW()`,
    [key, new Date(now.getTime() + windowMs)]
  );

  const rows = await adminQuery<{ count: number }>(
    `SELECT count FROM rate_limits WHERE key = $1 AND expires_at > NOW()`,
    [key]
  );

  const currentCount = rows[0]?.count ?? 0;
  const allowed = currentCount <= max;

  return { allowed, remaining: Math.max(0, max - currentCount) };
}

function memoryCheckRateLimit(key: string, max: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = inMemoryMap.get(key);
  if (!entry || now > entry.resetAt) {
    inMemoryMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }
  if (entry.count >= max) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: max - entry.count };
}

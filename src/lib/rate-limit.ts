/**
 * In-memory rate limiter.
 * NOTE: Resets on server restart and is NOT shared across workers/instances.
 * For production deployments with multiple instances, replace with a
 * database-backed or Redis-based rate limiter (e.g., using the sessions table
 * or an external store).
 */
const rateMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, max: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }
  if (entry.count >= max) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: max - entry.count };
}

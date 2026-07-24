import { adminRun, adminQuery, adminGet } from './db';

type LoginInfo = {
  userId: string;
  email: string;
  ip: string;
  userAgent: string;
  deviceFingerprint?: string;
  deviceInfo?: string;
  loginMethod?: string;
  sessionToken: string;
};

export async function recordLogin(info: LoginInfo) {
  try {
    await adminRun(
      `INSERT INTO login_history (user_id, email, ip_address, user_agent, device_fingerprint, device_info, login_method, session_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [info.userId, info.email, info.ip, info.userAgent, info.deviceFingerprint || '', info.deviceInfo || '', info.loginMethod || 'web', info.sessionToken]
    );
  } catch (err) {
    console.error('tracking: failed to record login', err);
  }
}

export async function recordActiveTime(userId: string, email: string, sessionToken: string, ip: string, activeSeconds: number) {
  try {
    const existing = await adminGet(
      `SELECT id, active_seconds FROM session_activity WHERE session_token = $1 AND user_id = $2`,
      [sessionToken, userId]
    );
    if (existing) {
      await adminRun(
        `UPDATE session_activity SET active_seconds = $1, last_active_at = NOW(), ip_address = $2 WHERE id = $3`,
        [existing.active_seconds + activeSeconds, ip, existing.id]
      );
    } else {
      await adminRun(
        `INSERT INTO session_activity (user_id, email, session_token, ip_address, active_seconds)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, email, sessionToken, ip, activeSeconds]
      );
    }
  } catch (err) {
    console.error('tracking: failed to record active time', err);
  }
}

export async function recordLogout(sessionToken: string) {
  try {
    await adminRun(
      `UPDATE login_history SET logout_at = NOW() WHERE session_token = $1 AND logout_at IS NULL`,
      [sessionToken]
    );
  } catch (err) {
    console.error('tracking: failed to record logout', err);
  }
}

export async function measureStorageUsage() {
  try {
    const tenants = await adminQuery(`SELECT id, name FROM tenants`);
    for (const tenant of tenants) {
      let totalBytes = 0;
      try {
        const dbSize = await adminQuery(
          `SELECT COUNT(*) as row_count, COUNT(*) * 8192 as est_bytes FROM users WHERE tenant_id = $1`,
          [tenant.id]
        );
        totalBytes += parseInt(dbSize[0]?.est_bytes || '0');
      } catch { /* best-effort */ }
      try {
        await adminRun(
          `INSERT INTO storage_usage (tenant_id, email, database_size_bytes, tables_size_bytes, measured_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [tenant.id, tenant.name || '', totalBytes, totalBytes]
        );
      } catch { /* best-effort */ }
    }
  } catch (err) {
    console.error('tracking: failed to measure storage', err);
  }
}

export async function getLoginHistory(userId: string, limit = 50) {
  try {
    return await adminQuery(
      `SELECT id, email, ip_address, user_agent, device_fingerprint, device_info, login_method, login_at, logout_at
       FROM login_history WHERE user_id = $1 ORDER BY login_at DESC LIMIT $2`,
      [userId, limit]
    );
  } catch (err) {
    console.error('tracking: failed to get login history', err);
    return [];
  }
}

export async function getSessionActivity(userId: string) {
  try {
    return await adminQuery(
      `SELECT id, email, session_token, ip_address, last_active_at, active_seconds
       FROM session_activity WHERE user_id = $1 ORDER BY last_active_at DESC LIMIT 50`,
      [userId]
    );
  } catch (err) {
    console.error('tracking: failed to get session activity', err);
    return [];
  }
}

export async function getTotalActiveHours(userId: string) {
  try {
    const row = await adminGet(
      `SELECT COALESCE(SUM(active_seconds), 0) as total_seconds FROM session_activity WHERE user_id = $1`,
      [userId]
    );
    return Math.floor((parseInt(row?.total_seconds || '0')) / 3600);
  } catch {
    return 0;
  }
}

export async function getStorageUsage(tenantId: string) {
  try {
    return await adminQuery(
      `SELECT database_size_bytes, tables_size_bytes, measured_at
       FROM storage_usage WHERE tenant_id = $1 ORDER BY measured_at DESC LIMIT 1`,
      [tenantId]
    );
  } catch {
    return [];
  }
}

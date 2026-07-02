import { NextResponse } from 'next/server';
import { adminGet, adminRun } from '@/lib/db';
import { heartbeatOfflineSession, renewOfflineSession } from '@/lib/offline-session';

export async function POST(request: Request) {
  try {
    const {
      sessionToken,
      licenseKey,
      hardwareFingerprint,
      appVersion,
      platform,
      data,
    } = await request.json();

    if (!sessionToken && !licenseKey) {
      return NextResponse.json({ error: 'Session token or license key required' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    let sessionResult: any = { success: true, valid: true };

    if (sessionToken) {
      sessionResult = await heartbeatOfflineSession(sessionToken, ip);
    } else if (licenseKey) {
      const session = await adminGet(
        'SELECT session_token FROM offline_sessions WHERE license_key = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
        [licenseKey, 'active']
      );
      if (session) {
        sessionResult = await heartbeatOfflineSession(
          (session as any).session_token,
          ip
        );
      } else {
        return NextResponse.json({
          success: false,
          error: 'No active session found. Please reactivate.',
          needsReactivation: true,
        });
      }
    }

    if (data) {
      await adminRun(
        `INSERT INTO electron_activity (license_key, action, data, ip_address, session_token, hardware_fingerprint)
         VALUES ($1, 'heartbeat', $2, $3, $4, $5)`,
        [
          licenseKey || '',
          JSON.stringify({ appVersion, platform, ...data, timestamp: new Date().toISOString() }),
          ip,
          sessionToken || '',
          hardwareFingerprint || '',
        ]
      );
    }

    const latestUpdate = await adminGet(
      'SELECT version, changes, release_date FROM app_updates ORDER BY created_at DESC LIMIT 1'
    );

    let needsRenewal = false;
    if (sessionResult.daysRemaining !== undefined && sessionResult.daysRemaining <= 1) {
      needsRenewal = true;
    }

    return NextResponse.json({
      success: sessionResult.success,
      valid: sessionResult.valid,
      serverTime: new Date().toISOString(),
      daysRemaining: sessionResult.daysRemaining,
      needsRenewal,
      needsReactivation: sessionResult.needsReactivation || false,
      sessionExpiresAt: sessionResult.expiresAt,
      updateAvailable: latestUpdate ? {
        version: (latestUpdate as any).version,
        changes: (latestUpdate as any).changes,
        releaseDate: (latestUpdate as any).release_date,
      } : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Heartbeat failed' }, { status: 500 });
  }
}

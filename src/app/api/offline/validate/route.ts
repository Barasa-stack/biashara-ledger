import { NextResponse } from 'next/server';
import { validateOfflineSession, heartbeatOfflineSession } from '@/lib/offline-session';

export async function POST(request: Request) {
  try {
    const { sessionToken, hardwareFingerprint, ipAddress } = await request.json();

    if (!sessionToken) {
      return NextResponse.json({ valid: false, reason: 'Session token required' }, { status: 400 });
    }

    const result = await validateOfflineSession(sessionToken);
    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        reason: result.reason,
        needsReactivation: true,
      }, { status: 200 });
    }

    if (hardwareFingerprint && result.session) {
      const storedHw = result.session.hardware_fingerprint;
      if (storedHw && storedHw !== hardwareFingerprint) {
        return NextResponse.json({
          valid: false,
          reason: 'Hardware fingerprint mismatch',
          needsReactivation: true,
        }, { status: 200 });
      }
    }

    const heartbeat = await heartbeatOfflineSession(sessionToken, ipAddress);

    return NextResponse.json({
      valid: true,
      daysRemaining: result.daysRemaining,
      needsRenewal: (result.daysRemaining || 0) <= 1,
      expiresAt: result.session?.expires_at,
      companyName: result.session?.company_name,
      databaseName: result.session?.database_name,
      lastHeartbeat: result.session?.last_heartbeat,
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false, reason: err.message }, { status: 500 });
  }
}

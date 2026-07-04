import { NextResponse } from 'next/server';
import { validateOfflineSession, renewOfflineSession } from '@/lib/offline-session';

export async function POST(req: Request) {
  try {
    const { sessionToken, hardwareFingerprint } = await req.json();

    if (!sessionToken) {
      return NextResponse.json({ valid: false, reason: 'Session token required' }, { status: 400 });
    }

    const result = await validateOfflineSession(sessionToken);

    if (!result.valid) {
      return NextResponse.json({ valid: false, reason: result.reason || 'Session invalid' });
    }

    if (result.daysRemaining !== undefined && result.daysRemaining <= 1) {
      const renewal = await renewOfflineSession(sessionToken);
      if (renewal.success && renewal.expiresAt) {
        return NextResponse.json({
          valid: true,
          expiresAt: renewal.expiresAt,
          daysRemaining: Math.ceil((new Date(renewal.expiresAt).getTime() - Date.now()) / 86400000),
          renewed: true,
        });
      }
    }

    return NextResponse.json({
      valid: true,
      expiresAt: result.session?.expires_at,
      daysRemaining: result.daysRemaining,
    });
  } catch (err: any) {
    console.error('[offline/validate]', err?.message || err);
    return NextResponse.json({ valid: false, reason: 'Validation error' }, { status: 500 });
  }
}

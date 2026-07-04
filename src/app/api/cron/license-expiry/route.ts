import { NextResponse } from 'next/server';
import { checkExpiringLicenses } from '@/lib/cron/check-expiring-licenses';
import { logInfo, logError } from '@/lib/logger';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logInfo('cron-api', 'Received license expiry check request');
    const result = await checkExpiringLicenses();
    return NextResponse.json({ success: true, ...(result || {}) });
  } catch (err: any) {
    logError('cron-api', 'License expiry check failed', { error: err.message });
    return NextResponse.json({ error: 'Check failed', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}

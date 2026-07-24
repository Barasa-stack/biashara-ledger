import { NextResponse } from 'next/server';
import { measureStorageUsage } from '@/lib/tracking';

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await measureStorageUsage();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('cron/measure-storage error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

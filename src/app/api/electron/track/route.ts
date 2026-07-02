import { NextResponse } from 'next/server';
import { adminRun } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { licenseKey, action, data } = await request.json();

    if (!licenseKey || !action) {
      return NextResponse.json({ error: 'License key and action are required' }, { status: 400 });
    }

    await adminRun(
      `INSERT INTO electron_activity (license_key, action, data, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [licenseKey, action, JSON.stringify(data || {})]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const licenseKey = searchParams.get('licenseKey');

  if (licenseKey) {
    const { adminQuery } = await import('@/lib/db');
    const activities = await adminQuery(
      'SELECT * FROM electron_activity WHERE license_key = $1 ORDER BY created_at DESC LIMIT 100',
      [licenseKey]
    );
    return NextResponse.json(activities);
  }

  return NextResponse.json({ error: 'License key required' }, { status: 400 });
}

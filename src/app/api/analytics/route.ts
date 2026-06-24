import { NextResponse } from 'next/server';
import { run } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { event, licenseId, appVersion, osVersion, data } = await request.json();
    if (!event) return NextResponse.json({ error: 'event is required' }, { status: 400 });

    await run(
      `INSERT INTO analytics (license_id, event, app_version, os_version, data, created_at) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [licenseId || null, event, appVersion || null, osVersion || null, JSON.stringify(data || {})]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

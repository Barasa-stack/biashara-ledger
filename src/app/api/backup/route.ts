import { NextResponse } from 'next/server';
import { adminQuery, adminGet, adminRun } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { licenseKey, data } = await request.json();

    if (!licenseKey || !data) {
      return NextResponse.json({ error: 'License key and data are required' }, { status: 400 });
    }

    await adminRun(
      `INSERT INTO backups (license_key, data, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [licenseKey, JSON.stringify(data)]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const licenseKey = searchParams.get('licenseKey');

  if (!licenseKey) {
    return NextResponse.json({ error: 'License key required' }, { status: 400 });
  }

  try {
    const backup = await adminGet(
      'SELECT * FROM backups WHERE license_key = $1 ORDER BY created_at DESC LIMIT 1',
      [licenseKey]
    );

    if (!backup) {
      return NextResponse.json({ error: 'No backup found' }, { status: 404 });
    }

    return NextResponse.json(backup);
  } catch (err: any) {
    return NextResponse.json({ error: 'Backup retrieval failed' }, { status: 500 });
  }
}

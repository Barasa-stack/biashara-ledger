import { NextResponse } from 'next/server';
import { adminRun, adminGet } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function POST(request: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const { version, changes, releaseDate } = await request.json();
    if (!version || !changes) {
      return NextResponse.json({ error: 'Version and changes are required' }, { status: 400 });
    }

    await adminRun(
      `INSERT INTO app_updates (version, changes, release_date, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [version, JSON.stringify(changes), releaseDate || new Date().toISOString()]
    );

    return NextResponse.json({ success: true, message: `Update v${version} published` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  const latest = await adminGet('SELECT * FROM app_updates ORDER BY created_at DESC LIMIT 1');
  return NextResponse.json(latest || { version: '0.0.0', changes: [], releaseDate: null });
}

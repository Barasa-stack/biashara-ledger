import { NextResponse } from 'next/server';
import { adminRun, adminQuery } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function POST(request: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const { version, changes, releaseDate, isMandatory } = await request.json();

    if (!version) {
      return NextResponse.json({ error: 'Version number is required' }, { status: 400 });
    }

    const changesPayload = JSON.stringify({
      release_notes: changes || '',
      is_mandatory: !!isMandatory,
    });

    await adminRun(
      `INSERT INTO app_updates (version, changes, release_date, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [version.trim(), changesPayload, releaseDate || new Date().toISOString()]
    );

    return NextResponse.json({
      success: true,
      message: `Update v${version} published`,
      update: { version, changes: changesPayload, release_date: releaseDate || new Date().toISOString() },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to publish update' }, { status: 500 });
  }
}

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const history = await adminQuery(
      'SELECT * FROM app_updates ORDER BY created_at DESC LIMIT 20'
    );

    const latest = history[0] || null;

    const parsed = (row: any) => ({
      ...row,
      release_notes: typeof row.changes === 'string'
        ? (() => { try { const p = JSON.parse(row.changes); return p.release_notes || row.changes; } catch { return row.changes; } })()
        : row.changes?.release_notes || '',
      is_mandatory: typeof row.changes === 'string'
        ? (() => { try { const p = JSON.parse(row.changes); return !!p.is_mandatory; } catch { return false; } })()
        : !!row.changes?.is_mandatory,
    });

    return NextResponse.json({
      ...(latest ? parsed(latest) : { version: '0.0.0', changes: '[]', release_date: null }),
      history: history.map(parsed),
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
  }
}

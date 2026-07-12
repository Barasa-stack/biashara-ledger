import { NextResponse } from 'next/server';
import { adminRun } from '@/lib/db';

export async function GET() {
  try {
    await adminRun(`ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_modules TEXT DEFAULT '[]'`);
    try { await adminRun(`ALTER TABLE admin_license_keys ADD COLUMN IF NOT EXISTS modules TEXT DEFAULT '[]'`); } catch {}
    try { await adminRun(`ALTER TABLE admin_plans ADD COLUMN IF NOT EXISTS modules TEXT DEFAULT '[]'`); } catch {}
    return NextResponse.json({ success: true, message: 'Columns added successfully' });
  } catch (err: any) {
    console.error('Migration error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

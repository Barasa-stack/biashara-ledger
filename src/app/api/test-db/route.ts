import { NextResponse } from 'next/server';
import { adminQuery } from '@/lib/db';
import { logInfo, logError } from '@/lib/logger';

export async function GET() {
  try {
    logInfo('test-db', 'Testing database connection...');
    const result = await adminQuery('SELECT 1 as test');
    logInfo('test-db', 'DB connection successful', { result });
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    logError('test-db', 'DB connection failed', { error: err?.message || err });
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

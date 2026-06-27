import { NextResponse } from 'next/server';
import { adminGet } from '@/lib/db';

export async function GET() {
  try {
    const latest = await adminGet(
      'SELECT * FROM app_updates ORDER BY created_at DESC LIMIT 1'
    );

    if (!latest) {
      return NextResponse.json({
        version: process.env.npm_package_version || '1.0.0',
        changes: ['Initial release'],
        downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://biashara-ledger.vercel.app'}/downloads`,
        releaseDate: null,
      });
    }

    const record = latest as any;

    return NextResponse.json({
      version: record.version,
      changes: typeof record.changes === 'string' ? JSON.parse(record.changes) : record.changes,
      downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://biashara-ledger.vercel.app'}/downloads`,
      releaseDate: record.release_date,
    });
  } catch {
    return NextResponse.json({
      version: '1.0.0',
      changes: ['Initial release'],
      downloadUrl: '/downloads',
      releaseDate: null,
    });
  }
}

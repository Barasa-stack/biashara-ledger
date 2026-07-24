import { NextResponse } from 'next/server';
import { adminQuery, adminRun } from '@/lib/db';

export async function GET() {
  try {
    const rows = await adminQuery(
      `SELECT pr.*, u.first_name, u.last_name
       FROM payment_requests pr
       LEFT JOIN users u ON u.id = pr.user_id
       ORDER BY pr.created_at DESC
       LIMIT 100`
    );
    return NextResponse.json(rows || []);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch payment requests' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { adminRun } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session as any).email !== process.env.ADMIN_EMAIL && (session as any).role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const result = await adminRun(
    `UPDATE admin_clients SET is_active = NOT is_active WHERE id = $1`,
    [id]
  );
  return NextResponse.json({ success: true, affected: result.rowCount });
}

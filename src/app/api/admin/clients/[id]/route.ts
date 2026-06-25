import { NextResponse } from 'next/server';
import { adminQuery, adminRun } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { dropClientDatabase } from '@/lib/admin';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session as any).email !== process.env.ADMIN_EMAIL && (session as any).role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const client = await adminQuery('SELECT database_name FROM admin_clients WHERE id = $1', [id]);

  if (client.length === 0) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const { database_name } = client[0];

  await dropClientDatabase(database_name).catch((e) => console.error('Drop DB error:', e.message));

  await adminRun('DELETE FROM admin_license_keys WHERE client_id = $1', [id]);
  await adminRun('DELETE FROM admin_clients WHERE id = $1', [id]);

  return NextResponse.json({
    success: true,
    message: `Client deleted. Database "${database_name}" dropped.`
  });
}

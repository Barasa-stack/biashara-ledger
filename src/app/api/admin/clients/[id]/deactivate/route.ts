import { NextResponse } from 'next/server';
import { adminRun, adminGet } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await adminGuard();
  if (error) return error;

  const { id } = await params;

  try {
    const client = await adminGet('SELECT id, is_active FROM admin_clients WHERE id = $1', [id]);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const newStatus = !(client as any).is_active;
    await adminRun('UPDATE admin_clients SET is_active = $1 WHERE id = $2', [newStatus, id]);

    return NextResponse.json({ success: true, is_active: newStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

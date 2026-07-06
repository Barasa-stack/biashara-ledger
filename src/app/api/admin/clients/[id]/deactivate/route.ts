import { NextResponse } from 'next/server';
import { adminRun, adminGet } from '@/lib/db';
import { adminGuard } from '@/lib/admin';
import { logAdminAction } from '@/lib/admin-audit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await adminGuard();
  if (error) return error;

  const { id } = await params;

  try {
    const client = await adminGet('SELECT id, company_name, is_active FROM admin_clients WHERE id = $1', [id]);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const newStatus = !(client as any).is_active;
    await adminRun('UPDATE admin_clients SET is_active = $1 WHERE id = $2', [newStatus, id]);

    await logAdminAction({
      adminId: session?.user_id,
      adminEmail: session?.email,
      action: newStatus ? 'Client Activated' : 'Client Deactivated',
      entityType: 'client',
      entityId: id,
      details: `${(client as any).company_name || 'Client'} ${newStatus ? 'activated' : 'deactivated'}`,
    });

    return NextResponse.json({ success: true, is_active: newStatus });
  } catch (err: any) {
    return NextResponse.json({ error: 'Deactivation failed' }, { status: 500 });
  }
}

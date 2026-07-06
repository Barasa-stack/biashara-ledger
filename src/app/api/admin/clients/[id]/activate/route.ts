import { NextResponse } from 'next/server';
import { adminGuard, activateSelfRegisteredUser } from '@/lib/admin';
import { logAdminAction } from '@/lib/admin-audit';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await adminGuard();
  if (error) return error;

  const { id } = await params;

  try {
    const result = await activateSelfRegisteredUser(id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await logAdminAction({
      adminId: session?.user_id,
      adminEmail: session?.email,
      action: 'Client Activated',
      entityType: 'client',
      entityId: id,
      details: `Self-registered user ${result.client?.email || id} activated`,
    });

    return NextResponse.json({ client: result.client, licenseKey: result.licenseKey });
  } catch (err: any) {
    console.error('Activate error:', err);
    return NextResponse.json({ error: 'Failed to activate client' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { adminGuard, activateSelfRegisteredUser } from '@/lib/admin';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await adminGuard();
  if (error) return error;

  const { id } = await params;

  try {
    const result = await activateSelfRegisteredUser(id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ client: result.client, licenseKey: result.licenseKey });
  } catch (err: any) {
    console.error('Activate error:', err);
    return NextResponse.json({ error: 'Failed to activate client' }, { status: 500 });
  }
}

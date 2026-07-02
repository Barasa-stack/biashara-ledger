import { NextResponse } from 'next/server';
import { adminRun, adminGet } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const { error, session } = await adminGuard();
  if (error) return error;

  try {
    await adminRun(
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_enabled INTEGER DEFAULT 0`
    );

    const user = await adminGet<{ two_factor_enabled: number }>(
      'SELECT two_factor_enabled FROM users WHERE id = $1',
      [session.user_id]
    );

    return NextResponse.json({ enabled: !!(user as any)?.two_factor_enabled });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to load security settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { error, session } = await adminGuard();
  if (error) return error;

  try {
    const { enabled } = await request.json();

    await adminRun(
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_enabled INTEGER DEFAULT 0`
    );
    await adminRun(
      'UPDATE users SET two_factor_enabled = $1 WHERE id = $2',
      [enabled ? 1 : 0, session.user_id]
    );

    return NextResponse.json({ success: true, enabled: !!enabled });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update security settings' }, { status: 500 });
  }
}

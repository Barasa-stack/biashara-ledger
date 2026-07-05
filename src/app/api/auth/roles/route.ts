import { NextResponse } from 'next/server';
import { query, get, run } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/auth-guard';

export async function GET() {
  try {
    await requireRole('admin');
    const roles = await query('SELECT * FROM roles ORDER BY name');
    return NextResponse.json(roles);
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    // error already logged above
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireRole('admin');
    const { userId, role } = await request.json();
    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }
    const validRoles = await query('SELECT name FROM roles') as { name: string }[];
    if (!validRoles.find(r => r.name === role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    await run('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    // error already logged above
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}

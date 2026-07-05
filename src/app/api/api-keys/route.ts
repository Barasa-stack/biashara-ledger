import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import crypto from 'crypto';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const keys = await withTenantContext(session.tenant_id!, async () => {
      return await query("SELECT id, key_name, permissions, LEFT(api_key, 8) || '...' as api_key_mask, last_used_at, expires_at, is_active, created_at FROM api_keys ORDER BY created_at DESC");
    });
    return NextResponse.json(keys);
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    // error already logged above
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const apiKey = `bl_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = body.expires_in_days ? new Date(Date.now() + Number(body.expires_in_days) * 86400000).toISOString() : null;
    const result = await withTenantContext(session.tenant_id!, async () => {
      return await insertReturning<{ id: string }>(
        'INSERT INTO api_keys (tenant_id, key_name, api_key, permissions, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [session.tenant_id, body.key_name, apiKey, body.permissions || 'read', expiresAt]
      );
    });
    return NextResponse.json({ id: result.id, api_key: apiKey }, { status: 201 });
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    // error already logged above
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM api_keys WHERE id=$1', [id]);
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    // error already logged above
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { adminGet, adminRun } from '@/lib/db';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const vendor = await adminGet<{
      host: string; port: string; username: string; password: string;
      from_name: string; from_address: string; locked: boolean;
    }>('SELECT host, port, username, password, from_name, from_address, locked FROM vendor_smtp_settings WHERE id = 1');

    return NextResponse.json({
      settings: {
        smtp_host: (vendor as any)?.host || '',
        smtp_port: (vendor as any)?.port || '587',
        smtp_user: (vendor as any)?.username || '',
        smtp_pass: (vendor as any)?.password || '',
        smtp_from_name: (vendor as any)?.from_name || 'BiasharaLedger',
        smtp_from_address: (vendor as any)?.from_address || (vendor as any)?.username || '',
      },
      locked: (vendor as any)?.locked !== false,
    });
  } catch (error) {
    console.error('Error loading vendor SMTP settings:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await adminGuard();
  if (guard.error) return guard.error;
  const session = guard.session;

  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_name, smtp_from_address } = await req.json();

    if (smtp_port) {
      const portNum = parseInt(smtp_port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return NextResponse.json({ error: 'Invalid SMTP port' }, { status: 400 });
      }
    }

    // Read current values before updating
    const before = await adminGet<{
      host: string; username: string; from_name: string; from_address: string;
    }>('SELECT host, username, from_name, from_address FROM vendor_smtp_settings WHERE id = 1');

    await adminRun(
      `INSERT INTO vendor_smtp_settings (id, host, port, username, password, from_name, from_address, locked, updated_at)
       VALUES (1, $1, $2, $3, $4, $5, $6, true, NOW())
       ON CONFLICT (id) DO UPDATE SET
         host = EXCLUDED.host,
         port = EXCLUDED.port,
         username = EXCLUDED.username,
         password = EXCLUDED.password,
         from_name = EXCLUDED.from_name,
         from_address = EXCLUDED.from_address,
         locked = true,
         updated_at = NOW()`,
      [smtp_host || '', smtp_port || '587', smtp_user || '', smtp_pass || '',
       smtp_from_name || 'BiasharaLedger', smtp_from_address || smtp_user || '']
    );

    // Audit log
    const changed: Record<string, { before: string; after: string }> = {};
    const beforeV = (before as any) || {};
    if (smtp_host !== undefined && smtp_host !== beforeV.host) changed.smtp_host = { before: beforeV.host || '', after: smtp_host };
    if (smtp_user !== undefined && smtp_user !== beforeV.username) changed.smtp_user = { before: beforeV.username || '', after: smtp_user };
    if (smtp_from_name !== undefined && smtp_from_name !== beforeV.from_name) changed.smtp_from_name = { before: beforeV.from_name || '', after: smtp_from_name };
    if (smtp_from_address !== undefined && smtp_from_address !== beforeV.from_address) changed.smtp_from_address = { before: beforeV.from_address || '', after: smtp_from_address };

    if (Object.keys(changed).length > 0) {
      await adminRun(
        `INSERT INTO smtp_audit_log (admin_id, admin_email, action, changes) VALUES ($1, $2, 'update', $3::jsonb)`,
        [String(session?.user_id || ''), session?.email || '', JSON.stringify(changed)]
      );
    }

    return NextResponse.json({ success: true, message: 'Vendor SMTP settings updated' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error saving vendor SMTP settings:', msg);
    return NextResponse.json({ error: 'Failed to save settings: ' + msg }, { status: 500 });
  }
}

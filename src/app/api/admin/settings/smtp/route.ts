import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminGuard } from '@/lib/admin';
import { adminGet, adminRun } from '@/lib/db';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const settings = await adminGet<{
      smtp_host: string; smtp_port: string; smtp_user: string; smtp_pass: string;
    }>(
      "SELECT smtp_host, smtp_port, smtp_user, smtp_pass FROM company_settings WHERE company_name = 'BiasharaLedger' LIMIT 1"
    );

    return NextResponse.json({
      settings: {
        smtp_host: settings?.smtp_host || '',
        smtp_port: settings?.smtp_port || '587',
        smtp_user: settings?.smtp_user || '',
        smtp_pass: settings?.smtp_pass || '',
        company_name: 'BiasharaLedger',
      },
    });
  } catch (error) {
    console.error('Error loading SMTP settings:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const body = await req.json();
    const { smtp_host, smtp_port, smtp_user, smtp_pass } = body;

    if (smtp_port) {
      const portNum = parseInt(smtp_port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return NextResponse.json({ error: 'Invalid SMTP port' }, { status: 400 });
      }
    }

    // Use a fixed admin tenant ID for global settings
    const adminTenantId = '00000000-0000-0000-0000-000000000001';
    await adminRun(
      'INSERT INTO tenants (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [adminTenantId, 'BiasharaLedger']
    );
    await adminRun(
      `INSERT INTO company_settings (tenant_id, company_name, smtp_host, smtp_port, smtp_user, smtp_pass)
       VALUES ($1, 'BiasharaLedger', $2, $3, $4, $5)
       ON CONFLICT (tenant_id) DO UPDATE SET
         smtp_host = EXCLUDED.smtp_host,
         smtp_port = EXCLUDED.smtp_port,
         smtp_user = EXCLUDED.smtp_user,
         smtp_pass = EXCLUDED.smtp_pass`,
      [adminTenantId, smtp_host || '', smtp_port || '587', smtp_user || '', smtp_pass || '']
    );

    return NextResponse.json({ success: true, message: 'SMTP settings updated' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error saving SMTP settings:', msg);
    return NextResponse.json({ error: 'Failed to save settings: ' + msg }, { status: 500 });
  }
}

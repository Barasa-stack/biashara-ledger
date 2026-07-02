import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { adminGet, adminRun } from '@/lib/db';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    let settings = await adminGet<{
      smtp_host: string;
      smtp_port: string;
      smtp_user: string;
      smtp_pass: string;
      company_name: string;
    }>('SELECT smtp_host, smtp_port, smtp_user, smtp_pass, company_name FROM company_settings LIMIT 1');

    if (!settings) {
      settings = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: '587',
        smtp_user: '',
        smtp_pass: '',
        company_name: 'BiasharaLedger',
      };
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error loading SMTP settings:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass } = await req.json();

    if (smtp_port) {
      const portNum = parseInt(smtp_port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return NextResponse.json({ error: 'Invalid SMTP port' }, { status: 400 });
      }
    }

    // Use a fixed admin tenant_id for global settings
    const existing = await adminGet('SELECT tenant_id FROM company_settings LIMIT 1') as any;

    if (!existing?.tenant_id) {
      await adminRun(
        `INSERT INTO company_settings (tenant_id, company_name, smtp_host, smtp_port, smtp_user, smtp_pass)
         VALUES (gen_random_uuid(), 'BiasharaLedger', $1, $2, $3, $4)`,
        [smtp_host || 'smtp.gmail.com', smtp_port || '587', smtp_user || '', smtp_pass || '']
      );
    } else {
      await adminRun(
        `UPDATE company_settings SET
          smtp_host = COALESCE(NULLIF($1, ''), smtp_host),
          smtp_port = COALESCE(NULLIF($2, ''), smtp_port),
          smtp_user = COALESCE(NULLIF($3, ''), smtp_user),
          smtp_pass = COALESCE(NULLIF($4, ''), smtp_pass)
        WHERE tenant_id = $5`,
        [
          smtp_host || '',
          smtp_port || '587',
          smtp_user || '',
          smtp_pass || '',
          existing.tenant_id,
        ]
      );
    }

    return NextResponse.json({ success: true, message: 'SMTP settings updated' });
  } catch (error) {
    console.error('Error saving SMTP settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

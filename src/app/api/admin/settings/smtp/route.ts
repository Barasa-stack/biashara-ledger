import { NextRequest, NextResponse } from 'next/server';
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
    const { smtp_host, smtp_port, smtp_user, smtp_pass } = await req.json();

    if (smtp_port) {
      const portNum = parseInt(smtp_port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return NextResponse.json({ error: 'Invalid SMTP port' }, { status: 400 });
      }
    }

    // Upsert into company_settings with company_name = 'BiasharaLedger'
    const existing = await adminGet(
      "SELECT tenant_id FROM company_settings WHERE company_name = 'BiasharaLedger' LIMIT 1"
    ) as any;

    if (!existing?.tenant_id) {
      await adminRun(
        `INSERT INTO company_settings (tenant_id, company_name, smtp_host, smtp_port, smtp_user, smtp_pass)
         VALUES (gen_random_uuid(), 'BiasharaLedger', $1, $2, $3, $4)`,
        [smtp_host || '', smtp_port || '587', smtp_user || '', smtp_pass || '']
      );
    } else {
      await adminRun(
        `UPDATE company_settings SET
          smtp_host = $1, smtp_port = $2, smtp_user = $3, smtp_pass = $4
         WHERE tenant_id = $5`,
        [smtp_host || '', smtp_port || '587', smtp_user || '', smtp_pass || '', existing.tenant_id]
      );
    }

    return NextResponse.json({ success: true, message: 'SMTP settings updated' });
  } catch (error) {
    console.error('Error saving SMTP settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

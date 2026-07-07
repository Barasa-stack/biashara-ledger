import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { adminQuery, adminGet, adminRun } from '@/lib/db';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    // Read from admin_settings first
    const rows = await adminQuery('SELECT key, value FROM admin_settings WHERE key LIKE \'smtp_%\'');
    const adminSmtp: Record<string, string> = {};
    for (const row of rows) {
      adminSmtp[row.key] = row.value;
    }

    if (adminSmtp.smtp_host && adminSmtp.smtp_user) {
      return NextResponse.json({
        settings: {
          smtp_host: adminSmtp.smtp_host,
          smtp_port: adminSmtp.smtp_port || '587',
          smtp_user: adminSmtp.smtp_user,
          smtp_pass: adminSmtp.smtp_pass || '',
          company_name: 'BiasharaLedger',
        },
      });
    }

    // Fallback to company_settings
    const company = await adminGet<{
      smtp_host: string; smtp_port: string; smtp_user: string; smtp_pass: string; company_name: string;
    }>('SELECT smtp_host, smtp_port, smtp_user, smtp_pass, company_name FROM company_settings LIMIT 1');

    const host = company?.smtp_host || adminSmtp.smtp_host || 'smtp.gmail.com';
    const port = company?.smtp_port || adminSmtp.smtp_port || '587';
    const user = company?.smtp_user || adminSmtp.smtp_user || '';
    const pass = company?.smtp_pass || adminSmtp.smtp_pass || '';

    return NextResponse.json({
      settings: {
        smtp_host: host,
        smtp_port: port,
        smtp_user: user,
        smtp_pass: pass,
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

    // Store in admin_settings (system-wide, not tied to any tenant)
    const pairs: Record<string, string> = {
      smtp_host: smtp_host || 'smtp.gmail.com',
      smtp_port: smtp_port || '587',
      smtp_user: smtp_user || '',
      smtp_pass: smtp_pass || '',
    };
    for (const [key, value] of Object.entries(pairs)) {
      await adminRun(
        `INSERT INTO admin_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, value]
      );
    }

    // Also save to company_settings for backward compatibility
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

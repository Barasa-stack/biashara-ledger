import { NextRequest, NextResponse } from 'next/server';
import { adminQuery, adminRun, adminGet } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const rows = await adminQuery('SELECT key, value FROM admin_settings');
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({
      platform_name: settings.platform_name || 'BiasharaLedger',
      support_email: settings.support_email || 'support@biasharaledger.com',
      default_currency: settings.default_currency || 'USD',
      timezone: settings.timezone || 'Africa/Nairobi (UTC+3)',
      primary_color: settings.primary_color || '#dc2626',
      logo_url: settings.logo_url || '',
      favicon_url: settings.favicon_url || '',
    });
  } catch (err) {
    console.error('Error loading general settings:', err);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const body = await req.json();
    const allowed = ['platform_name', 'support_email', 'default_currency', 'timezone', 'primary_color', 'logo_url', 'favicon_url'];

    for (const [key, value] of Object.entries(body)) {
      if (allowed.includes(key)) {
        await adminRun(
          `INSERT INTO admin_settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [key, String(value || '')]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (err) {
    console.error('Error saving general settings:', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

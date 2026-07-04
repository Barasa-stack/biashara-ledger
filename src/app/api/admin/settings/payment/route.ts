import { NextRequest, NextResponse } from 'next/server';
import { adminQuery, adminRun } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const rows = await adminQuery("SELECT key, value FROM admin_settings WHERE key LIKE 'payment_%'");
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({
      provider: settings.payment_provider || 'M-Pesa (Daraja API)',
      api_key: settings.payment_api_key || '',
      webhook_secret: settings.payment_webhook_secret || '',
    });
  } catch (err) {
    console.error('Error loading payment settings:', err);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const { provider, api_key, webhook_secret } = await req.json();

    const updates: Record<string, string> = {};
    if (provider !== undefined) updates.payment_provider = provider;
    if (api_key !== undefined) updates.payment_api_key = api_key;
    if (webhook_secret !== undefined) updates.payment_webhook_secret = webhook_secret;

    for (const [key, value] of Object.entries(updates)) {
      await adminRun(
        `INSERT INTO admin_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, String(value)]
      );
    }

    return NextResponse.json({ success: true, message: 'Payment settings saved' });
  } catch (err) {
    console.error('Error saving payment settings:', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

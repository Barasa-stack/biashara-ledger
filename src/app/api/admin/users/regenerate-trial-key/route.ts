import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminRun, adminGet, run, withTenantContext } from '@/lib/db';
import { createTransporter } from '@/lib/email';
import { adminGuard } from '@/lib/admin';

export async function POST(req: NextRequest) {
  const guard = await adminGuard();
  if (guard.error) return guard.error;

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await adminGet<any>(
      `SELECT id, tenant_id, email, first_name, license_key, license_status FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hash = crypto.createHash('sha256').update(normalizedEmail + 'trial' + (process.env.LICENSE_SECRET || 'default')).digest('hex');
    const newKey = `${hash.substring(0, 4).toUpperCase()}-${hash.substring(4, 8).toUpperCase()}-${hash.substring(8, 12).toUpperCase()}-${hash.substring(12, 16).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    if (user.tenant_id) {
      await withTenantContext(user.tenant_id, async () => {
        await run(
          `UPDATE users SET license_key = $1, subscription_expiry = $2, license_status = 'trial' WHERE id = $3`,
          [newKey, expiresAt, user.id]
        );
      });
    } else {
      await adminRun(
        `UPDATE users SET license_key = $1, subscription_expiry = $2, license_status = 'trial' WHERE id = $3`,
        [newKey, expiresAt, user.id]
      );
    }

    let emailSent = false;
    try {
      const transporter = await createTransporter();
      if (transporter) {
        const activateUrl = 'https://biasharaledger.qzz.io/activate-license';
        await transporter.sendMail({
          from: `"BiasharaLedger" <${(transporter as any).options?.auth?.user || 'noreply@biasharaledger.com'}>`,
          to: normalizedEmail,
          subject: 'Your New BiasharaLedger Trial License Key',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
              <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:28px;text-align:center;border-radius:8px 8px 0 0;">
                <h1 style="color:#fff;margin:0;font-size:20px;">BiasharaLedger</h1>
              </div>
              <div style="padding:28px;background:#fff;border:1px solid #e5e7eb;">
                <h2 style="font-size:16px;color:#111;margin:0 0 12px;">Your New Trial License Key</h2>
                <p style="font-size:13px;color:#444;line-height:1.6;">A new trial license key has been generated for your account.</p>
                <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
                  <p style="font-size:11px;color:#888;margin:0 0 4px;">Your New Trial License Key</p>
                  <p style="font-size:18px;font-weight:700;color:#dc2626;letter-spacing:2px;font-family:monospace;margin:4px 0;">${newKey}</p>
                  <p style="font-size:11px;color:#888;margin:8px 0 0;">Expires: ${new Date(expiresAt).toLocaleDateString()}</p>
                </div>
                <p style="font-size:13px;color:#444;line-height:1.6;">
                  <strong>Next step:</strong> Activate your trial by visiting:<br/>
                  <a href="${activateUrl}" style="color:#dc2626;">${activateUrl}</a>
                </p>
              </div>
              <div style="padding:16px;text-align:center;background:#f9fafb;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;">
                <p style="margin:0;font-size:11px;color:#999;">BiasharaLedger</p>
              </div>
            </div>
          `,
        });
        emailSent = true;
      }
    } catch {}

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      license_key: newKey,
      email_sent: emailSent,
      message: `New trial key generated and ${emailSent ? 'sent' : 'ready'}!`,
    });
  } catch (err: any) {
    console.error('[regenerate-trial-key] Error:', err?.message || err);
    return NextResponse.json({ error: 'Failed: ' + (err?.message || 'Unknown') }, { status: 500 });
  }
}

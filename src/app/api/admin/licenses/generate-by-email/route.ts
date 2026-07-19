import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminRun, adminGet } from '@/lib/db';
import { adminGuard } from '@/lib/admin';
import { createTransporter } from '@/lib/email';
import { createNotification } from '@/lib/admin-notify';

export async function POST(req: Request) {
  try {
    const guard = await adminGuard();
    if (guard.error) return guard.error;

    const { email, contact_person, company_name, plan = 'Premium', durationDays = 365 } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const secret = process.env.LICENSE_SECRET || 'default-secret';
    const hash = crypto.createHash('sha256').update(normalizedEmail + secret).digest('hex');
    const licenseKey = `BL-${hash.substring(0, 8).toUpperCase()}-${hash.substring(8, 16).toUpperCase()}-${hash.substring(16, 24).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const planLower = plan.toLowerCase();

    // 1. Create/Update client in admin_clients
    let clientId = null;
    const existingClient = await adminGet(
      `SELECT id FROM admin_clients WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail]
    );

    if (existingClient) {
      clientId = (existingClient as any).id;
      await adminRun(
        `UPDATE admin_clients SET company_name = COALESCE($1, company_name), plan = $2, is_active = true, expires_at = $3, license_key = $4 WHERE id = $5`,
        [company_name || null, planLower, expiresAt, licenseKey, clientId]
      );
    } else {
      const clientIdNum = Math.floor(Math.random() * 2147483647) + 1;
      await adminRun(
        `INSERT INTO admin_clients (id, company_name, email, database_name, plan, is_active, expires_at, license_key, created_at)
         VALUES ($1, $2, $3, $4, $5, true, $6, $7, NOW())`,
        [clientIdNum, company_name || 'Unknown Company', normalizedEmail, 'db_' + clientIdNum, planLower, expiresAt, licenseKey]
      );
      clientId = clientIdNum;
    }

    // 2. Store in admin_license_keys
    await adminRun(
      `INSERT INTO admin_license_keys (license_key, client_id, plan, is_active, is_used, expires_at, created_at)
       VALUES ($1, $2, $3, true, false, $4, NOW())
       ON CONFLICT (license_key) DO UPDATE SET is_active = true, expires_at = $4`,
      [licenseKey, clientId, planLower, expiresAt]
    );

    // 3. Create/Update user with license (no password — user sets via reset link)
    const existingUser = await adminGet(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail]
    );

    if (existingUser) {
      await adminRun(
        `UPDATE users SET license_key = $1, license_status = 'active', subscription_plan = $2, subscription_expiry = $3, subscription_status = 'active' WHERE LOWER(email) = LOWER($4)`,
        [licenseKey, plan, expiresAt, normalizedEmail]
      );
    } else {
      await adminRun(
        `INSERT INTO users (email, license_key, license_status, subscription_plan, subscription_expiry, subscription_status, role, verified)
         VALUES ($1, $2, 'active', $3, $4, 'active', 'user', 1)`,
        [normalizedEmail, licenseKey, plan, expiresAt]
      );
    }

    // 4. Send activation email with set-password link
    let emailSent = false;
    let emailError = '';
    try {
      const transporter = await createTransporter();
      if (transporter) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://biasharaledger.qzz.io';
        const signInUrl = `${appUrl}/sign-in`;
        const companyName = company_name || 'BiasharaLedger';

        await transporter.sendMail({
          from: `"${companyName}" <${(transporter as any).options?.auth?.user || 'noreply@biasharaledger.com'}>`,
          to: normalizedEmail,
          subject: `Welcome to ${companyName} — Set Your Password`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
              <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:28px;text-align:center;border-radius:8px 8px 0 0;">
                <h1 style="color:#fff;margin:0;font-size:20px;">${companyName}</h1>
              </div>
              <div style="padding:28px;background:#fff;border:1px solid #e5e7eb;">
                <h2 style="font-size:16px;color:#111;margin:0 0 12px;">Your Account Has Been Created</h2>
                <p style="font-size:13px;color:#444;line-height:1.6;">Your account is ready. Sign in below to get started.</p>
                <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
                  <p style="margin:4px 0;font-size:13px;color:#444;"><strong>Email:</strong> ${normalizedEmail}</p>
                  <p style="margin:4px 0;font-size:13px;color:#444;"><strong>License Key:</strong> <code style="background:#fff;padding:2px 8px;border:1px solid #e5e7eb;border-radius:4px;font-size:12px;">${licenseKey}</code></p>
                  <p style="margin:4px 0;font-size:13px;color:#444;"><strong>Plan:</strong> ${plan}</p>
                </div>
                <p style="font-size:13px;color:#444;line-height:1.6;">
                  Sign in at:<br/>
                  <a href="${signInUrl}" style="color:#dc2626;">${signInUrl}</a>
                </p>
                <p style="font-size:13px;color:#888;margin-top:16px;">Use the "Forgot Password" link on the sign-in page to set your password for the first time.</p>
              </div>
              <div style="padding:16px;text-align:center;background:#f9fafb;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;">
                <p style="margin:0;font-size:11px;color:#999;">${companyName} &mdash; Business Management Software</p>
              </div>
            </div>
          `,
        });
        emailSent = true;
      }
    } catch (err: any) {
      emailError = err?.message || 'Failed to send email';
      console.error('[generate-by-email] Email send failed:', emailError);
    }

    await createNotification('success', 'License Generated', `License for ${normalizedEmail} (${plan}) created. Expires: ${new Date(expiresAt).toLocaleDateString()}`, '/admin/licenses');

    return NextResponse.json({
      success: true,
      license_key: licenseKey,
      email: normalizedEmail,
      contact_person: contact_person || '',
      company_name: company_name || '',
      plan,
      expires_at: expiresAt,
      client_id: clientId,
      email_sent: emailSent,
      email_error: emailError || undefined,
      message: `License generated. Sign-in instructions sent to ${normalizedEmail}.`,
    });
  } catch (err: any) {
    console.error('[generate-by-email] Error:', err?.message || err);
    return NextResponse.json({ error: 'Failed to generate license: ' + (err?.message || 'Unknown') }, { status: 500 });
  }
}

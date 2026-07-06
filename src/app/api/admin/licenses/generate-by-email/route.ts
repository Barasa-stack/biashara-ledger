import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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

    // Generate a unique license key and a random password
    const secret = process.env.LICENSE_SECRET || 'default-secret';
    const hash = crypto.createHash('sha256').update(normalizedEmail + secret).digest('hex');
    const licenseKey = `BL-${hash.substring(0, 8).toUpperCase()}-${hash.substring(8, 16).toUpperCase()}-${hash.substring(16, 24).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const planLower = plan.toLowerCase();

    // Generate a random 12-character password
    const tempPassword = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 12) + '1A!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

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

    // 3. Create/Update user with hashed password and license
    const existingUser = await adminGet(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail]
    );

    if (existingUser) {
      await adminRun(
        `UPDATE users SET license_key = $1, license_status = 'active', subscription_plan = $2, subscription_expiry = $3, subscription_status = 'active', password_hash = $4 WHERE LOWER(email) = LOWER($5)`,
        [licenseKey, plan, expiresAt, hashedPassword, normalizedEmail]
      );
    } else {
      await adminRun(
        `INSERT INTO users (email, password_hash, license_key, license_status, subscription_plan, subscription_expiry, subscription_status, role, verified)
         VALUES ($1, $2, $3, 'active', $4, $5, 'active', 'user', 1)`,
        [normalizedEmail, hashedPassword, licenseKey, plan, expiresAt]
      );
    }

    // 4. Send activation email with credentials
    let emailSent = false;
    let emailError = '';
    try {
      const transporter = await createTransporter();
      if (transporter) {
        const activateUrl = `https://biashara-ledger.vercel.app/activate-license`;
        const signInUrl = `https://biashara-ledger.vercel.app/sign-in`;
        const companyName = company_name || 'BiasharaLedger';

        await transporter.sendMail({
          from: `"${companyName}" <${(transporter as any).options?.auth?.user || 'noreply@biasharaledger.com'}>`,
          to: normalizedEmail,
          subject: `Welcome to ${companyName} — Your Account Credentials`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
              <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:28px;text-align:center;border-radius:8px 8px 0 0;">
                <h1 style="color:#fff;margin:0;font-size:20px;">${companyName}</h1>
              </div>
              <div style="padding:28px;background:#fff;border:1px solid #e5e7eb;">
                <h2 style="font-size:16px;color:#111;margin:0 0 12px;">Welcome to ${companyName}!</h2>
                <p style="font-size:13px;color:#444;line-height:1.6;">Your account has been created. Use the credentials below to sign in.</p>
                <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
                  <p style="margin:4px 0;font-size:13px;color:#444;"><strong>Email:</strong> ${normalizedEmail}</p>
                  <p style="margin:4px 0;font-size:13px;color:#444;"><strong>Password:</strong> <code style="background:#fff;padding:2px 8px;border:1px solid #e5e7eb;border-radius:4px;font-size:14px;">${tempPassword}</code></p>
                  <p style="margin:4px 0;font-size:13px;color:#444;"><strong>License Key:</strong> <code style="background:#fff;padding:2px 8px;border:1px solid #e5e7eb;border-radius:4px;font-size:12px;">${licenseKey}</code></p>
                  <p style="margin:4px 0;font-size:13px;color:#444;"><strong>Plan:</strong> ${plan}</p>
                </div>
                <p style="font-size:13px;color:#444;line-height:1.6;">
                  <strong>Step 1:</strong> Activate your license by visiting:<br/>
                  <a href="${activateUrl}" style="color:#dc2626;">${activateUrl}</a>
                </p>
                <p style="font-size:13px;color:#444;line-height:1.6;">
                  <strong>Step 2:</strong> Sign in at:<br/>
                  <a href="${signInUrl}" style="color:#dc2626;">${signInUrl}</a>
                </p>
                <p style="font-size:12px;color:#888;margin-top:16px;">You can reset your password after signing in.</p>
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
      temp_password: tempPassword,
      contact_person: contact_person || '',
      company_name: company_name || '',
      plan,
      expires_at: expiresAt,
      client_id: clientId,
      email_sent: emailSent,
      email_error: emailError || undefined,
      message: `License generated. Credentials sent to ${normalizedEmail}.`,
    });
  } catch (err: any) {
    console.error('[generate-by-email] Error:', err?.message || err);
    return NextResponse.json({ error: 'Failed to generate license: ' + (err?.message || 'Unknown') }, { status: 500 });
  }
}

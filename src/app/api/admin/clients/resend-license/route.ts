import { NextResponse } from 'next/server';
import { adminGet } from '@/lib/db';
import { adminGuard } from '@/lib/admin';
import { createTransporter } from '@/lib/email';

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const { clientId } = await req.json();
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Get client info from admin_clients or users table
    let clientInfo = await adminGet<any>(
      `SELECT id, company_name, email, license_key, plan, expires_at FROM admin_clients WHERE CAST(id AS TEXT) = $1`,
      [String(clientId)]
    );
    let isUserTable = false;

    if (!clientInfo) {
      clientInfo = await adminGet<any>(
        `SELECT id, email, license_key, subscription_plan as plan, subscription_expiry as expires_at FROM users WHERE CAST(id AS TEXT) = $1`,
        [String(clientId)]
      );
      isUserTable = true;
    }

    if (!clientInfo || !clientInfo.email) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const email = clientInfo.email;
    const licenseKey = clientInfo.license_key;
    const plan = clientInfo.plan || 'Premium';
    const companyName = clientInfo.company_name || 'BiasharaLedger';
    const expiresAt = clientInfo.expires_at || 'N/A';

    if (!licenseKey) {
      return NextResponse.json({ error: 'No license key found for this client. Generate a license first.' }, { status: 400 });
    }

    // Get a fresh temporary password (we can't retrieve the old one since it's hashed)
    // Instead, we'll send the license key and activation instructions
    const transporter = await createTransporter();
    if (!transporter) {
      return NextResponse.json({ error: 'SMTP not configured. Please configure SMTP in Admin > Settings.' }, { status: 400 });
    }

    const activateUrl = `https://biashara-ledger.vercel.app/activate-license`;
    const signInUrl = `https://biashara-ledger.vercel.app/sign-in`;

    await transporter.sendMail({
      from: `"${companyName}" <${(transporter as any).options?.auth?.user || 'noreply@biasharaledger.com'}>`,
      to: email,
      subject: `Your ${companyName} License Details`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:28px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:20px;">${companyName}</h1>
          </div>
          <div style="padding:28px;background:#fff;border:1px solid #e5e7eb;">
            <h2 style="font-size:16px;color:#111;margin:0 0 12px;">Your License Information</h2>
            <p style="font-size:13px;color:#444;line-height:1.6;">Here are your account details:</p>
            <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:4px 0;font-size:13px;color:#444;"><strong>Email:</strong> ${email}</p>
              <p style="margin:4px 0;font-size:13px;color:#444;"><strong>License Key:</strong> <code style="background:#fff;padding:2px 8px;border:1px solid #e5e7eb;border-radius:4px;font-size:12px;">${licenseKey}</code></p>
              <p style="margin:4px 0;font-size:13px;color:#444;"><strong>Plan:</strong> ${plan}</p>
              <p style="margin:4px 0;font-size:13px;color:#444;"><strong>Expires:</strong> ${expiresAt}</p>
            </div>
            <p style="font-size:13px;color:#444;line-height:1.6;">
              <strong>Step 1:</strong> Activate your license:<br/>
              <a href="${activateUrl}" style="color:#dc2626;">${activateUrl}</a>
            </p>
            <p style="font-size:13px;color:#444;line-height:1.6;">
              <strong>Step 2:</strong> Sign in:<br/>
              <a href="${signInUrl}" style="color:#dc2626;">${signInUrl}</a>
            </p>
            ${isUserTable ? '<p style="font-size:12px;color:#888;margin-top:16px;">If you forgot your password, use the "Forgot Password" link on the sign-in page to reset it.</p>' : ''}
          </div>
          <div style="padding:16px;text-align:center;background:#f9fafb;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;">
            <p style="margin:0;font-size:11px;color:#999;">${companyName} &mdash; Business Management Software</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: `License details sent to ${email}` });
  } catch (err: any) {
    console.error('[resend-license] Error:', err?.message || err);
    return NextResponse.json({ error: 'Failed to send email: ' + (err?.message || 'Unknown') }, { status: 500 });
  }
}

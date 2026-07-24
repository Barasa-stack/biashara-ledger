import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { adminRun, adminGet } from '@/lib/db';
import { createTransporter } from '@/lib/email';
import { createNotification } from '@/lib/admin-notify';
import { normalizePlan } from '@/lib/feature-gate';

export async function POST(req: NextRequest) {
  try {
    const { email, password, phone, firstName, lastName, otp, selectedPackage, country } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await adminGet('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 });
    }

    // Validate OTP
    if (!otp) {
      return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
    }
    const validOtp = await adminGet(
      `SELECT id FROM verification_codes WHERE email = $1 AND code = $2 AND purpose = 'signup' AND used = 0 AND expires_at > NOW()`,
      [normalizedEmail, otp]
    );
    if (!validOtp) {
      return NextResponse.json({ error: 'Invalid or expired verification code. Please request a new one.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const tenantUuid = crypto.randomUUID();

    // Generate trial license key (standard XXXX-XXXX-XXXX-XXXX format)
    const hash = crypto.createHash('sha256').update(normalizedEmail + 'trial' + (process.env.LICENSE_SECRET || 'default')).digest('hex');
    const trialKey = `${hash.substring(0, 4).toUpperCase()}-${hash.substring(4, 8).toUpperCase()}-${hash.substring(8, 12).toUpperCase()}-${hash.substring(12, 16).toUpperCase()}`;
    const trialExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    // Create tenant
    try {
      await adminRun(`INSERT INTO tenants (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [tenantUuid, firstName || 'New User']);
    } catch {}

    // Create user with trial license
    const plan = normalizePlan(selectedPackage);
    const userId = Math.floor(Math.random() * 2147483647) + 1;
    await adminRun(
      `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, country, role, verified,
        subscription_plan, subscription_status, subscription_expiry, license_key, license_status,
        trial_start_date, trial_end_date, trial_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'user', true, $9, 'trial', $10, $11, 'trial',
        NOW(), $12, 1)`,
      [userId, tenantUuid, normalizedEmail, hashedPassword, firstName || '', lastName || '', phone || '', country || 'KE', plan, trialExpiry, trialKey, trialExpiry]
    );

    // Mark OTP as used
    await adminRun('UPDATE verification_codes SET used = 1 WHERE email = $1 AND code = $2', [normalizedEmail, otp]);

    // Send trial license key via email
    let emailSent = false;
    try {
      const transporter = await createTransporter();
      if (transporter) {
        const activateUrl = `https://biasharaledger.qzz.io/activate-license`;
        await transporter.sendMail({
          from: `"BiasharaLedger" <${(transporter as any).options?.auth?.user || 'noreply@biasharaledger.com'}>`,
          to: normalizedEmail,
          subject: 'Your 3-Day Free Trial License Key',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
              <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:28px;text-align:center;border-radius:8px 8px 0 0;">
                <h1 style="color:#fff;margin:0;font-size:20px;">BiasharaLedger</h1>
              </div>
              <div style="padding:28px;background:#fff;border:1px solid #e5e7eb;">
                <h2 style="font-size:16px;color:#111;margin:0 0 12px;">Welcome to BiasharaLedger! 🎉</h2>
                <p style="font-size:13px;color:#444;line-height:1.6;">Your 3-day free trial has been created. Use the key below to activate your trial.</p>
                <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
                  <p style="font-size:11px;color:#888;margin:0 0 4px;">Your Trial License Key</p>
                  <p style="font-size:18px;font-weight:700;color:#dc2626;letter-spacing:2px;font-family:monospace;margin:4px 0;">${trialKey}</p>
                  <p style="font-size:11px;color:#888;margin:8px 0 0;">Expires: ${new Date(trialExpiry).toLocaleDateString()}</p>
                </div>
                <p style="font-size:13px;color:#444;line-height:1.6;">
                  <strong>Next step:</strong> Activate your trial by visiting:<br/>
                  <a href="${activateUrl}" style="color:#dc2626;">${activateUrl}</a>
                </p>
                <p style="font-size:12px;color:#888;margin-top:16px;">Enter your license key to activate. After activation you can sign in and start using BiasharaLedger.</p>
              </div>
              <div style="padding:16px;text-align:center;background:#f9fafb;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;">
                <p style="margin:0;font-size:11px;color:#999;">BiasharaLedger &mdash; Business Management Software</p>
              </div>
            </div>
          `,
        });
        emailSent = true;
      }
    } catch (err: any) {
      console.error('[signup] Email send failed:', err?.message);
    }

    createNotification('info', 'New User Registration', `${normalizedEmail} registered for a 3-day trial (${selectedPackage || 'No plan'}).`, '/admin/clients');

    // ─── AUTO-CREATE SESSION ───
    const sessionToken = crypto.randomUUID();
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await adminRun(
      'INSERT INTO sessions (tenant_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [tenantUuid, userId, sessionToken, sessionExpiresAt]
    );

    const displayName = firstName || lastName || '';
    const response = NextResponse.json({
      success: true,
      trial_key: trialKey,
      email_sent: emailSent,
      message: `Account created! Check ${normalizedEmail} for your 3-day trial activation key.`,
      user: {
        id: userId,
        email: normalizedEmail,
        name: displayName,
        tenantId: tenantUuid,
        subscriptionPlan: plan,
        subscriptionStatus: 'trial',
        country: country || 'KE',
      },
    });

    response.cookies.set('bl_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    response.cookies.set('user_plan', plan, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    response.cookies.set('user_subscription_expiry', trialExpiry, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('[signup] Error:', err?.message || err);
    return NextResponse.json({ error: 'Signup failed: ' + (err?.message || 'Unknown') }, { status: 500 });
  }
}

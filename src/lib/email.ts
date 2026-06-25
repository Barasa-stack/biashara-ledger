import nodemailer from 'nodemailer';
import { get, run } from './db';

export async function getSmtpConfig() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      fromName: process.env.EMAIL_FROM_NAME || 'BiasharaLedger',
      fromAddr: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER,
    };
  }

  try {
    const company = await get<{
      smtp_host: string;
      smtp_port: string;
      smtp_user: string;
      smtp_pass: string;
      company_name: string;
    }>('SELECT smtp_host, smtp_port, smtp_user, smtp_pass, company_name FROM company_settings WHERE id = 1');

    if (company?.smtp_host && company?.smtp_user && company?.smtp_pass) {
      return {
        host: company.smtp_host,
        port: parseInt(company.smtp_port || '587'),
        secure: company.smtp_port === '465',
        user: company.smtp_user,
        pass: company.smtp_pass,
        fromName: company.company_name || 'BiasharaLedger',
        fromAddr: company.smtp_user,
      };
    }
  } catch {
    // DB not available — continue to return null
  }

  return null;
}

export async function createTransporter() {
  const config = await getSmtpConfig();
  if (!config) {
    console.warn('[EMAIL] SMTP not configured — emails will not be sent');
    return null;
  }
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    logger: true,
    debug: true,
  });
  transporter.verify().then(() => {
    console.log('[EMAIL] SMTP connection verified successfully');
  }).catch((err) => {
    console.error('[EMAIL] SMTP verification failed:', err.message);
  });
  return transporter;
}

export async function getCompanyName(): Promise<string> {
  const company = await get<{ company_name: string }>('SELECT company_name FROM company_settings WHERE id = 1');
  return company?.company_name || 'BiasharaLedger';
}

export async function sendOTPEmail(to: string, code: string, name = '') {
  const transporter = await createTransporter();
  if (!transporter) {
    console.warn('[EMAIL] SMTP not configured — OTP email not sent');
    return { sent: false, fallback: true, code };
  }

  const config = await getSmtpConfig();
  const fromName = config?.fromName || 'BiasharaLedger';
  const fromAddr = config?.fromAddr || process.env.SMTP_USER || '';

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to,
      subject: 'Your BiasharaLedger Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #df1c1c; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">${fromName}</h1>
          </div>
          <div style="padding: 24px; background: #fff; border: 1px solid #eee;">
            <p style="font-size: 14px; color: #333;">Hello${name ? ' ' + name : ''},</p>
            <p style="font-size: 14px; color: #333;">Your verification code is:</p>
            <div style="text-align: center; padding: 16px; margin: 16px 0; background: #f8f8f8; border-radius: 8px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #df1c1c;">${code}</div>
            <p style="font-size: 12px; color: #888;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
          </div>
        </div>
      `,
    });
    console.log('[EMAIL] OTP sent to', to);
    await logEmail(to, 'otp', true, 'OTP sent');
    return { sent: true, code };
  } catch (err: any) {
    console.error('[EMAIL] Failed to send OTP:', err.message);
    await logEmail(to, 'otp', false, err.message);
    return { sent: false, fallback: true, code };
  }
}

export async function sendWelcomeEmail(to: string, name = '') {
  const transporter = await createTransporter();
  if (!transporter) return { sent: false };

  const config = await getSmtpConfig();
  const fromName = config?.fromName || 'BiasharaLedger';
  const fromAddr = config?.fromAddr || '';

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to,
      subject: `Welcome to ${fromName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #df1c1c; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">${fromName}</h1>
          </div>
          <div style="padding: 24px; background: #fff; border: 1px solid #eee;">
            <p style="font-size: 14px; color: #333;">Hello${name ? ' ' + name : ''},</p>
            <p style="font-size: 14px; color: #333;">Your account has been successfully verified. Welcome to ${fromName}!</p>
            <p style="font-size: 12px; color: #888;">You can now sign in and start using the application.</p>
          </div>
        </div>
      `,
    });
    console.log('[EMAIL] Welcome email sent to', to);
    await logEmail(to, 'welcome', true);
    return { sent: true };
  } catch (err: any) {
    console.error('[EMAIL] Failed to send welcome email:', err.message);
    await logEmail(to, 'welcome', false, err.message);
    return { sent: false };
  }
}

export async function sendLicenseEmail(email: string, licenseKey: string, plan: string, name: string) {
  const transporter = await createTransporter();
  if (!transporter) {
    console.warn('[EMAIL] Cannot send license email — SMTP not configured');
    await logEmail(email, 'license_key', false, 'SMTP not configured');
    return { sent: false, error: 'SMTP not configured' };
  }

  const config = await getSmtpConfig();
  const fromName = config?.fromName || 'BiasharaLedger';
  const fromAddr = config?.fromAddr || '';

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #8B0000; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">${fromName}</h1>
      </div>
      <div style="padding: 32px; background: #fff; border: 1px solid #e2e8f0;">
        <p style="font-size: 14px; color: #333;">Dear ${name},</p>
        <p style="font-size: 14px; color: #333;">Thank you for purchasing ${fromName}! Your license key is below:</p>

        <div style="text-align: center; padding: 20px; margin: 20px 0; background: #f7fafc; border: 2px dashed #8B0000; border-radius: 8px;">
          <p style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">License Key</p>
          <p style="font-size: 22px; font-weight: 700; color: #8B0000; letter-spacing: 3px; font-family: monospace;">${licenseKey}</p>
        </div>

        <table style="width: 100%; font-size: 13px; color: #333; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #718096;">Plan:</td><td style="padding: 6px 0; font-weight: 600;">${plan.toUpperCase()}</td></tr>
          <tr><td style="padding: 6px 0; color: #718096;">Email:</td><td style="padding: 6px 0; font-weight: 600;">${email}</td></tr>
          <tr><td style="padding: 6px 0; color: #718096;">Expires:</td><td style="padding: 6px 0; font-weight: 600;">${expiryDate.toLocaleDateString()}</td></tr>
        </table>

        <div style="background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="font-size: 13px; color: #276749; font-weight: 600; margin-bottom: 8px;">How to Activate</p>
          <ol style="font-size: 13px; color: #333; margin-left: 16px; line-height: 1.8;">
            <li>Open ${fromName} application</li>
            <li>Go to Settings → License</li>
            <li>Enter your email and license key</li>
            <li>Click "Activate License"</li>
          </ol>
        </div>

        <p style="font-size: 13px; color: #718096; margin-top: 20px;">
          Need help? Contact us at <a href="mailto:support@biasharaledger.com" style="color: #8B0000;">support@biasharaledger.com</a>
        </p>
      </div>
      <div style="text-align: center; padding: 16px; font-size: 11px; color: #a0aec0;">
        &copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: email,
      subject: `Your ${fromName} License Key`,
      html,
    });
    console.log('[EMAIL] License email sent:', info.messageId);
    await logEmail(email, 'license_key', true, `MessageId: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('[EMAIL] Failed to send license email:', err.message);
    await logEmail(email, 'license_key', false, err.message);
    return { sent: false, error: err.message };
  }
}

async function logEmail(to: string, type: string, success: boolean, detail?: string) {
  try {
    await run(
      'INSERT INTO email_logs (recipient, email_type, success, detail) VALUES ($1, $2, $3, $4)',
      [to, type, success ? 1 : 0, detail || '']
    );
  } catch {}
}

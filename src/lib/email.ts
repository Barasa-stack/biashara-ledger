import nodemailer from 'nodemailer';
import { adminGet, adminRun } from './db';
import { logInfo, logError } from './logger';

export async function getSmtpConfig(tenantId?: string) {
  try {
    const query = tenantId
      ? 'SELECT smtp_host, smtp_port, smtp_user, smtp_pass, company_name FROM company_settings WHERE tenant_id = $1 LIMIT 1'
      : 'SELECT smtp_host, smtp_port, smtp_user, smtp_pass, company_name FROM company_settings LIMIT 1';
    const params = tenantId ? [tenantId] : [];
    const company = await adminGet<{
      smtp_host: string;
      smtp_port: string;
      smtp_user: string;
      smtp_pass: string;
      company_name: string;
    }>(query, params);

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
  }

  const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && smtpPass) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      user: process.env.SMTP_USER,
      pass: smtpPass,
      fromName: process.env.EMAIL_FROM_NAME || 'BiasharaLedger',
      fromAddr: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER,
    };
  }

  return null;
}

export async function createTransporter() {
  const config = await getSmtpConfig();
  if (!config) {
    if (process.env.NODE_ENV === 'development') {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        logInfo('email', 'Using Ethereal test account', { user: testAccount.user });
        return transporter;
      } catch {
        logError('email', 'Could not create Ethereal account — emails will not be sent');
        return null;
      }
    }
    logError('email', 'SMTP not configured — emails will not be sent');
    return null;
  }
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    logger: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development',
  });
  transporter.verify().then(() => {
    logInfo('email', 'SMTP connection verified successfully');
  }).catch((err) => {
    logError('email', 'SMTP verification failed', { error: (err as Error).message });
  });
  return transporter;
}

export async function getCompanyName(): Promise<string> {
  const company = await adminGet<{ company_name: string }>('SELECT company_name FROM company_settings LIMIT 1', []);
  return company?.company_name || 'BiasharaLedger';
}

export async function sendOTPEmail(to: string, code: string, name = '') {
  const transporter = await createTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV === 'development') {
      logInfo('email', `Dev OTP for ${to}: ${code}`);
      return { sent: true };
    }
    logError('email', 'SMTP not configured — OTP email not sent');
    return { sent: false, fallback: true };
  }

  const config = await getSmtpConfig();
  const fromName = config?.fromName || 'BiasharaLedger';
  const fromAddr = config?.fromAddr || '';

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
    logInfo('email', 'OTP sent', { to });
    await logEmail(to, 'otp', true, 'OTP sent');
    return { sent: true };
  } catch (err: any) {
    logError('email', 'Failed to send OTP', { error: (err as Error).message });
    await logEmail(to, 'otp', false, err.message);
    return { sent: false, fallback: true };
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
    logInfo('email', 'Welcome email sent', { to });
    await logEmail(to, 'welcome', true);
    return { sent: true };
  } catch (err: any) {
    logError('email', 'Failed to send welcome email', { error: (err as Error).message });
    await logEmail(to, 'welcome', false, err.message);
    return { sent: false };
  }
}

export async function sendLicenseEmail(email: string, licenseKey: string, plan: string, name: string) {
  const transporter = await createTransporter();
  if (!transporter) {
    logError('email', 'Cannot send license email — SMTP not configured');
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
    logInfo('email', 'License email sent', { messageId: info.messageId });
    await logEmail(email, 'license_key', true, `MessageId: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err: any) {
    logError('email', 'Failed to send license email', { error: (err as Error).message });
    await logEmail(email, 'license_key', false, err.message);
    return { sent: false, error: err.message };
  }
}

async function logEmail(to: string, type: string, success: boolean, detail?: string) {
  try {
    await adminRun(
      'INSERT INTO email_logs (recipient, email_type, success, detail) VALUES ($1, $2, $3, $4)',
      [to, type, success ? 1 : 0, detail || '']
    );
  } catch {}
}

export async function sendWelcomeEmailNewClient(params: {
  to: string;
  name: string;
  tempPassword: string;
  licenseKey: string;
  plan: string;
  expiresAt: string;
  loginUrl?: string;
}) {
  const transporter = await createTransporter();
  if (!transporter) {
    logInfo('email', `Dev: Welcome email for ${params.to}`, { tempPassword: params.tempPassword });
    return { sent: true, dev: true };
  }

  const config = await getSmtpConfig();
  const fromName = config?.fromName || 'BiasharaLedger';
  const fromAddr = config?.fromAddr || '';
  const loginUrl = params.loginUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.biasharaledger.com'}/login`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #df1c1c 0%, #b91c1c 100%); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700;">${fromName}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Welcome to the family!</p>
      </div>
      <div style="padding: 32px; background: #fff; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 16px;">Dear ${params.name || 'Valued Customer'},</p>
        <p style="font-size: 14px; color: #374151; line-height: 1.6;">Your BiasharaLedger account has been created successfully. Here are your login credentials:</p>

        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Login Credentials</p>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #6b7280; padding: 4px 0;">Login URL:</td>
              <td style="padding: 4px 0;"><a href="${loginUrl}" style="color: #df1c1c; text-decoration: none;">${loginUrl}</a></td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 4px 0;">Email:</td>
              <td style="padding: 4px 0; font-weight: 600;">${params.to}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 4px 0;">Temporary Password:</td>
              <td style="padding: 4px 0; font-weight: 600; font-family: monospace; background: #fff; padding: 4px 8px; border-radius: 4px;">${params.tempPassword}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="font-size: 13px; color: #92400e; margin: 0;"><strong>Important:</strong> Please log in using the temporary password above. You will be required to change your password on first login.</p>
        </div>

        <div style="background: #fef2f2; border: 2px dashed #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your License Details</p>
          <p style="font-size: 20px; font-weight: 700; color: #991b1b; letter-spacing: 2px; font-family: monospace; margin: 8px 0;">${params.licenseKey}</p>
          <table style="width: auto; margin: 12px auto 0; font-size: 13px;">
            <tr><td style="color: #6b7280; padding: 2px 8px;">Plan:</td><td style="padding: 2px 8px; font-weight: 600;">${params.plan.charAt(0).toUpperCase() + params.plan.slice(1)}</td></tr>
            <tr><td style="color: #6b7280; padding: 2px 8px;">Expires:</td><td style="padding: 2px 8px; font-weight: 600;">${new Date(params.expiresAt).toLocaleDateString()}</td></tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #374151; line-height: 1.6;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p style="font-size: 14px; color: #374151; margin-top: 20px;">Best regards,<br><strong>The ${fromName} Team</strong></p>
      </div>
      <div style="text-align: center; padding: 20px; background: #f3f4f6; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 12px; color: #6b7280; margin: 0;">&copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: params.to,
      subject: `Welcome to ${fromName} - Your Account is Ready!`,
      html,
    });
    logInfo('email', 'Welcome email (new client) sent', { to: params.to });
    return { sent: true };
  } catch (err: any) {
    logError('email', 'Failed to send welcome email', { error: err.message });
    return { sent: false, error: err.message };
  }
}

export async function sendLicenseActivatedEmail(params: {
  to: string;
  name: string;
  licenseKey: string;
  plan: string;
  expiresAt: string;
}) {
  const transporter = await createTransporter();
  if (!transporter) {
    logInfo('email', `Dev: License activated email for ${params.to}`);
    return { sent: true, dev: true };
  }

  const config = await getSmtpConfig();
  const fromName = config?.fromName || 'BiasharaLedger';
  const fromAddr = config?.fromAddr || '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700;">License Activated!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Your subscription is now active</p>
      </div>
      <div style="padding: 32px; background: #fff; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 16px;">Dear ${params.name || 'Valued Customer'},</p>
        <p style="font-size: 14px; color: #374151; line-height: 1.6;">Great news! Your BiasharaLedger license has been successfully activated. You can now enjoy uninterrupted access to all features of your ${params.plan.charAt(0).toUpperCase() + params.plan.slice(1)} plan.</p>

        <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">License Details</p>
          <p style="font-size: 20px; font-weight: 700; color: #991b1b; letter-spacing: 2px; font-family: monospace; margin: 8px 0;">${params.licenseKey}</p>
          <table style="width: auto; margin: 12px auto 0; font-size: 13px;">
            <tr><td style="color: #6b7280; padding: 2px 8px;">Plan:</td><td style="padding: 2px 8px; font-weight: 600;">${params.plan.charAt(0).toUpperCase() + params.plan.slice(1)}</td></tr>
            <tr><td style="color: #6b7280; padding: 2px 8px;">Status:</td><td style="padding: 2px 8px; font-weight: 600; color: #ef4444;">Active</td></tr>
            <tr><td style="color: #6b7280; padding: 2px 8px;">Expires:</td><td style="padding: 2px 8px; font-weight: 600;">${new Date(params.expiresAt).toLocaleDateString()}</td></tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #374151; line-height: 1.6;">You can continue using all features of BiasharaLedger without any interruption. Thank you for your continued trust in our platform!</p>
        <p style="font-size: 14px; color: #374151; margin-top: 20px;">Best regards,<br><strong>The ${fromName} Team</strong></p>
      </div>
      <div style="text-align: center; padding: 20px; background: #f3f4f6; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 12px; color: #6b7280; margin: 0;">&copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: params.to,
      subject: `Your ${fromName} License Has Been Updated!`,
      html,
    });
    logInfo('email', 'License activated email sent', { to: params.to });
    return { sent: true };
  } catch (err: any) {
    logError('email', 'Failed to send license activated email', { error: err.message });
    return { sent: false, error: err.message };
  }
}

export async function sendExpiryReminderEmail(params: {
  to: string;
  name: string;
  licenseKey: string;
  daysRemaining: number;
  expiresAt: string;
  urgent?: boolean;
}) {
  const transporter = await createTransporter();
  if (!transporter) {
    logInfo('email', `Dev: Expiry reminder for ${params.to}, ${params.daysRemaining} days`);
    return { sent: true, dev: true };
  }

  const config = await getSmtpConfig();
  const fromName = config?.fromName || 'BiasharaLedger';
  const fromAddr = config?.fromAddr || '';
  const renewalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.biasharaledger.com'}/subscription/renew`;

  const urgent = params.urgent || params.daysRemaining <= 7;
  const bgColor = urgent ? '#dc2626' : '#f59e0b';
  const bgGradient = urgent ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${bgGradient}; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700;">${urgent ? '⚠️ URGENT' : 'License Expiry Reminder'}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Your subscription expires in ${params.daysRemaining} day${params.daysRemaining === 1 ? '' : 's'}</p>
      </div>
      <div style="padding: 32px; background: #fff; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 16px;">Dear ${params.name || 'Valued Customer'},</p>
        ${urgent
          ? `<p style="font-size: 14px; color: #374151; line-height: 1.6; background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 16px 0;"><strong>Your BiasharaLedger subscription will expire tomorrow!</strong> To avoid interruption of service, please renew your license immediately.</p>`
          : `<p style="font-size: 14px; color: #374151; line-height: 1.6;">This is a reminder that your BiasharaLedger subscription will expire on <strong>${new Date(params.expiresAt).toLocaleDateString()}</strong>.</p>`
        }

        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">License Information</p>
          <p style="font-size: 16px; font-weight: 700; color: #111827; letter-spacing: 1px; font-family: monospace; margin: 0 0 12px;">${params.licenseKey}</p>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">Expires: <strong>${new Date(params.expiresAt).toLocaleDateString()}</strong> (${params.daysRemaining} day${params.daysRemaining === 1 ? '' : 's'} remaining)</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${renewalUrl}" style="display: inline-block; background: ${bgColor}; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">Renew Now</a>
        </div>

        <p style="font-size: 14px; color: #374151; line-height: 1.6;">To avoid any interruption to your service, please renew your license before the expiry date. If you have any questions or need assistance, our support team is here to help.</p>
        <p style="font-size: 14px; color: #374151; margin-top: 20px;">Best regards,<br><strong>The ${fromName} Team</strong></p>
      </div>
      <div style="text-align: center; padding: 20px; background: #f3f4f6; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 12px; color: #6b7280; margin: 0;">&copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: params.to,
      subject: urgent
        ? `[URGENT] Your ${fromName} License Expires Tomorrow!`
        : `[Reminder] Your ${fromName} License Expires in ${params.daysRemaining} Days`,
      html,
    });
    logInfo('email', 'Expiry reminder sent', { to: params.to, daysRemaining: params.daysRemaining });
    return { sent: true };
  } catch (err: any) {
    logError('email', 'Failed to send expiry reminder', { error: err.message });
    return { sent: false, error: err.message };
  }
}

export async function sendLicenseExtendedEmail(params: {
  to: string;
  name: string;
  licenseKey: string;
  plan: string;
  newExpiresAt: string;
  additionalMonths: number;
}) {
  const transporter = await createTransporter();
  if (!transporter) {
    logInfo('email', `Dev: License extended email for ${params.to}`);
    return { sent: true, dev: true };
  }

  const config = await getSmtpConfig();
  const fromName = config?.fromName || 'BiasharaLedger';
  const fromAddr = config?.fromAddr || '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700;">License Extended!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Your subscription has been extended</p>
      </div>
      <div style="padding: 32px; background: #fff; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 16px;">Dear ${params.name || 'Valued Customer'},</p>
        <p style="font-size: 14px; color: #374151; line-height: 1.6;">Great news! Your BiasharaLedger license has been successfully extended by <strong>${params.additionalMonths} month${params.additionalMonths === 1 ? '' : 's'}</strong>.</p>

        <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Updated License Details</p>
          <p style="font-size: 18px; font-weight: 700; color: #991b1b; letter-spacing: 2px; font-family: monospace; margin: 8px 0;">${params.licenseKey}</p>
          <table style="width: auto; margin: 12px auto 0; font-size: 13px;">
            <tr><td style="color: #6b7280; padding: 2px 8px;">Plan:</td><td style="padding: 2px 8px; font-weight: 600;">${params.plan.charAt(0).toUpperCase() + params.plan.slice(1)}</td></tr>
            <tr><td style="color: #6b7280; padding: 2px 8px;">Status:</td><td style="padding: 2px 8px; font-weight: 600; color: #ef4444;">Active</td></tr>
            <tr><td style="color: #6b7280; padding: 2px 8px;">New Expires:</td><td style="padding: 2px 8px; font-weight: 600;">${new Date(params.newExpiresAt).toLocaleDateString()}</td></tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #374151; line-height: 1.6;">You can continue using all features of BiasharaLedger without any interruption. Thank you for your continued trust in our platform!</p>
        <p style="font-size: 14px; color: #374151; margin-top: 20px;">Best regards,<br><strong>The ${fromName} Team</strong></p>
      </div>
      <div style="text-align: center; padding: 20px; background: #f3f4f6; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 12px; color: #6b7280; margin: 0;">&copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: params.to,
      subject: `Your ${fromName} License Has Been Extended!`,
      html,
    });
    logInfo('email', 'License extended email sent', { to: params.to });
    return { sent: true };
  } catch (err: any) {
    logError('email', 'Failed to send license extended email', { error: err.message });
    return { sent: false, error: err.message };
  }
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const transporter = await createTransporter();
  if (!transporter) {
    logInfo('email', `Dev: Password reset email for ${params.to}`);
    return { sent: true, dev: true };
  }

  const config = await getSmtpConfig();
  const fromName = config?.fromName || 'BiasharaLedger';
  const fromAddr = config?.fromAddr || '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700;">Password Reset</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Request to reset your password</p>
      </div>
      <div style="padding: 32px; background: #fff; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 16px;">Dear ${params.name || 'Valued Customer'},</p>
        <p style="font-size: 14px; color: #374151; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password:</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.resetUrl}" style="display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">Reset Password</a>
        </div>

        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="font-size: 13px; color: #92400e; margin: 0;"><strong>Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #3b82f6; word-break: break-all;">${params.resetUrl}</p>
        <p style="font-size: 14px; color: #374151; margin-top: 20px;">Best regards,<br><strong>The ${fromName} Team</strong></p>
      </div>
      <div style="text-align: center; padding: 20px; background: #f3f4f6; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 12px; color: #6b7280; margin: 0;">&copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: params.to,
      subject: `Reset Your ${fromName} Password`,
      html,
    });
    logInfo('email', 'Password reset email sent', { to: params.to });
    return { sent: true };
  } catch (err: any) {
    logError('email', 'Failed to send password reset email', { error: err.message });
    return { sent: false, error: err.message };
  }
}

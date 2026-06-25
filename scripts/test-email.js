/**
 * SMTP Email Test Script
 * =======================
 * Tests Gmail SMTP configuration and sends a test OTP email.
 *
 * Usage:
 *   1. Update SMTP_USER and SMTP_PASS in .env.local
 *   2. Run: node scripts/test-email.js
 *   3. Check the recipient's inbox (and spam folder)
 *
 * Generate a Gmail App Password:
 *   Google Account → Security → 2-Step Verification (enable)
 *   → App Passwords → Select "Mail" + "Mac" → Generate
 *   → Copy the 16-character password
 */

// Load .env.local
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const nodemailer = require('nodemailer');

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     BiasharaLedger SMTP Test Script         ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  const {
    SMTP_HOST, SMTP_PORT, SMTP_SECURE,
    SMTP_USER, SMTP_PASS,
    EMAIL_FROM_NAME, EMAIL_FROM_ADDRESS,
  } = process.env;

  const host = SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(SMTP_PORT || '587', 10);
  const secure = SMTP_SECURE === 'true' || port === 465;
  const user = SMTP_USER;
  const pass = SMTP_PASS;
  const fromName = EMAIL_FROM_NAME || 'BiasharaLedger';
  const fromAddr = EMAIL_FROM_ADDRESS || user;

  // ── Validate ──
  if (!user || !pass || user === 'your-email@gmail.com' || pass === 'your-16-char-gmail-app-password') {
    console.error('❌ SMTP credentials not configured.');
    console.error('');
    console.error('   Edit .env.local and set SMTP_USER and SMTP_PASS:');
    console.error('');
    console.error('   SMTP_USER=your-email@gmail.com');
    console.error('   SMTP_PASS=your-16-char-gmail-app-password');
    console.error('');
    console.error('💡 Generate a Gmail App Password:');
    console.error('   1. https://myaccount.google.com/security');
    console.error('   2. Enable 2-Step Verification');
    console.error('   3. App Passwords → Generate');
    process.exit(1);
  }

  // ── Test SMTP connection ──
  console.log(`📧 SMTP Host: ${host}:${port} (secure: ${secure})`);
  console.log(`📧 SMTP User: ${user}`);
  console.log(`📧 From: ${fromName} <${fromAddr}>`);
  console.log('');

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    logger: true,
    debug: true,
  });

  console.log('⏳ Verifying SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
  } catch (err) {
    console.error('❌ SMTP connection failed:', err.message);
    if (err.code === 'EAUTH') {
      console.error('');
      console.error('🔑 Authentication failed. Make sure you are using an App Password:');
      console.error('   Google Account → Security → App Passwords');
    }
    process.exit(1);
  }

  // ── Send test email ──
  const testEmail = process.argv[2] || user;
  console.log('');
  console.log(`⏳ Sending test OTP to ${testEmail}...`);
  console.log('');

  const testCode = '123456';

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: testEmail,
      subject: 'BiasharaLedger - SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #df1c1c; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">${fromName}</h1>
          </div>
          <div style="padding: 24px; background: #fff; border: 1px solid #eee;">
            <p style="font-size: 14px; color: #333;">This is a test email from BiasharaLedger.</p>
            <p style="font-size: 14px; color: #333;">Your test verification code is:</p>
            <div style="text-align: center; padding: 16px; margin: 16px 0; background: #f8f8f8; border-radius: 8px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #df1c1c;">${testCode}</div>
            <p style="font-size: 12px; color: #888;">If you received this, SMTP is configured correctly!</p>
          </div>
        </div>
      `,
    });

    console.log('✅ TEST EMAIL SENT SUCCESSFULLY!');
    console.log(`   To: ${testEmail}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log('');
    console.log('📬 Check your inbox (and spam folder).');
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  SMTP is working! OTPs will be delivered.  ║');
    console.log('╚══════════════════════════════════════════════╝');
  } catch (err) {
    console.error('❌ Failed to send test email:', err.message);
    if (err.code === 'EAUTH') {
      console.error('🔑 Check your App Password.');
    }
    if (err.code === 'ESOCKET' || err.code === 'ECONNECTION') {
      console.error('🌐 Network issue — check your internet connection.');
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

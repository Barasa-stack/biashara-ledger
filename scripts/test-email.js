const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

async function testSmtp() {
  console.log('\n=== SMTP Configuration Test ===\n');

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || '587';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log('SMTP credentials not found in environment.');
    console.log('Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local\n');
    console.log('Current env:');
    console.log(`  SMTP_HOST: ${host || '(not set)'}`);
    console.log(`  SMTP_PORT: ${port}`);
    console.log(`  SMTP_USER: ${user || '(not set)'}`);
    console.log(`  SMTP_PASS: ${pass ? '***' : '(not set)'}`);
    process.exit(1);
  }

  console.log(`Testing SMTP connection to ${host}:${port}...`);
  console.log(`  User: ${user}\n`);

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: port === '465',
    auth: { user, pass },
    logger: true,
    debug: true,
    connectionTimeout: 10000,
  });

  try {
    await transporter.verify();
    console.log('\n✅ SMTP connection verified successfully!\n');
    console.log('SMTP configuration is working correctly.');
    console.log('Your application will be able to send emails.\n');
  } catch (err) {
    console.error('\n❌ SMTP connection failed:', err.message);
    console.error('\nPossible issues:');
    console.error('  1. SMTP credentials are incorrect');
    console.error('  2. SMTP server is not reachable');
    console.error('  3. Port may be blocked by firewall');
    console.error('  4. For Gmail: Use an App Password (not your regular password)');
    console.error('  5. For Gmail: Enable "Less secure app access" or use OAuth2\n');
    process.exit(1);
  }
}

testSmtp().catch(console.error);

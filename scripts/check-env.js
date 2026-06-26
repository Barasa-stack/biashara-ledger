const path = require('path');
const fs = require('fs');

console.log('\n=== Environment Variables Check ===\n');

const envPath = path.resolve(__dirname, '..', '.env.local');
const prodEnvPath = path.resolve(__dirname, '..', '.env.production');

if (!fs.existsSync(envPath)) {
  console.warn('⚠️  .env.local not found!');
} else {
  console.log('✅ .env.local exists');
}

if (!fs.existsSync(prodEnvPath)) {
  console.warn('⚠️  .env.production not found!');
} else {
  console.log('✅ .env.production exists');
}

const requiredVars = [
  'PGHOST',
  'PGPORT',
  'PGDATABASE',
  'PGUSER',
  'DATABASE_URL',
  'ENCRYPTION_KEY',
  'OTP_EXPIRY_MINUTES',
  'OTP_LENGTH',
  'NEXT_PUBLIC_APP_URL',
  'APP_URL',
  'ADMIN_EMAIL',
  'LICENSE_SECRET',
];

console.log('\nChecking required environment variables...\n');

const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');
const definedVars = new Set();

for (const line of envLines) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const match = trimmed.match(/^([^=]+)=/);
    if (match) {
      definedVars.add(match[1]);
    }
  }
}

let allPresent = true;
for (const varName of requiredVars) {
  const isSet = definedVars.has(varName);
  const val = process.env[varName] || '';
  if (isSet || val) {
    const displayVal = varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASS')
      ? '***' : (process.env[varName] || '(from file)');
    console.log(`✅ ${varName} = ${displayVal}`);
  } else {
    console.warn(`❌ ${varName} is NOT SET`);
    allPresent = false;
  }
}

if (allPresent) {
  console.log('\n✅ All required environment variables are set!\n');
} else {
  console.warn('\n⚠️  Some environment variables are missing. Check .env.local\n');
}

const smtpHost = process.env.SMTP_HOST || envContent.match(/SMTP_HOST=(.+)/)?.[1];
if (!smtpHost) {
  console.log('ℹ️  SMTP is not configured in env vars (will use DB-based config)');
} else {
  console.log(`ℹ️  SMTP_HOST = ${smtpHost}`);
}

console.log('\n=== Check Complete ===\n');

/**
 * License Key Generator for BiasharaLedger
 * Usage: node scripts/generate-license.js --email=user@example.com --plan=premium --years=1
 */
const crypto = require('crypto');

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, val] = arg.replace('--', '').split('=');
  acc[key] = val;
  return acc;
}, {});

const SECRET = process.env.LICENSE_SECRET || (() => { throw new Error('LICENSE_SECRET env var required'); })();
const PLAN = args.plan || 'standard';
const YEARS = parseInt(args.years) || 1;
const EMAIL = args.email || '';
const COUNT = parseInt(args.count) || 1;

function generateLicenseKey(email) {
  const uuid = crypto.randomUUID();
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(email + uuid);
  const signature = hmac.digest('hex').substring(0, 16);
  const year = new Date().getFullYear();
  return `BL-${year}-${uuid.substring(0, 8)}-${signature}`;
}

function generateSQL(count) {
  const now = new Date();
  const expiry = new Date(now.getTime() + YEARS * 365 * 24 * 60 * 60 * 1000);

  console.log(`-- BiasharaLedger Admin License Keys (${PLAN})`);
  console.log(`-- Generated: ${now.toISOString()}`);
  console.log(`-- Expiry: ${expiry.toISOString()}`);
  console.log(`-- Count: ${count}`);
  console.log();

  for (let i = 0; i < count; i++) {
    const key = generateLicenseKey(EMAIL || `user${i}@example.com`);
    console.log(`INSERT INTO admin_license_keys (license_key, plan, is_active, is_used, expires_at) VALUES`);
    console.log(`  ('${key}', '${PLAN}', true, false, '${expiry.toISOString()}');`);
    console.log();
  }
}

function generateJSON(count) {
  const config = LICENSE_TYPES[TYPE] || LICENSE_TYPES.trial;
  const now = new Date();
  const expiry = new Date(now.getTime() + config.duration * 24 * 60 * 60 * 1000);
  const licenses = [];

  for (let i = 0; i < count; i++) {
    licenses.push({
      licenseKey: generateKey(),
      licenseId: generateLicenseId(),
      type: TYPE,
      status: 'active',
      expiryDate: expiry.toISOString(),
      features: config.features,
      duration: config.duration,
      price: config.price,
      email: EMAIL || null,
    });
  }

  console.log(JSON.stringify(licenses, null, 2));
}

console.log('\n=== BiasharaLedger License Key Generator ===\n');
console.log(`Type: ${TYPE}`);
console.log(`Duration: ${LICENSE_TYPES[TYPE]?.duration || DURATION} days`);
console.log(`Count: ${COUNT}`);
console.log(`Email: ${EMAIL || 'N/A'}`);
console.log();

if (args.format === 'json') {
  generateJSON(COUNT);
} else {
  generateSQL(COUNT);
}

console.log('\nTo insert into database:');
console.log(`  psql -d biashara_ledger -f licenses.sql`);
console.log('\nOr copy the INSERT statements above and run them directly.');

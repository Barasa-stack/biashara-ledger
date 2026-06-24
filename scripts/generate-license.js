/**
 * License Key Generator for BiasharaLedger
 * Usage: node scripts/generate-license.js --type=standard --duration=365 --email=user@example.com
 */
const crypto = require('crypto');

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, val] = arg.replace('--', '').split('=');
  acc[key] = val;
  return acc;
}, {});

const TYPE = args.type || 'trial';
const DURATION = parseInt(args.duration) || 14;
const EMAIL = args.email || '';
const COUNT = parseInt(args.count) || 1;

const LICENSE_TYPES = {
  trial: { duration: 14, features: ['all'], price: 'Free' },
  standard: { duration: 365, features: ['all'], price: '$49' },
  premium: { duration: 99999, features: ['all', 'updates'], price: '$199' },
  enterprise: { duration: 365, features: ['all', 'multi_user', 'support'], price: '$299/year' },
};

function generateKey() {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(3).toString('hex').toUpperCase());
  }
  return segments.join('-');
}

function generateLicenseId() {
  return 'BL-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

function generateSQL(count) {
  const config = LICENSE_TYPES[TYPE] || LICENSE_TYPES.trial;
  const now = new Date();
  const expiry = new Date(now.getTime() + config.duration * 24 * 60 * 60 * 1000);

  console.log(`-- BiasharaLedger License Keys (${TYPE})`);
  console.log(`-- Generated: ${now.toISOString()}`);
  console.log(`-- Expiry: ${expiry.toISOString()}`);
  console.log(`-- Count: ${count}`);
  console.log();

  for (let i = 0; i < count; i++) {
    const key = generateKey();
    const lid = generateLicenseId();
    const features = JSON.stringify(config.features);

    console.log(`INSERT INTO licenses (license_key, license_id, type, status, expiry_date, features, allowed_installations) VALUES`);
    console.log(`  ('${key}', '${lid}', '${TYPE}', 'active', '${expiry.toISOString()}', '${features}', 1);`);
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

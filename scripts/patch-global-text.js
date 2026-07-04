#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🌍 PATCHING AFRICA-SPECIFIC TEXT TO GLOBAL\n');
console.log('═'.repeat(60));

// ============================================
// 1. HOME PAGE
// ============================================
const homePath = 'src/app/(marketing)/page.tsx';
console.log(`\n📄 Patching: ${homePath}`);

let homeContent = fs.readFileSync(homePath, 'utf8');

// Change 1: "in Africa" → "for the Modern Enterprise"
homeContent = homeContent.replace(
  /in Africa\.\.\./g,
  'for the Modern Enterprise...'
);

// Change 2: African businesses → businesses worldwide
homeContent = homeContent.replace(
  /for African businesses — inventory, sales, accounting, payroll, and reporting designed for your market\./g,
  'for businesses worldwide — inventory, sales, accounting, payroll, and reporting designed for your needs.'
);

fs.writeFileSync(homePath, homeContent);
console.log('  ✅ Home page patched');

// ============================================
// 2. ABOUT PAGE
// ============================================
const aboutPath = 'src/app/(marketing)/about/page.tsx';
console.log(`\n📄 Patching: ${aboutPath}`);

let aboutContent = fs.readFileSync(aboutPath, 'utf8');

// Change 1: Value card - "Built for African businesses"
aboutContent = aboutContent.replace(
  /'Built for African businesses\. Local tax compliance and payment methods are first-class features\.'/g,
  "'Built for businesses everywhere. Local compliance, multi-currency, and payment methods are first-class features.'"
);

// Change 2: Hero subtitle - remove Africa and M-Pesa references
aboutContent = aboutContent.replace(
  /subtitle="We built BiasharaLedger because businesses deserve tools that understand their market — tax compliance, M-Pesa reconciliation, and the real way business works across Africa\."/g,
  'subtitle="We built BiasharaLedger because businesses deserve tools that understand their market — tax compliance, payment reconciliation, and the real way business works across the globe."'
);

// Change 3: Story paragraph - "designed specifically for African businesses"
aboutContent = aboutContent.replace(
  /payroll, and reporting — designed specifically for African businesses\./g,
  'payroll, and reporting — designed for businesses everywhere.'
);

fs.writeFileSync(aboutPath, aboutContent);
console.log('  ✅ About page patched');

// ============================================
// 3. CONTACT PAGE
// ============================================
const contactPath = 'src/app/(marketing)/contact/page.tsx';
console.log(`\n📄 Patching: ${contactPath}`);

let contactContent = fs.readFileSync(contactPath, 'utf8');

// Change: Location - "Nairobi, Kenya" → "Global Headquarters"
contactContent = contactContent.replace(
  /<p className="text-sm text-gray-600">Nairobi, Kenya<\/p>/g,
  '<p className="text-sm text-gray-600">Global Headquarters</p>'
);

fs.writeFileSync(contactPath, contactContent);
console.log('  ✅ Contact page patched');

// ============================================
// SUMMARY
// ============================================
console.log('\n' + '═'.repeat(60));
console.log('\n✅ PATCH COMPLETE!');
console.log('\n📋 Changes made:');
console.log('  1. Home: "in Africa" → "for the Modern Enterprise"');
console.log('  2. Home: "African businesses" → "businesses worldwide"');
console.log('  3. About: Value card text updated to global');
console.log('  4. About: Hero subtitle updated (removed M-Pesa, Africa)');
console.log('  5. About: Story text updated to "businesses everywhere"');
console.log('  6. Contact: "Nairobi, Kenya" → "Global Headquarters"');
console.log('\n⚠️  NO design, font, color, or theme changes were made.');
console.log('   Only text content was updated.');
console.log('\n🔍 To verify changes, run:');
console.log('   grep -n "Africa\\|Kenya\\|African" src/app/\\\\(marketing\\\\)/*/page.tsx');

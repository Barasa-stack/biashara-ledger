#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const pages = [
  { path: 'src/app/(marketing)/page.tsx', name: 'Home' },
  { path: 'src/app/(marketing)/about/page.tsx', name: 'About' },
  { path: 'src/app/(marketing)/features/page.tsx', name: 'Features' },
  { path: 'src/app/(marketing)/pricing/page.tsx', name: 'Pricing' },
  { path: 'src/app/(marketing)/contact/page.tsx', name: 'Contact' },
  { path: 'src/app/(marketing)/industries/page.tsx', name: 'Industries' },
  { path: 'src/app/(marketing)/download/page.tsx', name: 'Download' },
];

const africaTerms = [
  'Africa', 'African', 'Kenya', 'Kenyan', 'Nairobi', 
  'SMEs in Kenya', 'Kenyan businesses', 'African market',
  'East Africa', 'East African', 'M-Pesa', 'mpesa',
  'KRA', 'KRA compliance', 'Kenya Revenue Authority'
];

console.log('\n🔍 AUDITING PAGES FOR AFRICA-SPECIFIC TEXT\n');
console.log('═'.repeat(60));

pages.forEach(({ path: filePath, name }) => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ ${name}: File not found`);
      return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    let found = false;
    
    console.log(`\n📄 ${name} Page (${filePath}):`);
    
    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      let matched = false;
      let matchedTerms = [];
      
      africaTerms.forEach(term => {
        if (lowerLine.includes(term.toLowerCase())) {
          matched = true;
          matchedTerms.push(term);
        }
      });
      
      // Also check for context like "for Kenyan businesses" or "in Africa"
      if (lowerLine.includes('africa') || lowerLine.includes('kenya') || lowerLine.includes('african')) {
        matched = true;
        if (!matchedTerms.length) {
          matchedTerms.push('Africa/Kenya context');
        }
      }
      
      if (matched && !line.includes('//') && !line.includes('/*') && !line.includes('*')) {
        found = true;
        console.log(`  Line ${index + 1}: ${line.trim().substring(0, 100)}...`);
        console.log(`    → Contains: ${matchedTerms.join(', ')}`);
      }
    });
    
    if (!found) {
      console.log(`  ✅ No Africa-specific text found`);
    }
  } catch (err) {
    console.log(`❌ Error reading ${name}:`, err.message);
  }
});

console.log('\n' + '═'.repeat(60));
console.log('✅ Audit complete!');

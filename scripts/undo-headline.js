const fs = require('fs');

const homePath = 'src/app/(marketing)/page.tsx';
let content = fs.readFileSync(homePath, 'utf8');

// Restore the original headline
content = content.replace(
  /The Future of\n\s*<br \/>\n\s*<span className="gradient-text-shine">Business Management<\/span>\n\s*<br \/>\n\s*<span className="text-white\/80 text-2xl md:text-3xl">For the Modern Enterprise<\/span>/g,
  'The Future of\n            <br />\n            <span className="gradient-text-shine">Business Management</span>\n            <br />\n            in Africa'
);

fs.writeFileSync(homePath, content);
console.log('✅ Headline restored to original!');
console.log('  Headline: "The Future of Business Management in Africa"');

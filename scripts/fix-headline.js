const fs = require('fs');

const homePath = 'src/app/(marketing)/page.tsx';
let content = fs.readFileSync(homePath, 'utf8');

// Fix the main headline - remove "in Africa" from the hero title
content = content.replace(
  /The Future of\n\s*<br \/>\n\s*<span className="gradient-text-shine">Business Management<\/span>\n\s*<br \/>\n\s*in Africa/g,
  'The Future of\n            <br />\n            <span className="gradient-text-shine">Business Management</span>\n            <br />\n            <span className="text-white/80 text-2xl md:text-3xl">For the Modern Enterprise</span>'
);

fs.writeFileSync(homePath, content);
console.log('✅ Headline updated!');
console.log('  New headline: "The Future of Business Management"');
console.log('  Sub-text: "For the Modern Enterprise"');

const fs = require('fs');
const path = require('path');

const initPath = path.join(__dirname, '..', 'src', 'lib', 'init.ts');
let content = fs.readFileSync(initPath, 'utf8');

// Fix the logInfo call
content = content.replace(
  /logInfo\('init', 'Tables exist:', String\(tablesExist\)\);/,
  "logInfo('init', 'Tables exist:', { exists: tablesExist });"
);

fs.writeFileSync(initPath, content);
console.log('✅ init.ts patched');

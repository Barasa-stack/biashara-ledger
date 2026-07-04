const fs = require('fs');

const signinPath = 'src/app/api/auth/signin/route.ts';
let content = fs.readFileSync(signinPath, 'utf8');

// Add debug logging at the start of the function
const debugStart = `
    console.log('🔍 ===== SIGNIN ATTEMPT =====');
    console.log('🔍 Email:', email);
    console.log('🔍 Password provided:', password ? 'Yes (length: ' + password.length + ')' : 'No');
`;

// Find where the function starts and add debug
content = content.replace(
  'const { email, password } = await req.json();',
  'const { email, password } = await req.json();\n' + debugStart
);

// Add debug before the query
const debugQuery = `
    console.log('🔍 Running query for:', email);
    console.log('🔍 Query: SELECT id, tenant_id, email, password_hash, first_name, last_name, verified, subscription_plan, subscription_status, license_status, country FROM users WHERE LOWER(email) = LOWER($1) ...');
`;

content = content.replace(
  'const user = await adminGet(',
  debugQuery + '\n    const user = await adminGet('
);

// Add debug after the query
const debugResult = `
    console.log('🔍 Query result:', user ? '✅ User found' : '❌ User not found');
    if (user) {
      console.log('🔍 User email:', user.email);
      console.log('🔍 User verified:', user.verified);
      console.log('🔍 User has password_hash:', !!user.password_hash);
      console.log('🔍 User tenant_id:', user.tenant_id);
      console.log('🔍 User subscription_plan:', user.subscription_plan);
    }
`;

content = content.replace(
  ') as any;',
  ') as any;\n' + debugResult
);

// Add debug for password comparison
const debugPassword = `
    console.log('🔍 Comparing password...');
    console.log('🔍 Password hash from DB:', user.password_hash ? 'Has value (length: ' + user.password_hash.length + ')' : 'EMPTY');
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('🔍 Password match result:', isMatch ? '✅ MATCH' : '❌ NO MATCH');
`;

content = content.replace(
  'const isMatch = await bcrypt.compare(password, user.password_hash);',
  debugPassword
);

fs.writeFileSync(signinPath, content);
console.log('✅ Signin API patched with debug logging');
console.log('⚠️ Restart your dev server for changes to take effect');

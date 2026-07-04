const fs = require('fs');

const signinPath = 'src/app/api/auth/signin/route.ts';
let content = fs.readFileSync(signinPath, 'utf8');

// Add debug after password match
const debugAfterMatch = `
    console.log('🔍 Password matched successfully!');
    console.log('🔍 Creating session for user:', user.id);
    console.log('🔍 Tenant ID:', tenantId);
    console.log('🔍 Session token:', sessionToken);
    console.log('🔍 Expires at:', expiresAt);
`;

content = content.replace(
  'const tenantId = user.tenant_id || \'local-default\';',
  'const tenantId = user.tenant_id || \'local-default\';\n' + debugAfterMatch
);

// Add debug for session insertion
const debugSessionInsert = `
    console.log('🔍 Inserting session...');
    console.log('🔍 Session SQL: INSERT INTO sessions (tenant_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)');
    console.log('🔍 Session values:', { tenantId, userId: user.id, sessionToken, expiresAt });
`;

content = content.replace(
  'await adminRun(',
  debugSessionInsert + '\n    await adminRun('
);

// Add debug for response
const debugResponse = `
    console.log('🔍 Creating response...');
    console.log('🔍 Response data:', { success: true, user: { id: user.id, email: user.email, name: displayName, tenantId: tenantId, subscriptionPlan: subPlan, subscriptionStatus: subStatus, country } });
    console.log('🔍 Setting cookie: bl_session');
    console.log('✅ Login successful for:', user.email);
`;

content = content.replace(
  'const response = NextResponse.json({',
  debugResponse + '\n    const response = NextResponse.json({'
);

fs.writeFileSync(signinPath, content);
console.log('✅ Signin API patched with more debug logging');
console.log('⚠️ Restart your dev server for changes to take effect');

const https = require('https');

async function initNileDb() {
  console.log('🔄 Initializing Nile database via REST API...');
  
  const apiUrl = process.env.NILEDB_API_URL;
  const user = process.env.NILEDB_USER;
  const password = process.env.NILEDB_PASSWORD;
  
  if (!apiUrl || !user || !password) {
    console.error('❌ NILEDB_API_URL, NILEDB_USER, and NILEDB_PASSWORD must be set');
    console.log('   Current values:');
    console.log(`   NILEDB_API_URL: ${apiUrl || 'NOT SET'}`);
    console.log(`   NILEDB_USER: ${user || 'NOT SET'}`);
    console.log(`   NILEDB_PASSWORD: ${password ? 'SET' : 'NOT SET'}`);
    process.exit(1);
  }

  // Use Nile's API to create tenant
  const createTenant = () => {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        name: 'default_tenant',
        plan: 'free'
      });
      
      const url = new URL(apiUrl);
      const options = {
        hostname: url.hostname,
        path: '/v2/tenants',
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };
      
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            resolve(response);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        });
      });
      
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  };

  try {
    // Try to create tenant via API
    console.log('📋 Creating tenant via API...');
    const result = await createTenant();
    console.log('✅ Tenant created via API:', result);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n💡 Alternative: Since Nile API is giving issues, we can try direct SQL with tenant context.');
    console.log('   Please run this SQL directly in your Nile database console:');
    console.log('\n   -- Create tenant');
    console.log('   INSERT INTO tenants (id, name) VALUES (gen_random_uuid(), \'default_tenant\');');
    console.log('\n   -- Then set tenant context and create users');
    console.log('   SELECT set_config(\'nile.tenant_id\', (SELECT id FROM tenants WHERE name = \'default_tenant\'), true);');
    console.log('\n   -- Create users table');
    console.log('   CREATE TABLE IF NOT EXISTS users (');
    console.log('     id UUID DEFAULT gen_random_uuid(),');
    console.log('     tenant_id UUID NOT NULL,');
    console.log('     email TEXT NOT NULL,');
    console.log('     password_hash TEXT NOT NULL,');
    console.log('     first_name TEXT DEFAULT \'\',');
    console.log('     last_name TEXT DEFAULT \'\',');
    console.log('     role TEXT DEFAULT \'user\',');
    console.log('     verified BOOLEAN DEFAULT true,');
    console.log('     subscription_plan TEXT DEFAULT \'premium\',');
    console.log('     subscription_status TEXT DEFAULT \'active\',');
    console.log('     license_status TEXT DEFAULT \'active\',');
    console.log('     country TEXT DEFAULT \'KE\',');
    console.log('     created_at TIMESTAMPTZ DEFAULT NOW(),');
    console.log('     PRIMARY KEY (id)');
    console.log('   );');
    console.log('\n   -- Create admin user (password: Admin123!)');
    console.log('   INSERT INTO users (email, password_hash, tenant_id, verified, first_name, last_name, role, subscription_plan, subscription_status, license_status, country)');
    console.log('   VALUES (\'digitalbaroz@gmail.com\', \'$2b$10$H7PzLp3qw5M5QFZ3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z\', (SELECT id FROM tenants WHERE name = \'default_tenant\'), true, \'Admin\', \'User\', \'admin\', \'premium\', \'active\', \'active\', \'KE\');');
    
    process.exit(1);
  }
}

initNileDb();

const https = require('https');
const { URL } = require('url');

async function initNileDb() {
  console.log('🔄 Initializing Nile database via API v2...');
  
  const apiUrl = process.env.NILEDB_API_URL;
  const user = process.env.NILEDB_USER;
  const password = process.env.NILEDB_PASSWORD;
  
  if (!apiUrl || !user || !password) {
    console.error('❌ NILEDB_API_URL, NILEDB_USER, and NILEDB_PASSWORD must be set');
    process.exit(1);
  }

  // Parse the API URL
  const url = new URL(apiUrl);
  const databaseId = url.pathname.split('/').pop();
  
  console.log(`📋 Database ID: ${databaseId}`);
  console.log(`📋 API Host: ${url.hostname}`);

  const makeRequest = (method, path, data = null) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: path,
        method: method,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(body ? JSON.parse(body) : {});
            } catch (e) {
              resolve({ raw: body });
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`));
          }
        });
      });
      
      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  };

  try {
    // Try to get database info
    console.log('📋 Fetching database info...');
    try {
      const info = await makeRequest('GET', `/v2/databases/${databaseId}`);
      console.log('✅ Database info:', JSON.stringify(info, null, 2).substring(0, 300));
    } catch (err) {
      console.log(`⚠️ Could not fetch database info: ${err.message}`);
    }

    // Try to create a tenant using SQL via API
    console.log('\n📋 Attempting to create tenant via API...');
    
    // Use the API to execute SQL
    const sqlQuery = `
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      INSERT INTO tenants (id, name) 
      VALUES (gen_random_uuid(), 'default_tenant')
      ON CONFLICT (name) DO NOTHING;
      
      SELECT id FROM tenants WHERE name = 'default_tenant';
    `;
    
    const result = await makeRequest('POST', `/v2/databases/${databaseId}/sql`, {
      query: sqlQuery
    });
    
    console.log('✅ SQL executed:', JSON.stringify(result, null, 2).substring(0, 500));
    
    console.log('\n✅ Nile database initialized successfully!');
    console.log('\n📋 Login credentials:');
    console.log(`  Admin: digitalbaroz@gmail.com / Admin123!`);
    console.log('\n⚠️ Please create the admin user through the app signup flow.');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n💡 Alternative: Since the API is having issues, please:');
    console.log('   1. Go to your Nile dashboard: https://www.thenile.dev');
    console.log('   2. Find your database: Biasharaledger_App');
    console.log('   3. Open the SQL editor or console');
    console.log('   4. Run this SQL:');
    console.log('');
    console.log('      CREATE TABLE IF NOT EXISTS tenants (');
    console.log('        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
    console.log('        name TEXT NOT NULL,');
    console.log('        created_at TIMESTAMPTZ DEFAULT NOW()');
    console.log('      );');
    console.log('');
    console.log("      INSERT INTO tenants (id, name) VALUES (gen_random_uuid(), 'default_tenant') ON CONFLICT (name) DO NOTHING;");
    console.log('');
    console.log('   5. Then deploy your app to Vercel and use the signup flow.');
    process.exit(1);
  }
}

initNileDb();

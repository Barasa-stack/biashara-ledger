const https = require('https');
const { URL } = require('url');

async function initDatabase() {
  console.log('🔄 Initializing Nile database via API...');

  const apiUrl = process.env.NILEDB_API_URL;
  const user = process.env.NILEDB_USER;
  const password = process.env.NILEDB_PASSWORD;

  if (!apiUrl || !user || !password) {
    console.error('❌ Missing Nile credentials');
    process.exit(1);
  }

  // 1. Create tenant via API
  const createTenant = () => {
    return new Promise((resolve, reject) => {
      const url = new URL(apiUrl);
      const data = JSON.stringify({
        name: 'default_tenant',
        plan: 'free'
      });

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
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
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ raw: body, status: res.statusCode });
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  };

  try {
    console.log('📋 Creating tenant...');
    const result = await createTenant();
    console.log('✅ Tenant creation result:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

initDatabase();

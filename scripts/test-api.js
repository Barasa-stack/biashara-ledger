const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testEndpoint(method, path, body = null) {
  const url = new URL(path, BASE_URL);
  const options = {
    method,
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch { json = data; }
        resolve({ status: res.statusCode, ok: res.statusCode < 400, data: json });
      });
    });

    req.on('error', (err) => resolve({ status: 0, ok: false, data: { error: err.message } }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, ok: false, data: { error: 'Timeout' } }); });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n=== API Tests ===\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  const tests = [
    { name: 'Health Check', fn: () => testEndpoint('GET', '/api/health') },
    { name: 'License Generate (incomplete)', fn: () => testEndpoint('POST', '/api/license/generate', {}) },
    { name: 'License Activate (incomplete)', fn: () => testEndpoint('POST', '/api/license/activate', {}) },
    { name: 'Downloads Latest', fn: () => testEndpoint('GET', '/api/downloads/latest') },
    { name: 'Admin Clients (unauthorized)', fn: () => testEndpoint('GET', '/api/admin/clients') },
  ];

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result.ok || result.status === 400 || result.status === 401) {
        console.log(`✅ ${test.name} — ${result.status}`);
        passed++;
      } else {
        console.log(`❌ ${test.name} — ${result.status} ${JSON.stringify(result.data).slice(0, 100)}`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ${test.name} — Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

console.log('Make sure your Next.js app is running on', BASE_URL);
console.log('Run: npm run dev\n');

runTests().catch(console.error);

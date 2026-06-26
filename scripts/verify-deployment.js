const http = require('http');

const BASE_URL = process.env.DEPLOY_URL || process.env.VERCEL_URL || 'http://localhost:3000';

async function check(url, label) {
  return new Promise((resolve) => {
    const u = new URL(url, BASE_URL);
    const req = http.get({ hostname: u.hostname, port: u.port, path: u.pathname, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const ok = res.statusCode === 200;
        console.log(`${ok ? '✅' : '❌'} ${label} — ${res.statusCode}`);
        resolve(ok);
      });
    });
    req.on('error', (err) => {
      console.log(`❌ ${label} — ${err.message}`);
      resolve(false);
    });
    req.on('timeout', () => { req.destroy(); console.log(`❌ ${label} — Timeout`); resolve(false); });
  });
}

async function verifyDeployment() {
  console.log(`\n=== Post-Deployment Verification ===\n`);
  console.log(`URL: ${BASE_URL}\n`);

  const checks = [
    check('/api/health', 'Health Check'),
    check('/api/license/status', 'License Status API'),
    check('/api/downloads/latest', 'Download Links API'),
    check('/api/updates/latest', 'Updates API'),
    check('/api/admin/clients', 'Admin API (should return 401)'),
    check(`${BASE_URL}/`.replace(/\/*$/, '/'), 'Home Page'),
    check('/admin/login', 'Admin Login Page'),
  ];

  if (BASE_URL.startsWith('https://')) {
    console.log('\nℹ️  SSL is active (HTTPS)');
  }

  const results = await Promise.all(checks);
  const passed = results.filter(Boolean).length;
  const failed = results.filter(r => !r).length;

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

  if (failed > 0) {
    console.log('⚠️  Some checks failed. Review the issues before final deployment.\n');
    process.exit(1);
  } else {
    console.log('✅ All checks passed! Deployment is ready!\n');
  }
}

verifyDeployment().catch(console.error);

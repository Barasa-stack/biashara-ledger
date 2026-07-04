const { Pool } = require('pg');
require('dotenv').config();

async function listAllUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const result = await pool.query(`
      SELECT 
        u.email,
        u.tenant_id,
        t.name as tenant_name,
        u.role,
        u.verified
      FROM public.users u
      LEFT JOIN public.tenants t ON u.tenant_id = t.id
      ORDER BY u.email
    `);

    console.log('📋 All users in database:');
    console.log('═'.repeat(50));
    result.rows.forEach(row => {
      console.log(`  ${row.email}`);
      console.log(`    Tenant: ${row.tenant_name || 'No tenant'}`);
      console.log(`    Role: ${row.role}`);
      console.log(`    Verified: ${row.verified ? 'Yes' : 'No'}`);
      console.log('');
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

listAllUsers();

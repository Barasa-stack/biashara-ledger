const { Pool } = require('pg');
require('dotenv').config();

async function auditLocalDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 AUDITING LOCAL DATABASE\n');
    console.log('═'.repeat(60));

    // 1. Check tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables in local database:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log(`  Total: ${tables.rows.length} tables`);

    // 2. Check tenants
    const tenants = await pool.query(`
      SELECT id, name, created_at FROM tenants
    `);
    console.log(`\n📋 Tenants: ${tenants.rows.length}`);
    tenants.rows.forEach(t => {
      console.log(`  - ${t.name} (${t.id})`);
    });

    // 3. Check users
    const users = await pool.query(`
      SELECT id, email, role, verified, tenant_id FROM users
    `);
    console.log(`\n📋 Users: ${users.rows.length}`);
    users.rows.forEach(u => {
      console.log(`  - ${u.email} (${u.role}) - Verified: ${u.verified}`);
    });

    // 4. Check specific admin user
    const admin = await pool.query(`
      SELECT email, password_hash, tenant_id 
      FROM users WHERE email = 'digitalbaroz@gmail.com'
    `);
    
    if (admin.rows.length > 0) {
      console.log(`\n✅ Admin user found: digitalbaroz@gmail.com`);
      console.log(`  Tenant ID: ${admin.rows[0].tenant_id}`);
      console.log(`  Password hash: ${admin.rows[0].password_hash.substring(0, 30)}...`);
    } else {
      console.log(`\n❌ Admin user NOT found: digitalbaroz@gmail.com`);
    }

    // 5. Check test client
    const client = await pool.query(`
      SELECT email, password_hash, tenant_id 
      FROM users WHERE email = 'Mambombaya1992@gmail.com'
    `);
    
    if (client.rows.length > 0) {
      console.log(`\n✅ Test client found: Mambombaya1992@gmail.com`);
      console.log(`  Tenant ID: ${client.rows[0].tenant_id}`);
    } else {
      console.log(`\n❌ Test client NOT found: Mambombaya1992@gmail.com`);
    }

    // 6. Check company_settings
    const settings = await pool.query(`
      SELECT tenant_id, company_name, country, base_currency 
      FROM company_settings LIMIT 5
    `);
    console.log(`\n📋 Company settings: ${settings.rows.length}`);
    settings.rows.forEach(s => {
      console.log(`  - ${s.company_name || 'No name'} (${s.country || 'N/A'})`);
    });

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Audit complete!');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

auditLocalDb();

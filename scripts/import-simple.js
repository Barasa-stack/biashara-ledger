const { Pool } = require('pg');
require('dotenv').config();

async function importSimple() {
  console.log('🔄 Simple import to Nile...\n');
  
  const sourcePool = new Pool({
    connectionString: 'postgresql://postgres@localhost:5432/biashara_ledger',
  });

  const targetPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  try {
    // 1. Get tenant ID
    const tenants = await targetPool.query(`SELECT id, name FROM tenants LIMIT 1`);
    const tenantId = tenants.rows.length > 0 ? tenants.rows[0].id : null;
    console.log(`📋 Tenant ID: ${tenantId}`);

    // 2. Get users from source
    const users = await sourcePool.query(`
      SELECT email, password_hash, verified, first_name, last_name, role, 
             subscription_plan, subscription_status, license_status, country
      FROM users
    `);
    console.log(`📋 Found ${users.rows.length} users`);

    // 3. Insert users one by one
    let inserted = 0;
    for (const user of users.rows) {
      try {
        await targetPool.query(`
          INSERT INTO users (
            email, password_hash, tenant_id, verified, 
            first_name, last_name, role, 
            subscription_plan, subscription_status, license_status,
            country, created_at
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7,
            $8, $9, $10,
            $11, NOW()
          )
          ON CONFLICT (email) DO NOTHING
        `, [
          user.email, user.password_hash, tenantId, user.verified || true,
          user.first_name || '', user.last_name || '', user.role || 'user',
          user.subscription_plan || 'premium', user.subscription_status || 'active', user.license_status || 'active',
          user.country || 'KE'
        ]);
        inserted++;
        console.log(`  ✅ ${user.email}`);
      } catch (err) {
        console.log(`  ⚠️ ${user.email}: ${err.message.substring(0, 50)}`);
      }
    }

    // 4. Ensure super admin exists
    const adminCheck = await targetPool.query(`
      SELECT email FROM users WHERE email = 'digitalbaroz@gmail.com'
    `);
    
    if (adminCheck.rows.length === 0) {
      console.log('\n📋 Creating super admin...');
      await targetPool.query(`
        INSERT INTO users (
          email, password_hash, tenant_id, verified, 
          first_name, last_name, role, 
          subscription_plan, subscription_status, license_status,
          country, created_at
        ) VALUES (
          'digitalbaroz@gmail.com',
          '$2b$10$H7PzLp3qw5M5QFZ3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z',
          $1, true,
          'Digital', 'Baroz', 'super_admin',
          'premium', 'active', 'active',
          'KE', NOW()
        )
        ON CONFLICT (email) DO NOTHING
      `, [tenantId]);
      console.log('✅ Super admin created');
    } else {
      console.log('\n✅ Super admin already exists');
    }

    console.log(`\n✅ Import complete! Inserted ${inserted} users`);
    console.log('\n🔑 Try logging in:');
    console.log('  Admin URL: https://vibe-app-virid.vercel.app/admin/login');
    console.log('  Email: digitalbaroz@gmail.com');
    console.log('  Password: Admin123!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

importSimple();

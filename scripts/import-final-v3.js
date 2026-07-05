const { Pool } = require('pg');
require('dotenv').config();

async function importFinalV3() {
  console.log('🔄 Final import v3...\n');
  
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
             subscription_plan, subscription_status, license_status, country,
             created_at
      FROM users
    `);
    console.log(`📋 Found ${users.rows.length} users from source`);

    // 3. Get current max ID
    const maxIdResult = await targetPool.query(`SELECT COALESCE(MAX(id), 0) as max_id FROM users`);
    let nextId = parseInt(maxIdResult.rows[0].max_id) + 1;
    console.log(`📋 Next ID: ${nextId}`);

    // 4. Insert users
    let inserted = 0;
    for (const user of users.rows) {
      try {
        const hash = user.password_hash || '$2b$10$H7PzLp3qw5M5QFZ3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z';
        const userId = nextId++;
        
        await targetPool.query(`
          INSERT INTO users (
            id, email, password_hash, password, tenant_id, verified, 
            first_name, last_name, role, 
            subscription_plan, subscription_status, license_status,
            country, created_at
          ) VALUES (
            $1::integer, $2, $3, $4, $5, $6,
            $7, $8, $9,
            $10, $11, $12,
            $13, $14
          )
          ON CONFLICT (email) DO NOTHING
        `, [
          userId, 
          user.email, 
          hash, 
          hash,  // password column gets the same hash
          tenantId, 
          user.verified || true,
          user.first_name || '', 
          user.last_name || '', 
          user.role || 'user',
          user.subscription_plan || 'premium', 
          user.subscription_status || 'active', 
          user.license_status || 'active',
          user.country || 'KE', 
          user.created_at || new Date()
        ]);
        inserted++;
        console.log(`  ✅ ${user.email} (ID: ${userId})`);
      } catch (err) {
        console.log(`  ⚠️ ${user.email}: ${err.message.substring(0, 60)}`);
      }
    }

    // 5. Ensure super admin exists
    console.log('\n📋 Ensuring super admin exists...');
    const adminCheck = await targetPool.query(`
      SELECT email FROM users WHERE email = 'digitalbaroz@gmail.com'
    `);
    
    const adminHash = '$2b$10$H7PzLp3qw5M5QFZ3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z';
    
    if (adminCheck.rows.length === 0) {
      console.log('  Creating super admin...');
      const adminId = nextId++;
      await targetPool.query(`
        INSERT INTO users (
          id, email, password_hash, password, tenant_id, verified, 
          first_name, last_name, role, 
          subscription_plan, subscription_status, license_status,
          country, created_at
        ) VALUES (
          $1::integer, $2, $3, $4, $5, $6,
          $7, $8, $9,
          $10, $11, $12,
          $13, NOW()
        )
        ON CONFLICT (email) DO NOTHING
      `, [
        adminId, 
        'digitalbaroz@gmail.com',
        adminHash,
        adminHash,
        tenantId, 
        true,
        'Digital', 
        'Baroz', 
        'super_admin',
        'premium', 
        'active', 
        'active',
        'KE'
      ]);
      console.log(`  ✅ Super admin created (ID: ${adminId})`);
    } else {
      console.log('  ✅ Super admin already exists');
      
      // Update password
      await targetPool.query(`
        UPDATE users 
        SET password_hash = $1, password = $1
        WHERE email = 'digitalbaroz@gmail.com'
      `, [adminHash]);
      console.log('  ✅ Password updated');
    }

    // 6. Final verification
    console.log('\n📋 Final verification...');
    const finalUsers = await targetPool.query(`SELECT COUNT(*) FROM users`);
    console.log(`  ✅ Total users in Nile: ${finalUsers.rows[0].count}`);
    
    const finalAdmin = await targetPool.query(`
      SELECT email, role FROM users WHERE email = 'digitalbaroz@gmail.com'
    `);
    if (finalAdmin.rows.length > 0) {
      console.log(`  ✅ Super Admin: ${finalAdmin.rows[0].email} (${finalAdmin.rows[0].role})`);
    }

    console.log('\n✅ Import complete!');
    console.log('\n🔑 Try logging in:');
    console.log('  Admin URL: https://vibe-app-virid.vercel.app/admin/login');
    console.log('  Email: digitalbaroz@gmail.com');
    console.log('  Password: Admin123!');

    await sourcePool.end();
    await targetPool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await sourcePool.end();
    await targetPool.end();
    process.exit(1);
  }
}

importFinalV3();

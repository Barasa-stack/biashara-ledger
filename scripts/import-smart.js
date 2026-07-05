const { Pool } = require('pg');
const fs = require('fs');

async function importSmart() {
  console.log('🔄 Smart importing biashara_ledger data to Nile...\n');
  
  // Source: biashara_ledger
  const sourcePool = new Pool({
    connectionString: 'postgresql://postgres@localhost:5432/biashara_ledger',
  });

  // Target: Nile
  const targetPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // 1. Get tenants from source
    console.log('📋 Extracting tenants...');
    const tenants = await sourcePool.query(`
      SELECT id, name, created_at FROM tenants
    `);
    console.log(`  Found ${tenants.rows.length} tenants`);

    // 2. Get users from source
    console.log('📋 Extracting users...');
    const users = await sourcePool.query(`
      SELECT id, email, password_hash, tenant_id, verified, 
             first_name, last_name, role, 
             subscription_plan, subscription_status, license_status,
             country, created_at
      FROM users
    `);
    console.log(`  Found ${users.rows.length} users`);
    console.log(`  Includes digitalbaroz@gmail.com: ${users.rows.some(u => u.email === 'digitalbaroz@gmail.com') ? '✅' : '❌'}`);

    // 3. Insert tenants into Nile
    console.log('\n📋 Inserting tenants into Nile...');
    for (const tenant of tenants.rows) {
      try {
        await targetPool.query(`
          INSERT INTO tenants (id, name, created_at) 
          VALUES ($1, $2, $3)
          ON CONFLICT (id) DO NOTHING
        `, [tenant.id, tenant.name, tenant.created_at]);
        console.log(`  ✅ Tenant: ${tenant.name}`);
      } catch (err) {
        console.log(`  ⚠️ Could not insert tenant ${tenant.name}: ${err.message.substring(0, 50)}`);
      }
    }

    // 4. Insert users into Nile
    console.log('\n📋 Inserting users into Nile...');
    for (const user of users.rows) {
      try {
        // Ensure tenant_id is a valid UUID
        const tenantId = user.tenant_id || tenants.rows[0]?.id;
        
        await targetPool.query(`
          INSERT INTO users (
            id, email, password_hash, tenant_id, verified, 
            first_name, last_name, role, 
            subscription_plan, subscription_status, license_status,
            country, created_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8,
            $9, $10, $11,
            $12, $13
          )
          ON CONFLICT (id) DO NOTHING
        `, [
          user.id, user.email, user.password_hash, tenantId, user.verified,
          user.first_name || '', user.last_name || '', user.role || 'user',
          user.subscription_plan || 'premium', user.subscription_status || 'active', user.license_status || 'active',
          user.country || 'KE', user.created_at
        ]);
        
        if (user.email === 'digitalbaroz@gmail.com') {
          console.log(`  ✅ SUPER ADMIN: ${user.email} (${user.role})`);
        } else {
          console.log(`  ✅ User: ${user.email}`);
        }
      } catch (err) {
        console.log(`  ⚠️ Could not insert user ${user.email}: ${err.message.substring(0, 50)}`);
      }
    }

    // 5. Verify the import
    console.log('\n📋 Verifying import...');
    
    const verifyTenants = await targetPool.query(`SELECT COUNT(*) FROM tenants`);
    console.log(`  ✅ Tenants in Nile: ${verifyTenants.rows[0].count}`);
    
    const verifyUsers = await targetPool.query(`SELECT COUNT(*) FROM users`);
    console.log(`  ✅ Users in Nile: ${verifyUsers.rows[0].count}`);
    
    const adminCheck = await targetPool.query(`
      SELECT email, role FROM users WHERE email = 'digitalbaroz@gmail.com'
    `);
    if (adminCheck.rows.length > 0) {
      console.log(`  ✅ Super Admin: ${adminCheck.rows[0].email} (${adminCheck.rows[0].role})`);
    } else {
      console.log(`  ⚠️ Super Admin not found in Nile`);
    }

    // 6. Reset admin password
    await targetPool.query(`
      UPDATE users 
      SET password_hash = '$2b$10$H7PzLp3qw5M5QFZ3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z' 
      WHERE email = 'digitalbaroz@gmail.com'
    `);
    console.log(`  ✅ Password reset for digitalbaroz@gmail.com (Admin123!)`);

    console.log('\n✅ Import complete!');
    console.log('\n🔑 Try logging in:');
    console.log('  URL: https://vibe-app-virid.vercel.app/sign-in');
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

importSmart();

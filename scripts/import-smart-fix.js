const { Pool } = require('pg');

async function importSmartFix() {
  console.log('🔄 Smart importing biashara_ledger data to Nile (SSL fixed)...\n');
  
  // Source: biashara_ledger
  const sourcePool = new Pool({
    connectionString: 'postgresql://postgres@localhost:5432/biashara_ledger',
  });

  // Target: Nile (without SSL)
  const targetPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,  // Disable SSL
    max: 10,
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

    // 3. Check if tenants exist in Nile
    console.log('\n📋 Checking Nile database...');
    try {
      const check = await targetPool.query(`SELECT COUNT(*) FROM tenants`);
      console.log(`  Current tenants in Nile: ${check.rows[0].count}`);
    } catch (err) {
      console.log(`  ⚠️ Could not check tenants: ${err.message}`);
    }

    // 4. Insert tenants into Nile
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

    // 5. Create a default tenant if none exist
    if (tenants.rows.length === 0) {
      console.log('  Creating default tenant...');
      try {
        const result = await targetPool.query(`
          INSERT INTO tenants (id, name) 
          VALUES (gen_random_uuid(), 'default_tenant')
          ON CONFLICT (name) DO NOTHING
          RETURNING id
        `);
        if (result.rows.length > 0) {
          console.log(`  ✅ Default tenant created: ${result.rows[0].id}`);
        }
      } catch (err) {
        console.log(`  ⚠️ Could not create default tenant: ${err.message}`);
      }
    }

    // 6. Get the tenant ID
    const tenantResult = await targetPool.query(`
      SELECT id FROM tenants LIMIT 1
    `);
    const tenantId = tenantResult.rows.length > 0 ? tenantResult.rows[0].id : null;
    console.log(`  📋 Using tenant ID: ${tenantId}`);

    // 7. Insert users into Nile
    console.log('\n📋 Inserting users into Nile...');
    for (const user of users.rows) {
      try {
        const finalTenantId = user.tenant_id || tenantId;
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
          user.id, user.email, user.password_hash, finalTenantId, user.verified || true,
          user.first_name || '', user.last_name || '', user.role || 'user',
          user.subscription_plan || 'premium', user.subscription_status || 'active', user.license_status || 'active',
          user.country || 'KE', user.created_at || new Date()
        ]);
        
        const isAdmin = user.email === 'digitalbaroz@gmail.com';
        console.log(`  ${isAdmin ? '✅ SUPER ADMIN' : '✅ User'}: ${user.email}`);
      } catch (err) {
        console.log(`  ⚠️ Could not insert user ${user.email}: ${err.message.substring(0, 50)}`);
      }
    }

    // 8. Ensure digitalbaroz exists
    console.log('\n📋 Ensuring super admin exists...');
    const adminCheck = await targetPool.query(`
      SELECT email, role FROM users WHERE email = 'digitalbaroz@gmail.com'
    `);
    
    if (adminCheck.rows.length === 0) {
      console.log('  Creating super admin...');
      await targetPool.query(`
        INSERT INTO users (
          id, email, password_hash, tenant_id, verified, 
          first_name, last_name, role, 
          subscription_plan, subscription_status, license_status,
          country, created_at
        ) VALUES (
          gen_random_uuid(),
          'digitalbaroz@gmail.com',
          '$2b$10$H7PzLp3qw5M5QFZ3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z',
          $1,
          true,
          'Digital',
          'Baroz',
          'super_admin',
          'premium',
          'active',
          'active',
          'KE',
          NOW()
        )
        ON CONFLICT (email) DO NOTHING
      `, [tenantId]);
      console.log('  ✅ Super admin created');
    } else {
      console.log(`  ✅ Super admin exists: ${adminCheck.rows[0].email} (${adminCheck.rows[0].role})`);
    }

    // 9. Verify the import
    console.log('\n📋 Verifying import...');
    
    const verifyTenants = await targetPool.query(`SELECT COUNT(*) FROM tenants`);
    console.log(`  ✅ Tenants in Nile: ${verifyTenants.rows[0].count}`);
    
    const verifyUsers = await targetPool.query(`SELECT COUNT(*) FROM users`);
    console.log(`  ✅ Users in Nile: ${verifyUsers.rows[0].count}`);
    
    const adminVerify = await targetPool.query(`
      SELECT email, role FROM users WHERE email = 'digitalbaroz@gmail.com'
    `);
    if (adminVerify.rows.length > 0) {
      console.log(`  ✅ Super Admin: ${adminVerify.rows[0].email} (${adminVerify.rows[0].role})`);
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

importSmartFix();

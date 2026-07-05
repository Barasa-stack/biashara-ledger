const { Pool } = require('pg');

async function importClean() {
  console.log('🔄 Clean importing biashara_ledger data to Nile...\n');
  
  // Source: biashara_ledger
  const sourcePool = new Pool({
    connectionString: 'postgresql://postgres@localhost:5432/biashara_ledger',
  });

  // Target: Nile
  const targetPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  try {
    // 1. Get users from source
    console.log('📋 Extracting users from biashara_ledger...');
    const users = await sourcePool.query(`
      SELECT id, email, password_hash, tenant_id, verified, 
             first_name, last_name, role, 
             subscription_plan, subscription_status, license_status,
             country, created_at
      FROM users
    `);
    console.log(`  Found ${users.rows.length} users`);
    
    // Find digitalbaroz
    const adminUser = users.rows.find(u => u.email === 'digitalbaroz@gmail.com');
    if (adminUser) {
      console.log(`  ✅ Found super admin: ${adminUser.email} (${adminUser.role})`);
    } else {
      console.log(`  ⚠️ digitalbaroz@gmail.com not found in source`);
    }

    // 2. Get existing tenant IDs from Nile
    console.log('\n📋 Checking existing tenants in Nile...');
    const tenants = await targetPool.query(`
      SELECT id, name FROM tenants
    `);
    console.log(`  Found ${tenants.rows.length} tenants`);
    tenants.rows.forEach(t => {
      console.log(`    - ${t.name} (${t.id})`);
    });

    // 3. Use the first tenant ID
    const tenantId = tenants.rows.length > 0 ? tenants.rows[0].id : null;
    if (!tenantId) {
      console.log('  ❌ No tenants found in Nile. Creating one...');
      const newTenant = await targetPool.query(`
        INSERT INTO tenants (id, name) 
        VALUES (gen_random_uuid(), 'default_tenant')
        RETURNING id
      `);
      tenantId = newTenant.rows[0].id;
      console.log(`  ✅ Created tenant: ${tenantId}`);
    }
    console.log(`  📋 Using tenant ID: ${tenantId}`);

    // 4. Insert users with proper UUIDs
    console.log('\n📋 Inserting users into Nile...');
    let inserted = 0;
    let failed = 0;

    for (const user of users.rows) {
      try {
        // Generate a new UUID for each user instead of using the old integer ID
        const newId = crypto.randomUUID();
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
          ON CONFLICT (email) DO NOTHING
        `, [
          newId, user.email, user.password_hash, finalTenantId, user.verified || true,
          user.first_name || '', user.last_name || '', user.role || 'user',
          user.subscription_plan || 'premium', user.subscription_status || 'active', user.license_status || 'active',
          user.country || 'KE', user.created_at || new Date()
        ]);
        
        inserted++;
        const isAdmin = user.email === 'digitalbaroz@gmail.com';
        console.log(`  ${isAdmin ? '✅ SUPER ADMIN' : '✅ User'}: ${user.email}`);
      } catch (err) {
        failed++;
        console.log(`  ⚠️ Could not insert user ${user.email}: ${err.message.substring(0, 60)}`);
      }
    }

    // 5. Ensure digitalbaroz exists
    console.log('\n📋 Verifying super admin...');
    const adminCheck = await targetPool.query(`
      SELECT email, role FROM users WHERE email = 'digitalbaroz@gmail.com'
    `);
    
    if (adminCheck.rows.length === 0) {
      console.log('  Creating super admin...');
      const newId = crypto.randomUUID();
      await targetPool.query(`
        INSERT INTO users (
          id, email, password_hash, tenant_id, verified, 
          first_name, last_name, role, 
          subscription_plan, subscription_status, license_status,
          country, created_at
        ) VALUES (
          $1, 'digitalbaroz@gmail.com', 
          '$2b$10$H7PzLp3qw5M5QFZ3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z',
          $2, true,
          'Digital', 'Baroz', 'super_admin',
          'premium', 'active', 'active',
          'KE', NOW()
        )
        ON CONFLICT (email) DO NOTHING
      `, [newId, tenantId]);
      console.log('  ✅ Super admin created');
    } else {
      console.log(`  ✅ Super admin exists: ${adminCheck.rows[0].email} (${adminCheck.rows[0].role})`);
    }

    // 6. Final verification
    console.log('\n📋 Final verification...');
    const finalUsers = await targetPool.query(`
      SELECT COUNT(*) FROM users
    `);
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

importClean();

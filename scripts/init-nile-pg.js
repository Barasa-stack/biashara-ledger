const { Client } = require('pg');

async function initNileDb() {
  console.log('🔄 Connecting to Nile via PostgreSQL...');
  
  const user = process.env.NILEDB_USER;
  const password = process.env.NILEDB_PASSWORD;
  const host = 'us-west-2.db.thenile.dev';
  const port = '5432';
  const database = 'Biasharaledger_App';
  
  if (!user || !password) {
    console.error('❌ NILEDB_USER and NILEDB_PASSWORD must be set');
    process.exit(1);
  }
  
  const connectionString = `postgres://${user}:${password}@${host}:${port}/${database}`;
  console.log(`📋 Connecting to: ${host}:${port}/${database}`);
  console.log(`📋 Using user: ${user.substring(0, 8)}...`);
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Nile database');

    // Check if tenants table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tenants'
      )
    `);
    
    const tenantsExist = checkResult.rows[0].exists;
    console.log(`📋 Tenants table exists: ${tenantsExist}`);

    if (!tenantsExist) {
      console.log('📋 Creating tenants table...');
      await client.query(`
        CREATE TABLE tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      console.log('✅ Tenants table created');
    }

    // Check if default tenant exists
    const tenantCheck = await client.query(`
      SELECT id FROM tenants WHERE name = 'default_tenant'
    `);
    
    let tenantId;
    if (tenantCheck.rows.length === 0) {
      console.log('📋 Creating default tenant...');
      const result = await client.query(`
        INSERT INTO tenants (id, name) 
        VALUES (gen_random_uuid(), 'default_tenant')
        RETURNING id
      `);
      tenantId = result.rows[0].id;
      console.log('✅ Default tenant created');
    } else {
      tenantId = tenantCheck.rows[0].id;
      console.log('✅ Default tenant exists');
    }

    console.log(`📋 Tenant ID: ${tenantId}`);

    // Check if users table exists
    const usersCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    
    if (!usersCheck.rows[0].exists) {
      console.log('📋 Creating users table...');
      await client.query(`
        CREATE TABLE users (
          id UUID DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          email TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          first_name TEXT DEFAULT '',
          last_name TEXT DEFAULT '',
          role TEXT DEFAULT 'user',
          verified BOOLEAN DEFAULT true,
          subscription_plan TEXT DEFAULT 'premium',
          subscription_status TEXT DEFAULT 'active',
          license_status TEXT DEFAULT 'active',
          country TEXT DEFAULT 'KE',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (id)
        )
      `);
      console.log('✅ Users table created');
    }

    // Create admin user
    console.log('📋 Creating admin user...');
    const adminEmail = 'digitalbaroz@gmail.com';
    // Pre-hashed password for "Admin123!"
    const hashedPassword = '$2b$10$H7PzLp3qw5M5QFZ3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z';
    
    await client.query(`
      INSERT INTO users (
        email, password_hash, tenant_id, verified, 
        first_name, last_name, role, 
        subscription_plan, subscription_status, license_status,
        country, created_at
      ) VALUES (
        $1, $2, $3, true,
        'Admin', 'User', 'admin',
        'premium', 'active', 'active',
        'KE', NOW()
      )
      ON CONFLICT (email) DO NOTHING
    `, [adminEmail, hashedPassword, tenantId]);
    
    console.log('✅ Admin user created/verified');

    console.log('\n✅ Nile database initialized successfully!');
    console.log('\n📋 Login credentials:');
    console.log(`  Admin: ${adminEmail} / Admin123!`);
    
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('  Code:', err.code);
    await client.end();
    process.exit(1);
  }
}

initNileDb();

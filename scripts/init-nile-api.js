const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function initNileDb() {
  console.log('🔄 Initializing Nile database via API...');
  
  const user = process.env.NILEDB_USER;
  const password = process.env.NILEDB_PASSWORD;
  const host = process.env.NILEDB_HOST || 'us-west-2.db.thenile.dev';
  const port = process.env.NILEDB_PORT || '5432';
  const database = process.env.NILEDB_DATABASE || 'Biasharaledger_App';
  
  if (!user || !password) {
    console.error('❌ NILEDB_USER and NILEDB_PASSWORD must be set');
    process.exit(1);
  }
  
  const connectionString = `postgres://${user}:${password}@${host}:${port}/${database}`;
  console.log(`📋 Connecting to: ${host}:${port}/${database}`);
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
  });

  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to Nile database');

    // The issue is with Nile's tenant isolation.
    // We need to run operations without tenant context first,
    // then create the tenant and set it.

    // Check if tenant exists in the tenants table
    const tenantCheck = await pool.query(`
      SELECT id FROM tenants WHERE name = 'default_tenant'
    `);
    
    let tenantId;
    if (tenantCheck.rows.length === 0) {
      // Insert tenant without tenant context (use the master table)
      const tenantResult = await pool.query(`
        INSERT INTO tenants (id, name) 
        VALUES (gen_random_uuid(), 'default_tenant')
        RETURNING id
      `);
      tenantId = tenantResult.rows[0].id;
      console.log('✅ Default tenant created');
    } else {
      tenantId = tenantCheck.rows[0].id;
      console.log('✅ Default tenant exists');
    }

    console.log(`📋 Tenant ID: ${tenantId}`);

    // Now create a new connection with tenant context
    const tenantPool = new Pool({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      // Set tenant context on connection
      connectionTimeoutMillis: 5000,
    });

    // Set the tenant context for Nile
    await tenantPool.query('SELECT set_config($1, $2, true)', ['nile.tenant_id', tenantId]);
    console.log('✅ Tenant context set');

    // Now create tables within the tenant context
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS users (
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
      );
    `);
    console.log('✅ Users table created/verified');

    // Create admin user within tenant context
    const adminEmail = 'digitalbaroz@gmail.com';
    const adminPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const userCheck = await tenantPool.query(`
      SELECT id FROM users WHERE email = $1
    `, [adminEmail]);
    
    if (userCheck.rows.length === 0) {
      await tenantPool.query(`
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
      `, [adminEmail, hashedPassword, tenantId]);
      console.log(`✅ Admin user created: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
    } else {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
    }

    console.log('\n✅ Nile database initialized successfully!');
    console.log('\n📋 Login credentials:');
    console.log(`  Admin: ${adminEmail} / ${adminPassword}`);
    
    await tenantPool.end();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('  Full error:', err);
    await pool.end();
    process.exit(1);
  }
}

initNileDb();

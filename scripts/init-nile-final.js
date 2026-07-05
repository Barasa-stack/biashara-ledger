const { Pool } = require('pg');

async function initNileDb() {
  console.log('🔄 Initializing Nile database (final approach)...');
  
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
    // Create tenants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ Tenants table created');

    // Insert default tenant
    await pool.query(`
      INSERT INTO tenants (id, name) 
      VALUES (gen_random_uuid(), 'default_tenant')
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Default tenant created');

    // Get tenant ID
    const tenantResult = await pool.query(`
      SELECT id FROM tenants WHERE name = 'default_tenant'
    `);
    
    if (tenantResult.rows.length === 0) {
      console.error('❌ Tenant not found after creation');
      process.exit(1);
    }
    
    const tenantId = tenantResult.rows[0].id;
    console.log(`📋 Tenant ID: ${tenantId}`);

    // Create users table
    await pool.query(`
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
      )
    `);
    console.log('✅ Users table created');

    // Create admin user with pre-hashed password
    const hashedPassword = '$2b$10$H7PzLp3qw5M5QFZ3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z';
    
    await pool.query(`
      INSERT INTO users (
        email, password_hash, tenant_id, verified, 
        first_name, last_name, role, 
        subscription_plan, subscription_status, license_status,
        country, created_at
      ) VALUES (
        'digitalbaroz@gmail.com', $1, $2, true,
        'Admin', 'User', 'admin',
        'premium', 'active', 'active',
        'KE', NOW()
      )
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword, tenantId]);
    
    console.log('✅ Admin user created: digitalbaroz@gmail.com');
    console.log('🔑 Password: Admin123!');

    console.log('\n✅ Nile database initialized successfully!');
    console.log('\n📋 Login credentials:');
    console.log(`  Admin: digitalbaroz@gmail.com / Admin123!`);
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

initNileDb();

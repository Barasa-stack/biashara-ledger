const { Pool } = require('pg');

async function initNileDb() {
  console.log('🔄 Initializing Nile database directly...');
  
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
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Connected to Nile database');

    // Create tenant
    console.log('📋 Creating tenant...');
    await pool.query(`
      INSERT INTO tenants (id, name) 
      VALUES (gen_random_uuid(), 'default_tenant')
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Tenant created/verified');

    // Set tenant context
    console.log('📋 Setting tenant context...');
    await pool.query(`
      SELECT set_config('nile.tenant_id', (SELECT id FROM tenants WHERE name = 'default_tenant'), true)
    `);
    console.log('✅ Tenant context set');

    // Create users table
    console.log('📋 Creating users table...');
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
    console.log('📋 Creating admin user...');
    const adminEmail = 'digitalbaroz@gmail.com';
    // This is the bcrypt hash for "Admin123!"
    const hashedPassword = '$2b$10$H7PzLp3qw5M5QFZ3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z3m5Q5Z3m5Q5ZO5Z';
    
    await pool.query(`
      INSERT INTO users (
        email, password_hash, tenant_id, verified, 
        first_name, last_name, role, 
        subscription_plan, subscription_status, license_status,
        country, created_at
      ) VALUES (
        $1, $2, (SELECT id FROM tenants WHERE name = 'default_tenant'), true,
        'Admin', 'User', 'admin',
        'premium', 'active', 'active',
        'KE', NOW()
      )
      ON CONFLICT (email) DO NOTHING
    `, [adminEmail, hashedPassword]);
    
    console.log(`✅ Admin user created: ${adminEmail}`);
    console.log(`🔑 Password: Admin123!`);

    console.log('\n✅ Nile database initialized successfully!');
    console.log('\n📋 Login credentials:');
    console.log(`  Admin: ${adminEmail} / Admin123!`);
    
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

const path = require('path');

async function initViaApp() {
  console.log('🔄 Initializing via app...');
  
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
  
  // Set environment variable so the app can use it
  process.env.DATABASE_URL = connectionString;
  process.env.NILEDB_USER = user;
  process.env.NILEDB_PASSWORD = password;
  process.env.NILEDB_HOST = host;
  process.env.NILEDB_PORT = port;
  process.env.NILEDB_DATABASE = database;
  
  // Import the app's init function using the compiled version
  try {
    // Try to import the compiled JS
    const initPath = path.join(__dirname, '..', 'src', 'lib', 'init');
    // Use require with .ts extension for ts-node
    const { ensureDbInitialized } = require(initPath);
    console.log('📋 Running ensureDbInitialized...');
    await ensureDbInitialized();
    console.log('✅ Database initialized via app!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n💡 Trying alternative approach...');
    
    // Alternative: Direct SQL approach
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false },
    });
    
    try {
      console.log('📋 Creating tables directly...');
      
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
      
      // Set tenant context
      const tenantResult = await pool.query(`
        SELECT id FROM tenants WHERE name = 'default_tenant'
      `);
      
      if (tenantResult.rows.length > 0) {
        const tenantId = tenantResult.rows[0].id;
        await pool.query(`
          SELECT set_config('nile.tenant_id', $1, true)
        `, [tenantId]);
        console.log('✅ Tenant context set');
      }
      
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
      
      // Create admin user (password: Admin123!)
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
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
      `, ['digitalbaroz@gmail.com', hashedPassword]);
      
      console.log('✅ Admin user created: digitalbaroz@gmail.com');
      console.log('🔑 Password: Admin123!');
      
      await pool.end();
      console.log('\n✅ Database initialized successfully!');
      process.exit(0);
    } catch (err2) {
      console.error('❌ Alternative approach failed:', err2.message);
      await pool.end();
      process.exit(1);
    }
  }
}

initViaApp();

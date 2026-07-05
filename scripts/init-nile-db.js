const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

async function initNileDb() {
  console.log('🔄 Initializing Nile database...');
  
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

    // Use absolute path to import schema
    const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'schema');
    const { initSchema } = require(schemaPath);
    await initSchema();
    console.log('✅ Schema initialized');

    // Create default tenant
    const tenantCheck = await pool.query(`
      SELECT COUNT(*) FROM tenants WHERE name = 'default_tenant'
    `);
    
    let tenantId;
    if (parseInt(tenantCheck.rows[0].count) === 0) {
      const tenantResult = await pool.query(`
        INSERT INTO tenants (id, name, created_at) 
        VALUES (gen_random_uuid(), 'default_tenant', NOW())
        RETURNING id
      `);
      tenantId = tenantResult.rows[0].id;
      console.log('✅ Default tenant created');
    } else {
      const tenantResult = await pool.query(`
        SELECT id FROM tenants WHERE name = 'default_tenant'
      `);
      tenantId = tenantResult.rows[0].id;
      console.log('✅ Default tenant exists');
    }

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'digitalbaroz@gmail.com';
    const adminPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const userCheck = await pool.query(`
      SELECT COUNT(*) FROM users WHERE email = $1
    `, [adminEmail]);
    
    if (parseInt(userCheck.rows[0].count) === 0) {
      await pool.query(`
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

    // Create test client
    const clientEmail = 'Mambombaya1992@gmail.com';
    const clientPassword = 'Kaya1992$';
    const clientHashed = await bcrypt.hash(clientPassword, 10);
    
    const clientCheck = await pool.query(`
      SELECT COUNT(*) FROM users WHERE email = $1
    `, [clientEmail]);
    
    if (parseInt(clientCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO users (
          email, password_hash, tenant_id, verified, 
          first_name, last_name, role, 
          subscription_plan, subscription_status, license_status,
          country, created_at
        ) VALUES (
          $1, $2, $3, true,
          'Mambombaya', 'User', 'admin',
          'premium', 'active', 'active',
          'KE', NOW()
        )
      `, [clientEmail, clientHashed, tenantId]);
      console.log(`✅ Test client created: ${clientEmail}`);
      console.log(`🔑 Password: ${clientPassword}`);
    } else {
      console.log(`✅ Test client already exists: ${clientEmail}`);
    }

    console.log('\n✅ Nile database initialized successfully!');
    console.log('\n📋 Login credentials:');
    console.log(`  Admin: ${adminEmail} / ${adminPassword}`);
    console.log(`  Client: ${clientEmail} / ${clientPassword}`);
    
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

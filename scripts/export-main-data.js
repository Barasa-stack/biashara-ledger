const { Pool } = require('pg');
const fs = require('fs');

async function exportMainData() {
  console.log('📋 Exporting data from enockshimakabarasa...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 1. Export tenants
    const tenants = await pool.query(`
      SELECT id, name, created_at FROM tenants
    `);
    console.log(`  Tenants: ${tenants.rows.length}`);

    // 2. Export users
    const users = await pool.query(`
      SELECT id, email, password_hash, tenant_id, verified, 
             first_name, last_name, role, 
             subscription_plan, subscription_status, license_status,
             country, created_at
      FROM users
    `);
    console.log(`  Users: ${users.rows.length}`);

    // 3. Generate SQL
    const sqlStatements = [];

    // Create tenants table
    sqlStatements.push(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create users table
    sqlStatements.push(`
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

    // Insert tenants
    for (const tenant of tenants.rows) {
      sqlStatements.push(`
        INSERT INTO tenants (id, name, created_at) 
        VALUES ('${tenant.id}', '${tenant.name}', '${tenant.created_at}')
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    // Insert users
    for (const user of users.rows) {
      sqlStatements.push(`
        INSERT INTO users (
          id, email, password_hash, tenant_id, verified, 
          first_name, last_name, role, 
          subscription_plan, subscription_status, license_status,
          country, created_at
        ) VALUES (
          '${user.id}', '${user.email}', '${user.password_hash}', '${user.tenant_id}', ${user.verified},
          '${user.first_name || ''}', '${user.last_name || ''}', '${user.role || 'user'}',
          '${user.subscription_plan || 'premium'}', '${user.subscription_status || 'active'}', '${user.license_status || 'active'}',
          '${user.country || 'KE'}', '${user.created_at}'
        )
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    // Write to file
    const sqlContent = sqlStatements.join('\n');
    fs.writeFileSync('scripts/nile-migration.sql', sqlContent);
    
    console.log('\n✅ Migration SQL generated!');
    console.log(`  File: scripts/nile-migration.sql`);
    console.log(`  Statements: ${sqlStatements.length}`);
    
    console.log('\n📋 Data Summary:');
    console.log(`  Tenants: ${tenants.rows.length}`);
    console.log(`  Users: ${users.rows.length}`);
    console.log(`  Admin: ${users.rows.some(u => u.email === 'Evanromanoff@gmail.com') ? '✅' : '⚠️'}`);
    console.log(`  Client: ${users.rows.some(u => u.email === 'Mambombaya1992@gmail.com') ? '✅' : '⚠️'}`);

    console.log('\n🔧 Next Steps:');
    console.log('  1. Open Nile SQL Editor');
    console.log('  2. Copy the contents of scripts/nile-migration.sql');
    console.log('  3. Run it in Nile');
    console.log('  4. Your data is now in Nile!');

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

exportMainData();

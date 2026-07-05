const { Pool } = require('pg');
require('dotenv').config();

async function consolidateData() {
  console.log('🔄 Consolidating data into ONE database...\n');
  
  const mainPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get all databases
    const result = await mainPool.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      AND datname NOT IN ('postgres')
      ORDER BY datname
    `);
    
    console.log('📋 Found databases:');
    result.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.datname}`);
    });

    // Check which databases have actual data
    for (const db of result.rows) {
      const dbName = db.datname;
      console.log(`\n🔍 Checking: ${dbName}`);
      
      try {
        const pool = new Pool({
          connectionString: `postgresql://postgres@localhost:5432/${dbName}`,
        });
        
        // Check for tenants table
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'tenants'
          )
        `);
        
        if (tableCheck.rows[0].exists) {
          const tenants = await pool.query(`
            SELECT COUNT(*) FROM tenants
          `);
          console.log(`  ✅ Has tenants table: ${tenants.rows[0].count} tenants`);
          
          const users = await pool.query(`
            SELECT COUNT(*) FROM users
          `);
          console.log(`  ✅ Has users table: ${users.rows[0].count} users`);
        } else {
          console.log(`  ⚠️ No tenants table (likely empty or template)`);
        }
        
        await pool.end();
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('📋 Recommendation:');
    console.log('  - Keep ONE database (enockshimakabarasa or biashara_ledger)');
    console.log('  - Migrate all data from other databases into it');
    console.log('  - Use tenant_id to isolate data');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

consolidateData();

const { Pool } = require('pg');
require('dotenv').config();

async function findAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const result = await pool.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      AND datname NOT IN ('postgres')
      ORDER BY datname
    `);
    
    console.log('🔍 Searching for digitalbaroz@gmail.com...\n');
    
    let found = false;
    
    for (const db of result.rows) {
      const dbName = db.datname;
      try {
        const dbPool = new Pool({
          connectionString: `postgresql://postgres@localhost:5432/${dbName}`,
        });
        
        const tableCheck = await dbPool.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'users'
          )
        `);
        
        if (tableCheck.rows[0].exists) {
          const userCheck = await dbPool.query(`
            SELECT COUNT(*) FROM users WHERE email = 'digitalbaroz@gmail.com'
          `);
          
          if (parseInt(userCheck.rows[0].count) > 0) {
            found = true;
            console.log(`✅ Found digitalbaroz@gmail.com in: ${dbName}`);
            
            const admin = await dbPool.query(`
              SELECT email, role, tenant_id, verified 
              FROM users WHERE email = 'digitalbaroz@gmail.com'
            `);
            console.log(`   Role: ${admin.rows[0].role}`);
            console.log(`   Tenant ID: ${admin.rows[0].tenant_id}`);
            console.log(`   Verified: ${admin.rows[0].verified}`);
          }
        }
        
        await dbPool.end();
      } catch (err) {
        // Table might not exist, skip
      }
    }
    
    if (!found) {
      console.log('❌ digitalbaroz@gmail.com not found in any database');
      console.log('   Checking all users in all databases...\n');
      
      // List all users from all databases
      for (const db of result.rows) {
        const dbName = db.datname;
        try {
          const dbPool = new Pool({
            connectionString: `postgresql://postgres@localhost:5432/${dbName}`,
          });
          
          const tableCheck = await dbPool.query(`
            SELECT EXISTS (
              SELECT 1 FROM information_schema.tables 
              WHERE table_name = 'users'
            )
          `);
          
          if (tableCheck.rows[0].exists) {
            const users = await dbPool.query(`
              SELECT email, role FROM users LIMIT 10
            `);
            if (users.rows.length > 0) {
              console.log(`📋 ${dbName}:`);
              users.rows.forEach(u => {
                console.log(`   - ${u.email} (${u.role})`);
              });
            }
          }
          
          await dbPool.end();
        } catch (err) {
          // Skip
        }
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

findAdmin();

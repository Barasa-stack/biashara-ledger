const { Pool } = require('pg');
require('dotenv').config();

async function listDatabases() {
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
    
    console.log('📋 All databases:');
    console.log('═'.repeat(40));
    result.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.datname}`);
    });
    console.log('═'.repeat(40));
    console.log(`Total: ${result.rows.length} databases`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

listDatabases();

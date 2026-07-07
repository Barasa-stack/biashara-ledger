const { Pool } = require('pg');
require('dotenv').config();

async function checkVerificationSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'verification_codes'
      ORDER BY column_name
    `);

    console.log('📋 verification_codes table schema:');
    if (result.rows.length === 0) {
      console.log('  ❌ Table does not exist');
    } else {
      result.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
      });
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkVerificationSchema();

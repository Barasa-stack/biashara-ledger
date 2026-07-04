const { Pool } = require('pg');
require('dotenv').config();

async function checkUserTable() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres@localhost:5432/dummy_client',
  });

  try {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY column_name
    `);

    console.log('📋 Users table columns in dummy_client:');
    if (result.rows.length === 0) {
      console.log('  ❌ No columns found - table might not exist');
    } else {
      result.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkUserTable();

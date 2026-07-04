const { Pool } = require('pg');
require('dotenv').config();

async function checkNileDb() {
  try {
    // Direct connection using DATABASE_URL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const result = await pool.query('SELECT current_database()');
    console.log('📋 DATABASE_URL connects to:', result.rows[0].current_database);
    
    // Check if the user exists
    const userCheck = await pool.query(`
      SELECT id, email, password_hash, verified 
      FROM users 
      WHERE LOWER(email) = LOWER($1)
    `, ['Mambombaya1992@gmail.com']);
    
    if (userCheck.rows.length > 0) {
      console.log('✅ User found in:', result.rows[0].current_database);
      console.log('  Email:', userCheck.rows[0].email);
      console.log('  password_hash:', userCheck.rows[0].password_hash ? 'Has value' : 'Empty');
    } else {
      console.log('❌ User NOT found in:', result.rows[0].current_database);
    }
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkNileDb();

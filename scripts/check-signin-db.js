const { Pool } = require('pg');
require('dotenv').config();

async function checkSigninDb() {
  try {
    // Import the nile module using dynamic import
    const { getNileDb } = await import('../src/lib/nile.js');
    const pool = await getNileDb();
    
    const result = await pool.query('SELECT current_database()');
    console.log('📋 getNileDb() connects to:', result.rows[0].current_database);
    
    // Check if the user exists
    const userCheck = await pool.query(`
      SELECT id, email, password_hash, verified 
      FROM users 
      WHERE LOWER(email) = LOWER($1)
    `, ['Mambombaya1992@gmail.com']);
    
    if (userCheck.rows.length > 0) {
      console.log('✅ User found in:', result.rows[0].current_database);
      console.log('  Email:', userCheck.rows[0].email);
    } else {
      console.log('❌ User NOT found in:', result.rows[0].current_database);
      console.log('This is why the signin is failing!');
    }
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkSigninDb();

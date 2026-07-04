const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugSignin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const result = await pool.query(`
      SELECT 
        email, 
        password, 
        password_hash,
        LENGTH(password) as pass_len,
        LENGTH(password_hash) as hash_len
      FROM public.users 
      WHERE email = 'Mambombaya1992@gmail.com'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    const user = result.rows[0];
    console.log('📋 User data:');
    console.log(`  Email: ${user.email}`);
    console.log(`  password: ${user.password ? '✅ Has value (' + user.pass_len + ' chars)' : '❌ Empty'}`);
    console.log(`  password_hash: ${user.password_hash ? '✅ Has value (' + user.hash_len + ' chars)' : '❌ Empty'}`);
    
    // Test the password against the hash
    if (user.password_hash) {
      const isMatch = await bcrypt.compare('Test123!', user.password_hash);
      console.log(`\n  Password 'Test123!' matches password_hash: ${isMatch ? '✅ YES' : '❌ NO'}`);
      
      // If it doesn't match, reset it
      if (!isMatch) {
        console.log('\n⚠️ Resetting password_hash...');
        const newHash = await bcrypt.hash('Test123!', 10);
        await pool.query(`UPDATE public.users SET password_hash = $1 WHERE email = $2`, [newHash, user.email]);
        console.log('✅ password_hash reset!');
        
        // Test again
        const verifyResult = await pool.query(`SELECT password_hash FROM public.users WHERE email = 'Mambombaya1992@gmail.com'`);
        const verifyMatch = await bcrypt.compare('Test123!', verifyResult.rows[0].password_hash);
        console.log(`  New hash matches: ${verifyMatch ? '✅ YES' : '❌ NO'}`);
      }
    } else {
      console.log('\n⚠️ password_hash is empty! Setting it...');
      const newHash = await bcrypt.hash('Test123!', 10);
      await pool.query(`UPDATE public.users SET password_hash = $1 WHERE email = $2`, [newHash, user.email]);
      console.log('✅ password_hash set!');
    }
    
    console.log('\n🔑 Try logging in now:');
    console.log('  Email: Mambombaya1992@gmail.com');
    console.log('  Password: Test123!');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

debugSignin();

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugSignin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const email = 'Mambombaya1992@gmail.com';
    const password = 'Test123!';
    
    console.log('🔍 Debugging signin for:', email);
    console.log('═'.repeat(50));
    
    // 1. Check if user exists with the exact query
    const result = await pool.query(`
      SELECT 
        id, 
        email, 
        password_hash,
        verified,
        tenant_id,
        subscription_plan,
        subscription_status,
        license_status
      FROM users 
      WHERE LOWER(email) = LOWER($1)
    `, [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    const user = result.rows[0];
    console.log('✅ User found in database:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  password_hash: ${user.password_hash ? 'Has value (' + user.password_hash.length + ' chars)' : 'EMPTY'}`);
    console.log(`  Verified: ${user.verified ? 'Yes' : 'No'}`);
    console.log(`  Tenant ID: ${user.tenant_id}`);
    console.log(`  Subscription Plan: ${user.subscription_plan}`);
    console.log(`  License Status: ${user.license_status}`);
    
    // 2. Test password match
    if (user.password_hash) {
      console.log('\n🔑 Testing password...');
      const isMatch = await bcrypt.compare(password, user.password_hash);
      console.log(`  Password '${password}' matches: ${isMatch ? '✅ YES' : '❌ NO'}`);
      
      if (!isMatch) {
        console.log('\n⚠️ Password does not match! Resetting...');
        const newHash = await bcrypt.hash(password, 10);
        await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [newHash, user.id]);
        console.log('✅ Password reset!');
        
        // Test again
        const verify = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [user.id]);
        const newMatch = await bcrypt.compare(password, verify.rows[0].password_hash);
        console.log(`  New password matches: ${newMatch ? '✅ YES' : '❌ NO'}`);
      }
    } else {
      console.log('\n⚠️ password_hash is empty! Setting it...');
      const newHash = await bcrypt.hash(password, 10);
      await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [newHash, user.id]);
      console.log('✅ password_hash set!');
    }
    
    // 3. Check if the user has all required fields
    console.log('\n📋 Checking required fields:');
    const requiredFields = ['id', 'email', 'password_hash', 'verified', 'tenant_id'];
    const missing = requiredFields.filter(f => !user[f]);
    if (missing.length > 0) {
      console.log(`  ❌ Missing: ${missing.join(', ')}`);
    } else {
      console.log('  ✅ All required fields present');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

debugSignin();

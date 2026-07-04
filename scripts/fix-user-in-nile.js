const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixUserInNile() {
  try {
    // Import the nile module
    const { getNileDb } = await import('../src/lib/nile.js');
    const pool = await getNileDb();
    
    // Check current database
    const dbResult = await pool.query('SELECT current_database()');
    console.log('📋 getNileDb() connects to:', dbResult.rows[0].current_database);
    
    const email = 'Mambombaya1992@gmail.com';
    const password = 'Test123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const check = await pool.query(`
      SELECT COUNT(*) FROM users WHERE LOWER(email) = LOWER($1)
    `, [email]);
    
    if (parseInt(check.rows[0].count) > 0) {
      console.log('✅ User already exists, updating password...');
      await pool.query(`
        UPDATE users 
        SET password_hash = $1, verified = true,
            subscription_plan = 'premium', subscription_status = 'active', license_status = 'active'
        WHERE LOWER(email) = LOWER($2)
      `, [hashedPassword, email]);
    } else {
      console.log('📋 Creating user...');
      
      // Get tenant ID
      const tenantResult = await pool.query(`
        SELECT id FROM tenants WHERE name = 'dummy_client'
      `);
      
      const tenantId = tenantResult.rows.length > 0 ? tenantResult.rows[0].id : null;
      
      await pool.query(`
        INSERT INTO users (
          email, 
          password_hash, 
          tenant_id, 
          verified, 
          first_name, 
          last_name, 
          role, 
          subscription_plan,
          subscription_status,
          license_status,
          license_key,
          country,
          created_at
        ) VALUES (
          $1, $2, $3, true, 'Mambombaya', 'User', 'admin', 'premium', 'active', 'active', 'BL-TEST-001', 'KE', NOW()
        )
      `, [email, hashedPassword, tenantId]);
    }
    
    console.log('\n✅ User ready in getNileDb() database!');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('\n🔗 Try login at: http://localhost:3000/signin');
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixUserInNile();

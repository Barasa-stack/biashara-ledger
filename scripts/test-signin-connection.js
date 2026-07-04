const { Pool } = require('pg');
require('dotenv').config();

async function testSigninConnection() {
  try {
    // Use the same connection string as DATABASE_URL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Check current database
    const dbResult = await pool.query('SELECT current_database()');
    const dbName = dbResult.rows[0].current_database;
    console.log('📋 Current database:', dbName);
    
    // Now run the exact query the signin API uses
    const result = await pool.query(`
      SELECT id, tenant_id, email, password_hash, first_name, last_name, verified,
             subscription_plan, subscription_status, license_status, country
      FROM users
      WHERE LOWER(email) = LOWER($1)
      ORDER BY
        (LOWER(subscription_plan) = 'premium') DESC,
        (license_status = 'active') DESC,
        (subscription_status = 'active') DESC,
        created_at DESC
      LIMIT 1
    `, ['Mambombaya1992@gmail.com']);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ User found by signin query!');
      console.log('  Email:', user.email);
      console.log('  password_hash:', user.password_hash ? 'Has value' : 'Empty');
      console.log('  Verified:', user.verified);
      console.log('  Tenant ID:', user.tenant_id);
      console.log('  Subscription Plan:', user.subscription_plan);
      console.log('  License Status:', user.license_status);
      
      console.log('\n🔑 Signin should work with:');
      console.log('  Email: Mambombaya1992@gmail.com');
      console.log('  Password: Test123!');
    } else {
      console.log('❌ User NOT found by signin query');
      console.log('The signin API cannot find the user.');
    }
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testSigninConnection();

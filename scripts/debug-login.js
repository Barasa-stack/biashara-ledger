const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugLogin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const email = 'mambombaya1992@gmail.com';
    
    // Check if user exists
    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.password,
        u.tenant_id,
        u.verified,
        t.name as tenant_name
      FROM public.users u
      LEFT JOIN public.tenants t ON u.tenant_id = t.id
      WHERE LOWER(u.email) = LOWER($1)
    `, [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found in main database');
      console.log('\n📋 All users:');
      const all = await pool.query('SELECT email FROM public.users');
      all.rows.forEach(row => console.log(`  - ${row.email}`));
      process.exit(1);
    }
    
    const user = result.rows[0];
    console.log('✅ User found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password Hash: ${user.password ? user.password.substring(0, 30) + '...' : 'EMPTY'}`);
    console.log(`  Tenant: ${user.tenant_name || 'No tenant'}`);
    console.log(`  Verified: ${user.verified ? 'Yes' : 'No'}`);
    
    if (!user.password || user.password.length === 0) {
      console.log('\n⚠️ Password hash is empty! Resetting...');
      const newPassword = 'Test123!';
      const hashed = await bcrypt.hash(newPassword, 10);
      await pool.query(`UPDATE public.users SET password = $1 WHERE id = $2`, [hashed, user.id]);
      console.log('✅ Password reset!');
      console.log(`  New Password: ${newPassword}`);
      process.exit(0);
    }
    
    // Test the password
    const testPassword = 'Test123!';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    
    if (isMatch) {
      console.log('\n✅ Password matches!');
      console.log('\n🔑 Login credentials:');
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${testPassword}`);
    } else {
      console.log('\n❌ Password does NOT match!');
      console.log('Resetting password...');
      const newHash = await bcrypt.hash(testPassword, 10);
      await pool.query(`UPDATE public.users SET password = $1 WHERE id = $2`, [newHash, user.id]);
      console.log('✅ Password reset!');
      console.log(`  New Password: ${testPassword}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

debugLogin();

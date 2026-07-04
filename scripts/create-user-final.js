const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createUser() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres@localhost:5432/dummy_client',
  });

  try {
    // Get tenant ID from main database
    const mainPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const tenantResult = await mainPool.query(`
      SELECT id FROM public.tenants WHERE name = 'dummy_client'
    `);
    
    if (tenantResult.rows.length === 0) {
      console.log('❌ dummy_client tenant not found');
      process.exit(1);
    }
    
    const tenantId = tenantResult.rows[0].id;
    console.log('📋 Tenant ID:', tenantId);

    const email = 'Mambombaya1992@gmail.com';
    const password = 'Test123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const userCheck = await pool.query(`
      SELECT id FROM public.users WHERE email = $1
    `, [email]);
    
    if (userCheck.rows.length > 0) {
      console.log('✅ User already exists, updating...');
      await pool.query(`
        UPDATE public.users 
        SET password_hash = $1, tenant_id = $2
        WHERE email = $3
      `, [hashedPassword, tenantId, email]);
    } else {
      console.log('📋 Creating new user:', email);
      await pool.query(`
        INSERT INTO public.users (
          tenant_id,
          email,
          password_hash,
          first_name,
          last_name,
          role,
          verified,
          created_at
        ) VALUES (
          $1,
          $2,
          $3,
          'Mambombaya',
          'User',
          'admin',
          1,
          NOW()
        )
      `, [tenantId, email, hashedPassword]);
    }
    
    console.log('\n✅ User created/updated successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('  Tenant: dummy_client');
    console.log('\n🔗 Login at: http://localhost:3000/login');
    
    // Verify the user
    const verify = await pool.query(`
      SELECT email, role, verified FROM public.users WHERE email = $1
    `, [email]);
    
    if (verify.rows.length > 0) {
      console.log('\n✅ Verification:');
      console.log('  Email:', verify.rows[0].email);
      console.log('  Role:', verify.rows[0].role);
      console.log('  Verified:', verify.rows[0].verified ? 'Yes' : 'No');
    }
    
    await mainPool.end();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createUser();

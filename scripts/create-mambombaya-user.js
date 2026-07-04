const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createMambombayaUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get dummy_client tenant ID
    const tenantResult = await pool.query(`
      SELECT id, name FROM public.tenants WHERE name = 'dummy_client'
    `);
    
    if (tenantResult.rows.length === 0) {
      console.log('❌ dummy_client tenant not found');
      console.log('Available tenants:');
      const all = await pool.query('SELECT name FROM public.tenants');
      all.rows.forEach(t => console.log(`  - ${t.name}`));
      process.exit(1);
    }
    
    const tenantId = tenantResult.rows[0].id;
    console.log(`📋 Found tenant: dummy_client (${tenantId})`);
    
    const email = 'Mambombaya1992@gmail.com';
    const password = 'Test123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const userCheck = await pool.query(`
      SELECT id, email FROM public.users WHERE email = $1
    `, [email]);
    
    if (userCheck.rows.length > 0) {
      console.log(`✅ User ${email} already exists`);
      console.log(`  Updating tenant and password...`);
      
      await pool.query(`
        UPDATE public.users 
        SET tenant_id = $1, password_hash = $2
        WHERE email = $3
      `, [tenantId, hashedPassword, email]);
      
      console.log(`✅ User updated`);
    } else {
      console.log(`📋 Creating new user: ${email}`);
      
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
      
      console.log(`✅ User created`);
    }
    
    // Verify the user
    const verify = await pool.query(`
      SELECT 
        u.email,
        u.role,
        u.verified,
        t.name as tenant_name,
        c.country,
        c.base_currency
      FROM public.users u
      LEFT JOIN public.tenants t ON u.tenant_id = t.id
      LEFT JOIN public.company_settings c ON t.id = c.tenant_id
      WHERE u.email = $1
    `, [email]);
    
    if (verify.rows.length > 0) {
      const data = verify.rows[0];
      console.log(`\n✅ User verified:`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Role: ${data.role}`);
      console.log(`  Verified: ${data.verified ? 'Yes' : 'No'}`);
      console.log(`  Tenant: ${data.tenant_name || 'No tenant'}`);
      console.log(`  Country: ${data.country || 'Not set'}`);
      console.log(`  Currency: ${data.base_currency || 'Not set'}`);
    }
    
    console.log(`\n🔑 Login credentials:`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`\n🔗 Login at: http://localhost:3000/login`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createMambombayaUser();

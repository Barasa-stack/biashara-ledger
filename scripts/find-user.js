const { Pool } = require('pg');
require('dotenv').config();

async function findUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.tenant_id,
        t.name as tenant_name,
        c.country,
        c.base_currency,
        c.company_name
      FROM public.users u
      LEFT JOIN public.tenants t ON u.tenant_id = t.id
      LEFT JOIN public.company_settings c ON t.id = c.tenant_id
      WHERE u.email = 'Mambombaya1992@gmail.com'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ User Mambombaya1992@gmail.com not found');
      console.log('\n📋 All users in database:');
      const all = await pool.query('SELECT email, tenant_id FROM public.users');
      all.rows.forEach(u => console.log(`  - ${u.email} (tenant: ${u.tenant_id || 'NULL'})`));
      process.exit(0);
    }
    
    const user = result.rows[0];
    console.log('✅ User found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Tenant: ${user.tenant_name || 'No tenant assigned'}`);
    console.log(`  Tenant ID: ${user.tenant_id || 'NULL'}`);
    console.log(`  Country: ${user.country || 'Not set'}`);
    console.log(`  Currency: ${user.base_currency || 'Not set'}`);
    console.log(`  Company: ${user.company_name || 'Not set'}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

findUser();

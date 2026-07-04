const { Pool } = require('pg');
require('dotenv').config();

async function checkClientCompanySettings() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // First, let's see what tenants exist
    const tenants = await pool.query(`
      SELECT id, name FROM public.tenants ORDER BY name
    `);
    
    console.log('📋 Available tenants:');
    tenants.rows.forEach((t, i) => {
      console.log(`  ${i+1}. ${t.name} (${t.id})`);
    });
    
    if (tenants.rows.length === 0) {
      console.log('❌ No tenants found.');
      process.exit(1);
    }
    
    console.log('\n📋 Checking company_settings for each tenant:\n');
    
    for (const tenant of tenants.rows) {
      const result = await pool.query(`
        SELECT 
          tenant_id,
          company_name,
          smtp_host,
          smtp_port,
          smtp_user,
          smtp_pass,
          email,
          phone,
          country,
          created_at
        FROM public.company_settings 
        WHERE tenant_id = $1
      `, [tenant.id]);
      
      console.log(`🔍 Tenant: ${tenant.name}`);
      
      if (result.rows.length > 0) {
        const settings = result.rows[0];
        console.log('  ✅ Company settings found:');
        console.log(`    Company: ${settings.company_name || 'Not set'}`);
        console.log(`    SMTP Host: ${settings.smtp_host || 'Not set'}`);
        console.log(`    SMTP Port: ${settings.smtp_port || 'Not set'}`);
        console.log(`    SMTP User: ${settings.smtp_user || 'Not set'}`);
        console.log(`    SMTP Pass: ${settings.smtp_pass ? '******** (set)' : 'Not set'}`);
        console.log(`    Email: ${settings.email || 'Not set'}`);
        console.log(`    Phone: ${settings.phone || 'Not set'}`);
        console.log(`    Country: ${settings.country || 'Not set'}`);
      } else {
        console.log('  ⚠️ No company settings found for this tenant');
        console.log('     They need to configure SMTP in Company Settings');
      }
      console.log('');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkClientCompanySettings();

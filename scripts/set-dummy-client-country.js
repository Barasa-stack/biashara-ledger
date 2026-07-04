const { Pool } = require('pg');
require('dotenv').config();

async function setDummyClientCountry() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get the dummy client (non-default tenant)
    const result = await pool.query(`
      SELECT 
        t.id,
        t.name,
        c.country,
        c.base_currency,
        c.company_name
      FROM public.tenants t
      LEFT JOIN public.company_settings c ON t.id = c.tenant_id
      WHERE t.name != 'default_tenant'
      ORDER BY t.name
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No dummy client tenants found');
      console.log('   Create a test client first, or use the signup flow.');
      process.exit(1);
    }
    
    console.log('📋 Available client tenants:');
    result.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.name} (${row.company_name || 'No company name'})`);
    });
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nSelect tenant number (or press Enter for first): ', async (answer) => {
      rl.close();
      
      let selected;
      if (!answer || answer.trim() === '') {
        selected = result.rows[0];
      } else {
        const index = parseInt(answer) - 1;
        if (isNaN(index) || index < 0 || index >= result.rows.length) {
          console.log('❌ Invalid selection');
          process.exit(1);
        }
        selected = result.rows[index];
      }
      
      console.log(`\n📋 Updating tenant: ${selected.name}`);
      console.log(`  Current Country: ${selected.country || 'Not set'}`);
      console.log(`  Current Currency: ${selected.base_currency || 'Not set'}`);
      
      rl.question('\nEnter country code (e.g., KE, US, GB): ', async (countryCode) => {
        rl.close();
        
        if (!countryCode) {
          console.log('❌ Country code is required');
          process.exit(1);
        }
        
        const upperCode = countryCode.toUpperCase();
        
        // Get currency from mapping
        const { getCurrencyForCountry } = require('../src/lib/country-currency');
        const currency = getCurrencyForCountry(upperCode);
        
        console.log(`\n📋 Setting currency for ${upperCode}:`);
        console.log(`  Currency: ${currency.code} (${currency.name})`);
        console.log(`  Symbol: ${currency.symbol}`);
        
        // Update company_settings
        await pool.query(`
          UPDATE public.company_settings 
          SET 
            country = $1,
            base_currency = $2
          WHERE tenant_id = $3
        `, [upperCode, currency.code, selected.id]);
        
        console.log(`\n✅ Updated tenant ${selected.name}:`);
        console.log(`  Country: ${upperCode}`);
        console.log(`  Currency: ${currency.code} (${currency.symbol})`);
        
        process.exit(0);
      });
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setDummyClientCountry();

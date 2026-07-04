const { Pool } = require('pg');
require('dotenv').config();

const readline = require('readline');

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

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
    
    const answer = await askQuestion('\nSelect tenant number (or press Enter for first): ');
    
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
    
    const countryCode = await askQuestion('\nEnter country code (e.g., KE, US, GB): ');
    
    if (!countryCode) {
      console.log('❌ Country code is required');
      process.exit(1);
    }
    
    const upperCode = countryCode.toUpperCase();
    
    // Get currency from mapping
    const { getCurrencyForCountry } = require('./src/lib/country-currency');
    const currency = getCurrencyForCountry(upperCode);
    
    console.log(`\n📋 Setting currency for ${upperCode}:`);
    console.log(`  Currency: ${currency.code} (${currency.name})`);
    console.log(`  Symbol: ${currency.symbol}`);
    console.log(`  Flag: ${currency.flag || '🌍'}`);
    
    // Check if company_settings exists for this tenant
    const checkSettings = await pool.query(`
      SELECT COUNT(*) FROM public.company_settings WHERE tenant_id = $1
    `, [selected.id]);
    
    if (parseInt(checkSettings.rows[0].count) === 0) {
      // Create company_settings
      await pool.query(`
        INSERT INTO public.company_settings (
          tenant_id,
          company_name,
          country,
          base_currency,
          created_at
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          NOW()
        )
      `, [selected.id, `${selected.name} Company`, upperCode, currency.code]);
      console.log(`  ✅ Created company settings for ${selected.name}`);
    } else {
      // Update company_settings
      await pool.query(`
        UPDATE public.company_settings 
        SET 
          country = $1,
          base_currency = $2
        WHERE tenant_id = $3
      `, [upperCode, currency.code, selected.id]);
      console.log(`  ✅ Updated company settings for ${selected.name}`);
    }
    
    console.log(`\n✅ Updated tenant ${selected.name}:`);
    console.log(`  Country: ${upperCode} ${currency.flag || '🌍'}`);
    console.log(`  Currency: ${currency.code} (${currency.symbol})`);
    console.log(`  Currency Name: ${currency.name}`);
    
    console.log(`\n🔗 Login at: http://localhost:3000/login`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setDummyClientCountry();

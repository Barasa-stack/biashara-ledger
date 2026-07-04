const { Pool } = require('pg');
require('dotenv').config();

async function checkCountryData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking existing country and currency data...\n');
    console.log('═'.repeat(60));

    // 1. Check company_settings for country and currency
    const settingsResult = await pool.query(`
      SELECT 
        t.name as tenant_name,
        c.country,
        c.base_currency,
        c.company_name,
        c.created_at
      FROM public.tenants t
      LEFT JOIN public.company_settings c ON t.id = c.tenant_id
      ORDER BY t.name
    `);
    
    console.log('📋 Current tenant country/currency settings:');
    console.log('─'.repeat(60));
    
    if (settingsResult.rows.length === 0) {
      console.log('  No company settings found');
    } else {
      settingsResult.rows.forEach(row => {
        console.log(`  Tenant: ${row.tenant_name}`);
        console.log(`    Company: ${row.company_name || 'Not set'}`);
        console.log(`    Country: ${row.country || 'Not set'}`);
        console.log(`    Currency: ${row.base_currency || 'Not set'}`);
        console.log(`    Created: ${row.created_at || 'N/A'}`);
        console.log('');
      });
    }
    
    console.log('═'.repeat(60));
    
    // 2. Check if there's a currency table
    const currencyTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'currencies'
      )
    `);
    
    if (currencyTableCheck.rows[0].exists) {
      console.log('📋 Currencies table exists! Checking content...');
      
      const currencies = await pool.query(`
        SELECT * FROM public.currencies LIMIT 10
      `);
      
      if (currencies.rows.length > 0) {
        console.log('  Sample currencies in database:');
        currencies.rows.forEach(curr => {
          console.log(`    ${curr.code} - ${curr.name} (${curr.symbol})`);
        });
      } else {
        console.log('  ⚠️ Currencies table is empty');
      }
    } else {
      console.log('ℹ️ No separate currencies table found');
      console.log('   Currency data may be hardcoded or in company_settings');
    }
    
    console.log('═'.repeat(60));
    
    // 3. Check if there's a countries table
    const countryTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'countries'
      )
    `);
    
    if (countryTableCheck.rows[0].exists) {
      console.log('📋 Countries table exists! Checking content...');
      
      const countries = await pool.query(`
        SELECT code, name, currency_code FROM public.countries LIMIT 10
      `);
      
      if (countries.rows.length > 0) {
        console.log('  Sample countries in database:');
        countries.rows.forEach(country => {
          console.log(`    ${country.code} - ${country.name} (${country.currency_code || 'No currency'})`);
        });
      } else {
        console.log('  ⚠️ Countries table is empty');
      }
    } else {
      console.log('ℹ️ No separate countries table found');
    }
    
    console.log('═'.repeat(60));
    
    // 4. Check for hardcoded currency in code
    console.log('🔍 Checking for currency constants in code...');
    
    const { exec } = require('child_process');
    exec('grep -r "currency.*=.*["\"]" src/lib/ 2>/dev/null | head -10', (error, stdout) => {
      if (stdout) {
        console.log('  Found currency references in code:');
        stdout.split('\n').forEach(line => {
          if (line.trim()) console.log(`    ${line.trim()}`);
        });
      } else {
        console.log('  No currency constants found in lib files');
      }
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkCountryData();

const { Pool } = require('pg');
require('dotenv').config();

async function setCountryDirect() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Setting country and currency for dummy_client...\n');
    
    // Get dummy_client tenant
    const tenantResult = await pool.query(`
      SELECT id, name FROM public.tenants WHERE name = 'dummy_client'
    `);
    
    if (tenantResult.rows.length === 0) {
      console.log('❌ dummy_client not found');
      console.log('   Available tenants:');
      const all = await pool.query(`SELECT name FROM public.tenants`);
      all.rows.forEach(t => console.log(`  - ${t.name}`));
      process.exit(1);
    }
    
    const tenantId = tenantResult.rows[0].id;
    console.log(`📋 Tenant: dummy_client (${tenantId})`);
    
    // Country to currency mapping (hardcoded in script)
    const countryMap = {
      'KE': { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
      'US': { code: 'USD', symbol: '$', name: 'US Dollar' },
      'GB': { code: 'GBP', symbol: '£', name: 'British Pound' },
      'NG': { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
      'ZA': { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
      'UG': { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
      'TZ': { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
      'EG': { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
      'GH': { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
      'MA': { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham' },
      'AU': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
      'DE': { code: 'EUR', symbol: '€', name: 'Euro' },
      'FR': { code: 'EUR', symbol: '€', name: 'Euro' },
      'IN': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
      'CN': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
      'JP': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
      'BR': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
      'CA': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
      'MX': { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
      'AE': { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    };
    
    console.log('\n📋 Available countries:');
    const countries = Object.keys(countryMap);
    countries.forEach((code, i) => {
      const c = countryMap[code];
      console.log(`  ${i+1}. ${code} - ${c.name} (${c.symbol})`);
    });
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nEnter country code (e.g., KE, US, GB): ', async (countryCode) => {
      rl.close();
      
      const upperCode = countryCode.toUpperCase();
      
      if (!countryMap[upperCode]) {
        console.log(`❌ Invalid country code: ${upperCode}`);
        console.log('Available codes:', Object.keys(countryMap).join(', '));
        process.exit(1);
      }
      
      const currency = countryMap[upperCode];
      
      console.log(`\n📋 Setting currency for ${upperCode}:`);
      console.log(`  Currency: ${currency.code} (${currency.name})`);
      console.log(`  Symbol: ${currency.symbol}`);
      
      // Check if company_settings exists
      const checkSettings = await pool.query(`
        SELECT COUNT(*) FROM public.company_settings WHERE tenant_id = $1
      `, [tenantId]);
      
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
            'Dummy Company',
            $2,
            $3,
            NOW()
          )
        `, [tenantId, upperCode, currency.code]);
        console.log(`  ✅ Created company settings for dummy_client`);
      } else {
        // Update company_settings
        await pool.query(`
          UPDATE public.company_settings 
          SET 
            country = $1,
            base_currency = $2
          WHERE tenant_id = $3
        `, [upperCode, currency.code, tenantId]);
        console.log(`  ✅ Updated company settings for dummy_client`);
      }
      
      console.log(`\n✅ dummy_client configured:`);
      console.log(`  Country: ${upperCode}`);
      console.log(`  Currency: ${currency.code} (${currency.symbol})`);
      console.log(`  Currency Name: ${currency.name}`);
      
      console.log(`\n🔗 Login at: http://localhost:3000/login`);
      console.log(`  Email: Mambombaya1992@gmail.com`);
      console.log(`  Password: Test123!`);
      
      process.exit(0);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setCountryDirect();

const { Pool } = require('pg');
require('dotenv').config();

async function verify() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres@localhost:5432/default_tenant',
  });
  
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quotations' 
      ORDER BY column_name
    `);
    
    console.log('✅ Quotations table columns:');
    result.rows.forEach(row => console.log('  -', row.column_name));
    
    // Check for vat_rate
    let hasVatRate = false;
    let hasCustomerCountry = false;
    let hasCurrency = false;
    let hasExchangeRate = false;
    let hasDiscounts = false;
    
    result.rows.forEach(row => {
      if (row.column_name === 'vat_rate') hasVatRate = true;
      if (row.column_name === 'customer_country') hasCustomerCountry = true;
      if (row.column_name === 'currency') hasCurrency = true;
      if (row.column_name === 'exchange_rate') hasExchangeRate = true;
      if (row.column_name === 'discounts') hasDiscounts = true;
    });
    
    console.log('\n📋 Important columns:');
    console.log(`  vat_rate: ${hasVatRate ? '✅' : '❌'}`);
    console.log(`  customer_country: ${hasCustomerCountry ? '✅' : '❌'}`);
    console.log(`  currency: ${hasCurrency ? '✅' : '❌'}`);
    console.log(`  exchange_rate: ${hasExchangeRate ? '✅' : '❌'}`);
    console.log(`  discounts: ${hasDiscounts ? '✅' : '❌'}`);
    
    if (hasVatRate && hasCustomerCountry && hasCurrency && hasExchangeRate && hasDiscounts) {
      console.log('\n✅ All columns exist! Tenant is ready.');
    } else {
      console.log('\n⚠️ Some columns are missing.');
    }
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

verify();

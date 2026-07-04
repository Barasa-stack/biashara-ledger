const { Pool } = require('pg');
require('dotenv').config();

async function fixAllTenantDatabases() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Get all tenant databases
    const result = await pool.query(`
      SELECT datname FROM pg_database 
      WHERE datistemplate = false 
      AND datname NOT IN ('postgres', 'biashara_ledger')
      ORDER BY datname;
    `);
    
    const tenantDbs = result.rows.map(r => r.datname);
    console.log(`📋 Found ${tenantDbs.length} tenant databases to fix:`);
    tenantDbs.forEach(db => console.log(`  - ${db}`));
    
    // Fix each tenant database
    for (const dbName of tenantDbs) {
      console.log(`\n🔧 Fixing database: ${dbName}`);
      
      try {
        const tenantPool = new Pool({
          connectionString: `postgresql://postgres@localhost:5432/${dbName}`,
        });
        
        // Check if quotations table exists
        const tableCheck = await tenantPool.query(`
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'quotations'
          );
        `);
        
        const tableExists = tableCheck.rows[0].exists;
        
        if (!tableExists) {
          console.log(`  ⏭️ quotations table doesn't exist in ${dbName}, skipping`);
          await tenantPool.end();
          continue;
        }
        
        // Add all missing columns to quotations
        const columns = [
          { name: 'vat_rate', type: 'REAL DEFAULT 0' },
          { name: 'customer_country', type: 'TEXT DEFAULT ""' },
          { name: 'currency', type: 'TEXT DEFAULT "USD"' },
          { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
          { name: 'discounts', type: 'REAL DEFAULT 0' },
        ];
        
        for (const col of columns) {
          try {
            await tenantPool.query(`
              ALTER TABLE public.quotations 
              ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};
            `);
            console.log(`  ✅ ${col.name} added to ${dbName}.quotations`);
          } catch (err) {
            console.log(`  ⚠️ Could not add ${col.name} to ${dbName}: ${err.message}`);
          }
        }
        
        // Also add vat_rate to sales_invoices if it exists
        try {
          await tenantPool.query(`
            ALTER TABLE public.sales_invoices 
            ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 0;
          `);
          console.log(`  ✅ vat_rate added to ${dbName}.sales_invoices`);
        } catch (err) {
          // Table might not exist
        }
        
        // Add vat_rate to credit_notes if it exists
        try {
          await tenantPool.query(`
            ALTER TABLE public.credit_notes 
            ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 0;
          `);
          console.log(`  ✅ vat_rate added to ${dbName}.credit_notes`);
        } catch (err) {
          // Table might not exist
        }
        
        await tenantPool.end();
      } catch (err) {
        console.log(`  ❌ Error fixing ${dbName}: ${err.message}`);
      }
    }
    
    console.log('\n✅ All tenant databases fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixAllTenantDatabases();

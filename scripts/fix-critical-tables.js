const { Pool } = require('pg');
require('dotenv').config();

// Critical tables and their required columns
const CRITICAL_FIXES = {
  quotations: [
    'vat_rate REAL DEFAULT 0',
    'customer_country TEXT DEFAULT \'\'',
    'currency TEXT DEFAULT \'USD\'',
    'exchange_rate REAL DEFAULT 1',
    'discounts REAL DEFAULT 0'
  ],
  sales_invoices: [
    'vat_rate REAL DEFAULT 0',
    'customer_country TEXT DEFAULT \'\'',
    'currency TEXT DEFAULT \'USD\'',
    'exchange_rate REAL DEFAULT 1'
  ],
  credit_notes: [
    'vat_rate REAL DEFAULT 0',
    'currency TEXT DEFAULT \'USD\'',
    'exchange_rate REAL DEFAULT 1'
  ],
  purchase_orders: [
    'vat_rate REAL DEFAULT 0',
    'client_country TEXT DEFAULT \'\'',
    'currency TEXT DEFAULT \'USD\'',
    'exchange_rate REAL DEFAULT 1'
  ],
  purchase_invoices: [
    'vat_rate REAL DEFAULT 0',
    'client_country TEXT DEFAULT \'\'',
    'currency TEXT DEFAULT \'USD\'',
    'exchange_rate REAL DEFAULT 1'
  ],
  payments: [
    'currency TEXT DEFAULT \'USD\'',
    'exchange_rate REAL DEFAULT 1'
  ],
  expenses: [
    'currency TEXT DEFAULT \'USD\'',
    'exchange_rate REAL DEFAULT 1'
  ],
  salaries: [
    'currency TEXT DEFAULT \'USD\'',
    'exchange_rate REAL DEFAULT 1'
  ],
  company_settings: [
    'base_currency TEXT DEFAULT \'USD\'',
    'income_tax_rate REAL DEFAULT 0',
    'tax_filing_frequency TEXT DEFAULT \'monthly\'',
    'created_at TIMESTAMP DEFAULT NOW()'
  ],
  customers: [
    'currency TEXT DEFAULT \'\''
  ],
  clients: [
    'country TEXT DEFAULT \'\'',
    'currency TEXT DEFAULT \'\''
  ],
  billing_history: [
    'currency TEXT DEFAULT \'USD\'',
    'status TEXT DEFAULT \'completed\''
  ],
  subscription_events: [
    'tenant_id UUID'
  ],
  inventory_items: [
    'reorder_level REAL DEFAULT 0'
  ],
  bank_statements: [
    'currency TEXT DEFAULT \'USD\''
  ]
};

async function fixDatabase(dbName) {
  console.log(`\n🔧 Fixing critical columns in: ${dbName}`);
  console.log('─'.repeat(40));
  
  const pool = new Pool({
    connectionString: `postgresql://postgres@localhost:5432/${dbName}`,
  });

  try {
    let fixesApplied = 0;
    let errors = 0;

    // Get all tables in this database
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const existingTables = tablesResult.rows.map(r => r.table_name);

    for (const [tableName, columns] of Object.entries(CRITICAL_FIXES)) {
      // Skip if table doesn't exist
      if (!existingTables.includes(tableName)) {
        console.log(`  ⏭️ Table ${tableName} doesn't exist, skipping`);
        continue;
      }

      // Get existing columns
      const columnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      `);
      const existingColNames = columnsResult.rows.map(r => r.column_name);

      // Add each missing column
      for (const colDef of columns) {
        const colName = colDef.split(' ')[0];
        
        if (!existingColNames.includes(colName)) {
          try {
            // Try with a simpler approach - just add as nullable first
            await pool.query(`
              ALTER TABLE public.${tableName} 
              ADD COLUMN IF NOT EXISTS ${colDef}
            `);
            console.log(`  ✅ Added ${colName} to ${tableName}`);
            fixesApplied++;
          } catch (err) {
            console.log(`  ⚠️ Could not add ${colName} to ${tableName}: ${err.message}`);
            errors++;
          }
        }
      }
    }

    console.log(`\n📊 Summary for ${dbName}:`);
    console.log(`  ✅ Fixes applied: ${fixesApplied}`);
    console.log(`  ⚠️ Errors: ${errors}`);
    
    return { fixesApplied, errors };
  } catch (err) {
    console.error(`❌ Error fixing ${dbName}:`, err.message);
    return { fixesApplied: 0, errors: 0 };
  } finally {
    await pool.end();
  }
}

async function fixAll() {
  console.log(`
${'█'.repeat(60)}
  🔧 CRITICAL DATABASE FIXER
${'█'.repeat(60)}`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get all databases
    const result = await pool.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      AND datname NOT IN ('postgres')
      ORDER BY datname
    `);
    
    const dbs = result.rows.map(r => r.datname);
    console.log(`\n📋 Found ${dbs.length} databases to fix`);
    
    let totalFixes = 0;
    let totalErrors = 0;
    
    for (const dbName of dbs) {
      const result = await fixDatabase(dbName);
      totalFixes += result.fixesApplied;
      totalErrors += result.errors;
    }
    
    console.log(`\n\n${'█'.repeat(60)}`);
    console.log(`  📊 FINAL SUMMARY`);
    console.log(`${'█'.repeat(60)}`);
    console.log(`  ✅ Total fixes applied: ${totalFixes}`);
    console.log(`  ⚠️ Total errors: ${totalErrors}`);
    console.log(`${'█'.repeat(60)}`);
    
  } catch (err) {
    console.error('❌ Fix failed:', err.message);
  } finally {
    await pool.end();
  }
}

fixAll();

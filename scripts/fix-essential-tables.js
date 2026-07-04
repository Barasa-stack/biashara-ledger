const { Pool } = require('pg');
require('dotenv').config();

// ONLY the essential tables that your app uses daily
const ESSENTIAL_TABLES = {
  quotations: [
    'tenant_id UUID',
    'id UUID DEFAULT gen_random_uuid()',
    'quotation_number TEXT DEFAULT \'\'',
    'customer_id UUID',
    'customer_name TEXT NOT NULL DEFAULT \'\'',
    'description TEXT DEFAULT \'\'',
    'quantity REAL DEFAULT 1',
    'unit_price REAL DEFAULT 0',
    'subtotal REAL DEFAULT 0',
    'tax_vat REAL DEFAULT 0',
    'amount REAL NOT NULL DEFAULT 0',
    'valid_until TEXT DEFAULT \'\'',
    'due_date TEXT DEFAULT \'\'',
    'status TEXT DEFAULT \'draft\'',
    'notes TEXT DEFAULT \'\'',
    'items TEXT DEFAULT \'[]\'',
    'issue_date TEXT NOT NULL DEFAULT \'\'',
    'created_at TIMESTAMP DEFAULT NOW()',
    'vat_rate REAL DEFAULT 0',
    'customer_country TEXT DEFAULT \'\'',
    'currency TEXT DEFAULT \'USD\'',
    'exchange_rate REAL DEFAULT 1',
    'discounts REAL DEFAULT 0'
  ],
  sales_invoices: [
    'tenant_id UUID',
    'id UUID DEFAULT gen_random_uuid()',
    'invoice_number TEXT DEFAULT \'\'',
    'quotation_id UUID',
    'customer_id UUID',
    'customer_name TEXT NOT NULL DEFAULT \'\'',
    'description TEXT DEFAULT \'\'',
    'quantity REAL DEFAULT 1',
    'unit_price REAL DEFAULT 0',
    'subtotal REAL DEFAULT 0',
    'tax_vat REAL DEFAULT 0',
    'discounts REAL DEFAULT 0',
    'amount REAL NOT NULL DEFAULT 0',
    'payment_terms TEXT DEFAULT \'Net 30\'',
    'status TEXT DEFAULT \'unpaid\'',
    'items TEXT DEFAULT \'[]\'',
    'issue_date TEXT NOT NULL DEFAULT \'\'',
    'due_date TEXT NOT NULL DEFAULT \'\'',
    'created_at TIMESTAMP DEFAULT NOW()',
    'vat_rate REAL DEFAULT 0',
    'customer_country TEXT DEFAULT \'\'',
    'currency TEXT DEFAULT \'USD\'',
    'exchange_rate REAL DEFAULT 1'
  ],
  customers: [
    'tenant_id UUID',
    'id UUID DEFAULT gen_random_uuid()',
    'customer_name TEXT NOT NULL DEFAULT \'\'',
    'company_name TEXT DEFAULT \'\'',
    'contact_person TEXT DEFAULT \'\'',
    'email_address TEXT DEFAULT \'\'',
    'phone_number TEXT DEFAULT \'\'',
    'billing_address TEXT DEFAULT \'\'',
    'shipping_address TEXT DEFAULT \'\'',
    'tax_id TEXT DEFAULT \'\'',
    'country TEXT DEFAULT \'\'',
    'payment_terms TEXT DEFAULT \'Net 30\'',
    'credit_limit REAL DEFAULT 0',
    'notes TEXT DEFAULT \'\'',
    'currency TEXT DEFAULT \'\'',
    'created_at TIMESTAMP DEFAULT NOW()'
  ],
  clients: [
    'tenant_id UUID',
    'id UUID DEFAULT gen_random_uuid()',
    'supplier_name TEXT NOT NULL DEFAULT \'\'',
    'company_name TEXT DEFAULT \'\'',
    'contact_person TEXT DEFAULT \'\'',
    'email_address TEXT DEFAULT \'\'',
    'phone_number TEXT DEFAULT \'\'',
    'address TEXT DEFAULT \'\'',
    'bank_details TEXT DEFAULT \'\'',
    'tax_id TEXT DEFAULT \'\'',
    'payment_terms TEXT DEFAULT \'Net 30\'',
    'supplier_category TEXT DEFAULT \'\'',
    'notes TEXT DEFAULT \'\'',
    'country TEXT DEFAULT \'\'',
    'currency TEXT DEFAULT \'\'',
    'created_at TIMESTAMP DEFAULT NOW()'
  ],
  payments: [
    'tenant_id UUID',
    'id UUID DEFAULT gen_random_uuid()',
    'invoice_id UUID',
    'customer_id UUID',
    'customer_name TEXT NOT NULL DEFAULT \'\'',
    'amount REAL NOT NULL DEFAULT 0',
    'payment_date TEXT NOT NULL DEFAULT \'\'',
    'payment_method TEXT DEFAULT \'cash\'',
    'notes TEXT DEFAULT \'\'',
    'created_at TIMESTAMP DEFAULT NOW()',
    'currency TEXT DEFAULT \'USD\'',
    'exchange_rate REAL DEFAULT 1'
  ],
  expenses: [
    'tenant_id UUID',
    'id UUID DEFAULT gen_random_uuid()',
    'expense_code TEXT DEFAULT \'\'',
    'category TEXT NOT NULL DEFAULT \'\'',
    'description TEXT DEFAULT \'\'',
    'supplier_vendor TEXT DEFAULT \'\'',
    'invoice_receipt_number TEXT DEFAULT \'\'',
    'amount REAL NOT NULL DEFAULT 0',
    'tax_vat REAL DEFAULT 0',
    'expense_date TEXT NOT NULL DEFAULT \'\'',
    'payment_method TEXT DEFAULT \'cash\'',
    'paid_by TEXT DEFAULT \'\'',
    'status TEXT DEFAULT \'pending\'',
    'notes TEXT DEFAULT \'\'',
    'created_at TIMESTAMP DEFAULT NOW()',
    'currency TEXT DEFAULT \'USD\'',
    'exchange_rate REAL DEFAULT 1'
  ],
  employees: [
    'tenant_id UUID',
    'id UUID DEFAULT gen_random_uuid()',
    'employee_code TEXT DEFAULT \'\'',
    'name TEXT NOT NULL DEFAULT \'\'',
    'phone TEXT DEFAULT \'\'',
    'email TEXT DEFAULT \'\'',
    'department TEXT DEFAULT \'\'',
    'job_title TEXT DEFAULT \'\'',
    'salary REAL DEFAULT 0',
    'created_at TIMESTAMP DEFAULT NOW()'
  ],
  company_settings: [
    'tenant_id UUID',
    'id UUID DEFAULT gen_random_uuid()',
    'company_name TEXT DEFAULT \'\'',
    'country TEXT DEFAULT \'Kenya\'',
    'phone TEXT DEFAULT \'\'',
    'email TEXT DEFAULT \'\'',
    'kra_pin TEXT DEFAULT \'\'',
    'vat_rate REAL DEFAULT 16',
    'base_currency TEXT DEFAULT \'USD\'',
    'created_at TIMESTAMP DEFAULT NOW()'
  ]
};

async function ensureEssentialTables(dbName) {
  console.log(`\n🔧 Checking essential tables in: ${dbName}`);
  console.log('─'.repeat(40));
  
  const pool = new Pool({
    connectionString: `postgresql://postgres@localhost:5432/${dbName}`,
  });

  try {
    let fixesApplied = 0;

    for (const [tableName, columns] of Object.entries(ESSENTIAL_TABLES)) {
      // Check if table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        )
      `);
      
      if (!tableCheck.rows[0].exists) {
        // Create the table
        const colDefs = columns.join(', ');
        try {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS public.${tableName} (
              ${colDefs}
            )
          `);
          console.log(`  ✅ Created table: ${tableName}`);
          fixesApplied++;
        } catch (err) {
          console.log(`  ❌ Could not create ${tableName}: ${err.message}`);
        }
        continue;
      }
      
      // Get existing columns
      const existingCols = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      `);
      const existingColNames = existingCols.rows.map(r => r.column_name);
      
      // Add missing columns
      let missingCount = 0;
      for (const colDef of columns) {
        const colName = colDef.split(' ')[0];
        if (!existingColNames.includes(colName)) {
          try {
            await pool.query(`
              ALTER TABLE public.${tableName} 
              ADD COLUMN IF NOT EXISTS ${colDef}
            `);
            missingCount++;
          } catch (err) {
            // Skip if column already exists or can't be added
          }
        }
      }
      
      if (missingCount > 0) {
        console.log(`  ✅ Added ${missingCount} columns to ${tableName}`);
        fixesApplied += missingCount;
      }
    }

    console.log(`\n📊 ${dbName}: ${fixesApplied} fixes applied`);
    return fixesApplied;
  } catch (err) {
    console.error(`❌ Error fixing ${dbName}:`, err.message);
    return 0;
  } finally {
    await pool.end();
  }
}

async function fixAll() {
  console.log(`
${'█'.repeat(60)}
  🔧 ESSENTIAL TABLES FIXER
${'█'.repeat(60)}`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const result = await pool.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      AND datname NOT IN ('postgres')
      ORDER BY datname
    `);
    
    const dbs = result.rows.map(r => r.datname);
    console.log(`\n📋 Fixing ${dbs.length} databases...`);
    
    let totalFixes = 0;
    
    for (const dbName of dbs) {
      const fixes = await ensureEssentialTables(dbName);
      totalFixes += fixes;
    }
    
    console.log(`\n${'█'.repeat(60)}`);
    console.log(`  ✅ TOTAL FIXES APPLIED: ${totalFixes}`);
    console.log(`${'█'.repeat(60)}`);
    console.log(`\n🎉 Essential tables are now ready!`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixAll();

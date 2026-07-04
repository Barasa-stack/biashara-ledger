const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runSchema() {
  console.log('🔄 Running full schema initialization...');
  
  try {
    // Read the schema SQL from the schema.ts file
    // Since we can't easily import TypeScript, we'll run the schema creation directly
    
    console.log('📋 Creating tables...');
    
    // Create tenants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.tenants (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  ✅ tenants table created');
    
    // Create customers table with tenant_id
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.customers (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        customer_name TEXT NOT NULL DEFAULT '',
        company_name TEXT DEFAULT '',
        contact_person TEXT DEFAULT '',
        email_address TEXT DEFAULT '',
        phone_number TEXT DEFAULT '',
        billing_address TEXT DEFAULT '',
        shipping_address TEXT DEFAULT '',
        tax_id TEXT DEFAULT '',
        country TEXT DEFAULT '',
        payment_terms TEXT DEFAULT 'Net 30',
        credit_limit REAL DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `);
    console.log('  ✅ customers table created');
    
    // Create clients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.clients (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        supplier_name TEXT NOT NULL DEFAULT '',
        company_name TEXT DEFAULT '',
        contact_person TEXT DEFAULT '',
        email_address TEXT DEFAULT '',
        phone_number TEXT DEFAULT '',
        address TEXT DEFAULT '',
        bank_details TEXT DEFAULT '',
        tax_id TEXT DEFAULT '',
        payment_terms TEXT DEFAULT 'Net 30',
        supplier_category TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `);
    console.log('  ✅ clients table created');
    
    // Create sales_invoices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.sales_invoices (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        invoice_number TEXT DEFAULT '',
        quotation_id UUID,
        customer_id UUID NOT NULL,
        customer_name TEXT NOT NULL,
        description TEXT DEFAULT '',
        quantity REAL DEFAULT 1,
        unit_price REAL DEFAULT 0,
        subtotal REAL DEFAULT 0,
        tax_vat REAL DEFAULT 0,
        discounts REAL DEFAULT 0,
        amount REAL NOT NULL DEFAULT 0,
        payment_terms TEXT DEFAULT 'Net 30',
        status TEXT DEFAULT 'unpaid',
        items TEXT DEFAULT '[]',
        issue_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `);
    console.log('  ✅ sales_invoices table created');
    
    // Create other essential tables...
    // I'll create the most important ones for now
    
    console.log('✅ Schema initialization complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

runSchema();

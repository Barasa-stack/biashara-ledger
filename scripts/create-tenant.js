const { Pool } = require('pg');
require('dotenv').config();

async function createTenant() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Check if tenants exist
    const result = await pool.query('SELECT COUNT(*) FROM public.tenants');
    const count = parseInt(result.rows[0].count);
    
    let tenantId, tenantName;
    
    if (count === 0) {
      console.log('🔄 No tenants found. Creating default tenant...');
      
      // Create tenant
      const insertResult = await pool.query(`
        INSERT INTO public.tenants (id, name) 
        VALUES (gen_random_uuid(), 'default_tenant')
        RETURNING id, name
      `);
      
      tenantId = insertResult.rows[0].id;
      tenantName = insertResult.rows[0].name;
      console.log(`✅ Tenant created: ${tenantName} (${tenantId})`);
    } else {
      // Get existing tenant
      const tenantResult = await pool.query('SELECT id, name FROM public.tenants LIMIT 1');
      tenantId = tenantResult.rows[0].id;
      tenantName = tenantResult.rows[0].name;
      console.log(`📋 Using existing tenant: ${tenantName} (${tenantId})`);
    }
    
    // Check if tenant database exists
    const dbCheck = await pool.query(`
      SELECT datname FROM pg_database WHERE datname = '${tenantName}'
    `);
    
    if (dbCheck.rows.length === 0) {
      console.log(`🔄 Creating tenant database: ${tenantName}`);
      await pool.query(`CREATE DATABASE ${tenantName}`);
      console.log(`✅ Database created: ${tenantName}`);
    } else {
      console.log(`✅ Database already exists: ${tenantName}`);
    }
    
    // Now create all tables with proper schema
    const tenantPool = new Pool({
      connectionString: `postgresql://postgres@localhost:5432/${tenantName}`,
    });
    
    console.log(`\n📋 Creating tables for tenant: ${tenantName}`);
    
    // Create quotations table with all columns
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS public.quotations (
        tenant_id UUID,
        id UUID DEFAULT gen_random_uuid(),
        quotation_number TEXT DEFAULT '',
        customer_id UUID,
        customer_name TEXT NOT NULL DEFAULT '',
        description TEXT DEFAULT '',
        quantity REAL DEFAULT 1,
        unit_price REAL DEFAULT 0,
        subtotal REAL DEFAULT 0,
        tax_vat REAL DEFAULT 0,
        amount REAL NOT NULL DEFAULT 0,
        valid_until TEXT DEFAULT '',
        due_date TEXT DEFAULT '',
        status TEXT DEFAULT 'draft',
        notes TEXT DEFAULT '',
        items TEXT DEFAULT '[]',
        issue_date TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        vat_rate REAL DEFAULT 0,
        customer_country TEXT DEFAULT '',
        currency TEXT DEFAULT 'USD',
        exchange_rate REAL DEFAULT 1,
        discounts REAL DEFAULT 0,
        PRIMARY KEY (tenant_id, id)
      );
    `);
    console.log('  ✅ quotations table created');
    
    // Create customers table
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS public.customers (
        tenant_id UUID,
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
        currency TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `);
    console.log('  ✅ customers table created');
    
    // Create sales_invoices table
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS public.sales_invoices (
        tenant_id UUID,
        id UUID DEFAULT gen_random_uuid(),
        invoice_number TEXT DEFAULT '',
        quotation_id UUID,
        customer_id UUID,
        customer_name TEXT NOT NULL DEFAULT '',
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
        issue_date TEXT NOT NULL DEFAULT '',
        due_date TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        vat_rate REAL DEFAULT 0,
        customer_country TEXT DEFAULT '',
        currency TEXT DEFAULT 'USD',
        exchange_rate REAL DEFAULT 1,
        PRIMARY KEY (tenant_id, id)
      );
    `);
    console.log('  ✅ sales_invoices table created');
    
    // Create clients table
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS public.clients (
        tenant_id UUID,
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
        country TEXT DEFAULT '',
        currency TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `);
    console.log('  ✅ clients table created');
    
    // Create payments table
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS public.payments (
        tenant_id UUID,
        id UUID DEFAULT gen_random_uuid(),
        invoice_id UUID,
        customer_id UUID,
        customer_name TEXT NOT NULL DEFAULT '',
        amount REAL NOT NULL DEFAULT 0,
        payment_date TEXT NOT NULL DEFAULT '',
        payment_method TEXT DEFAULT 'cash',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        currency TEXT DEFAULT 'USD',
        exchange_rate REAL DEFAULT 1,
        PRIMARY KEY (tenant_id, id)
      );
    `);
    console.log('  ✅ payments table created');
    
    // Create expenses table
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS public.expenses (
        tenant_id UUID,
        id UUID DEFAULT gen_random_uuid(),
        expense_code TEXT DEFAULT '',
        category TEXT NOT NULL DEFAULT '',
        description TEXT DEFAULT '',
        supplier_vendor TEXT DEFAULT '',
        invoice_receipt_number TEXT DEFAULT '',
        amount REAL NOT NULL DEFAULT 0,
        tax_vat REAL DEFAULT 0,
        expense_date TEXT NOT NULL DEFAULT '',
        payment_method TEXT DEFAULT 'cash',
        paid_by TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        currency TEXT DEFAULT 'USD',
        exchange_rate REAL DEFAULT 1,
        PRIMARY KEY (tenant_id, id)
      );
    `);
    console.log('  ✅ expenses table created');
    
    await tenantPool.end();
    
    console.log(`\n✅ Tenant ${tenantName} is fully configured!`);
    console.log(`\n📝 Tenant ID: ${tenantId}`);
    console.log(`📝 Tenant Name: ${tenantName}`);
    console.log(`\n🔑 Use this tenant for testing.`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createTenant();

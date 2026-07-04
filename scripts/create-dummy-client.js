const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createDummyClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Creating dummy client tenant...\n');
    
    // Get default_tenant as template
    const templateResult = await pool.query(`
      SELECT id FROM public.tenants WHERE name = 'default_tenant'
    `);
    
    if (templateResult.rows.length === 0) {
      console.log('❌ default_tenant not found. Please run the setup first.');
      process.exit(1);
    }
    
    const templateId = templateResult.rows[0].id;
    
    // Create new tenant
    const tenantName = 'dummy_client';
    const tenantResult = await pool.query(`
      INSERT INTO public.tenants (id, name) 
      VALUES (gen_random_uuid(), $1)
      RETURNING id, name
    `, [tenantName]);
    
    const tenantId = tenantResult.rows[0].id;
    console.log(`✅ Tenant created: ${tenantName} (${tenantId})`);
    
    // Create tenant database (copy from template)
    console.log(`🔄 Creating database: ${tenantName}...`);
    await pool.query(`CREATE DATABASE ${tenantName}`);
    console.log(`✅ Database created: ${tenantName}`);
    
    // Now create the tenant's tables by copying from template
    const tenantPool = new Pool({
      connectionString: `postgresql://postgres@localhost:5432/${tenantName}`,
    });
    
    // Create essential tables
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
      
      CREATE TABLE IF NOT EXISTS public.customers (
        tenant_id UUID,
        id UUID DEFAULT gen_random_uuid(),
        customer_name TEXT NOT NULL DEFAULT '',
        company_name TEXT DEFAULT '',
        email_address TEXT DEFAULT '',
        phone_number TEXT DEFAULT '',
        country TEXT DEFAULT '',
        currency TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
      
      CREATE TABLE IF NOT EXISTS public.clients (
        tenant_id UUID,
        id UUID DEFAULT gen_random_uuid(),
        supplier_name TEXT NOT NULL DEFAULT '',
        company_name TEXT DEFAULT '',
        email_address TEXT DEFAULT '',
        phone_number TEXT DEFAULT '',
        country TEXT DEFAULT '',
        currency TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
      
      CREATE TABLE IF NOT EXISTS public.sales_invoices (
        tenant_id UUID,
        id UUID DEFAULT gen_random_uuid(),
        invoice_number TEXT DEFAULT '',
        customer_id UUID,
        customer_name TEXT NOT NULL DEFAULT '',
        description TEXT DEFAULT '',
        quantity REAL DEFAULT 1,
        unit_price REAL DEFAULT 0,
        subtotal REAL DEFAULT 0,
        tax_vat REAL DEFAULT 0,
        discounts REAL DEFAULT 0,
        amount REAL NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'unpaid',
        issue_date TEXT NOT NULL DEFAULT '',
        due_date TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        vat_rate REAL DEFAULT 0,
        customer_country TEXT DEFAULT '',
        currency TEXT DEFAULT 'USD',
        exchange_rate REAL DEFAULT 1,
        PRIMARY KEY (tenant_id, id)
      );
      
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
      
      CREATE TABLE IF NOT EXISTS public.expenses (
        tenant_id UUID,
        id UUID DEFAULT gen_random_uuid(),
        expense_code TEXT DEFAULT '',
        category TEXT NOT NULL DEFAULT '',
        description TEXT DEFAULT '',
        amount REAL NOT NULL DEFAULT 0,
        expense_date TEXT NOT NULL DEFAULT '',
        payment_method TEXT DEFAULT 'cash',
        status TEXT DEFAULT 'pending',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        currency TEXT DEFAULT 'USD',
        exchange_rate REAL DEFAULT 1,
        PRIMARY KEY (tenant_id, id)
      );
      
      CREATE TABLE IF NOT EXISTS public.company_settings (
        tenant_id UUID,
        id UUID DEFAULT gen_random_uuid(),
        company_name TEXT DEFAULT '',
        country TEXT DEFAULT '',
        base_currency TEXT DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
      
      CREATE TABLE IF NOT EXISTS public.users (
        tenant_id UUID,
        id UUID DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT DEFAULT '',
        last_name TEXT DEFAULT '',
        role TEXT DEFAULT 'user',
        verified INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id),
        UNIQUE (tenant_id, email)
      );
    `);
    
    console.log('✅ Tables created in dummy client database');
    
    // Create a test user
    const testEmail = 'Mambombaya1992@gmail.com';
    const testPassword = 'Test123!';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    await tenantPool.query(`
      INSERT INTO public.users (
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        verified,
        created_at
      ) VALUES (
        $1,
        $2,
        $3,
        'Mambombaya',
        'User',
        'admin',
        1,
        NOW()
      )
    `, [tenantId, testEmail, hashedPassword]);
    
    console.log(`✅ Test user created: ${testEmail}`);
    console.log(`  Password: ${testPassword}`);
    
    await tenantPool.end();
    
    console.log(`\n🎉 Dummy client tenant created successfully!`);
    console.log(`  Tenant: ${tenantName}`);
    console.log(`  Login: http://localhost:3000/login`);
    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: ${testPassword}`);
    console.log(`\n  Country: Not set yet`);
    console.log(`  Currency: Not set yet`);
    console.log(`  \nRun: node scripts/set-dummy-client-country.js to set country/currency`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createDummyClient();

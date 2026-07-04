const { Pool } = require('pg');
require('dotenv').config();

const FIXES = {
  // For each table, define columns that need to be added
  tenants: [
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'name', type: 'TEXT NOT NULL' },
    { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT NOW()' },
  ],
  users: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'email', type: 'TEXT NOT NULL' },
    { name: 'password_hash', type: 'TEXT NOT NULL' },
    { name: 'first_name', type: 'TEXT DEFAULT ""' },
    { name: 'last_name', type: 'TEXT DEFAULT ""' },
    { name: 'phone', type: 'TEXT DEFAULT ""' },
    { name: 'country', type: 'TEXT DEFAULT "KE"' },
    { name: 'subscription_plan', type: 'TEXT DEFAULT "trial"' },
    { name: 'subscription_status', type: 'TEXT DEFAULT "active"' },
    { name: 'verified', type: 'INTEGER DEFAULT 0' },
    { name: 'subscription_expiry', type: 'TIMESTAMPTZ' },
    { name: 'role', type: 'TEXT DEFAULT "user"' },
    { name: 'encryption_key', type: 'TEXT' },
    { name: 'grace_period_end', type: 'TIMESTAMPTZ' },
    { name: 'last_reminder_sent', type: 'TIMESTAMPTZ' },
    { name: 'payment_method', type: 'TEXT DEFAULT "mpesa"' },
    { name: 'card_last4', type: 'TEXT' },
    { name: 'card_expiry', type: 'TEXT' },
    { name: 'paypal_email', type: 'TEXT' },
    { name: 'trial_start_date', type: 'TIMESTAMPTZ' },
    { name: 'trial_end_date', type: 'TIMESTAMPTZ' },
    { name: 'trial_used', type: 'INTEGER DEFAULT 0' },
    { name: 'license_status', type: 'TEXT DEFAULT "trial"' },
    { name: 'license_key', type: 'TEXT DEFAULT ""' },
    { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT NOW()' },
  ],
  sessions: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'user_id', type: 'UUID NOT NULL' },
    { name: 'token', type: 'TEXT NOT NULL' },
    { name: 'expires_at', type: 'TIMESTAMPTZ NOT NULL' },
    { name: 'client_db', type: 'TEXT DEFAULT ""' },
    { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT NOW()' },
  ],
  customers: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'customer_name', type: 'TEXT NOT NULL DEFAULT ""' },
    { name: 'company_name', type: 'TEXT DEFAULT ""' },
    { name: 'contact_person', type: 'TEXT DEFAULT ""' },
    { name: 'email_address', type: 'TEXT DEFAULT ""' },
    { name: 'phone_number', type: 'TEXT DEFAULT ""' },
    { name: 'billing_address', type: 'TEXT DEFAULT ""' },
    { name: 'shipping_address', type: 'TEXT DEFAULT ""' },
    { name: 'tax_id', type: 'TEXT DEFAULT ""' },
    { name: 'country', type: 'TEXT DEFAULT ""' },
    { name: 'payment_terms', type: 'TEXT DEFAULT "Net 30"' },
    { name: 'credit_limit', type: 'REAL DEFAULT 0' },
    { name: 'notes', type: 'TEXT DEFAULT ""' },
    { name: 'currency', type: 'TEXT DEFAULT ""' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
  ],
  clients: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'supplier_name', type: 'TEXT NOT NULL DEFAULT ""' },
    { name: 'company_name', type: 'TEXT DEFAULT ""' },
    { name: 'contact_person', type: 'TEXT DEFAULT ""' },
    { name: 'email_address', type: 'TEXT DEFAULT ""' },
    { name: 'phone_number', type: 'TEXT DEFAULT ""' },
    { name: 'address', type: 'TEXT DEFAULT ""' },
    { name: 'bank_details', type: 'TEXT DEFAULT ""' },
    { name: 'tax_id', type: 'TEXT DEFAULT ""' },
    { name: 'payment_terms', type: 'TEXT DEFAULT "Net 30"' },
    { name: 'supplier_category', type: 'TEXT DEFAULT ""' },
    { name: 'notes', type: 'TEXT DEFAULT ""' },
    { name: 'country', type: 'TEXT DEFAULT ""' },
    { name: 'currency', type: 'TEXT DEFAULT ""' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
  ],
  quotations: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'quotation_number', type: 'TEXT DEFAULT ""' },
    { name: 'customer_id', type: 'UUID' },
    { name: 'customer_name', type: 'TEXT NOT NULL' },
    { name: 'description', type: 'TEXT DEFAULT ""' },
    { name: 'quantity', type: 'REAL DEFAULT 1' },
    { name: 'unit_price', type: 'REAL DEFAULT 0' },
    { name: 'subtotal', type: 'REAL DEFAULT 0' },
    { name: 'tax_vat', type: 'REAL DEFAULT 0' },
    { name: 'amount', type: 'REAL NOT NULL DEFAULT 0' },
    { name: 'valid_until', type: 'TEXT DEFAULT ""' },
    { name: 'due_date', type: 'TEXT DEFAULT ""' },
    { name: 'status', type: 'TEXT DEFAULT "draft"' },
    { name: 'notes', type: 'TEXT DEFAULT ""' },
    { name: 'items', type: 'TEXT DEFAULT "[]"' },
    { name: 'issue_date', type: 'TEXT NOT NULL' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'vat_rate', type: 'REAL DEFAULT 0' },
    { name: 'customer_country', type: 'TEXT DEFAULT ""' },
    { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
    { name: 'discounts', type: 'REAL DEFAULT 0' },
  ],
  sales_invoices: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'invoice_number', type: 'TEXT DEFAULT ""' },
    { name: 'quotation_id', type: 'UUID' },
    { name: 'customer_id', type: 'UUID' },
    { name: 'customer_name', type: 'TEXT NOT NULL' },
    { name: 'description', type: 'TEXT DEFAULT ""' },
    { name: 'quantity', type: 'REAL DEFAULT 1' },
    { name: 'unit_price', type: 'REAL DEFAULT 0' },
    { name: 'subtotal', type: 'REAL DEFAULT 0' },
    { name: 'tax_vat', type: 'REAL DEFAULT 0' },
    { name: 'discounts', type: 'REAL DEFAULT 0' },
    { name: 'amount', type: 'REAL NOT NULL DEFAULT 0' },
    { name: 'payment_terms', type: 'TEXT DEFAULT "Net 30"' },
    { name: 'status', type: 'TEXT DEFAULT "unpaid"' },
    { name: 'items', type: 'TEXT DEFAULT "[]"' },
    { name: 'issue_date', type: 'TEXT NOT NULL' },
    { name: 'due_date', type: 'TEXT NOT NULL' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'vat_rate', type: 'REAL DEFAULT 0' },
    { name: 'customer_country', type: 'TEXT DEFAULT ""' },
    { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
  ],
  credit_notes: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'credit_note_number', type: 'TEXT DEFAULT ""' },
    { name: 'invoice_id', type: 'UUID' },
    { name: 'customer_id', type: 'UUID' },
    { name: 'customer_name', type: 'TEXT NOT NULL' },
    { name: 'customer_email', type: 'TEXT DEFAULT ""' },
    { name: 'description', type: 'TEXT DEFAULT ""' },
    { name: 'quantity', type: 'REAL DEFAULT 1' },
    { name: 'unit_price', type: 'REAL DEFAULT 0' },
    { name: 'subtotal', type: 'REAL DEFAULT 0' },
    { name: 'tax_vat', type: 'REAL DEFAULT 0' },
    { name: 'discounts', type: 'REAL DEFAULT 0' },
    { name: 'amount', type: 'REAL NOT NULL DEFAULT 0' },
    { name: 'reason', type: 'TEXT DEFAULT ""' },
    { name: 'notes', type: 'TEXT DEFAULT ""' },
    { name: 'payment_terms', type: 'TEXT DEFAULT "Net 30"' },
    { name: 'issue_date', type: 'TEXT NOT NULL' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'vat_rate', type: 'REAL DEFAULT 0' },
    { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
  ],
  payments: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'invoice_id', type: 'UUID' },
    { name: 'customer_id', type: 'UUID' },
    { name: 'customer_name', type: 'TEXT NOT NULL' },
    { name: 'amount', type: 'REAL NOT NULL' },
    { name: 'payment_date', type: 'TEXT NOT NULL' },
    { name: 'payment_method', type: 'TEXT DEFAULT "cash"' },
    { name: 'notes', type: 'TEXT DEFAULT ""' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
  ],
  purchase_orders: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'po_number', type: 'TEXT DEFAULT ""' },
    { name: 'client_id', type: 'UUID' },
    { name: 'client_name', type: 'TEXT NOT NULL' },
    { name: 'description', type: 'TEXT DEFAULT ""' },
    { name: 'quantity', type: 'REAL DEFAULT 1' },
    { name: 'unit_price', type: 'REAL DEFAULT 0' },
    { name: 'subtotal', type: 'REAL DEFAULT 0' },
    { name: 'tax_vat', type: 'REAL DEFAULT 0' },
    { name: 'amount', type: 'REAL NOT NULL DEFAULT 0' },
    { name: 'delivery_date', type: 'TEXT DEFAULT ""' },
    { name: 'status', type: 'TEXT DEFAULT "pending"' },
    { name: 'notes', type: 'TEXT DEFAULT ""' },
    { name: 'issue_date', type: 'TEXT NOT NULL' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'vat_rate', type: 'REAL DEFAULT 0' },
    { name: 'client_country', type: 'TEXT DEFAULT ""' },
    { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
  ],
  purchase_invoices: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'invoice_number', type: 'TEXT DEFAULT ""' },
    { name: 'po_id', type: 'UUID' },
    { name: 'client_id', type: 'UUID' },
    { name: 'client_name', type: 'TEXT NOT NULL' },
    { name: 'description', type: 'TEXT DEFAULT ""' },
    { name: 'quantity', type: 'REAL DEFAULT 1' },
    { name: 'unit_price', type: 'REAL DEFAULT 0' },
    { name: 'subtotal', type: 'REAL DEFAULT 0' },
    { name: 'tax_vat', type: 'REAL DEFAULT 0' },
    { name: 'discounts', type: 'REAL DEFAULT 0' },
    { name: 'amount', type: 'REAL NOT NULL DEFAULT 0' },
    { name: 'payment_terms', type: 'TEXT DEFAULT "Net 30"' },
    { name: 'status', type: 'TEXT DEFAULT "unpaid"' },
    { name: 'issue_date', type: 'TEXT NOT NULL' },
    { name: 'due_date', type: 'TEXT NOT NULL' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'vat_rate', type: 'REAL DEFAULT 0' },
    { name: 'client_country', type: 'TEXT DEFAULT ""' },
    { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
  ],
  debit_notes: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'debit_note_number', type: 'TEXT DEFAULT ""' },
    { name: 'purchase_invoice_id', type: 'UUID' },
    { name: 'client_id', type: 'UUID' },
    { name: 'client_name', type: 'TEXT NOT NULL' },
    { name: 'description', type: 'TEXT DEFAULT ""' },
    { name: 'quantity', type: 'REAL DEFAULT 1' },
    { name: 'unit_price', type: 'REAL DEFAULT 0' },
    { name: 'amount', type: 'REAL NOT NULL DEFAULT 0' },
    { name: 'reason', type: 'TEXT DEFAULT ""' },
    { name: 'notes', type: 'TEXT DEFAULT ""' },
    { name: 'issue_date', type: 'TEXT NOT NULL' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
  ],
  supplier_payments: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'invoice_id', type: 'UUID' },
    { name: 'client_id', type: 'UUID' },
    { name: 'client_name', type: 'TEXT NOT NULL' },
    { name: 'amount', type: 'REAL NOT NULL' },
    { name: 'payment_date', type: 'TEXT NOT NULL' },
    { name: 'payment_method', type: 'TEXT DEFAULT "cash"' },
    { name: 'notes', type: 'TEXT DEFAULT ""' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
  ],
  expenses: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'expense_code', type: 'TEXT DEFAULT ""' },
    { name: 'category', type: 'TEXT NOT NULL DEFAULT ""' },
    { name: 'description', type: 'TEXT DEFAULT ""' },
    { name: 'supplier_vendor', type: 'TEXT DEFAULT ""' },
    { name: 'invoice_receipt_number', type: 'TEXT DEFAULT ""' },
    { name: 'amount', type: 'REAL NOT NULL DEFAULT 0' },
    { name: 'tax_vat', type: 'REAL DEFAULT 0' },
    { name: 'expense_date', type: 'TEXT NOT NULL' },
    { name: 'payment_method', type: 'TEXT DEFAULT "cash"' },
    { name: 'paid_by', type: 'TEXT DEFAULT ""' },
    { name: 'status', type: 'TEXT DEFAULT "pending"' },
    { name: 'notes', type: 'TEXT DEFAULT ""' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
  ],
  employees: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'employee_code', type: 'TEXT DEFAULT ""' },
    { name: 'name', type: 'TEXT NOT NULL DEFAULT ""' },
    { name: 'date_of_birth', type: 'TEXT DEFAULT ""' },
    { name: 'national_id', type: 'TEXT DEFAULT ""' },
    { name: 'tax_pin', type: 'TEXT DEFAULT ""' },
    { name: 'phone', type: 'TEXT DEFAULT ""' },
    { name: 'email', type: 'TEXT DEFAULT ""' },
    { name: 'address', type: 'TEXT DEFAULT ""' },
    { name: 'department', type: 'TEXT DEFAULT ""' },
    { name: 'job_title', type: 'TEXT DEFAULT ""' },
    { name: 'date_of_hire', type: 'TEXT DEFAULT ""' },
    { name: 'employment_type', type: 'TEXT DEFAULT "full-time"' },
    { name: 'bank_name', type: 'TEXT DEFAULT ""' },
    { name: 'account_number', type: 'TEXT DEFAULT ""' },
    { name: 'emergency_contact_name', type: 'TEXT DEFAULT ""' },
    { name: 'emergency_contact_phone', type: 'TEXT DEFAULT ""' },
    { name: 'notes', type: 'TEXT DEFAULT ""' },
    { name: 'salary', type: 'REAL DEFAULT 0' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
  ],
  salaries: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'employee_id', type: 'UUID' },
    { name: 'employee_name', type: 'TEXT NOT NULL' },
    { name: 'basic_salary', type: 'REAL DEFAULT 0' },
    { name: 'allowances', type: 'REAL DEFAULT 0' },
    { name: 'deductions', type: 'REAL DEFAULT 0' },
    { name: 'overtime', type: 'REAL DEFAULT 0' },
    { name: 'bonuses', type: 'REAL DEFAULT 0' },
    { name: 'amount', type: 'REAL NOT NULL DEFAULT 0' },
    { name: 'pay_date', type: 'TEXT NOT NULL' },
    { name: 'payment_method', type: 'TEXT DEFAULT "bank"' },
    { name: 'payslip_reference', type: 'TEXT DEFAULT ""' },
    { name: 'status', type: 'TEXT DEFAULT "pending"' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
  ],
  company_settings: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'company_name', type: 'TEXT DEFAULT ""' },
    { name: 'address', type: 'TEXT DEFAULT ""' },
    { name: 'location', type: 'TEXT DEFAULT ""' },
    { name: 'country', type: 'TEXT DEFAULT "Kenya"' },
    { name: 'phone', type: 'TEXT DEFAULT ""' },
    { name: 'email', type: 'TEXT DEFAULT ""' },
    { name: 'kra_pin', type: 'TEXT DEFAULT ""' },
    { name: 'logo_base64', type: 'TEXT' },
    { name: 'paybill_number', type: 'TEXT DEFAULT ""' },
    { name: 'bank_name', type: 'TEXT DEFAULT ""' },
    { name: 'account_number', type: 'TEXT DEFAULT ""' },
    { name: 'bank_branch', type: 'TEXT DEFAULT ""' },
    { name: 'branch_code', type: 'TEXT DEFAULT ""' },
    { name: 'bank_code', type: 'TEXT DEFAULT ""' },
    { name: 'swift_code', type: 'TEXT DEFAULT ""' },
    { name: 'terms_conditions', type: 'TEXT DEFAULT ""' },
    { name: 'invoice_prefix', type: 'TEXT DEFAULT "INV"' },
    { name: 'next_invoice_number', type: 'INTEGER DEFAULT 1' },
    { name: 'quotation_prefix', type: 'TEXT DEFAULT "QTN"' },
    { name: 'next_quotation_number', type: 'INTEGER DEFAULT 1' },
    { name: 'last_invoice_month', type: 'TEXT DEFAULT ""' },
    { name: 'last_quotation_month', type: 'TEXT DEFAULT ""' },
    { name: 'smtp_host', type: 'TEXT DEFAULT ""' },
    { name: 'smtp_port', type: 'TEXT DEFAULT "587"' },
    { name: 'smtp_user', type: 'TEXT DEFAULT ""' },
    { name: 'smtp_pass', type: 'TEXT DEFAULT ""' },
    { name: 'vat_rate', type: 'REAL DEFAULT 16' },
    { name: 'base_currency', type: 'TEXT DEFAULT "USD"' },
    { name: 'income_tax_rate', type: 'REAL DEFAULT 0' },
    { name: 'tax_filing_frequency', type: 'TEXT DEFAULT "monthly"' },
    { name: 'credit_note_prefix', type: 'TEXT DEFAULT "CN"' },
    { name: 'next_credit_note_number', type: 'INTEGER DEFAULT 1' },
    { name: 'last_credit_note_month', type: 'TEXT DEFAULT ""' },
    { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
  ],
  bank_statements: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'bank_account_id', type: 'UUID NOT NULL' },
    { name: 'transaction_date', type: 'TEXT NOT NULL' },
    { name: 'description', type: 'TEXT DEFAULT ""' },
    { name: 'reference', type: 'TEXT DEFAULT ""' },
    { name: 'amount', type: 'REAL NOT NULL DEFAULT 0' },
    { name: 'type', type: 'TEXT NOT NULL DEFAULT "DEBIT"' },
    { name: 'balance', type: 'REAL DEFAULT 0' },
    { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    { name: 'status', type: 'TEXT DEFAULT "unreconciled"' },
    { name: 'reconciliation_id', type: 'UUID' },
    { name: 'matched_transaction_type', type: 'TEXT DEFAULT ""' },
    { name: 'matched_transaction_id', type: 'TEXT DEFAULT ""' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
  ],
  inventory_items: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'item_name', type: 'TEXT NOT NULL DEFAULT ""' },
    { name: 'sku', type: 'TEXT DEFAULT ""' },
    { name: 'category', type: 'TEXT DEFAULT ""' },
    { name: 'unit_of_measure', type: 'TEXT DEFAULT "pcs"' },
    { name: 'opening_stock', type: 'REAL DEFAULT 0' },
    { name: 'current_stock', type: 'REAL DEFAULT 0' },
    { name: 'unit_cost', type: 'REAL DEFAULT 0' },
    { name: 'reorder_level', type: 'REAL DEFAULT 0' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
  ],
  billing_history: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'user_id', type: 'UUID NOT NULL' },
    { name: 'amount', type: 'REAL NOT NULL' },
    { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    { name: 'plan_name', type: 'TEXT NOT NULL' },
    { name: 'payment_method', type: 'TEXT DEFAULT "mpesa"' },
    { name: 'transaction_id', type: 'TEXT DEFAULT ""' },
    { name: 'status', type: 'TEXT DEFAULT "completed"' },
    { name: 'period_start', type: 'TIMESTAMP NOT NULL' },
    { name: 'period_end', type: 'TIMESTAMP NOT NULL' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
  ],
  subscription_events: [
    { name: 'tenant_id', type: 'UUID' },
    { name: 'id', type: 'UUID DEFAULT gen_random_uuid()' },
    { name: 'user_id', type: 'UUID NOT NULL' },
    { name: 'event_type', type: 'TEXT NOT NULL' },
    { name: 'description', type: 'TEXT DEFAULT ""' },
    { name: 'metadata', type: 'TEXT DEFAULT "{}"' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
  ],
};

async function fixDatabase(dbName) {
  console.log(`\n🔧 Fixing database: ${dbName}`);
  console.log('─'.repeat(40));
  
  const pool = new Pool({
    connectionString: `postgresql://postgres@localhost:5432/${dbName}`,
  });

  try {
    let fixesApplied = 0;
    let errors = 0;

    // For each table in the fixes
    for (const [tableName, columns] of Object.entries(FIXES)) {
      // First check if the table exists
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
        const colDefs = columns.map(col => `${col.name} ${col.type}`).join(', ');
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
          errors++;
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
      for (const col of columns) {
        if (!existingColNames.includes(col.name)) {
          try {
            await pool.query(`
              ALTER TABLE public.${tableName} 
              ADD COLUMN ${col.name} ${col.type}
            `);
            console.log(`  ✅ Added ${col.name} to ${tableName}`);
            fixesApplied++;
          } catch (err) {
            console.log(`  ⚠️ Could not add ${col.name} to ${tableName}: ${err.message}`);
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

async function fixAllDatabases() {
  console.log(`
${'█'.repeat(60)}
  🔧 BIASHARALEDGER - DATABASE FIXER
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
    console.log(`\n📋 Found ${dbs.length} databases to fix:\n  - ${dbs.join('\n  - ')}`);
    
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
    
    if (totalErrors === 0) {
      console.log(`\n🎉 ALL DATABASES FIXED SUCCESSFULLY!`);
    } else {
      console.log(`\n⚠️ Some errors occurred. Please review the output.`);
    }
    
  } catch (err) {
    console.error('❌ Fix failed:', err.message);
  } finally {
    await pool.end();
  }
}

fixAllDatabases();

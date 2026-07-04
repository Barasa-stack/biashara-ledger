const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixAllColumns() {
  console.log('🔄 Fixing ALL missing columns across ALL tables...\n');

  // Define all columns that should exist in each table
  const columnDefinitions = {
    // Sales & Quotes
    quotations: [
      { name: 'vat_rate', type: 'REAL DEFAULT 0' },
      { name: 'customer_country', type: 'TEXT DEFAULT ""' },
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
      { name: 'discounts', type: 'REAL DEFAULT 0' },
    ],
    sales_invoices: [
      { name: 'vat_rate', type: 'REAL DEFAULT 0' },
      { name: 'customer_country', type: 'TEXT DEFAULT ""' },
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
    ],
    credit_notes: [
      { name: 'vat_rate', type: 'REAL DEFAULT 0' },
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
      { name: 'discounts', type: 'REAL DEFAULT 0' },
    ],
    
    // Purchases
    purchase_orders: [
      { name: 'vat_rate', type: 'REAL DEFAULT 0' },
      { name: 'client_country', type: 'TEXT DEFAULT ""' },
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
    ],
    purchase_invoices: [
      { name: 'vat_rate', type: 'REAL DEFAULT 0' },
      { name: 'client_country', type: 'TEXT DEFAULT ""' },
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
    ],
    debit_notes: [
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
    ],
    
    // Payments
    payments: [
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
    ],
    supplier_payments: [
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
    ],
    
    // Customers & Clients
    customers: [
      { name: 'currency', type: 'TEXT DEFAULT ""' },
      { name: 'tenant_id', type: 'UUID' },
    ],
    clients: [
      { name: 'country', type: 'TEXT DEFAULT ""' },
      { name: 'currency', type: 'TEXT DEFAULT ""' },
    ],
    
    // Expenses & Payroll
    expenses: [
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
    ],
    salaries: [
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
    ],
    
    // Company Settings
    company_settings: [
      { name: 'base_currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'income_tax_rate', type: 'REAL DEFAULT 0' },
      { name: 'tax_filing_frequency', type: 'TEXT DEFAULT "monthly"' },
    ],
    
    // Bank & Reconciliation
    bank_accounts: [
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    ],
    bank_statements: [
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    ],
    
    // Inventory
    inventory_items: [
      { name: 'tenant_id', type: 'UUID' },
      { name: 'unit_cost', type: 'REAL DEFAULT 0' },
      { name: 'opening_stock', type: 'REAL DEFAULT 0' },
      { name: 'current_stock', type: 'REAL DEFAULT 0' },
      { name: 'reorder_level', type: 'REAL DEFAULT 0' },
    ],
    inventory_transactions: [
      { name: 'tenant_id', type: 'UUID' },
    ],
    
    // Journal & Accounting
    journal_entries: [
      { name: 'tenant_id', type: 'UUID' },
    ],
    journal_entry_lines: [
      { name: 'tenant_id', type: 'UUID' },
    ],
    chart_of_accounts: [
      { name: 'tenant_id', type: 'UUID' },
      { name: 'opening_balance', type: 'REAL DEFAULT 0' },
    ],
    
    // Other
    budgets: [
      { name: 'tenant_id', type: 'UUID' },
      { name: 'amount', type: 'REAL DEFAULT 0' },
    ],
    fixed_assets: [
      { name: 'tenant_id', type: 'UUID' },
      { name: 'purchase_cost', type: 'REAL DEFAULT 0' },
      { name: 'accumulated_depreciation', type: 'REAL DEFAULT 0' },
      { name: 'book_value', type: 'REAL DEFAULT 0' },
      { name: 'salvage_value', type: 'REAL DEFAULT 0' },
    ],
    projects: [
      { name: 'tenant_id', type: 'UUID' },
      { name: 'budget', type: 'REAL DEFAULT 0' },
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    ],
    deals: [
      { name: 'tenant_id', type: 'UUID' },
      { name: 'deal_value', type: 'REAL DEFAULT 0' },
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
    ],
    other_transactions: [
      { name: 'tenant_id', type: 'UUID' },
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
    ],
    capital_transactions: [
      { name: 'tenant_id', type: 'UUID' },
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'exchange_rate', type: 'REAL DEFAULT 1' },
    ],
    approval_workflows: [
      { name: 'tenant_id', type: 'UUID' },
    ],
    approval_requests: [
      { name: 'tenant_id', type: 'UUID' },
    ],
    recurring_templates: [
      { name: 'tenant_id', type: 'UUID' },
    ],
    notification_log: [
      { name: 'tenant_id', type: 'UUID' },
    ],
    audit_log: [
      { name: 'tenant_id', type: 'UUID' },
    ],
    exchange_rates: [
      { name: 'tenant_id', type: 'UUID' },
    ],
    api_keys: [
      { name: 'tenant_id', type: 'UUID' },
    ],
    webhooks: [
      { name: 'tenant_id', type: 'UUID' },
    ],
  };

  let totalAdded = 0;
  let totalErrors = 0;

  for (const [table, columns] of Object.entries(columnDefinitions)) {
    console.log(`📋 Processing table: ${table}`);
    
    for (const col of columns) {
      try {
        await pool.query(
          `ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`
        );
        console.log(`  ✅ ${col.name} added to ${table}`);
        totalAdded++;
      } catch (err) {
        // Table might not exist yet, which is fine
        if (err.message.includes('does not exist')) {
          console.log(`  ⏭️  Table ${table} doesn't exist yet, skipping`);
        } else {
          console.log(`  ⚠️ Could not add ${col.name} to ${table}: ${err.message}`);
          totalErrors++;
        }
      }
    }
  }

  console.log(`\n✅ Done! Added ${totalAdded} columns with ${totalErrors} errors.`);
  process.exit(0);
}

fixAllColumns();

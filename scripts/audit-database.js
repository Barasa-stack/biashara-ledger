const { Pool } = require('pg');
require('dotenv').config();

// Define the expected schema for ALL tables
const EXPECTED_SCHEMA = {
  // Core Tables
  tenants: ['id', 'name', 'created_at'],
  users: ['tenant_id', 'id', 'email', 'password_hash', 'first_name', 'last_name', 'phone', 'country', 'subscription_plan', 'subscription_status', 'verified', 'subscription_expiry', 'role', 'encryption_key', 'grace_period_end', 'last_reminder_sent', 'payment_method', 'card_last4', 'card_expiry', 'paypal_email', 'trial_start_date', 'trial_end_date', 'trial_used', 'license_status', 'license_key', 'created_at'],
  sessions: ['tenant_id', 'id', 'user_id', 'token', 'expires_at', 'client_db', 'created_at'],
  
  // CRM Tables
  customers: ['tenant_id', 'id', 'customer_name', 'company_name', 'contact_person', 'email_address', 'phone_number', 'billing_address', 'shipping_address', 'tax_id', 'country', 'payment_terms', 'credit_limit', 'notes', 'currency', 'created_at'],
  clients: ['tenant_id', 'id', 'supplier_name', 'company_name', 'contact_person', 'email_address', 'phone_number', 'address', 'bank_details', 'tax_id', 'payment_terms', 'supplier_category', 'notes', 'country', 'currency', 'created_at'],
  deals: ['tenant_id', 'id', 'deal_name', 'customer_id', 'contact_name', 'contact_email', 'contact_phone', 'deal_value', 'currency', 'pipeline_stage', 'probability', 'expected_close_date', 'notes', 'status', 'created_at'],
  
  // Sales Tables
  quotations: ['tenant_id', 'id', 'quotation_number', 'customer_id', 'customer_name', 'description', 'quantity', 'unit_price', 'subtotal', 'tax_vat', 'amount', 'valid_until', 'due_date', 'status', 'notes', 'items', 'issue_date', 'created_at', 'vat_rate', 'customer_country', 'currency', 'exchange_rate', 'discounts'],
  sales_invoices: ['tenant_id', 'id', 'invoice_number', 'quotation_id', 'customer_id', 'customer_name', 'description', 'quantity', 'unit_price', 'subtotal', 'tax_vat', 'discounts', 'amount', 'payment_terms', 'status', 'items', 'issue_date', 'due_date', 'created_at', 'vat_rate', 'customer_country', 'currency', 'exchange_rate'],
  credit_notes: ['tenant_id', 'id', 'credit_note_number', 'invoice_id', 'customer_id', 'customer_name', 'customer_email', 'description', 'quantity', 'unit_price', 'subtotal', 'tax_vat', 'discounts', 'amount', 'reason', 'notes', 'payment_terms', 'issue_date', 'created_at', 'vat_rate', 'currency', 'exchange_rate'],
  payments: ['tenant_id', 'id', 'invoice_id', 'customer_id', 'customer_name', 'amount', 'payment_date', 'payment_method', 'notes', 'created_at', 'currency', 'exchange_rate'],
  
  // Purchases Tables
  purchase_orders: ['tenant_id', 'id', 'po_number', 'client_id', 'client_name', 'description', 'quantity', 'unit_price', 'subtotal', 'tax_vat', 'amount', 'delivery_date', 'status', 'notes', 'issue_date', 'created_at', 'vat_rate', 'client_country', 'currency', 'exchange_rate'],
  purchase_invoices: ['tenant_id', 'id', 'invoice_number', 'po_id', 'client_id', 'client_name', 'description', 'quantity', 'unit_price', 'subtotal', 'tax_vat', 'discounts', 'amount', 'payment_terms', 'status', 'issue_date', 'due_date', 'created_at', 'vat_rate', 'client_country', 'currency', 'exchange_rate'],
  debit_notes: ['tenant_id', 'id', 'debit_note_number', 'purchase_invoice_id', 'client_id', 'client_name', 'description', 'quantity', 'unit_price', 'amount', 'reason', 'notes', 'issue_date', 'created_at', 'currency', 'exchange_rate'],
  supplier_payments: ['tenant_id', 'id', 'invoice_id', 'client_id', 'client_name', 'amount', 'payment_date', 'payment_method', 'notes', 'created_at', 'currency', 'exchange_rate'],
  
  // Finance Tables
  expenses: ['tenant_id', 'id', 'expense_code', 'category', 'description', 'supplier_vendor', 'invoice_receipt_number', 'amount', 'tax_vat', 'expense_date', 'payment_method', 'paid_by', 'status', 'notes', 'created_at', 'currency', 'exchange_rate'],
  chart_of_accounts: ['tenant_id', 'id', 'account_code', 'account_name', 'account_type', 'parent_id', 'is_active', 'opening_balance', 'description', 'created_at'],
  journal_entries: ['tenant_id', 'id', 'entry_number', 'description', 'entry_date', 'reference', 'status', 'created_at'],
  journal_entry_lines: ['tenant_id', 'id', 'journal_entry_id', 'account_id', 'description', 'debit_amount', 'credit_amount', 'created_at'],
  budgets: ['tenant_id', 'id', 'fiscal_year', 'period', 'category_type', 'category_name', 'amount', 'created_at'],
  other_transactions: ['tenant_id', 'id', 'type', 'category', 'description', 'amount', 'currency', 'exchange_rate', 'transaction_date', 'notes', 'created_at'],
  capital_transactions: ['tenant_id', 'id', 'type', 'amount', 'currency', 'exchange_rate', 'transaction_date', 'description', 'reference', 'created_at'],
  
  // HR Tables
  employees: ['tenant_id', 'id', 'employee_code', 'name', 'date_of_birth', 'national_id', 'tax_pin', 'phone', 'email', 'address', 'department', 'job_title', 'date_of_hire', 'employment_type', 'bank_name', 'account_number', 'emergency_contact_name', 'emergency_contact_phone', 'notes', 'salary', 'salary_encrypted', 'national_id_encrypted', 'bank_account_encrypted', 'created_at'],
  salaries: ['tenant_id', 'id', 'employee_id', 'employee_name', 'basic_salary', 'allowances', 'deductions', 'overtime', 'bonuses', 'amount', 'amount_encrypted', 'pay_date', 'payment_method', 'payslip_reference', 'status', 'created_at', 'currency', 'exchange_rate'],
  
  // Banking Tables
  bank_accounts: ['tenant_id', 'id', 'account_name', 'account_number', 'bank_name', 'currency', 'opening_balance', 'is_active', 'created_at'],
  bank_statements: ['tenant_id', 'id', 'bank_account_id', 'transaction_date', 'description', 'reference', 'amount', 'type', 'balance', 'currency', 'status', 'reconciliation_id', 'matched_transaction_type', 'matched_transaction_id', 'created_at'],
  reconciliation_runs: ['tenant_id', 'id', 'bank_account_id', 'statement_balance', 'system_balance', 'difference', 'start_date', 'end_date', 'status', 'created_at'],
  
  // Inventory Tables
  inventory_items: ['tenant_id', 'id', 'item_name', 'sku', 'category', 'unit_of_measure', 'opening_stock', 'current_stock', 'unit_cost', 'reorder_level', 'created_at'],
  inventory_transactions: ['tenant_id', 'id', 'item_id', 'transaction_type', 'quantity', 'unit_cost', 'total_cost', 'reference_type', 'reference_id', 'transaction_date', 'notes', 'created_at'],
  
  // Projects Tables
  projects: ['tenant_id', 'id', 'project_name', 'description', 'start_date', 'end_date', 'budget', 'currency', 'customer_id', 'status', 'created_at'],
  project_transactions: ['tenant_id', 'id', 'project_id', 'entity_type', 'entity_id', 'amount', 'transaction_date', 'description', 'created_at'],
  
  // Assets Tables
  fixed_assets: ['tenant_id', 'id', 'asset_name', 'asset_type', 'purchase_date', 'purchase_cost', 'useful_life_years', 'depreciation_method', 'salvage_value', 'accumulated_depreciation', 'book_value', 'status', 'disposal_date', 'disposal_amount', 'notes', 'created_at'],
  
  // Settings Tables
  company_settings: ['tenant_id', 'id', 'company_name', 'address', 'location', 'country', 'phone', 'email', 'kra_pin', 'logo_base64', 'paybill_number', 'bank_name', 'account_number', 'bank_branch', 'branch_code', 'bank_code', 'swift_code', 'terms_conditions', 'invoice_prefix', 'next_invoice_number', 'quotation_prefix', 'next_quotation_number', 'last_invoice_month', 'last_quotation_month', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'vat_rate', 'base_currency', 'income_tax_rate', 'tax_filing_frequency', 'credit_note_prefix', 'next_credit_note_number', 'last_credit_note_month', 'updated_at', 'created_at'],
  exchange_rates: ['tenant_id', 'id', 'source_currency', 'target_currency', 'rate', 'rate_date', 'created_at'],
  
  // Approvals Tables
  approval_workflows: ['tenant_id', 'id', 'workflow_name', 'entity_type', 'trigger_amount', 'approver_role', 'is_active', 'created_at'],
  approval_requests: ['tenant_id', 'id', 'workflow_id', 'entity_type', 'entity_id', 'entity_amount', 'requested_by', 'status', 'approved_by', 'approved_at', 'notes', 'created_at'],
  
  // Notifications Tables
  notification_preferences: ['tenant_id', 'id', 'user_id', 'email_notifications', 'sms_notifications', 'in_app_notifications', 'invoice_reminders', 'payment_confirmations', 'low_stock_alerts', 'approval_requests', 'created_at'],
  notification_log: ['tenant_id', 'id', 'user_id', 'notification_type', 'title', 'message', 'channel', 'is_read', 'created_at'],
  
  // System Tables
  audit_log: ['tenant_id', 'id', 'user_id', 'entity_type', 'imported_count', 'errors_count', 'error_details', 'file_name', 'created_at'],
  api_keys: ['tenant_id', 'id', 'key_name', 'api_key', 'permissions', 'last_used_at', 'expires_at', 'is_active', 'created_at'],
  webhooks: ['tenant_id', 'id', 'webhook_name', 'url', 'events', 'secret', 'is_active', 'last_triggered_at', 'created_at'],
  recurring_templates: ['tenant_id', 'id', 'template_name', 'entity_type', 'template_data', 'frequency', 'interval_count', 'next_run_date', 'last_run_date', 'is_active', 'created_at'],
  articles: ['tenant_id', 'id', 'title', 'slug', 'content', 'excerpt', 'author', 'status', 'published_at', 'created_at'],
  
  // Billing Tables
  billing_history: ['tenant_id', 'id', 'user_id', 'amount', 'currency', 'plan_name', 'payment_method', 'transaction_id', 'status', 'period_start', 'period_end', 'created_at'],
  subscription_events: ['tenant_id', 'id', 'user_id', 'event_type', 'description', 'metadata', 'created_at'],
};

async function auditDatabase(dbName, isMainDb = false) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📋 Auditing database: ${dbName}`);
  console.log(`${'═'.repeat(60)}`);
  
  const pool = new Pool({
    connectionString: `postgresql://postgres@localhost:5432/${dbName}`,
  });

  try {
    // Get all tables in the database
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map(r => r.table_name);
    console.log(`\n📊 Found ${existingTables.length} tables`);
    
    // Check against expected schema
    let missingTables = [];
    let missingColumns = [];
    let totalIssues = 0;
    
    // For each expected table, check if it exists and has the right columns
    for (const [expectedTable, expectedColumns] of Object.entries(EXPECTED_SCHEMA)) {
      if (!existingTables.includes(expectedTable)) {
        missingTables.push(expectedTable);
        console.log(`  ❌ Missing table: ${expectedTable}`);
        totalIssues++;
        continue;
      }
      
      // Get actual columns for this table
      const columnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${expectedTable}'
        ORDER BY column_name
      `);
      
      const actualColumns = columnsResult.rows.map(r => r.column_name);
      
      // Check for missing columns
      const missing = expectedColumns.filter(col => !actualColumns.includes(col));
      if (missing.length > 0) {
        missingColumns.push({ table: expectedTable, columns: missing });
        console.log(`  ⚠️ ${expectedTable} missing columns: ${missing.join(', ')}`);
        totalIssues += missing.length;
      }
    }
    
    // Check if there are extra tables (not in our schema)
    const extraTables = existingTables.filter(t => !EXPECTED_SCHEMA[t] && !['_prisma_migrations', 'schema_migrations'].includes(t));
    if (extraTables.length > 0) {
      console.log(`\n📌 Extra tables found (not in schema): ${extraTables.join(', ')}`);
    }
    
    // Summary
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📊 Audit Summary for ${dbName}:`);
    console.log(`  ✅ Tables checked: ${Object.keys(EXPECTED_SCHEMA).length}`);
    console.log(`  ✅ Tables existing: ${existingTables.length}`);
    console.log(`  ❌ Missing tables: ${missingTables.length}`);
    console.log(`  ❌ Missing columns: ${missingColumns.length}`);
    console.log(`  ⚠️ Total issues: ${totalIssues}`);
    
    if (missingTables.length === 0 && missingColumns.length === 0) {
      console.log(`\n  ✅ ${dbName} is 100% healthy! 🎉`);
    } else {
      console.log(`\n  ⚠️ ${dbName} needs attention.`);
    }
    
    return { missingTables, missingColumns, totalIssues };
  } catch (err) {
    console.error(`❌ Error auditing ${dbName}:`, err.message);
    return { missingTables: [], missingColumns: [], totalIssues: 0 };
  } finally {
    await pool.end();
  }
}

async function auditAllDatabases() {
  console.log(`
${'█'.repeat(60)}
  🔍 BIASHARALEDGER - FULL DATABASE AUDIT
${'█'.repeat(60)}`);
  
  const mainPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get all databases
    const result = await mainPool.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      AND datname NOT IN ('postgres', 'biashara_ledger')
      ORDER BY datname
    `);
    
    const allDbs = ['biashara_ledger', ...result.rows.map(r => r.datname)];
    console.log(`\n📋 Found ${allDbs.length} databases to audit:\n  - ${allDbs.join('\n  - ')}`);
    
    // Audit each database
    let allIssues = [];
    for (const dbName of allDbs) {
      const result = await auditDatabase(dbName, dbName === 'biashara_ledger');
      allIssues.push({ db: dbName, ...result });
    }
    
    // Final summary
    console.log(`\n\n${'█'.repeat(60)}`);
    console.log(`  📊 FINAL AUDIT SUMMARY`);
    console.log(`${'█'.repeat(60)}`);
    
    let totalIssues = 0;
    let healthyCount = 0;
    let unhealthyCount = 0;
    
    for (const issue of allIssues) {
      const status = issue.totalIssues === 0 ? '✅ HEALTHY' : '⚠️ ISSUES';
      if (issue.totalIssues === 0) {
        healthyCount++;
      } else {
        unhealthyCount++;
      }
      totalIssues += issue.totalIssues;
      console.log(`  ${status}  ${issue.db.padEnd(30)} (${issue.totalIssues} issues)`);
    }
    
    console.log(`${'─'.repeat(60)}`);
    console.log(`  ✅ Healthy databases: ${healthyCount}`);
    console.log(`  ⚠️ Databases with issues: ${unhealthyCount}`);
    console.log(`  📊 Total issues found: ${totalIssues}`);
    console.log(`${'█'.repeat(60)}`);
    
    if (totalIssues === 0) {
      console.log(`\n🎉 ALL DATABASES ARE 100% HEALTHY!`);
    } else {
      console.log(`\n⚠️ Some databases have issues. Run fixes as needed.`);
    }
    
  } catch (err) {
    console.error('❌ Audit failed:', err.message);
  } finally {
    await mainPool.end();
  }
}

// Run the audit
auditAllDatabases();

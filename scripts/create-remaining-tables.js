const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createRemainingTables() {
  console.log('🔄 Creating remaining tables with full schema...\n');

  const tables = {
    company_settings: `
      CREATE TABLE IF NOT EXISTS public.company_settings (
        tenant_id UUID UNIQUE NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        company_name TEXT DEFAULT '',
        address TEXT DEFAULT '',
        location TEXT DEFAULT '',
        country TEXT DEFAULT 'Kenya',
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        kra_pin TEXT DEFAULT '',
        logo_base64 TEXT DEFAULT '',
        paybill_number TEXT DEFAULT '',
        bank_name TEXT DEFAULT '',
        account_number TEXT DEFAULT '',
        bank_branch TEXT DEFAULT '',
        branch_code TEXT DEFAULT '',
        bank_code TEXT DEFAULT '',
        swift_code TEXT DEFAULT '',
        terms_conditions TEXT DEFAULT '',
        invoice_prefix TEXT DEFAULT 'INV',
        next_invoice_number INTEGER DEFAULT 1,
        quotation_prefix TEXT DEFAULT 'QTN',
        next_quotation_number INTEGER DEFAULT 1,
        last_invoice_month TEXT DEFAULT '',
        last_quotation_month TEXT DEFAULT '',
        smtp_host TEXT DEFAULT '',
        smtp_port TEXT DEFAULT '587',
        smtp_user TEXT DEFAULT '',
        smtp_pass TEXT DEFAULT '',
        vat_rate REAL DEFAULT 16,
        base_currency TEXT DEFAULT 'USD',
        income_tax_rate REAL DEFAULT 0,
        tax_filing_frequency TEXT DEFAULT 'monthly',
        credit_note_prefix TEXT DEFAULT 'CN',
        next_credit_note_number INTEGER DEFAULT 1,
        last_credit_note_month TEXT DEFAULT '',
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    bank_accounts: `
      CREATE TABLE IF NOT EXISTS public.bank_accounts (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        account_name TEXT NOT NULL DEFAULT '',
        account_number TEXT DEFAULT '',
        bank_name TEXT DEFAULT '',
        currency TEXT DEFAULT 'USD',
        opening_balance REAL DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    bank_statements: `
      CREATE TABLE IF NOT EXISTS public.bank_statements (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        bank_account_id UUID NOT NULL,
        transaction_date TEXT NOT NULL,
        description TEXT DEFAULT '',
        reference TEXT DEFAULT '',
        amount REAL NOT NULL DEFAULT 0,
        type TEXT NOT NULL DEFAULT 'DEBIT',
        balance REAL DEFAULT 0,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'unreconciled',
        reconciliation_id UUID,
        matched_transaction_type TEXT DEFAULT '',
        matched_transaction_id TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    reconciliation_runs: `
      CREATE TABLE IF NOT EXISTS public.reconciliation_runs (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        bank_account_id UUID NOT NULL,
        statement_balance REAL DEFAULT 0,
        system_balance REAL DEFAULT 0,
        difference REAL DEFAULT 0,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT DEFAULT 'in_progress',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    inventory_items: `
      CREATE TABLE IF NOT EXISTS public.inventory_items (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        item_name TEXT NOT NULL DEFAULT '',
        sku TEXT DEFAULT '',
        category TEXT DEFAULT '',
        unit_of_measure TEXT DEFAULT 'pcs',
        opening_stock REAL DEFAULT 0,
        current_stock REAL DEFAULT 0,
        unit_cost REAL DEFAULT 0,
        reorder_level REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    inventory_transactions: `
      CREATE TABLE IF NOT EXISTS public.inventory_transactions (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        item_id UUID NOT NULL,
        transaction_type TEXT NOT NULL DEFAULT 'PURCHASE',
        quantity REAL NOT NULL DEFAULT 0,
        unit_cost REAL DEFAULT 0,
        total_cost REAL DEFAULT 0,
        reference_type TEXT DEFAULT '',
        reference_id TEXT DEFAULT '',
        transaction_date TEXT NOT NULL,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    chart_of_accounts: `
      CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        account_code TEXT NOT NULL,
        account_name TEXT NOT NULL,
        account_type TEXT NOT NULL DEFAULT 'EXPENSE',
        parent_id UUID,
        is_active INTEGER DEFAULT 1,
        opening_balance REAL DEFAULT 0,
        description TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    journal_entries: `
      CREATE TABLE IF NOT EXISTS public.journal_entries (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        entry_number TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        entry_date TEXT NOT NULL,
        reference TEXT DEFAULT '',
        status TEXT DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    journal_entry_lines: `
      CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        journal_entry_id UUID NOT NULL,
        account_id UUID NOT NULL,
        description TEXT DEFAULT '',
        debit_amount REAL DEFAULT 0,
        credit_amount REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    budgets: `
      CREATE TABLE IF NOT EXISTS public.budgets (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        fiscal_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
        period TEXT NOT NULL DEFAULT 'MONTHLY',
        category_type TEXT NOT NULL DEFAULT 'REVENUE',
        category_name TEXT DEFAULT '',
        amount REAL NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    fixed_assets: `
      CREATE TABLE IF NOT EXISTS public.fixed_assets (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        asset_name TEXT NOT NULL DEFAULT '',
        asset_type TEXT DEFAULT 'Equipment',
        purchase_date TEXT NOT NULL,
        purchase_cost REAL NOT NULL DEFAULT 0,
        useful_life_years REAL NOT NULL DEFAULT 5,
        depreciation_method TEXT DEFAULT 'straight-line',
        salvage_value REAL DEFAULT 0,
        accumulated_depreciation REAL DEFAULT 0,
        book_value REAL DEFAULT 0,
        status TEXT DEFAULT 'active',
        disposal_date TEXT DEFAULT '',
        disposal_amount REAL DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    projects: `
      CREATE TABLE IF NOT EXISTS public.projects (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        project_name TEXT NOT NULL DEFAULT '',
        description TEXT DEFAULT '',
        start_date TEXT DEFAULT '',
        end_date TEXT DEFAULT '',
        budget REAL DEFAULT 0,
        currency TEXT DEFAULT 'USD',
        customer_id UUID,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    project_transactions: `
      CREATE TABLE IF NOT EXISTS public.project_transactions (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL,
        entity_type TEXT NOT NULL DEFAULT 'expense',
        entity_id TEXT NOT NULL DEFAULT '',
        amount REAL NOT NULL DEFAULT 0,
        transaction_date TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    deals: `
      CREATE TABLE IF NOT EXISTS public.deals (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        deal_name TEXT NOT NULL DEFAULT '',
        customer_id UUID,
        contact_name TEXT DEFAULT '',
        contact_email TEXT DEFAULT '',
        contact_phone TEXT DEFAULT '',
        deal_value REAL DEFAULT 0,
        currency TEXT DEFAULT 'USD',
        pipeline_stage TEXT DEFAULT 'lead',
        probability INTEGER DEFAULT 10,
        expected_close_date TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    other_transactions: `
      CREATE TABLE IF NOT EXISTS public.other_transactions (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        type TEXT NOT NULL DEFAULT 'OTHER_INCOME',
        category TEXT DEFAULT '',
        description TEXT DEFAULT '',
        amount REAL NOT NULL DEFAULT 0,
        currency TEXT DEFAULT 'USD',
        exchange_rate REAL DEFAULT 1,
        transaction_date TEXT NOT NULL,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    capital_transactions: `
      CREATE TABLE IF NOT EXISTS public.capital_transactions (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        type TEXT NOT NULL DEFAULT 'CAPITAL_INJECTION',
        amount REAL NOT NULL DEFAULT 0,
        currency TEXT DEFAULT 'USD',
        exchange_rate REAL DEFAULT 1,
        transaction_date TEXT NOT NULL,
        description TEXT DEFAULT '',
        reference TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    approval_workflows: `
      CREATE TABLE IF NOT EXISTS public.approval_workflows (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        workflow_name TEXT NOT NULL DEFAULT '',
        entity_type TEXT NOT NULL,
        trigger_amount REAL DEFAULT 0,
        approver_role TEXT DEFAULT 'admin',
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    approval_requests: `
      CREATE TABLE IF NOT EXISTS public.approval_requests (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        workflow_id UUID,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        entity_amount REAL DEFAULT 0,
        requested_by UUID,
        status TEXT DEFAULT 'pending',
        approved_by UUID,
        approved_at TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    recurring_templates: `
      CREATE TABLE IF NOT EXISTS public.recurring_templates (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        template_name TEXT NOT NULL DEFAULT '',
        entity_type TEXT NOT NULL DEFAULT 'invoice',
        template_data TEXT DEFAULT '{}',
        frequency TEXT NOT NULL DEFAULT 'monthly',
        interval_count INTEGER DEFAULT 1,
        next_run_date TEXT NOT NULL,
        last_run_date TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    notification_preferences: `
      CREATE TABLE IF NOT EXISTS public.notification_preferences (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        email_notifications INTEGER DEFAULT 1,
        sms_notifications INTEGER DEFAULT 0,
        in_app_notifications INTEGER DEFAULT 1,
        invoice_reminders INTEGER DEFAULT 1,
        payment_confirmations INTEGER DEFAULT 1,
        low_stock_alerts INTEGER DEFAULT 1,
        approval_requests INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    notification_log: `
      CREATE TABLE IF NOT EXISTS public.notification_log (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        user_id UUID,
        notification_type TEXT NOT NULL,
        title TEXT DEFAULT '',
        message TEXT DEFAULT '',
        channel TEXT DEFAULT 'in_app',
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    audit_log: `
      CREATE TABLE IF NOT EXISTS public.audit_log (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        user_id UUID,
        entity_type TEXT NOT NULL,
        imported_count INTEGER DEFAULT 0,
        errors_count INTEGER DEFAULT 0,
        error_details TEXT DEFAULT '[]',
        file_name TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    exchange_rates: `
      CREATE TABLE IF NOT EXISTS public.exchange_rates (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        source_currency TEXT NOT NULL,
        target_currency TEXT NOT NULL DEFAULT 'USD',
        rate REAL NOT NULL DEFAULT 1,
        rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    api_keys: `
      CREATE TABLE IF NOT EXISTS public.api_keys (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        key_name TEXT NOT NULL DEFAULT '',
        api_key TEXT NOT NULL,
        permissions TEXT DEFAULT 'read',
        last_used_at TIMESTAMP,
        expires_at TIMESTAMP,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    webhooks: `
      CREATE TABLE IF NOT EXISTS public.webhooks (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        webhook_name TEXT NOT NULL DEFAULT '',
        url TEXT NOT NULL,
        events TEXT DEFAULT '[]',
        secret TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        last_triggered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `,
    articles: `
      CREATE TABLE IF NOT EXISTS public.articles (
        tenant_id UUID NOT NULL REFERENCES public.tenants(id),
        id UUID DEFAULT gen_random_uuid(),
        title TEXT NOT NULL DEFAULT '',
        slug TEXT NOT NULL DEFAULT '',
        content TEXT DEFAULT '',
        excerpt TEXT DEFAULT '',
        author TEXT DEFAULT '',
        status TEXT DEFAULT 'draft',
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (tenant_id, id)
      );
    `
  };

  let created = 0;
  let total = Object.keys(tables).length;

  for (const [tableName, createSQL] of Object.entries(tables)) {
    try {
      await pool.query(createSQL);
      console.log(`  ✅ Created table: ${tableName}`);
      created++;
    } catch (err) {
      console.log(`  ⚠️ Could not create ${tableName}: ${err.message}`);
    }
  }

  console.log(`\n✅ Created ${created}/${total} tables successfully!`);
  process.exit(0);
}

createRemainingTables();

import { safeExec } from './safe-exec';
import { logError } from '../logger';

export async function initInventoryModule() {
  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.inventory_items (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      item_name TEXT NOT NULL DEFAULT '',
      sku TEXT DEFAULT '',
      category TEXT DEFAULT '',
      category_id UUID,
      barcode TEXT DEFAULT '',
      industry TEXT DEFAULT '',
      unit_of_measure TEXT DEFAULT 'pcs',
      purchase_uom TEXT DEFAULT '',
      sale_uom TEXT DEFAULT '',
      opening_stock REAL DEFAULT 0,
      current_stock REAL DEFAULT 0,
      unit_cost REAL DEFAULT 0,
      reorder_level REAL DEFAULT 0,
      custom_fields JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id),
      UNIQUE (tenant_id, sku)
    );
  `);

  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.categories (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      name TEXT NOT NULL DEFAULT '',
      industry TEXT DEFAULT '',
      parent_id UUID,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );
  `);

  await safeExec(`
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
  `);

  await safeExec(`DROP TABLE IF EXISTS public.unit_conversions`);
}

export async function initFinancialModule() {
  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.other_transactions (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      type TEXT NOT NULL DEFAULT 'OTHER_INCOME',
      category TEXT DEFAULT '',
      description TEXT DEFAULT '',
      amount REAL NOT NULL DEFAULT 0,
      transaction_date TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );
  `);

  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.capital_transactions (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      type TEXT NOT NULL DEFAULT 'CAPITAL_INJECTION',
      amount REAL NOT NULL DEFAULT 0,
      transaction_date TEXT NOT NULL,
      description TEXT DEFAULT '',
      reference TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );
  `);

  await safeExec(`
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
  `);

  await safeExec(`ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS income_tax_rate REAL DEFAULT 0`);
  await safeExec(`ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS tax_filing_frequency TEXT DEFAULT 'monthly'`);

  await safeExec(`
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
  `);

  await safeExec(`
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
  `);
  await safeExec(`
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
  `);

  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.bank_accounts (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      account_name TEXT NOT NULL DEFAULT '',
      account_number TEXT DEFAULT '',
      bank_name TEXT DEFAULT '',
      currency TEXT DEFAULT 'KES',
      opening_balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );
  `);
  await safeExec(`
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
      status TEXT DEFAULT 'unreconciled',
      reconciliation_id UUID,
      matched_transaction_type TEXT DEFAULT '',
      matched_transaction_id TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );
  `);
  await safeExec(`
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
  `);

  await safeExec(`
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
  `);

  // Multi-currency columns
  await safeExec(`ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'KES'`);
  await safeExec(`ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT ''`);
  await safeExec(`ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS industries TEXT[] DEFAULT '{}'`);
  await safeExec(`ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS custom_field_templates JSONB DEFAULT '[]'`);
  await safeExec(`ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT ''`);
  await safeExec(`ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT ''`);
  await safeExec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await safeExec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await safeExec(`ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await safeExec(`ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await safeExec(`ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await safeExec(`ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await safeExec(`ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await safeExec(`ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await safeExec(`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await safeExec(`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await safeExec(`ALTER TABLE public.supplier_payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await safeExec(`ALTER TABLE public.supplier_payments ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await safeExec(`ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await safeExec(`ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await safeExec(`ALTER TABLE public.salaries ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await safeExec(`ALTER TABLE public.salaries ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await safeExec(`ALTER TABLE public.credit_notes ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await safeExec(`ALTER TABLE public.credit_notes ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await safeExec(`ALTER TABLE public.debit_notes ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await safeExec(`ALTER TABLE public.debit_notes ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await safeExec(`ALTER TABLE public.other_transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await safeExec(`ALTER TABLE public.other_transactions ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await safeExec(`ALTER TABLE public.capital_transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await safeExec(`ALTER TABLE public.capital_transactions ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);

  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.exchange_rates (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      source_currency TEXT NOT NULL,
      target_currency TEXT NOT NULL DEFAULT 'KES',
      rate REAL NOT NULL DEFAULT 1,
      rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );
  `);
}

export async function initAdminModule() {
  await safeExec(`ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS reminder_sent_30d BOOLEAN DEFAULT FALSE`);
  await safeExec(`ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS reminder_sent_7d BOOLEAN DEFAULT FALSE`);
  await safeExec(`ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS reminder_sent_3d BOOLEAN DEFAULT FALSE`);
  await safeExec(`ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS reminder_sent_1d BOOLEAN DEFAULT FALSE`);
  await safeExec(`ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS reminder_sent_12h BOOLEAN DEFAULT FALSE`);

  await safeExec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS allowed_modules TEXT DEFAULT '[]'`);
  await safeExec(`ALTER TABLE public.admin_plans ADD COLUMN IF NOT EXISTS modules TEXT DEFAULT '[]'`);
  await safeExec(`ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS modules TEXT DEFAULT '[]'`);

  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.admin_plans (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      price NUMERIC(10,2) NOT NULL DEFAULT 0,
      description TEXT DEFAULT '',
      features TEXT DEFAULT '[]',
      is_active BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await safeExec(`
    INSERT INTO public.admin_plans (name, price, description, sort_order) VALUES
      ('Basic', 5.00, 'Basic plan with essential features', 1),
      ('Standard', 10.00, 'Standard plan with advanced features', 2),
      ('Premium', 15.00, 'Premium plan with all features', 3)
    ON CONFLICT (name) DO NOTHING;
  `);

  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.admin_audit_log (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      admin_id UUID,
      admin_email TEXT DEFAULT '',
      action TEXT NOT NULL,
      entity_type TEXT DEFAULT '',
      entity_id TEXT DEFAULT '',
      details TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.admin_notifications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT DEFAULT '',
      message TEXT NOT NULL,
      link TEXT DEFAULT '',
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  try {
    await safeExec(`
      INSERT INTO admin_notifications (type, title, message, link, created_at)
      SELECT 'info', 'New client registered', 'New client registered: ' || COALESCE(company_name, email), '/admin/clients', created_at
      FROM admin_clients WHERE created_at >= NOW() - INTERVAL '30 days'
      AND NOT EXISTS (SELECT 1 FROM admin_notifications WHERE admin_notifications.message LIKE 'New client registered:%')
    `);
  } catch (e) { logError('schema', e instanceof Error ? e.message : String(e)); }
  try {
    await safeExec(`
      INSERT INTO admin_notifications (type, title, message, link, created_at)
      SELECT 'info', 'License generated', 'License generated for ' || COALESCE(ac.company_name, 'a client'), '/admin/licenses', alk.created_at
      FROM admin_license_keys alk LEFT JOIN admin_clients ac ON alk.client_id = ac.id
      WHERE alk.created_at >= NOW() - INTERVAL '30 days'
      AND NOT EXISTS (SELECT 1 FROM admin_notifications WHERE admin_notifications.title = 'License generated')
    `);
  } catch (e) { logError('schema', e instanceof Error ? e.message : String(e)); }
  try {
    await safeExec(`
      INSERT INTO admin_notifications (type, title, message, link, created_at)
      SELECT 'info', 'Update published', 'Software update v' || version || ' published', '/admin/updates', COALESCE(release_date, created_at)
      FROM app_updates WHERE created_at >= NOW() - INTERVAL '30 days'
      AND NOT EXISTS (SELECT 1 FROM admin_notifications WHERE admin_notifications.title = 'Update published')
    `);
  } catch (e) { logError('schema', e instanceof Error ? e.message : String(e)); }
  try {
    await safeExec(`
      INSERT INTO admin_notifications (type, title, message, link, created_at)
      SELECT 'warning', 'License expiring', 'License ' || license_key || ' expiring in 3 days', '/admin/licenses', expires_at
      FROM admin_license_keys WHERE is_active = true AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
      AND NOT EXISTS (SELECT 1 FROM admin_notifications WHERE admin_notifications.title = 'License expiring')
    `);
  } catch (e) { logError('schema', e instanceof Error ? e.message : String(e)); }
}

export async function initSystemModule() {
  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.audit_log (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      user_id UUID,
      entity_type TEXT NOT NULL,
      entity_id TEXT DEFAULT '',
      action_type TEXT DEFAULT '',
      old_values TEXT DEFAULT '{}',
      new_values TEXT DEFAULT '{}',
      ip_address TEXT DEFAULT '',
      imported_count INTEGER DEFAULT 0,
      errors_count INTEGER DEFAULT 0,
      error_details TEXT DEFAULT '[]',
      file_name TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );
  `);

  await safeExec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS created_by UUID`);
  await safeExec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS updated_by UUID`);
  await safeExec(`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_by UUID`);
  await safeExec(`ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS created_by UUID`);
  await safeExec(`ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_by UUID`);
  await safeExec(`ALTER TABLE public.salaries ADD COLUMN IF NOT EXISTS created_by UUID`);
  await safeExec(`ALTER TABLE public.supplier_payments ADD COLUMN IF NOT EXISTS created_by UUID`);
  await safeExec(`ALTER TABLE public.credit_notes ADD COLUMN IF NOT EXISTS created_by UUID`);
  await safeExec(`ALTER TABLE public.debit_notes ADD COLUMN IF NOT EXISTS created_by UUID`);
  await safeExec(`ALTER TABLE public.other_transactions ADD COLUMN IF NOT EXISTS created_by UUID`);
  await safeExec(`ALTER TABLE public.capital_transactions ADD COLUMN IF NOT EXISTS created_by UUID`);
  await safeExec(`ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS created_by UUID`);
  await safeExec(`ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_by UUID`);

  await safeExec(`
    CREATE OR REPLACE FUNCTION public.audit_trigger_func()
    RETURNS TRIGGER AS $$
    DECLARE
      v_tenant_id UUID;
      v_old_json TEXT := '{}';
      v_new_json TEXT := '{}';
    BEGIN
      IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        v_old_json := row_to_json(OLD)::TEXT;
      END IF;
      IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_new_json := row_to_json(NEW)::TEXT;
      END IF;

      v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);

      INSERT INTO public.audit_log (tenant_id, user_id, entity_type, entity_id, action_type, old_values, new_values)
      VALUES (
        v_tenant_id,
        COALESCE(NEW.created_by, OLD.created_by, NEW.updated_by, OLD.updated_by, NULL),
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        TG_OP,
        v_old_json,
        v_new_json
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  const auditTables = ['sales_invoices', 'payments', 'purchase_invoices', 'supplier_payments',
    'expenses', 'salaries', 'credit_notes', 'debit_notes', 'other_transactions',
    'capital_transactions', 'customers', 'clients', 'inventory_items', 'fixed_assets',
    'journal_entries', 'journal_entry_lines'];
  for (const tbl of auditTables) {
    await safeExec(`
      DROP TRIGGER IF EXISTS audit_trigger ON public.${tbl};
      CREATE TRIGGER audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.${tbl}
      FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
    `);
  }

  // Idempotency & soft delete
  await safeExec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS idempotency_key TEXT`);
  await safeExec(`CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_invoices_idempotency ON public.sales_invoices (tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL`);
  await safeExec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`);
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_sales_invoices_deleted_at ON public.sales_invoices (deleted_at)`);

  await safeExec(`ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS category_id UUID`);
  await safeExec(`ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'`);
  await safeExec(`ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS purchase_uom TEXT DEFAULT ''`);
  await safeExec(`ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS sale_uom TEXT DEFAULT ''`);

  await safeExec(`
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
  `);

  await safeExec(`
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
  `);
  await safeExec(`
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
  `);

  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.deals (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      deal_name TEXT NOT NULL DEFAULT '',
      customer_id UUID,
      contact_name TEXT DEFAULT '',
      contact_email TEXT DEFAULT '',
      contact_phone TEXT DEFAULT '',
      deal_value REAL DEFAULT 0,
      currency TEXT DEFAULT 'KES',
      pipeline_stage TEXT DEFAULT 'lead',
      probability INTEGER DEFAULT 10,
      expected_close_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'open',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );
  `);

  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.projects (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      project_name TEXT NOT NULL DEFAULT '',
      description TEXT DEFAULT '',
      start_date TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      budget REAL DEFAULT 0,
      currency TEXT DEFAULT 'KES',
      customer_id UUID,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );
  `);
  await safeExec(`
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
  `);

  await safeExec(`
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
  `);
  await safeExec(`
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
  `);

  await safeExec(`
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
  `);
  await safeExec(`
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
  `);
}

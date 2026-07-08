import { exec } from './db';
import { logError } from './logger';

export async function initSchema() {
  // Create tenants table first since all tenant-scoped tables reference it
  await exec(`
    CREATE TABLE IF NOT EXISTS public.tenants (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS public.users (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT DEFAULT '',
      last_name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      country TEXT DEFAULT 'KE',
      subscription_plan TEXT DEFAULT 'trial',
      subscription_status TEXT DEFAULT 'active',
      verified INTEGER DEFAULT 0,
      subscription_expiry TIMESTAMPTZ,
      role TEXT DEFAULT 'user',
      encryption_key TEXT,
      grace_period_end TIMESTAMPTZ,
      last_reminder_sent TIMESTAMPTZ,
      payment_method TEXT DEFAULT 'mpesa',
      card_last4 TEXT,
      card_expiry TEXT,
      paypal_email TEXT,
      trial_start_date TIMESTAMPTZ,
      trial_end_date TIMESTAMPTZ,
      trial_used INTEGER DEFAULT 0,
      license_status TEXT DEFAULT 'trial',
      license_key TEXT DEFAULT '',
      last_ip TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id),
      UNIQUE (tenant_id, email)
    );

    CREATE TABLE IF NOT EXISTS public.sessions (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      token TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      client_db TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id),
      UNIQUE (tenant_id, token)
    );

    -- verification_codes is a shared table (used pre-auth, no tenant_id)
    CREATE TABLE IF NOT EXISTS public.verification_codes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT 'signup',
      data TEXT DEFAULT '{}',
      expires_at TIMESTAMPTZ NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- rate_limits for database-backed rate limiting (shared, no tenant_id)
    CREATE TABLE IF NOT EXISTS public.rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER DEFAULT 1,
      expires_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.roles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      permissions TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS public.subscription_events (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      event_type TEXT NOT NULL,
      description TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS public.billing_history (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'KES',
      plan_name TEXT NOT NULL,
      payment_method TEXT DEFAULT 'mpesa',
      transaction_id TEXT DEFAULT '',
      status TEXT DEFAULT 'completed',
      period_start TIMESTAMP NOT NULL,
      period_end TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

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

    CREATE TABLE IF NOT EXISTS public.quotations (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      quotation_number TEXT DEFAULT '',
      customer_id UUID NOT NULL,
      customer_name TEXT NOT NULL,
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
      issue_date TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

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

    CREATE TABLE IF NOT EXISTS public.payments (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      invoice_id UUID NOT NULL,
      customer_id UUID NOT NULL,
      customer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS public.credit_notes (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      credit_note_number TEXT DEFAULT '',
      invoice_id UUID NOT NULL,
      customer_id UUID NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT DEFAULT '',
      description TEXT DEFAULT '',
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      tax_vat REAL DEFAULT 0,
      discounts REAL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      reason TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      payment_terms TEXT DEFAULT 'Net 30',
      issue_date TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS public.purchase_orders (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      po_number TEXT DEFAULT '',
      client_id UUID NOT NULL,
      client_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      tax_vat REAL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      delivery_date TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      notes TEXT DEFAULT '',
      issue_date TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS public.purchase_invoices (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      invoice_number TEXT DEFAULT '',
      po_id UUID,
      client_id UUID NOT NULL,
      client_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      tax_vat REAL DEFAULT 0,
      discounts REAL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      payment_terms TEXT DEFAULT 'Net 30',
      status TEXT DEFAULT 'unpaid',
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS public.supplier_payments (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      invoice_id UUID NOT NULL,
      client_id UUID NOT NULL,
      client_name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS public.debit_notes (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      debit_note_number TEXT DEFAULT '',
      purchase_invoice_id UUID NOT NULL,
      client_id UUID NOT NULL,
      client_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      reason TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      issue_date TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS public.employees (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      employee_code TEXT DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      date_of_birth TEXT DEFAULT '',
      national_id TEXT DEFAULT '',
      tax_pin TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      department TEXT DEFAULT '',
      job_title TEXT DEFAULT '',
      date_of_hire TEXT DEFAULT '',
      employment_type TEXT DEFAULT 'full-time',
      bank_name TEXT DEFAULT '',
      account_number TEXT DEFAULT '',
      emergency_contact_name TEXT DEFAULT '',
      emergency_contact_phone TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      salary REAL DEFAULT 0,
      salary_encrypted TEXT,
      national_id_encrypted TEXT,
      bank_account_encrypted TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS public.salaries (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      employee_id UUID NOT NULL,
      employee_name TEXT NOT NULL,
      basic_salary REAL DEFAULT 0,
      allowances REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      overtime REAL DEFAULT 0,
      bonuses REAL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      amount_encrypted TEXT,
      pay_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'bank',
      payslip_reference TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

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
      credit_note_prefix TEXT DEFAULT 'CN',
      next_credit_note_number INTEGER DEFAULT 1,
      last_credit_note_month TEXT DEFAULT '',
      updated_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS public.expenses (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      expense_code TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      description TEXT DEFAULT '',
      supplier_vendor TEXT DEFAULT '',
      invoice_receipt_number TEXT DEFAULT '',
      amount REAL NOT NULL DEFAULT 0,
      tax_vat REAL DEFAULT 0,
      expense_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      paid_by TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS public.licenses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      license_key VARCHAR(255) UNIQUE NOT NULL,
      license_id VARCHAR(255) UNIQUE NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'trial',
      status VARCHAR(20) DEFAULT 'active',
      hardware_fingerprint TEXT,
      activated BOOLEAN DEFAULT FALSE,
      activation_date TIMESTAMP,
      expiry_date TIMESTAMP,
      last_validated TIMESTAMP,
      last_seen TIMESTAMP,
      last_known_ip VARCHAR(45),
      device_info TEXT,
      user_email VARCHAR(255),
      features JSONB DEFAULT '[]',
      revoked BOOLEAN DEFAULT FALSE,
      allowed_installations INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.analytics (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      license_id VARCHAR(255),
      event VARCHAR(100),
      app_version VARCHAR(50),
      os_version VARCHAR(50),
      data JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.sync_queue (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      table_name VARCHAR(100) NOT NULL,
      record_id INTEGER NOT NULL,
      action VARCHAR(20) NOT NULL,
      data JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      synced_at TIMESTAMP,
      attempts INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS public.admin_clients (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      company_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      database_name VARCHAR(255) UNIQUE NOT NULL,
      license_key VARCHAR(255) UNIQUE,
      max_users INTEGER DEFAULT 5,
      plan VARCHAR(50) DEFAULT 'basic',
      is_active BOOLEAN DEFAULT TRUE,
      is_trial BOOLEAN DEFAULT TRUE,
      trial_start_date TIMESTAMP,
      trial_end_date TIMESTAMP,
      expires_at TIMESTAMP,
      last_active TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE public.admin_clients ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'basic';

    CREATE TABLE IF NOT EXISTS public.admin_users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS public.admin_license_keys (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      license_key VARCHAR(255) UNIQUE NOT NULL,
      client_id UUID REFERENCES public.admin_clients(id) ON DELETE CASCADE,
      plan VARCHAR(50) DEFAULT 'standard',
      is_used BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      hardware_fingerprint TEXT,
      expires_at TIMESTAMPTZ,
      activated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.license_keys (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      license_key VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) NOT NULL,
      license_type VARCHAR(50) DEFAULT 'standard',
      status VARCHAR(20) DEFAULT 'unused',
      user_id UUID,
      expires_at TIMESTAMPTZ,
      activated_at TIMESTAMP,
      hardware_fingerprint TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS public.license_activations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      license_key VARCHAR(255) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      hardware_fingerprint TEXT DEFAULT '',
      ip_address VARCHAR(45) DEFAULT '',
      device_info TEXT DEFAULT '',
      status VARCHAR(20) NOT NULL DEFAULT '',
      error_reason TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.electron_activity (
      tenant_id UUID REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      license_key VARCHAR(255) NOT NULL,
      action VARCHAR(100) NOT NULL,
      data JSONB DEFAULT '{}',
      ip_address VARCHAR(45) DEFAULT '',
      session_token TEXT DEFAULT '',
      hardware_fingerprint TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS public.backups (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      license_key VARCHAR(255) NOT NULL,
      data JSONB NOT NULL,
      file_size INTEGER DEFAULT 0,
      version INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.app_updates (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      version VARCHAR(50) NOT NULL,
      changes JSONB DEFAULT '[]',
      release_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.email_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      recipient VARCHAR(255) NOT NULL,
      email_type VARCHAR(50) NOT NULL,
      success INTEGER DEFAULT 0,
      detail TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS public.offline_sessions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      client_id UUID REFERENCES public.admin_clients(id) ON DELETE CASCADE,
      license_key VARCHAR(255) NOT NULL,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      hardware_fingerprint TEXT NOT NULL DEFAULT '',
      user_email VARCHAR(255) NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      activated_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      last_heartbeat TIMESTAMPTZ,
      last_ip VARCHAR(45) DEFAULT '',
      last_sync TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.license_history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      client_id UUID REFERENCES public.admin_clients(id) ON DELETE SET NULL,
      license_id UUID,
      action VARCHAR(50) NOT NULL,
      old_plan_tier VARCHAR(50),
      new_plan_tier VARCHAR(50),
      old_expires_at TIMESTAMPTZ,
      new_expires_at TIMESTAMPTZ,
      performed_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Ensure all business tables have tenant_id column (for local PostgreSQL without Nile)
  async function addTenantIdCol(table: string) {
    try {
      await exec(`ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS tenant_id TEXT`);
    } catch { /* table may not exist yet — will be retried later */ }
  }
  const tenantTables = [
    'customers', 'clients', 'quotations', 'sales_invoices', 'payments',
    'credit_notes', 'purchase_orders', 'purchase_invoices', 'supplier_payments',
    'debit_notes', 'expenses', 'deals', 'projects',
    'other_transactions', 'capital_transactions', 'company_settings',
  ];
  for (const tbl of tenantTables) {
    await addTenantIdCol(tbl);
  }

  await exec(`ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS country TEXT DEFAULT ''`);
  await exec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'KE'`);
  await exec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''`);
  await exec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'`);
  await exec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ`);
  await exec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ`);
  await exec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ`);
  await exec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'trial'`);
  await exec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial'`);
  await exec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'`);
  await exec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified INTEGER DEFAULT 0`);
  await exec(`ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS client_db TEXT DEFAULT ''`);
  await exec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS customer_country TEXT DEFAULT ''`);
  await exec(`ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS customer_country TEXT DEFAULT ''`);
  await exec(`ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS client_country TEXT DEFAULT ''`);
  await exec(`ALTER TABLE public.credit_notes ADD COLUMN IF NOT EXISTS customer_country TEXT DEFAULT ''`);
  await exec(`ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS client_country TEXT DEFAULT ''`);
  await exec(`ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS country TEXT DEFAULT ''`);
  await exec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 0`);
  await exec(`ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 0`);
  await exec(`ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 0`);
  await exec(`ALTER TABLE public.credit_notes ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 0`);
  await exec(`ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 0`);

  // ═══════════════════════════════════════════════
  // INVENTORY MODULE
  // ═══════════════════════════════════════════════
  await exec(`
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
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );
  `);

  await exec(`
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

  // ═══════════════════════════════════════════════
  // OTHER INCOME & EXPENSES
  // ═══════════════════════════════════════════════
  await exec(`
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

  // ═══════════════════════════════════════════════
  // CAPITAL CONTRIBUTIONS & WITHDRAWALS
  // ═══════════════════════════════════════════════
  await exec(`
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

  // ═══════════════════════════════════════════════
  // USER-DEFINED BUDGETS
  // ═══════════════════════════════════════════════
  await exec(`
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

  // Income tax fields on company_settings
  await exec(`ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS reminder_sent_30d BOOLEAN DEFAULT FALSE`);
  await exec(`ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS reminder_sent_7d BOOLEAN DEFAULT FALSE`);
  await exec(`ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS reminder_sent_3d BOOLEAN DEFAULT FALSE`);
  await exec(`ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS reminder_sent_1d BOOLEAN DEFAULT FALSE`);
  await exec(`ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS reminder_sent_12h BOOLEAN DEFAULT FALSE`);

  await exec(`ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS income_tax_rate REAL DEFAULT 0`);
  await exec(`ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS tax_filing_frequency TEXT DEFAULT 'monthly'`);

  // ═══════════════════════════════════════════════
  // AUDIT LOG (import tracking)
  // ═══════════════════════════════════════════════
  await exec(`
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
  `);

  await exec(`
    INSERT INTO public.admin_users (username, password_hash, email, role)
    VALUES ('admin', '$2b$10$dummy', 'admin@biasharaledger.com', 'super_admin')
    ON CONFLICT (username) DO NOTHING;
  `);

  await exec(`
    INSERT INTO public.roles (name, description, permissions) VALUES
      ('admin', 'Full access to all features', '["all"]'),
      ('hr_manager', 'HR and payroll management', '["hr.read","hr.write","payroll.read","payroll.write","dashboard.read"]'),
      ('accountant', 'Accounting and financial reports', '["accounts.read","accounts.write","reports.read","dashboard.read"]'),
      ('employee', 'View own data only', '["dashboard.read","hr.own"]')
    ON CONFLICT (name) DO NOTHING;
  `);

  // ═══════════════════════════════════════════════
  // MULTI-CURRENCY — currency fields on all tables
  // ═══════════════════════════════════════════════
  await exec(`ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'KES'`);
  await exec(`ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT ''`);
  await exec(`ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT ''`);
  await exec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await exec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await exec(`ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await exec(`ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await exec(`ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await exec(`ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await exec(`ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await exec(`ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await exec(`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await exec(`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await exec(`ALTER TABLE public.supplier_payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await exec(`ALTER TABLE public.supplier_payments ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await exec(`ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await exec(`ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await exec(`ALTER TABLE public.salaries ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await exec(`ALTER TABLE public.salaries ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await exec(`ALTER TABLE public.credit_notes ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await exec(`ALTER TABLE public.credit_notes ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await exec(`ALTER TABLE public.debit_notes ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await exec(`ALTER TABLE public.debit_notes ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await exec(`ALTER TABLE public.other_transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await exec(`ALTER TABLE public.other_transactions ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await exec(`ALTER TABLE public.capital_transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`);
  await exec(`ALTER TABLE public.capital_transactions ADD COLUMN IF NOT EXISTS exchange_rate REAL DEFAULT 1`);
  await exec(`
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

  // ═══════════════════════════════════════════════
  // CHART OF ACCOUNTS
  // ═══════════════════════════════════════════════
  await exec(`
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

  // ═══════════════════════════════════════════════
  // JOURNAL ENTRIES
  // ═══════════════════════════════════════════════
  await exec(`
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
  await exec(`
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

  // ═══════════════════════════════════════════════
  // BANK RECONCILIATION
  // ═══════════════════════════════════════════════
  await exec(`
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
  await exec(`
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
  await exec(`
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

  // ═══════════════════════════════════════════════
  // FIXED ASSETS
  // ═══════════════════════════════════════════════
  await exec(`
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

  // ═══════════════════════════════════════════════
  // RECURRING TRANSACTIONS
  // ═══════════════════════════════════════════════
  await exec(`
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

  // ═══════════════════════════════════════════════
  // WORKFLOW APPROVALS
  // ═══════════════════════════════════════════════
  await exec(`
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
  await exec(`
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

  // ═══════════════════════════════════════════════
  // CRM PIPELINE
  // ═══════════════════════════════════════════════
  await exec(`
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

  // ═══════════════════════════════════════════════
  // PROJECT COSTING
  // ═══════════════════════════════════════════════
  await exec(`
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
  await exec(`
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

  // ═══════════════════════════════════════════════
  // ADMIN SETTINGS (key-value for admin panel config)
  // ═══════════════════════════════════════════════
  await exec(`
    CREATE TABLE IF NOT EXISTS public.admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // ═══════════════════════════════════════════════
  // ADMIN SUBSCRIPTION PLANS
  // ═══════════════════════════════════════════════
  await exec(`
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

  await exec(`
    INSERT INTO public.admin_plans (name, price, description, sort_order) VALUES
      ('Basic', 5.00, 'Basic plan with essential features', 1),
      ('Standard', 10.00, 'Standard plan with advanced features', 2),
      ('Premium', 15.00, 'Premium plan with all features', 3)
    ON CONFLICT (name) DO NOTHING;
  `);

  // ═══════════════════════════════════════════════
  // ADMIN AUDIT LOG
  // ═══════════════════════════════════════════════
  await exec(`
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

  // ═══════════════════════════════════════════════
  // ADMIN NOTIFICATIONS
  // ═══════════════════════════════════════════════
  await exec(`
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

  // Seed admin_notifications from existing data (only if table is empty)
  try {
    await exec(`
      INSERT INTO admin_notifications (type, title, message, link, created_at)
      SELECT 'info', 'New client registered', 'New client registered: ' || COALESCE(company_name, email), '/admin/clients', created_at
      FROM admin_clients WHERE created_at >= NOW() - INTERVAL '30 days'
      AND NOT EXISTS (SELECT 1 FROM admin_notifications WHERE admin_notifications.message LIKE 'New client registered:%')
    `);
  } catch {}
  try {
    await exec(`
      INSERT INTO admin_notifications (type, title, message, link, created_at)
      SELECT 'info', 'License generated', 'License generated for ' || COALESCE(ac.company_name, 'a client'), '/admin/licenses', alk.created_at
      FROM admin_license_keys alk LEFT JOIN admin_clients ac ON alk.client_id = ac.id
      WHERE alk.created_at >= NOW() - INTERVAL '30 days'
      AND NOT EXISTS (SELECT 1 FROM admin_notifications WHERE admin_notifications.title = 'License generated')
    `);
  } catch {}
  try {
    await exec(`
      INSERT INTO admin_notifications (type, title, message, link, created_at)
      SELECT 'info', 'Update published', 'Software update v' || version || ' published', '/admin/updates', COALESCE(release_date, created_at)
      FROM app_updates WHERE created_at >= NOW() - INTERVAL '30 days'
      AND NOT EXISTS (SELECT 1 FROM admin_notifications WHERE admin_notifications.title = 'Update published')
    `);
  } catch {}
  try {
    await exec(`
      INSERT INTO admin_notifications (type, title, message, link, created_at)
      SELECT 'warning', 'License expiring', 'License ' || license_key || ' expiring in 3 days', '/admin/licenses', expires_at
      FROM admin_license_keys WHERE is_active = true AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
      AND NOT EXISTS (SELECT 1 FROM admin_notifications WHERE admin_notifications.title = 'License expiring')
    `);
  } catch {}

  // ═══════════════════════════════════════════════
  // OPEN API / WEBHOOKS
  // ═══════════════════════════════════════════════
  await exec(`
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
  await exec(`
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

  // ═══════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════
  await exec(`
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
  await exec(`
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

  // ═══════════════════════════════════════════════════════════
  // DATA INTEGRITY MIGRATIONS — REAL → NUMERIC(14,2)
  // ═══════════════════════════════════════════════════════════
  const moneyColumns: { table: string; column: string }[] = [
    { table: 'sales_invoices', column: 'amount' },
    { table: 'sales_invoices', column: 'subtotal' },
    { table: 'sales_invoices', column: 'tax_vat' },
    { table: 'sales_invoices', column: 'discounts' },
    { table: 'sales_invoices', column: 'quantity' },
    { table: 'sales_invoices', column: 'unit_price' },
    { table: 'quotations', column: 'amount' },
    { table: 'quotations', column: 'subtotal' },
    { table: 'quotations', column: 'tax_vat' },
    { table: 'quotations', column: 'quantity' },
    { table: 'quotations', column: 'unit_price' },
    { table: 'payments', column: 'amount' },
    { table: 'credit_notes', column: 'amount' },
    { table: 'credit_notes', column: 'subtotal' },
    { table: 'credit_notes', column: 'tax_vat' },
    { table: 'credit_notes', column: 'discounts' },
    { table: 'credit_notes', column: 'quantity' },
    { table: 'credit_notes', column: 'unit_price' },
    { table: 'purchase_orders', column: 'amount' },
    { table: 'purchase_orders', column: 'subtotal' },
    { table: 'purchase_orders', column: 'tax_vat' },
    { table: 'purchase_orders', column: 'quantity' },
    { table: 'purchase_orders', column: 'unit_price' },
    { table: 'purchase_invoices', column: 'amount' },
    { table: 'purchase_invoices', column: 'subtotal' },
    { table: 'purchase_invoices', column: 'tax_vat' },
    { table: 'purchase_invoices', column: 'discounts' },
    { table: 'purchase_invoices', column: 'quantity' },
    { table: 'purchase_invoices', column: 'unit_price' },
    { table: 'debit_notes', column: 'amount' },
    { table: 'debit_notes', column: 'quantity' },
    { table: 'debit_notes', column: 'unit_price' },
    { table: 'supplier_payments', column: 'amount' },
    { table: 'expenses', column: 'amount' },
    { table: 'employees', column: 'salary' },
    { table: 'salaries', column: 'amount' },
    { table: 'journal_entry_lines', column: 'debit_amount' },
    { table: 'journal_entry_lines', column: 'credit_amount' },
    { table: 'chart_of_accounts', column: 'opening_balance' },
    { table: 'bank_statements', column: 'balance' },
    { table: 'fixed_assets', column: 'purchase_cost' },
    { table: 'fixed_assets', column: 'accumulated_depreciation' },
    { table: 'fixed_assets', column: 'book_value' },
    { table: 'fixed_assets', column: 'salvage_value' },
    { table: 'budgets', column: 'amount' },
    { table: 'other_transactions', column: 'amount' },
    { table: 'capital_transactions', column: 'amount' },
    { table: 'deals', column: 'deal_value' },
    { table: 'projects', column: 'budget' },
    { table: 'project_transactions', column: 'amount' },
    { table: 'customers', column: 'credit_limit' },
    { table: 'reconciliation_runs', column: 'opening_balance' },
    { table: 'reconciliation_runs', column: 'closing_balance' },
    { table: 'reconciliation_runs', column: 'difference' },
    { table: 'inventory_items', column: 'unit_cost' },
    { table: 'inventory_items', column: 'opening_stock' },
    { table: 'inventory_items', column: 'current_stock' },
    { table: 'inventory_items', column: 'reorder_level' },
    { table: 'company_settings', column: 'vat_rate' },
    { table: 'company_settings', column: 'income_tax_rate' },
  ];
  for (const { table, column } of moneyColumns) {
    try {
      await exec(`ALTER TABLE public.${table} ALTER COLUMN ${column} TYPE NUMERIC(14,2) USING ${column}::numeric`);
    } catch {}
  }

  // ═══════════════════════════════════════════════════════════
  // TEXT → DATE conversions for date columns
  // ═══════════════════════════════════════════════════════════
  const dateColumns: { table: string; column: string }[] = [
    { table: 'sales_invoices', column: 'issue_date' },
    { table: 'sales_invoices', column: 'due_date' },
    { table: 'quotations', column: 'issue_date' },
    { table: 'quotations', column: 'valid_until' },
    { table: 'quotations', column: 'due_date' },
    { table: 'payments', column: 'payment_date' },
    { table: 'credit_notes', column: 'issue_date' },
    { table: 'purchase_orders', column: 'issue_date' },
    { table: 'purchase_orders', column: 'delivery_date' },
    { table: 'purchase_invoices', column: 'issue_date' },
    { table: 'purchase_invoices', column: 'due_date' },
    { table: 'debit_notes', column: 'issue_date' },
    { table: 'expenses', column: 'expense_date' },
    { table: 'salaries', column: 'pay_date' },
    { table: 'journal_entries', column: 'entry_date' },
    { table: 'employees', column: 'hire_date' },
    { table: 'bank_statements', column: 'statement_date' },
    { table: 'fixed_assets', column: 'purchase_date' },
    { table: 'capital_transactions', column: 'transaction_date' },
    { table: 'other_transactions', column: 'transaction_date' },
    { table: 'budgets', column: 'fiscal_year' },
  ];
  for (const { table, column } of dateColumns) {
    try {
      await exec(`ALTER TABLE public.${table} ALTER COLUMN ${column} TYPE DATE USING NULLIF(${column}, '')::date`);
    } catch {}
  }

  // ═══════════════════════════════════════════════════════════
  // FOREIGN KEY CONSTRAINTS
  // ═══════════════════════════════════════════════════════════
  const fkConstraints: { table: string; column: string; ref: string; name: string }[] = [
    { table: 'sales_invoices', column: 'customer_id', ref: 'customers(id)', name: 'fk_sales_invoices_customer' },
    { table: 'quotations', column: 'customer_id', ref: 'customers(id)', name: 'fk_quotations_customer' },
    { table: 'payments', column: 'invoice_id', ref: 'sales_invoices(id)', name: 'fk_payments_invoice' },
    { table: 'payments', column: 'customer_id', ref: 'customers(id)', name: 'fk_payments_customer' },
    { table: 'credit_notes', column: 'invoice_id', ref: 'sales_invoices(id)', name: 'fk_credit_notes_invoice' },
    { table: 'credit_notes', column: 'customer_id', ref: 'customers(id)', name: 'fk_credit_notes_customer' },
    { table: 'purchase_orders', column: 'client_id', ref: 'clients(id)', name: 'fk_po_client' },
    { table: 'purchase_invoices', column: 'client_id', ref: 'clients(id)', name: 'fk_pi_client' },
    { table: 'purchase_invoices', column: 'po_id', ref: 'purchase_orders(id)', name: 'fk_pi_po' },
    { table: 'debit_notes', column: 'purchase_invoice_id', ref: 'purchase_invoices(id)', name: 'fk_dn_pi' },
    { table: 'debit_notes', column: 'client_id', ref: 'clients(id)', name: 'fk_dn_client' },
    { table: 'supplier_payments', column: 'invoice_id', ref: 'purchase_invoices(id)', name: 'fk_sp_invoice' },
    { table: 'supplier_payments', column: 'client_id', ref: 'clients(id)', name: 'fk_sp_client' },
    { table: 'salaries', column: 'employee_id', ref: 'employees(id)', name: 'fk_salaries_employee' },
    { table: 'journal_entry_lines', column: 'journal_entry_id', ref: 'journal_entries(id)', name: 'fk_jel_je' },
    { table: 'journal_entry_lines', column: 'account_id', ref: 'chart_of_accounts(id)', name: 'fk_jel_account' },
    { table: 'inventory_transactions', column: 'item_id', ref: 'inventory_items(id)', name: 'fk_it_item' },
    { table: 'bank_statements', column: 'bank_account_id', ref: 'bank_accounts(id)', name: 'fk_bs_ba' },
    { table: 'reconciliation_runs', column: 'bank_account_id', ref: 'bank_accounts(id)', name: 'fk_rr_ba' },
    { table: 'project_transactions', column: 'project_id', ref: 'projects(id)', name: 'fk_pt_project' },
    { table: 'deals', column: 'customer_id', ref: 'customers(id)', name: 'fk_deals_customer' },
    { table: 'projects', column: 'customer_id', ref: 'customers(id)', name: 'fk_projects_customer' },
    { table: 'chart_of_accounts', column: 'parent_id', ref: 'chart_of_accounts(id)', name: 'fk_coa_parent' },
    { table: 'approval_requests', column: 'requested_by', ref: 'users(id)', name: 'fk_ar_requestor' },
    { table: 'approval_requests', column: 'approved_by', ref: 'users(id)', name: 'fk_ar_approver' },
  ];
  for (const { table, column, ref, name } of fkConstraints) {
    try {
      await exec(`ALTER TABLE public.${table} ADD CONSTRAINT ${name} FOREIGN KEY (${column}) REFERENCES public.${ref} ON DELETE SET NULL`);
    } catch {}
  }

  // ═══════════════════════════════════════════════════════════
  // UNIQUE CONSTRAINTS on business identifiers
  // ═══════════════════════════════════════════════════════════
  const uniqueConstraints: { table: string; columns: string; name: string }[] = [
    { table: 'sales_invoices', columns: 'tenant_id, invoice_number', name: 'uq_sales_invoices_number' },
    { table: 'purchase_invoices', columns: 'tenant_id, invoice_number', name: 'uq_pi_number' },
    { table: 'purchase_orders', columns: 'tenant_id, po_number', name: 'uq_po_number' },
    { table: 'credit_notes', columns: 'tenant_id, credit_note_number', name: 'uq_cn_number' },
    { table: 'debit_notes', columns: 'tenant_id, debit_note_number', name: 'uq_dn_number' },
    { table: 'chart_of_accounts', columns: 'tenant_id, account_code', name: 'uq_coa_code' },
    { table: 'journal_entries', columns: 'tenant_id, entry_number', name: 'uq_je_number' },
    { table: 'customers', columns: 'tenant_id, email_address', name: 'uq_customers_email' },
    { table: 'api_keys', columns: 'api_key', name: 'uq_api_keys_key' },
    { table: 'clients', columns: 'tenant_id, email', name: 'uq_clients_email' },
  ];
  for (const { table, columns, name } of uniqueConstraints) {
    try {
      await exec(`ALTER TABLE public.${table} ADD CONSTRAINT ${name} UNIQUE (${columns})`);
    } catch {}
  }

  // ═══════════════════════════════════════════════════════════
  // INDICES on foreign key columns for query performance
  // ═══════════════════════════════════════════════════════════
  const indexColumns: { table: string; column: string; name: string }[] = [
    ...fkConstraints.map(fk => ({ table: fk.table, column: fk.column, name: `idx_${fk.name.replace('fk_', '')}` })),
    { table: 'sessions', column: 'user_id', name: 'idx_sessions_user' },
    { table: 'sessions', column: 'token', name: 'idx_sessions_token' },
    { table: 'payments', column: 'payment_date', name: 'idx_payments_date' },
    { table: 'expenses', column: 'expense_date', name: 'idx_expenses_date' },
    { table: 'journal_entries', column: 'entry_date', name: 'idx_je_date' },
    { table: 'journal_entries', column: 'status', name: 'idx_je_status' },
    { table: 'sales_invoices', column: 'status', name: 'idx_si_status' },
    { table: 'sales_invoices', column: 'issue_date', name: 'idx_si_date' },
    { table: 'purchase_invoices', column: 'status', name: 'idx_pi_status' },
    { table: 'notification_log', column: 'user_id', name: 'idx_nl_user' },
    { table: 'notification_log', column: 'is_read', name: 'idx_nl_read' },
    { table: 'audit_log', column: 'entity_type', name: 'idx_al_entity' },
    { table: 'audit_log', column: 'created_at', name: 'idx_al_date' },
    { table: 'admin_notifications', column: 'created_at', name: 'idx_admin_notif_date' },
    { table: 'admin_audit_log', column: 'created_at', name: 'idx_admin_audit_date' },
    { table: 'admin_audit_log', column: 'admin_email', name: 'idx_admin_audit_email' },
  ];
  for (const { table, column, name } of indexColumns) {
    try {
      await exec(`CREATE INDEX IF NOT EXISTS ${name} ON public.${table} (${column})`);
    } catch {}
  }

  // Final pass: ensure tenant_id on any tables still missing it
  const allTables = [
    'inventory_items', 'inventory_transactions', 'fixed_assets', 'journal_entries',
    'chart_of_accounts', 'budgets', 'bank_accounts', 'bank_statements',
    'reconciliations', 'employees', 'salaries', 'approval_workflows',
    'approval_requests', 'recurring_templates', 'notifications', 'api_keys',
    'exchange_rates', 'project_transactions', 'articles',
  ];
  for (const tbl of allTables) {
    try {
      await exec(`ALTER TABLE public.${tbl} ADD COLUMN IF NOT EXISTS tenant_id TEXT`);
    } catch { /* skip if table doesn't exist */ }
  }
}

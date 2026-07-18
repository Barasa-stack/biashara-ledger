import { safeExec } from './safe-exec';
import { logError } from '../logger';

export async function initCoreTables() {
  await safeExec(`
    CREATE TABLE IF NOT EXISTS public.tenants (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

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
      item_id UUID,
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
      nssf_number TEXT DEFAULT '',
      shif_number TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      department TEXT DEFAULT '',
      job_title TEXT DEFAULT '',
      date_of_hire TEXT DEFAULT '',
      employment_type TEXT DEFAULT 'full-time',
      employment_status TEXT DEFAULT 'active',
      contract_hours REAL DEFAULT 168,
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

    CREATE TABLE IF NOT EXISTS public.leave_requests (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      employee_id UUID NOT NULL,
      employee_name TEXT DEFAULT '',
      leave_type TEXT NOT NULL DEFAULT 'annual',
      reason TEXT DEFAULT '',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      days REAL NOT NULL DEFAULT 1,
      status TEXT DEFAULT 'pending',
      approved_by TEXT DEFAULT '',
      approved_at TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS public.attendance (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      employee_id UUID NOT NULL,
      employee_name TEXT DEFAULT '',
      date TEXT NOT NULL,
      clock_in TEXT DEFAULT '',
      clock_out TEXT DEFAULT '',
      hours REAL DEFAULT 0,
      overtime_hours REAL DEFAULT 0,
      overtime_type TEXT DEFAULT 'weekday',
      status TEXT DEFAULT 'present',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS public.payslips (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      salary_id UUID,
      employee_id UUID NOT NULL,
      employee_name TEXT NOT NULL,
      payslip_reference TEXT NOT NULL DEFAULT '',
      basic_salary REAL DEFAULT 0,
      allowances REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      overtime REAL DEFAULT 0,
      overtime_hours REAL DEFAULT 0,
      overtime_type TEXT DEFAULT 'none',
      bonuses REAL DEFAULT 0,
      gross_pay REAL DEFAULT 0,
      nssf_employee REAL DEFAULT 0,
      nhif REAL DEFAULT 0,
      shif REAL DEFAULT 0,
      ahl REAL DEFAULT 0,
      paye REAL DEFAULT 0,
      employer_nssf REAL DEFAULT 0,
      employer_ahl REAL DEFAULT 0,
      net_pay REAL NOT NULL DEFAULT 0,
      pay_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'bank',
      period_start TEXT DEFAULT '',
      period_end TEXT DEFAULT '',
      status TEXT DEFAULT 'generated',
      emailed INTEGER DEFAULT 0,
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
    ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT '';
    ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS two_factor_enabled INTEGER DEFAULT 0;

    CREATE TABLE IF NOT EXISTS public.admin_users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      tenant_id TEXT DEFAULT '',
      two_factor_enabled INTEGER DEFAULT 0,
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

  async function addTenantIdCol(table: string) {
    try {
      await safeExec(`ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS tenant_id TEXT`);
    } catch (e) { logError('schema', 'table may not exist yet', { error: e }); }
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

  await safeExec(`ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS country TEXT DEFAULT ''`);
  await safeExec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'KE'`);
  await safeExec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''`);
  await safeExec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'`);
  await safeExec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ`);
  await safeExec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ`);
  await safeExec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ`);
  await safeExec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'trial'`);
  await safeExec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial'`);
  await safeExec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'`);
  await safeExec(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified INTEGER DEFAULT 0`);
  await safeExec(`ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS client_db TEXT DEFAULT ''`);
  await safeExec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS customer_country TEXT DEFAULT ''`);
  await safeExec(`ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS customer_country TEXT DEFAULT ''`);
  await safeExec(`ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS client_country TEXT DEFAULT ''`);
  await safeExec(`ALTER TABLE public.credit_notes ADD COLUMN IF NOT EXISTS customer_country TEXT DEFAULT ''`);
  await safeExec(`ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS client_country TEXT DEFAULT ''`);
  await safeExec(`ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS country TEXT DEFAULT ''`);
  await safeExec(`ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 0`);
  await safeExec(`ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 0`);
  await safeExec(`ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 0`);
  await safeExec(`ALTER TABLE public.credit_notes ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 0`);
  await safeExec(`ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 0`);
  await safeExec(`ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS item_id UUID`);
}

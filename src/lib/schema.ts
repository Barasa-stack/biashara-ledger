import { exec } from './db';

export async function initSchema() {
  // Convert existing TIMESTAMP columns to TIMESTAMPTZ for correct timezone handling
  await exec(`ALTER TABLE IF EXISTS verification_codes ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC'`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS verification_codes ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS sessions ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC'`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS sessions ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS users ALTER COLUMN subscription_expiry TYPE TIMESTAMPTZ USING subscription_expiry AT TIME ZONE 'UTC'`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS users ALTER COLUMN grace_period_end TYPE TIMESTAMPTZ USING grace_period_end AT TIME ZONE 'UTC'`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS users ALTER COLUMN last_reminder_sent TYPE TIMESTAMPTZ USING last_reminder_sent AT TIME ZONE 'UTC'`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS users ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'`).catch(() => {});

  await exec(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS trial_used INTEGER DEFAULT 0`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'trial'`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS license_key TEXT DEFAULT ''`).catch(() => {});

  await exec(`ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS vat_rate REAL DEFAULT 16`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS credit_note_prefix TEXT DEFAULT 'CN'`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS next_credit_note_number INTEGER DEFAULT 1`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS last_credit_note_month TEXT DEFAULT ''`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS credit_notes ADD COLUMN IF NOT EXISTS customer_email TEXT DEFAULT ''`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS credit_notes ADD COLUMN IF NOT EXISTS subtotal REAL DEFAULT 0`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS credit_notes ADD COLUMN IF NOT EXISTS tax_vat REAL DEFAULT 0`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS credit_notes ADD COLUMN IF NOT EXISTS discounts REAL DEFAULT 0`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS credit_notes ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Net 30'`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS admin_clients ADD COLUMN IF NOT EXISTS schema_version INTEGER DEFAULT 1`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS quotations ADD COLUMN IF NOT EXISTS due_date TEXT DEFAULT ''`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS sessions ADD COLUMN IF NOT EXISTS client_db TEXT DEFAULT ''`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS license_keys ADD COLUMN IF NOT EXISTS offline_session_token TEXT DEFAULT ''`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS license_keys ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS license_keys ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45) DEFAULT ''`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS license_keys ADD COLUMN IF NOT EXISTS activation_count INTEGER DEFAULT 0`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS admin_license_keys ADD COLUMN IF NOT EXISTS hardware_fingerprint TEXT DEFAULT ''`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS admin_license_keys ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS admin_license_keys ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45) DEFAULT ''`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS admin_license_keys ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS electron_activity ADD COLUMN IF NOT EXISTS session_token TEXT DEFAULT ''`).catch(() => {});
  await exec(`ALTER TABLE IF EXISTS electron_activity ADD COLUMN IF NOT EXISTS hardware_fingerprint TEXT DEFAULT ''`).catch(() => {});

  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT DEFAULT '',
      last_name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      subscription_plan TEXT DEFAULT 'trial',
      subscription_status TEXT DEFAULT 'active',
      verified INTEGER DEFAULT 0,
      subscription_expiry TIMESTAMPTZ,
      role TEXT DEFAULT 'admin',
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
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT 'signup',
      data TEXT DEFAULT '{}',
      expires_at TIMESTAMPTZ NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      permissions TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS subscription_events (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      description TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS billing_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'KES',
      plan_name TEXT NOT NULL,
      payment_method TEXT DEFAULT 'mpesa',
      transaction_id TEXT DEFAULT '',
      status TEXT DEFAULT 'completed',
      period_start TIMESTAMP NOT NULL,
      period_end TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL DEFAULT '',
      company_name TEXT DEFAULT '',
      contact_person TEXT DEFAULT '',
      email_address TEXT DEFAULT '',
      phone_number TEXT DEFAULT '',
      billing_address TEXT DEFAULT '',
      shipping_address TEXT DEFAULT '',
      tax_id TEXT DEFAULT '',
      payment_terms TEXT DEFAULT 'Net 30',
      credit_limit REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id SERIAL PRIMARY KEY,
      quotation_number TEXT DEFAULT '',
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
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
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sales_invoices (
      id SERIAL PRIMARY KEY,
      invoice_number TEXT DEFAULT '',
      quotation_id INTEGER REFERENCES quotations(id) ON DELETE SET NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
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
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      customer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS credit_notes (
      id SERIAL PRIMARY KEY,
      credit_note_number TEXT DEFAULT '',
      invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
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
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      po_number TEXT DEFAULT '',
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
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
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id SERIAL PRIMARY KEY,
      invoice_number TEXT DEFAULT '',
      po_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
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
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS supplier_payments (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      client_name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS debit_notes (
      id SERIAL PRIMARY KEY,
      debit_note_number TEXT DEFAULT '',
      purchase_invoice_id INTEGER NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      client_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      reason TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      issue_date TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS salaries (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
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
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS company_settings (
      id SERIAL PRIMARY KEY,
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
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS licenses (
      id SERIAL PRIMARY KEY,
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

    CREATE TABLE IF NOT EXISTS license_installations (
      id SERIAL PRIMARY KEY,
      license_key VARCHAR(255),
      hardware_fingerprint TEXT,
      installation_date TIMESTAMP DEFAULT NOW(),
      last_seen TIMESTAMP,
      ip_address VARCHAR(45),
      device_info TEXT,
      status VARCHAR(20) DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS analytics (
      id SERIAL PRIMARY KEY,
      license_id VARCHAR(255),
      event VARCHAR(100),
      app_version VARCHAR(50),
      os_version VARCHAR(50),
      data JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id SERIAL PRIMARY KEY,
      table_name VARCHAR(100) NOT NULL,
      record_id INTEGER NOT NULL,
      action VARCHAR(20) NOT NULL,
      data JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      synced_at TIMESTAMP,
      attempts INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS admin_clients (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      database_name VARCHAR(255) UNIQUE NOT NULL,
      license_key VARCHAR(255) UNIQUE,
      max_users INTEGER DEFAULT 5,
      is_active BOOLEAN DEFAULT TRUE,
      is_trial BOOLEAN DEFAULT TRUE,
      trial_start_date TIMESTAMP,
      trial_end_date TIMESTAMP,
      expires_at TIMESTAMP,
      last_active TIMESTAMP,
      schema_version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_license_keys (
      id SERIAL PRIMARY KEY,
      license_key VARCHAR(255) UNIQUE NOT NULL,
      client_id INTEGER REFERENCES admin_clients(id) ON DELETE CASCADE,
      plan VARCHAR(50) DEFAULT 'standard',
      is_used BOOLEAN DEFAULT FALSE,
      activated_at TIMESTAMP,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS license_keys (
      id SERIAL PRIMARY KEY,
      license_key VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) NOT NULL,
      license_type VARCHAR(50) DEFAULT 'standard',
      status VARCHAR(20) DEFAULT 'unused',
      user_id INTEGER,
      expires_at TIMESTAMPTZ,
      activated_at TIMESTAMP,
      hardware_fingerprint TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS electron_activity (
      id SERIAL PRIMARY KEY,
      license_key VARCHAR(255) NOT NULL,
      action VARCHAR(100) NOT NULL,
      data JSONB DEFAULT '{}',
      ip_address VARCHAR(45) DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS license_activations (
      id SERIAL PRIMARY KEY,
      license_key VARCHAR(255) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      hardware_fingerprint TEXT DEFAULT '',
      ip_address VARCHAR(45) DEFAULT '',
      device_info TEXT DEFAULT '',
      status VARCHAR(20) DEFAULT 'success',
      error_reason TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS backups (
      id SERIAL PRIMARY KEY,
      license_key VARCHAR(255) NOT NULL,
      data JSONB NOT NULL,
      file_size INTEGER DEFAULT 0,
      version INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS app_updates (
      id SERIAL PRIMARY KEY,
      version VARCHAR(50) NOT NULL,
      changes JSONB DEFAULT '[]',
      release_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id SERIAL PRIMARY KEY,
      recipient VARCHAR(255) NOT NULL,
      email_type VARCHAR(50) NOT NULL,
      success INTEGER DEFAULT 0,
      detail TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create offline_sessions separately to avoid PG type collision during build
  await exec(`
    CREATE TABLE IF NOT EXISTS offline_sessions (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES admin_clients(id) ON DELETE CASCADE,
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
    )
  `).catch(() => {});

  // Seed default admin user
  await exec(`
    INSERT INTO admin_users (username, password_hash, email, role)
    VALUES ('admin', '$2b$10$dummy', 'admin@biasharaledger.com', 'super_admin')
    ON CONFLICT (username) DO NOTHING;
  `);

  // Seed default company settings
  await exec(`
    INSERT INTO company_settings (id) VALUES (1)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Seed roles
  await exec(`
    INSERT INTO roles (name, description, permissions) VALUES
      ('admin', 'Full access to all features', '["all"]'),
      ('hr_manager', 'HR and payroll management', '["hr.read","hr.write","payroll.read","payroll.write","dashboard.read"]'),
      ('accountant', 'Accounting and financial reports', '["accounts.read","accounts.write","reports.read","dashboard.read"]'),
      ('employee', 'View own data only', '["dashboard.read","hr.own"]')
    ON CONFLICT (name) DO NOTHING;
  `);
}

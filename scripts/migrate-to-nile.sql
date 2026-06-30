-- ============================================================
-- BiasharaLedger: Neon → Nile Schema Migration
-- UUID primary keys + tenant_id for per-tenant isolation
-- ============================================================

-- 1. users
CREATE TABLE IF NOT EXISTS public.users (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    id UUID DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id),
    UNIQUE (tenant_id, email)
);

-- 2. sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    client_db TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

-- 3. verification_codes (shared table — no tenant_id, used pre-auth)
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

-- 4. roles (shared - system-wide)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    permissions TEXT DEFAULT '[]'
);

-- 5. subscription_events
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

-- 6. billing_history
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

-- 7. customers
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
    payment_terms TEXT DEFAULT 'Net 30',
    credit_limit REAL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

-- 8. clients (suppliers)
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

-- 9. quotations
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

-- 10. sales_invoices
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

-- 11. payments (received)
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

-- 12. credit_notes
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

-- 13. purchase_orders
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

-- 14. purchase_invoices
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

-- 15. supplier_payments
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

-- 16. debit_notes
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

-- 17. employees
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

-- 18. salaries
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

-- 19. company_settings (one per tenant)
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

-- 20. expenses
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

-- 21. electron_activity
CREATE TABLE IF NOT EXISTS public.electron_activity (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
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

-- ============================================================
-- Shared tables (no tenant_id - admin/system wide)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.admin_license_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    client_id UUID REFERENCES public.admin_clients(id) ON DELETE CASCADE,
    plan VARCHAR(50) DEFAULT 'standard',
    is_used BOOLEAN DEFAULT FALSE,
    activated_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    status VARCHAR(20) DEFAULT 'success',
    error_reason TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.license_installations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_key VARCHAR(255),
    hardware_fingerprint TEXT,
    installation_date TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP,
    ip_address VARCHAR(45),
    device_info TEXT,
    status VARCHAR(20) DEFAULT 'active'
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

-- ============================================================
-- Seed data
-- ============================================================

INSERT INTO public.admin_users (username, password_hash, email, role)
VALUES ('admin', '$2b$10$dummy', 'admin@biasharaledger.com', 'super_admin')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.roles (name, description, permissions) VALUES
    ('admin', 'Full access to all features', '["all"]'),
    ('hr_manager', 'HR and payroll management', '["hr.read","hr.write","payroll.read","payroll.write","dashboard.read"]'),
    ('accountant', 'Accounting and financial reports', '["accounts.read","accounts.write","reports.read","dashboard.read"]'),
    ('employee', 'View own data only', '["dashboard.read","hr.own"]')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Tenant isolation indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_id ON public.sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_subscription_events_tenant_id ON public.subscription_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_tenant_id ON public.billing_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(supplier_name);
CREATE INDEX IF NOT EXISTS idx_quotations_tenant_id ON public.quotations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON public.quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_tenant_id ON public.sales_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON public.sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_tenant_id ON public.credit_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON public.purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_tenant_id ON public.purchase_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_tenant_id ON public.supplier_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_invoice_id ON public.supplier_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_debit_notes_tenant_id ON public.debit_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON public.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salaries_tenant_id ON public.salaries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salaries_employee_id ON public.salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_tenant_id ON public.company_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON public.expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_electron_activity_tenant_id ON public.electron_activity(tenant_id);

-- =============================================================
-- BiasharaLedger — Consolidated Schema Migration
-- Source of truth: src/lib/schema.ts + src/lib/init.ts
-- All statements are idempotent (IF NOT EXISTS / IF EXISTS).
-- Run once against the Nile production database.
-- =============================================================
-- Usage: psql $DATABASE_URL -f scripts/migrate-consolidated.sql
-- Or:    cat scripts/migrate-consolidated.sql | node -e "..."
-- =============================================================

BEGIN;

-- Schema is auto-created at runtime by src/lib/schema.ts on app init.
-- Run this migration against a fresh Nile database that already has the schema.

-- Phase migrations: extracted from src/lib/init.ts
-- Phase 1: Core ALTERs (users, sessions, company_settings)
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'KE';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS license_key TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'trial';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS verified INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS two_factor_enabled INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS last_ip TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS user_agent TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.sessions ADD COLUMN IF NOT EXISTS client_db TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.company_settings ADD COLUMN IF NOT EXISTS smtp_host TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.company_settings ADD COLUMN IF NOT EXISTS smtp_port TEXT DEFAULT '587';
ALTER TABLE IF EXISTS public.company_settings ADD COLUMN IF NOT EXISTS smtp_user TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.company_settings ADD COLUMN IF NOT EXISTS smtp_pass TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.company_settings ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#df1c1c';
ALTER TABLE IF EXISTS public.company_settings ADD COLUMN IF NOT EXISTS invoice_footer_text TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.company_settings ADD COLUMN IF NOT EXISTS payment_instructions TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.company_settings ADD COLUMN IF NOT EXISTS invoice_logo_base64 TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.company_settings ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'KES';

-- Phase 2: Admin tables
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '', updated_at TIMESTAMP DEFAULT NOW()
);

-- Phase 3: SMTP audit & vendor settings
CREATE TABLE IF NOT EXISTS public.smtp_audit_log (
  id SERIAL PRIMARY KEY, tenant_id TEXT, email_to TEXT, subject TEXT,
  status TEXT DEFAULT 'sent', error_message TEXT, sent_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.vendor_smtp_settings (
  id SERIAL PRIMARY KEY, tenant_id TEXT, vendor TEXT NOT NULL,
  smtp_host TEXT, smtp_port TEXT DEFAULT '587', smtp_user TEXT, smtp_pass TEXT,
  from_email TEXT, from_name TEXT, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT NOW()
);

-- Phase 4: Sales columns
ALTER TABLE IF EXISTS public.sales_invoices ADD COLUMN IF NOT EXISTS paid_amount REAL DEFAULT 0;
ALTER TABLE IF EXISTS public.quotations ADD COLUMN IF NOT EXISTS paid_amount REAL DEFAULT 0;

-- Phase 4b: Inventory reorder_level column
ALTER TABLE IF EXISTS public.inventory_items ADD COLUMN IF NOT EXISTS reorder_level REAL DEFAULT 0;

-- Phase 5: HR tables
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id TEXT, employee_id TEXT,
  date DATE, clock_in TIMESTAMPTZ, clock_out TIMESTAMPTZ, status TEXT DEFAULT 'present',
  notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id TEXT, employee_id TEXT,
  leave_type TEXT, start_date DATE, end_date DATE, reason TEXT,
  status TEXT DEFAULT 'pending', approved_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id TEXT, employee_id TEXT,
  salary_id TEXT, payslip_number TEXT, period_start DATE, period_end DATE,
  gross_pay REAL DEFAULT 0, net_pay REAL DEFAULT 0, status TEXT DEFAULT 'draft',
  payment_date DATE, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 6: HR columns
ALTER TABLE IF EXISTS public.payslips ADD COLUMN IF NOT EXISTS ahl REAL DEFAULT 0;
ALTER TABLE IF EXISTS public.payslips ADD COLUMN IF NOT EXISTS employer_ahl REAL DEFAULT 0;
ALTER TABLE IF EXISTS public.payslips ADD COLUMN IF NOT EXISTS overtime_hours REAL DEFAULT 0;
ALTER TABLE IF EXISTS public.payslips ADD COLUMN IF NOT EXISTS overtime_type TEXT DEFAULT 'none';
ALTER TABLE IF EXISTS public.payslips ADD COLUMN IF NOT EXISTS shif REAL DEFAULT 0;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active';
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS nssf_number TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS shif_number TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS contract_hours REAL DEFAULT 168;
ALTER TABLE IF EXISTS public.attendance ADD COLUMN IF NOT EXISTS overtime_type TEXT DEFAULT 'weekday';

-- Phase 7: UUID/TEXT fix for employee_id columns
ALTER TABLE IF EXISTS public.payslips ALTER COLUMN employee_id TYPE UUID USING employee_id::uuid;
ALTER TABLE IF EXISTS public.payslips ALTER COLUMN salary_id TYPE UUID USING salary_id::uuid;
ALTER TABLE IF EXISTS public.attendance ALTER COLUMN employee_id TYPE TEXT;
ALTER TABLE IF EXISTS public.leave_requests ALTER COLUMN employee_id TYPE TEXT;
ALTER TABLE IF EXISTS public.leave_requests ALTER COLUMN approved_by TYPE TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_settings_tenant_id ON public.company_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_id ON public.sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(supplier_name);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON public.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salaries_tenant_id ON public.salaries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salaries_employee_id ON public.salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_tenant_id ON public.payslips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_tenant_id ON public.sales_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON public.sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_tenant_id ON public.quotations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON public.quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_tenant_id ON public.credit_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON public.expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_tenant_id ON public.purchase_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON public.purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_debit_notes_tenant_id ON public.debit_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_tenant_id ON public.supplier_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_invoice_id ON public.supplier_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_tenant_id ON public.subscription_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_tenant_id ON public.billing_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_electron_activity_tenant_id ON public.electron_activity(tenant_id);

COMMIT;

-- After running, suspend the compute endpoint to avoid lingering costs:
-- Nile API:  PATCH /v2/databases/{database_id} { "suspended": true }

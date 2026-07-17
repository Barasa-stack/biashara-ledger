import { exec, adminRun, adminGet } from './db';
import { initSchema } from './schema';
import { logError } from './logger';
import { runMigrations } from './migrations';

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureDbInitialized() {
  if (initialized) return Promise.resolve();
  if (process.env.NEXT_PHASE === 'phase-production-build') return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { query } = await import('./db');

    let tablesExist = false;
    try {
      const rows = await query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'tenants'
        ) as exists`
      );
      tablesExist = (rows[0] as any)?.exists || false;
    } catch (e) { logError('init', 'check tables exist failed', { error: e }); }

    if (!tablesExist) {
      try { await initSchema(); } catch (e) { logError('init', 'schema init failed', { error: e }); }
    }

    // Column additions for core tables
    const phase1Columns = [
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'KE'`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS license_key TEXT DEFAULT ''`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'trial'`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial'`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified INTEGER DEFAULT 0`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_enabled INTEGER DEFAULT 0`,
      `ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS client_db TEXT DEFAULT ''`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_ip TEXT DEFAULT ''`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_agent TEXT DEFAULT ''`,
      `ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS smtp_host TEXT DEFAULT ''`,
      `ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS smtp_port TEXT DEFAULT '587'`,
      `ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS smtp_user TEXT DEFAULT ''`,
      `ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS smtp_pass TEXT DEFAULT ''`,
      `ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#df1c1c'`,
      `ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS invoice_footer_text TEXT DEFAULT ''`,
      `ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS payment_instructions TEXT DEFAULT ''`,
      `ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS invoice_logo_base64 TEXT DEFAULT ''`,
    ];

    // Indexes that need to exist
    const indexStatements: Record<string, string> = {
      idx_users_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id)',
      idx_sessions_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_sessions_tenant_id ON public.sessions(tenant_id)',
      idx_sessions_token: 'CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token)',
      idx_subscription_events_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_subscription_events_tenant_id ON public.subscription_events(tenant_id)',
      idx_billing_history_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_billing_history_tenant_id ON public.billing_history(tenant_id)',
      idx_customers_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id)',
      idx_customers_name: 'CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(customer_name)',
      idx_clients_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id)',
      idx_clients_name: 'CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(supplier_name)',
      idx_quotations_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_quotations_tenant_id ON public.quotations(tenant_id)',
      idx_quotations_customer_id: 'CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON public.quotations(customer_id)',
      idx_sales_invoices_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_sales_invoices_tenant_id ON public.sales_invoices(tenant_id)',
      idx_sales_invoices_customer_id: 'CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON public.sales_invoices(customer_id)',
      idx_payments_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id)',
      idx_payments_invoice_id: 'CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id)',
      idx_credit_notes_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_credit_notes_tenant_id ON public.credit_notes(tenant_id)',
      idx_purchase_orders_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON public.purchase_orders(tenant_id)',
      idx_purchase_invoices_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_purchase_invoices_tenant_id ON public.purchase_invoices(tenant_id)',
      idx_supplier_payments_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_supplier_payments_tenant_id ON public.supplier_payments(tenant_id)',
      idx_supplier_payments_invoice_id: 'CREATE INDEX IF NOT EXISTS idx_supplier_payments_invoice_id ON public.supplier_payments(invoice_id)',
      idx_debit_notes_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_debit_notes_tenant_id ON public.debit_notes(tenant_id)',
      idx_employees_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON public.employees(tenant_id)',
      idx_salaries_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_salaries_tenant_id ON public.salaries(tenant_id)',
      idx_salaries_employee_id: 'CREATE INDEX IF NOT EXISTS idx_salaries_employee_id ON public.salaries(employee_id)',
      idx_company_settings_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_company_settings_tenant_id ON public.company_settings(tenant_id)',
      idx_expenses_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON public.expenses(tenant_id)',
      idx_electron_activity_tenant_id: 'CREATE INDEX IF NOT EXISTS idx_electron_activity_tenant_id ON public.electron_activity(tenant_id)',
    };

    // Migrate admin user if ADMIN_EMAIL is set
    const hasAdminEmail = !!process.env.ADMIN_EMAIL;

    await runMigrations([
      {
        name: '2024-01-core-columns',
        run: async () => {
          for (const sql of phase1Columns) {
            try { await exec(sql); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          }
          if (hasAdminEmail) {
            try {
              await exec(`UPDATE users SET subscription_plan = 'Premium', subscription_status = 'active', license_status = 'active' WHERE email = $1 AND subscription_plan = 'trial'`, [process.env.ADMIN_EMAIL!]);
            } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          }
          try {
            await exec(`CREATE TABLE IF NOT EXISTS public.admin_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '', updated_at TIMESTAMP DEFAULT NOW())`);
          } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
        },
      },
      {
        name: '2024-02-company-settings-columns',
        run: async () => {
          const cols = [
            `ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#df1c1c'`,
            `ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS invoice_footer_text TEXT DEFAULT ''`,
            `ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS payment_instructions TEXT DEFAULT ''`,
            `ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS invoice_logo_base64 TEXT DEFAULT ''`,
          ];
          for (const sql of cols) {
            try { await exec(sql); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          }
        },
      },
      {
        name: '2024-03-admin-license-unique',
        run: async () => {
          try {
            await exec(`
              DO $$
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_constraint
                  WHERE conname = 'admin_license_keys_license_key_key'
                  AND conrelid = 'admin_license_keys'::regclass
                ) THEN
                  ALTER TABLE public.admin_license_keys ADD CONSTRAINT admin_license_keys_license_key_key UNIQUE (license_key);
                END IF;
              END $$;
            `);
          } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
        },
      },
      {
        name: '2024-04-smtp-audit-lock',
        run: async () => {
          try {
            await exec(`
              CREATE TABLE IF NOT EXISTS public.smtp_audit_log (
                id SERIAL PRIMARY KEY,
                admin_id TEXT NOT NULL,
                admin_email TEXT NOT NULL,
                action TEXT NOT NULL,
                changes JSONB,
                created_at TIMESTAMP DEFAULT NOW()
              )
            `);
          } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try {
            await exec(`
              INSERT INTO admin_settings (key, value) VALUES ('smtp_locked', 'true')
              ON CONFLICT (key) DO NOTHING
            `);
          } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
        },
      },
      {
        name: '2024-05-vendor-smtp',
        run: async () => {
          try {
            await exec(`
              CREATE TABLE IF NOT EXISTS public.vendor_smtp_settings (
                id INTEGER PRIMARY KEY DEFAULT 1,
                host TEXT NOT NULL DEFAULT '',
                port TEXT NOT NULL DEFAULT '587',
                username TEXT NOT NULL DEFAULT '',
                password TEXT NOT NULL DEFAULT '',
                from_name TEXT NOT NULL DEFAULT 'BiasharaLedger',
                from_address TEXT NOT NULL DEFAULT '',
                locked BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                CONSTRAINT single_row CHECK (id = 1)
              )
            `);
          } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try {
            await exec(`
              INSERT INTO vendor_smtp_settings (id, host, port, username, password, from_name, from_address)
              SELECT 1,
                COALESCE((SELECT value FROM admin_settings WHERE key = 'smtp_host'), ''),
                COALESCE((SELECT value FROM admin_settings WHERE key = 'smtp_port'), '587'),
                COALESCE((SELECT value FROM admin_settings WHERE key = 'smtp_user'), ''),
                COALESCE((SELECT value FROM admin_settings WHERE key = 'smtp_pass'), ''),
                COALESCE((SELECT value FROM admin_settings WHERE key = 'smtp_from_name'), 'BiasharaLedger'),
                COALESCE((SELECT value FROM admin_settings WHERE key = 'smtp_from_address'), '')
              WHERE NOT EXISTS (SELECT 1 FROM vendor_smtp_settings WHERE id = 1)
            `);
          } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
        },
      },
      {
        name: '2024-06-paid-amount',
        run: async () => {
          try { await exec('ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS paid_amount REAL DEFAULT 0'); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try { await exec('ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS paid_amount REAL DEFAULT 0'); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
        },
      },
      {
        name: '2024-06b-reorder-level',
        run: async () => {
          try { await exec('ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS reorder_level REAL DEFAULT 0'); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
        },
      },
      {
        name: '2024-06c-idempotency-soft-delete',
        run: async () => {
          try { await exec('ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS idempotency_key TEXT'); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try { await exec('CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_invoices_idempotency ON public.sales_invoices (tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL'); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try { await exec('ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ'); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try { await exec('CREATE INDEX IF NOT EXISTS idx_sales_invoices_deleted_at ON public.sales_invoices (deleted_at)'); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
        },
      },
      {
        name: '2024-07-hr-tables',
        run: async () => {
          try {
            await adminRun(`
              CREATE TABLE IF NOT EXISTS public.attendance (
                tenant_id UUID NOT NULL REFERENCES public.tenants(id),
                id UUID DEFAULT gen_random_uuid(),
                employee_id TEXT NOT NULL DEFAULT '0',
                employee_name TEXT DEFAULT '',
                date TEXT NOT NULL DEFAULT '',
                clock_in TEXT DEFAULT '',
                clock_out TEXT DEFAULT '',
                hours REAL DEFAULT 0,
                overtime_hours REAL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'present',
                notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (tenant_id, id)
              )
            `);
          } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try {
            await adminRun(`
              CREATE TABLE IF NOT EXISTS public.leave_requests (
                tenant_id UUID NOT NULL REFERENCES public.tenants(id),
                id UUID DEFAULT gen_random_uuid(),
                employee_id TEXT NOT NULL DEFAULT '0',
                employee_name TEXT DEFAULT '',
                leave_type TEXT NOT NULL DEFAULT 'annual',
                reason TEXT DEFAULT '',
                start_date TEXT NOT NULL DEFAULT '',
                end_date TEXT NOT NULL DEFAULT '',
                days REAL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'pending',
                approved_by TEXT DEFAULT '0',
                approved_at TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (tenant_id, id)
              )
            `);
          } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try {
            await adminRun(`
              CREATE TABLE IF NOT EXISTS public.payslips (
                tenant_id UUID NOT NULL REFERENCES public.tenants(id),
                id UUID DEFAULT gen_random_uuid(),
                salary_id UUID,
                employee_id UUID,
                employee_name TEXT DEFAULT '',
                payslip_reference TEXT DEFAULT '',
                basic_salary REAL DEFAULT 0,
                allowances REAL DEFAULT 0,
                deductions REAL DEFAULT 0,
                overtime REAL DEFAULT 0,
                bonuses REAL DEFAULT 0,
                gross_pay REAL DEFAULT 0,
                nssf_employee REAL DEFAULT 0,
                nhif REAL DEFAULT 0,
                paye REAL DEFAULT 0,
                employer_nssf REAL DEFAULT 0,
                net_pay REAL DEFAULT 0,
                pay_date TEXT DEFAULT '',
                payment_method TEXT DEFAULT 'bank',
                period_start TEXT DEFAULT '',
                period_end TEXT DEFAULT '',
                status TEXT DEFAULT 'draft',
                emailed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (tenant_id, id)
              )
            `);
          } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
        },
      },
      {
        name: '2024-08-hr-columns',
        run: async () => {
          try { await adminRun('ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS ahl REAL DEFAULT 0'); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try { await adminRun('ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS employer_ahl REAL DEFAULT 0'); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try { await adminRun('ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS overtime_hours REAL DEFAULT 0'); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try { await adminRun("ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS overtime_type TEXT DEFAULT 'none'"); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try { await adminRun('ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS shif REAL DEFAULT 0'); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try { await adminRun("ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS overtime_type TEXT DEFAULT 'weekday'"); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try { await adminRun('ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS contract_hours REAL DEFAULT 168'); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try { await adminRun("ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS nssf_number TEXT DEFAULT ''"); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try { await adminRun("ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS shif_number TEXT DEFAULT ''"); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          try { await adminRun("ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active'"); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
        },
      },
      {
        name: '2024-09-indexes',
        run: async () => {
          const allIndexNames = Object.keys(indexStatements);
          for (const name of allIndexNames) {
            try {
              const row = await adminGet<{ exists: boolean }>(
                'SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = \'public\' AND indexname = $1) as exists',
                [name]
              );
              if (!(row?.exists ?? false)) {
                try { await exec(indexStatements[name]); } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
              }
            } catch (e) { logError('init', e instanceof Error ? e.message : String(e)); }
          }
        },
      },
    ]);

    initialized = true;
  })();

  return initPromise;
}

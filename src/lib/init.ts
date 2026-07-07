import { exec } from './db';
import { initSchema } from './schema';
import { logError, logInfo } from './logger';

let initialized = false;
let initPromise: Promise<void> | null = null;

async function createIndexSafe(sql: string) {
  try {
    await exec(sql);
  } catch { /* index already exists or other non-critical — skip */ }
}

export async function ensureDbInitialized() {
  if (initialized) return Promise.resolve();
  if (process.env.NEXT_PHASE === 'phase-production-build') return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      logInfo('init', 'Checking database schema...');
      
      // Check if tables already exist before trying to create them
      const { query } = await import('./db');
      const rows = await query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'tenants'
        ) as exists;
      `);
      
      const tablesExist = (rows[0] as any)?.exists || false;
      logInfo('init', 'Tables exist:', { exists: tablesExist });
      
      if (tablesExist) {
        logInfo('init', 'Tables already exist, skipping schema creation');
      } else {
        logInfo('init', 'Creating database schema...');
        await initSchema();
        logInfo('init', 'Schema creation complete');
      }
      
      logInfo('init', 'Creating indexes...');
    } catch (e: any) {
      // Log but don't treat as fatal - tables likely already exist
      const msg = e?.message || String(e);
      if (msg.includes('already exists') || msg.includes('relation') && msg.includes('already exists')) {
        logInfo('init', 'Tables already exist, continuing...');
      } else {
        logError('init', 'Schema init warning (non-fatal):', msg);
      }
    }
    
    // Fix subscription plan for admin user (if they already have a paid plan reference)
    try {
      await exec(`UPDATE users SET subscription_plan = 'Premium', subscription_status = 'active', license_status = 'active' WHERE email = 'mambombaya1992@gmail.com' AND subscription_plan = 'trial'`);
    } catch {}

    // Ensure admin_settings table exists
    try {
      await exec(`
        CREATE TABLE IF NOT EXISTS public.admin_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL DEFAULT '',
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } catch {}

    // Always add missing columns to core auth tables (safe to run repeatedly)
    const migrateCols = [
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'KE'`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'trial'`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial'`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified INTEGER DEFAULT 0`,
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_enabled INTEGER DEFAULT 0`,
      `ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS client_db TEXT DEFAULT ''`,
    ];
    for (const sql of migrateCols) {
      try { await exec(sql); } catch {}
    }

    // Always try to create indexes (they're safe to run multiple times)
    await Promise.all([
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_sessions_tenant_id ON public.sessions(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_subscription_events_tenant_id ON public.subscription_events(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_billing_history_tenant_id ON public.billing_history(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(customer_name)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(supplier_name)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_quotations_tenant_id ON public.quotations(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON public.quotations(customer_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_sales_invoices_tenant_id ON public.sales_invoices(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON public.sales_invoices(customer_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_credit_notes_tenant_id ON public.credit_notes(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON public.purchase_orders(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_purchase_invoices_tenant_id ON public.purchase_invoices(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_supplier_payments_tenant_id ON public.supplier_payments(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_supplier_payments_invoice_id ON public.supplier_payments(invoice_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_debit_notes_tenant_id ON public.debit_notes(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON public.employees(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_salaries_tenant_id ON public.salaries(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_salaries_employee_id ON public.salaries(employee_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_company_settings_tenant_id ON public.company_settings(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON public.expenses(tenant_id)'),
      createIndexSafe('CREATE INDEX IF NOT EXISTS idx_electron_activity_tenant_id ON public.electron_activity(tenant_id)'),
    ]);
    
    initialized = true;
    logInfo('init', 'Database initialization complete');
  })();

  return initPromise;
}

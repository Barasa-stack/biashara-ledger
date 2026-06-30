import { exec } from './db';
import { initSchema } from './schema';

let initialized = false;

async function safeExec(sql: string) {
  try {
    await exec(sql);
  } catch (err: any) {
    if (err?.code === '42P07' || (err?.message && err.message.includes('already exists'))) {
      // Index or relation already exists -- safe to ignore on re-init
      return;
    }
    // Re-throw non-duplicate errors
    throw err;
  }
}

async function initIndexes() {
  // Run each CREATE INDEX separately so a single duplicate doesn't fail the batch
  const indexDefs = [
    'CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_tenant_id ON public.sessions(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token)',
    'CREATE INDEX IF NOT EXISTS idx_subscription_events_tenant_id ON public.subscription_events(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_billing_history_tenant_id ON public.billing_history(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(customer_name)',
    'CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(supplier_name)',
    'CREATE INDEX IF NOT EXISTS idx_quotations_tenant_id ON public.quotations(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON public.quotations(customer_id)',
    'CREATE INDEX IF NOT EXISTS idx_sales_invoices_tenant_id ON public.sales_invoices(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON public.sales_invoices(customer_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id)',
    'CREATE INDEX IF NOT EXISTS idx_credit_notes_tenant_id ON public.credit_notes(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON public.purchase_orders(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_purchase_invoices_tenant_id ON public.purchase_invoices(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_supplier_payments_tenant_id ON public.supplier_payments(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_supplier_payments_invoice_id ON public.supplier_payments(invoice_id)',
    'CREATE INDEX IF NOT EXISTS idx_debit_notes_tenant_id ON public.debit_notes(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON public.employees(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_salaries_tenant_id ON public.salaries(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_salaries_employee_id ON public.salaries(employee_id)',
    'CREATE INDEX IF NOT EXISTS idx_company_settings_tenant_id ON public.company_settings(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON public.expenses(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_electron_activity_tenant_id ON public.electron_activity(tenant_id)',
  ];
  for (const sql of indexDefs) {
    await safeExec(sql);
  }
}

export async function ensureDbInitialized() {
  if (initialized) return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  try {
    await initSchema();
  } catch (e) {
    console.error('Schema init failed (non-fatal):', e);
  }
  try {
    await initIndexes();
  } catch (e) {
    console.error('Index init failed (non-fatal):', e);
  }
  initialized = true;
}

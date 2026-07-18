import { safeExec } from './safe-exec';
import { logError } from '../logger';

export async function initDataMigrations() {
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
      await safeExec(`ALTER TABLE public.${table} ALTER COLUMN ${column} TYPE NUMERIC(14,2) USING ${column}::numeric`);
    } catch (e) { logError('schema', e instanceof Error ? e.message : String(e)); }
  }

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
      await safeExec(`ALTER TABLE public.${table} ALTER COLUMN ${column} TYPE DATE USING NULLIF(${column}, '')::date`);
    } catch (e) { logError('schema', e instanceof Error ? e.message : String(e)); }
  }
}

export async function initConstraints() {
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
    { table: 'categories', column: 'parent_id', ref: 'categories(id)', name: 'fk_cat_parent' },
    { table: 'inventory_items', column: 'category_id', ref: 'categories(id)', name: 'fk_item_category' },
  ];
  for (const { table, column, ref, name } of fkConstraints) {
    try {
      await safeExec(`ALTER TABLE public.${table} ADD CONSTRAINT ${name} FOREIGN KEY (${column}) REFERENCES public.${ref} ON DELETE SET NULL`);
    } catch (e) { logError('schema', e instanceof Error ? e.message : String(e)); }
  }

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
      await safeExec(`ALTER TABLE public.${table} ADD CONSTRAINT ${name} UNIQUE (${columns})`);
    } catch (e) { logError('schema', e instanceof Error ? e.message : String(e)); }
  }
}

export async function initIndices() {
  const indexColumns: { table: string; column: string; name: string }[] = [
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
    { table: 'leave_requests', column: 'employee_id', name: 'idx_lr_employee' },
    { table: 'leave_requests', column: 'status', name: 'idx_lr_status' },
    { table: 'attendance', column: 'employee_id', name: 'idx_att_employee' },
    { table: 'attendance', column: 'date', name: 'idx_att_date' },
    { table: 'payslips', column: 'employee_id', name: 'idx_ps_employee' },
    { table: 'payslips', column: 'pay_date', name: 'idx_ps_date' },
  ];
  for (const { table, column, name } of indexColumns) {
    try {
      await safeExec(`CREATE INDEX IF NOT EXISTS ${name} ON public.${table} (${column})`);
    } catch (e) { logError('schema', e instanceof Error ? e.message : String(e)); }
  }
}

export async function initFinalTenantIdPass() {
  const allTables = [
    'inventory_items', 'inventory_transactions', 'fixed_assets', 'journal_entries',
    'chart_of_accounts', 'budgets', 'bank_accounts', 'bank_statements',
    'reconciliations', 'employees', 'salaries', 'leave_requests', 'attendance', 'payslips', 'approval_workflows',
    'approval_requests', 'recurring_templates', 'notifications', 'api_keys',
    'exchange_rates', 'project_transactions', 'articles',
  ];
  for (const tbl of allTables) {
    try {
      await safeExec(`ALTER TABLE public.${tbl} ADD COLUMN IF NOT EXISTS tenant_id TEXT`);
    } catch (e) { logError('schema', 'table may not exist', { error: e }); }
  }
}

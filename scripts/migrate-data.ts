import { Pool } from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const NEON_URL = process.env.NEON_DATABASE_URL;
const NILE_URL = process.env.DATABASE_URL;

if (!NEON_URL || !NILE_URL) {
  console.error('Set NEON_DATABASE_URL and DATABASE_URL');
  process.exit(1);
}

function uuid() {
  return crypto.randomUUID();
}

interface IdMap {
  [oldId: number]: string;
}

async function main() {
  const neon = new Pool({ connectionString: NEON_URL });
  const nile = new Pool({ connectionString: NILE_URL });

  // Maps from old integer IDs to new UUIDs
  const tenants: IdMap = {};
  const users: IdMap = {};
  const customers: IdMap = {};
  const clients: IdMap = {};
  const employees: IdMap = {};
  const invoices: IdMap = {};
  const quotations: IdMap = {};
  const creditNotes: IdMap = {};
  const payments: IdMap = {};
  const pos: IdMap = {};
  const debitNotes: IdMap = {};
  const expenses: IdMap = {};
  const salaries: IdMap = {};

  console.log('=== Starting data migration ===\n');

  // 1. Migrate admin data (licenses, company_settings, roles)
  console.log('1. Migrating admin tables...');

  const companySettings = await neon.query('SELECT * FROM company_settings WHERE id = 1');
  if (companySettings.rows.length) {
    const cs = companySettings.rows[0];
    await nile.query(
      'INSERT INTO tenants (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id',
      [cs.company_name || 'BiasharaLedger']
    );
    // Admin data — tenant_id not applicable; use first tenant
    const tenantResult = await nile.query('SELECT id FROM tenants LIMIT 1');
    const tenantId = tenantResult.rows[0]?.id;
    if (tenantId) {
      await nile.query("SET nile.tenant_id = $1", [tenantId]);
      await nile.query(
        `INSERT INTO company_settings (tenant_id, company_name, email, phone, address, currency, tax_rate, smtp_host, smtp_port, smtp_user, smtp_pass)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING`,
        [tenantId, cs.company_name, cs.email, cs.phone, cs.address, cs.currency, cs.tax_rate, cs.smtp_host, cs.smtp_port, cs.smtp_user, cs.smtp_pass]
      );
      console.log(`   Company settings migrated (tenant: ${tenantId})`);
    }
  }

  const roles = await neon.query('SELECT * FROM roles');
  for (const row of roles.rows) {
    await nile.query(
      'INSERT INTO roles (name, permissions) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [row.name, row.permissions]
    );
  }
  console.log(`   ${roles.rows.length} roles migrated`);

  // 2. Migrate tenants (from users.tenant_id references) and users
  console.log('\n2. Migrating users...');
  const neonUsers = await neon.query('SELECT * FROM users ORDER BY id');

  // Create a tenant for each unique user or group
  const tenantId = (await nile.query('SELECT id FROM tenants LIMIT 1')).rows[0]?.id;
  if (!tenantId) {
    console.error('No tenant found! Run signup first or seed a tenant.');
    await neon.end();
    await nile.end();
    process.exit(1);
  }

  await nile.query("SET nile.tenant_id = $1", [tenantId]);

  for (const u of neonUsers.rows) {
    const newId = uuid();
    users[u.id] = newId;

    const passwordHash = u.password_hash || bcrypt.hashSync('changeme123', 10);

    await nile.query(
      `INSERT INTO users (tenant_id, id, email, password_hash, first_name, last_name, phone,
        subscription_plan, subscription_status, verified, subscription_expiry,
        trial_start_date, trial_end_date, trial_used, license_status, license_key, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId, newId, u.email, passwordHash, u.first_name || '', u.last_name || '', u.phone || '',
       u.subscription_plan || 'trial', u.subscription_status || 'active', u.verified || 1, u.subscription_expiry || null,
       u.trial_start_date || null, u.trial_end_date || null, u.trial_used || 0, u.license_status || null, u.license_key || null, u.role || 'admin']
    );
  }
  console.log(`   ${neonUsers.rows.length} users migrated`);

  // 3. Migrate sessions
  console.log('\n3. Migrating sessions...');
  const neonSessions = await neon.query('SELECT * FROM sessions');
  for (const s of neonSessions.rows) {
    const newUserId = users[s.user_id];
    if (!newUserId) continue;
    await nile.query(
      `INSERT INTO sessions (tenant_id, user_id, token, expires_at)
       VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
      [tenantId, newUserId, s.token, s.expires_at]
    );
  }
  console.log(`   ${neonSessions.rows.length} sessions migrated`);

  // 4. Migrate customers
  console.log('\n4. Migrating customers...');
  const neonCustomers = await neon.query('SELECT * FROM customers ORDER BY id');
  for (const c of neonCustomers.rows) {
    const newId = uuid();
    customers[c.id] = newId;
    await nile.query(
      `INSERT INTO customers (tenant_id, id, company_name, contact_person, email_address, phone_number, address, city, credit_limit, payment_terms, notes, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId, newId, c.company_name || '', c.contact_person || '', c.email_address || '', c.phone_number || '',
       c.address || '', c.city || '', c.credit_limit || 0, c.payment_terms || '', c.notes || '', c.category || 'general']
    );
  }
  console.log(`   ${neonCustomers.rows.length} customers migrated`);

  // 5. Migrate clients (purchases)
  console.log('\n5. Migrating clients...');
  const neonClients = await neon.query('SELECT * FROM clients ORDER BY id');
  for (const c of neonClients.rows) {
    const newId = uuid();
    clients[c.id] = newId;
    await nile.query(
      `INSERT INTO clients (tenant_id, id, company_name, contact_person, email_address, phone_number, address, city, payment_terms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId, newId, c.company_name || '', c.contact_person || '', c.email_address || '', c.phone_number || '',
       c.address || '', c.city || '', c.payment_terms || '']
    );
  }
  console.log(`   ${neonClients.rows.length} clients migrated`);

  // 6. Migrate employees
  console.log('\n6. Migrating employees...');
  const neonEmployees = await neon.query('SELECT * FROM employees ORDER BY id');
  for (const e of neonEmployees.rows) {
    const newId = uuid();
    employees[e.id] = newId;
    await nile.query(
      `INSERT INTO employees (tenant_id, id, employee_name, employee_email, phone_number, id_number, kra_pin, nssf, nhif,
        basic_salary, housing_allowance, transport_allowance, medical_allowance, other_allowances, total_deductions,
        paye, nssf_deduction, nhif_deduction, statutory_deductions, net_pay, department, job_title, employment_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId, newId, e.employee_name || '', e.employee_email || '', e.phone_number || '', e.id_number || '',
       e.kra_pin || '', e.nssf || '', e.nhif || '', e.basic_salary || 0, e.housing_allowance || 0, e.transport_allowance || 0,
       e.medical_allowance || 0, e.other_allowances || 0, e.total_deductions || 0, e.paye || 0, e.nssf_deduction || 0,
       e.nhif_deduction || 0, e.statutory_deductions || 0, e.net_pay || 0, e.department || '', e.job_title || '',
       e.employment_date || null, e.status || 'active']
    );
  }
  console.log(`   ${neonEmployees.rows.length} employees migrated`);

  // 7. Migrate sales invoices
  console.log('\n7. Migrating sales invoices...');
  const neonInvoices = await neon.query('SELECT * FROM sales_invoices ORDER BY id');
  for (const i of neonInvoices.rows) {
    const newId = uuid();
    invoices[i.id] = newId;
    const custId = i.customer_id ? (customers[i.customer_id] || null) : null;
    await nile.query(
      `INSERT INTO sales_invoices (tenant_id, id, invoice_number, customer_id, customer_name, customer_email,
        description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status,
        issue_date, due_date, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId, newId, i.invoice_number || '', custId, i.customer_name || '', i.customer_email || '',
       i.description || '', i.quantity || 0, i.unit_price || 0, i.subtotal || 0, i.tax_vat || 0, i.discounts || 0,
       i.amount || 0, i.payment_terms || '', i.status || 'draft', i.issue_date || null, i.due_date || null, i.created_at || new Date()]
    );
  }
  console.log(`   ${neonInvoices.rows.length} invoices migrated`);

  // 8. Migrate sales quotations
  console.log('\n8. Migrating quotations...');
  const neonQuotations = await neon.query('SELECT * FROM sales_quotations ORDER BY id');
  for (const q of neonQuotations.rows) {
    const newId = uuid();
    quotations[q.id] = newId;
    const custId = q.customer_id ? (customers[q.customer_id] || null) : null;
    await nile.query(
      `INSERT INTO sales_quotations (tenant_id, id, quotation_number, customer_id, customer_name, customer_email,
        description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status,
        issue_date, due_date, valid_until, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId, newId, q.quotation_number || '', custId, q.customer_name || '', q.customer_email || '',
       q.description || '', q.quantity || 0, q.unit_price || 0, q.subtotal || 0, q.tax_vat || 0, q.discounts || 0,
       q.amount || 0, q.payment_terms || '', q.status || 'draft', q.issue_date || null, q.due_date || null,
       q.valid_until || null, q.created_at || new Date()]
    );
  }
  console.log(`   ${neonQuotations.rows.length} quotations migrated`);

  // 9. Migrate credit notes
  console.log('\n9. Migrating credit notes...');
  const neonCreditNotes = await neon.query('SELECT * FROM sales_credit_notes ORDER BY id');
  for (const cn of neonCreditNotes.rows) {
    const newId = uuid();
    creditNotes[cn.id] = newId;
    const custId = cn.customer_id ? (customers[cn.customer_id] || null) : null;
    const invId = cn.invoice_id ? (invoices[cn.invoice_id] || null) : null;
    await nile.query(
      `INSERT INTO sales_credit_notes (tenant_id, id, credit_note_number, invoice_id, customer_id, customer_name,
        customer_email, reason, description, amount, payment_terms, issue_date, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId, newId, cn.credit_note_number || '', invId, custId, cn.customer_name || '',
       cn.customer_email || '', cn.reason || '', cn.description || '', cn.amount || 0,
       cn.payment_terms || '', cn.issue_date || null, cn.created_at || new Date()]
    );
  }
  console.log(`   ${neonCreditNotes.rows.length} credit notes migrated`);

  // 10. Migrate sales payments
  console.log('\n10. Migrating payments...');
  const neonPayments = await neon.query('SELECT * FROM sales_payments ORDER BY id');
  for (const p of neonPayments.rows) {
    const newId = uuid();
    payments[p.id] = newId;
    const invId = p.invoice_id ? (invoices[p.invoice_id] || null) : null;
    await nile.query(
      `INSERT INTO sales_payments (tenant_id, id, invoice_id, amount, payment_type, payment_date,
        reference, notes, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId, newId, invId, p.amount || 0, p.payment_type || 'full', p.payment_date || null,
       p.reference || '', p.notes || '', p.created_at || new Date()]
    );
  }
  console.log(`   ${neonPayments.rows.length} payments migrated`);

  // 11. Migrate purchase invoices
  console.log('\n11. Migrating purchase invoices...');
  const neonPurchaseInvs = await neon.query('SELECT * FROM purchase_invoices ORDER BY id');
  for (const pi of neonPurchaseInvs.rows) {
    const newId = uuid();
    const cliId = pi.client_id ? (clients[pi.client_id] || null) : null;
    await nile.query(
      `INSERT INTO purchase_invoices (tenant_id, id, invoice_number, client_id, client_name, client_email,
        description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status,
        issue_date, due_date, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId, newId, pi.invoice_number || '', cliId, pi.client_name || '', pi.client_email || '',
       pi.description || '', pi.quantity || 0, pi.unit_price || 0, pi.subtotal || 0, pi.tax_vat || 0, pi.discounts || 0,
       pi.amount || 0, pi.payment_terms || '', pi.status || 'draft', pi.issue_date || null, pi.due_date || null, pi.created_at || new Date()]
    );
  }
  console.log(`   ${neonPurchaseInvs.rows.length} purchase invoices migrated`);

  // 12. Migrate purchase orders
  console.log('\n12. Migrating purchase orders...');
  const neonPOs = await neon.query('SELECT * FROM purchase_orders ORDER BY id');
  for (const po of neonPOs.rows) {
    const newId = uuid();
    pos[po.id] = newId;
    const cliId = po.client_id ? (clients[po.client_id] || null) : null;
    await nile.query(
      `INSERT INTO purchase_orders (tenant_id, id, order_number, client_id, client_name, client_email,
        description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status,
        issue_date, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId, newId, po.order_number || '', cliId, po.client_name || '', po.client_email || '',
       po.description || '', po.quantity || 0, po.unit_price || 0, po.subtotal || 0, po.tax_vat || 0, po.discounts || 0,
       po.amount || 0, po.payment_terms || '', po.status || 'draft', po.issue_date || null, po.created_at || new Date()]
    );
  }
  console.log(`   ${neonPOs.rows.length} purchase orders migrated`);

  // 13. Migrate debit notes
  console.log('\n13. Migrating debit notes...');
  const neonDebitNotes = await neon.query('SELECT * FROM purchase_debit_notes ORDER BY id');
  for (const dn of neonDebitNotes.rows) {
    const newId = uuid();
    debitNotes[dn.id] = newId;
    await nile.query(
      `INSERT INTO purchase_debit_notes (tenant_id, id, debit_note_number, description, amount, reason, issue_date, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId, newId, dn.debit_note_number || '', dn.description || '', dn.amount || 0,
       dn.reason || '', dn.issue_date || null, dn.created_at || new Date()]
    );
  }
  console.log(`   ${neonDebitNotes.rows.length} debit notes migrated`);

  // 14. Migrate expenses
  console.log('\n14. Migrating expenses...');
  const neonExpenses = await neon.query('SELECT * FROM expenses ORDER BY id');
  for (const e of neonExpenses.rows) {
    const newId = uuid();
    expenses[e.id] = newId;
    await nile.query(
      `INSERT INTO expenses (tenant_id, id, expense_number, category, description, amount, tax_vat, payment_method,
        expense_date, receipt_url, notes, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId, newId, e.expense_number || '', e.category || '', e.description || '', e.amount || 0,
       e.tax_vat || 0, e.payment_method || '', e.expense_date || null, e.receipt_url || '', e.notes || '', e.created_at || new Date()]
    );
  }
  console.log(`   ${neonExpenses.rows.length} expenses migrated`);

  // 15. Migrate salaries
  console.log('\n15. Migrating salaries...');
  const neonSalaries = await neon.query('SELECT * FROM salaries ORDER BY id');
  for (const s of neonSalaries.rows) {
    const newId = uuid();
    salaries[s.id] = newId;
    const empId = s.employee_id ? (employees[s.employee_id] || null) : null;
    await nile.query(
      `INSERT INTO salaries (tenant_id, id, employee_id, amount, pay_date, payment_method, payslip_reference, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId, newId, empId, s.amount || 0, s.pay_date || null, s.payment_method || '', s.payslip_reference || '', s.status || 'paid', s.created_at || new Date()]
    );
  }
  console.log(`   ${neonSalaries.rows.length} salaries migrated`);

  // 16. Migrate billing history
  console.log('\n16. Migrating billing history...');
  const neonBilling = await neon.query('SELECT * FROM billing_history ORDER BY id');
  for (const b of neonBilling.rows) {
    const newUserId = users[b.user_id];
    if (!newUserId) continue;
    await nile.query(
      `INSERT INTO billing_history (tenant_id, user_id, amount, plan_name, payment_method, transaction_id,
        period_start, period_end, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT DO NOTHING`,
      [tenantId, newUserId, b.amount || 0, b.plan_name || '', b.payment_method || '', b.transaction_id || '',
       b.period_start || null, b.period_end || null, b.created_at || new Date()]
    );
  }
  console.log(`   ${neonBilling.rows.length} billing records migrated`);

  // 17. Migrate subscription events
  console.log('\n17. Migrating subscription events...');
  const neonEvents = await neon.query('SELECT * FROM subscription_events ORDER BY id');
  for (const ev of neonEvents.rows) {
    const newUserId = users[ev.user_id];
    if (!newUserId) continue;
    await nile.query(
      `INSERT INTO subscription_events (tenant_id, user_id, event_type, description, metadata, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT DO NOTHING`,
      [tenantId, newUserId, ev.event_type || '', ev.description || '', ev.metadata || '{}', ev.created_at || new Date()]
    );
  }
  console.log(`   ${neonEvents.rows.length} subscription events migrated`);

  // 18. Migrate email logs
  console.log('\n18. Migrating email logs...');
  const neonEmailLogs = await neon.query('SELECT * FROM email_logs ORDER BY id');
  for (const el of neonEmailLogs.rows) {
    await nile.query(
      `INSERT INTO email_logs (tenant_id, recipient, email_type, success, detail, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT DO NOTHING`,
      [tenantId, el.recipient || '', el.email_type || '', el.success || 0, el.detail || '', el.created_at || new Date()]
    );
  }
  console.log(`   ${neonEmailLogs.rows.length} email logs migrated`);

  // 19. Migrate licenses (admin table, no tenant_id)
  console.log('\n19. Migrating licenses...');
  const neonLicenses = await neon.query('SELECT * FROM licenses ORDER BY id');
  for (const l of neonLicenses.rows) {
    await nile.query(
      `INSERT INTO licenses (license_key, email, plan, status, activated_at, expires_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
      [l.license_key, l.email || '', l.plan || '', l.status || '', l.activated_at || null, l.expires_at || null, l.created_at || new Date()]
    );
  }
  console.log(`   ${neonLicenses.rows.length} licenses migrated`);

  // 20. Migrate backups (admin table, no tenant_id)
  console.log('\n20. Migrating backups...');
  const neonBackups = await neon.query('SELECT * FROM backups ORDER BY id');
  for (const b of neonBackups.rows) {
    await nile.query(
      `INSERT INTO backups (license_key, data, file_size, version, created_at)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      [b.license_key, b.data, b.file_size, b.version || 1, b.created_at || new Date()]
    );
  }
  console.log(`   ${neonBackups.rows.length} backups migrated`);

  // 21. Migrate offline sessions
  console.log('\n21. Migrating offline sessions...');
  const neonOffline = await neon.query('SELECT * FROM offline_sessions ORDER BY id');
  for (const os of neonOffline.rows) {
    const newUserId = users[os.user_id];
    if (!newUserId) continue;
    await nile.query(
      `INSERT INTO offline_sessions (tenant_id, user_id, token, license_key, expires_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
      [tenantId, newUserId, os.token, os.license_key, os.expires_at || null, os.created_at || new Date()]
    );
  }
  console.log(`   ${neonOffline.rows.length} offline sessions migrated`);

  // Summary
  console.log('\n=== Migration Complete ===');
  console.log(`Users: ${neonUsers.rows.length}`);
  console.log(`Customers: ${neonCustomers.rows.length}`);
  console.log(`Clients: ${neonClients.rows.length}`);
  console.log(`Employees: ${neonEmployees.rows.length}`);
  console.log(`Invoices: ${neonInvoices.rows.length}`);
  console.log(`Quotations: ${neonQuotations.rows.length}`);
  console.log(`Credit Notes: ${neonCreditNotes.rows.length}`);
  console.log(`Payments: ${neonPayments.rows.length}`);
  console.log(`Purchase Invoices: ${neonPurchaseInvs.rows.length}`);
  console.log(`Purchase Orders: ${neonPOs.rows.length}`);
  console.log(`Debit Notes: ${neonDebitNotes.rows.length}`);
  console.log(`Expenses: ${neonExpenses.rows.length}`);
  console.log(`Salaries: ${neonSalaries.rows.length}`);

  await neon.end();
  await nile.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

import { Pool } from 'pg';
import crypto from 'crypto';
import { exec as execChild } from 'child_process';
import util from 'util';
import { adminQuery, adminGet, adminRun, getPoolForDatabase, adminDb } from './db';
import { getSessionFromCookies } from './auth-server';
import { NextResponse } from 'next/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'digitalbaroz@gmail.com';

export async function adminGuard() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
    }
    if ((session as any).email !== ADMIN_EMAIL && (session as any).role !== 'super_admin') {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
    }
    return { error: null, session: session as any };
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
}

const execPromise = util.promisify(execChild);

export async function createClientDatabase(email: string, companyName: string, maxUsers = 5) {
  const sanitized = companyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dbName = `client_${sanitized}_${Date.now().toString(36)}`;
  const licenseKey = generateLicenseKey(email);

  console.log(`Creating database: ${dbName}...`);

  try {
    await execPromise(`createdb -U ${process.env.PGUSER || 'postgres'} -T biashara_ledger_template ${dbName}`);
  } catch (e) {
    console.log('Template clone failed, creating empty database and applying schema...');
    await execPromise(`createdb -U ${process.env.PGUSER || 'postgres'} ${dbName}`);
    const clientPool = getPoolForDatabase(dbName);
    await applySchemaToClient(clientPool);
  }

  const result = await adminQuery(
    `INSERT INTO admin_clients (company_name, email, database_name, license_key, max_users, trial_start_date, trial_end_date)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '14 days')
     RETURNING id, company_name, email, database_name, license_key, trial_end_date`,
    [companyName, email, dbName, licenseKey, maxUsers]
  );

  const client = result[0];

  await adminRun(
    `INSERT INTO admin_license_keys (license_key, client_id, expires_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '1 year')`,
    [licenseKey, client.id]
  );

  return client;
}

export async function applySchemaToClient(pool: Pool) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
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
      trial_start_date TIMESTAMPTZ,
      trial_end_date TIMESTAMPTZ,
      trial_used INTEGER DEFAULT 0,
      license_status TEXT DEFAULT 'trial',
      license_key TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
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
    )`,
    `CREATE TABLE IF NOT EXISTS clients (
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
    )`,
    `CREATE TABLE IF NOT EXISTS employees (
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
    )`,
    `CREATE TABLE IF NOT EXISTS company_settings (
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
    )`,
    `CREATE TABLE IF NOT EXISTS quotations (
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
    )`,
    `CREATE TABLE IF NOT EXISTS sales_invoices (
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
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      customer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS credit_notes (
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
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_orders (
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
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_invoices (
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
    )`,
    `CREATE TABLE IF NOT EXISTS supplier_payments (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      client_name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS debit_notes (
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
    )`,
    `CREATE TABLE IF NOT EXISTS salaries (
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
    )`,
    `CREATE TABLE IF NOT EXISTS expenses (
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
    )`,
    `CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      permissions TEXT DEFAULT '[]'
    )`,
    `INSERT INTO company_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`,
    `INSERT INTO roles (name, description, permissions) VALUES
      ('admin', 'Full access to all features', '["all"]'),
      ('hr_manager', 'HR and payroll management', '["hr.read","hr.write","payroll.read","payroll.write","dashboard.read"]'),
      ('accountant', 'Accounting and financial reports', '["accounts.read","accounts.write","reports.read","dashboard.read"]'),
      ('employee', 'View own data only', '["dashboard.read","hr.own"]')
    ON CONFLICT (name) DO NOTHING`,
  ];

  for (const sql of tables) {
    await pool.query(sql);
  }
}

export async function dropClientDatabase(databaseName: string) {
  await execPromise(`dropdb -U ${process.env.PGUSER || 'postgres'} ${databaseName}`);
}

export function generateLicenseKey(email: string): string {
  const uuid = crypto.randomUUID();
  const hmac = crypto.createHmac('sha256', process.env.LICENSE_SECRET || 'biashara-ledger-secret');
  hmac.update(email + uuid);
  const signature = hmac.digest('hex').substring(0, 8);
  const year = new Date().getFullYear();
  return `BL-${year}-${uuid.substring(0, 8)}-${signature}`;
}

export async function validateLicenseKey(licenseKey: string) {
  const result = await adminQuery(
    `SELECT l.*, c.company_name, c.database_name, c.email, c.max_users
     FROM admin_license_keys l
     JOIN admin_clients c ON l.client_id = c.id
     WHERE l.license_key = $1 AND l.is_used = false AND l.expires_at > CURRENT_TIMESTAMP AND c.is_active = true`,
    [licenseKey]
  );

  if (result.length === 0) {
    return { valid: false, error: 'Invalid or expired license key' };
  }

  return { valid: true, client: result[0] };
}

export async function getClientDatabase(clientId: number) {
  const result = await adminGet(
    'SELECT database_name FROM admin_clients WHERE id = $1 AND is_active = true',
    [clientId]
  );

  if (!result) {
    throw new Error('Client not found or inactive');
  }

  return getPoolForDatabase((result as any).database_name);
}

export async function createUserInClientDb(
  clientDb: string,
  email: string,
  passwordHash: string,
  firstName: string,
  lastName: string,
  phone: string
) {
  const pool = getPoolForDatabase(clientDb);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone,
      subscription_plan, subscription_status, verified)
     VALUES ($1, $2, $3, $4, $5, 'trial', 'active', 1)
     RETURNING id`,
    [email, passwordHash, firstName, lastName, phone]
  );
  return result.rows[0].id;
}

export async function createSessionInClientDb(clientDb: string, userId: number) {
  const pool = getPoolForDatabase(clientDb);
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await pool.query(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
  return { token, expiresAt };
}

export async function verifyCredentialsInClientDb(clientDb: string, email: string, password: string) {
  const { verifyPassword } = await import('./auth-server');
  const pool = getPoolForDatabase(clientDb);
  const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (user.rows.length === 0) return null;
  const u = user.rows[0];
  if (!verifyPassword(password, u.password_hash)) return null;
  return u;
}

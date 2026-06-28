import { NextResponse } from 'next/server';
import { get, adminGet, adminRun, getPoolForDatabase } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth-server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getTrialDates } from '@/lib/license';
import crypto from 'crypto';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'digitalbaroz@gmail.com';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { email, password, phone, firstName, lastName, otp } = body;
    if (email) email = email.trim().toLowerCase();

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = checkRateLimit(`signup:${ip}`, 3, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password must be at least 8 characters with an uppercase letter and a number' }, { status: 400 });
    }

    if (!otp) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    // Check if this email belongs to a client database
    const clientRecord = await adminGet(
      'SELECT id, database_name, company_name FROM admin_clients WHERE email = $1 AND is_active = true',
      [email]
    );

    if (clientRecord) {
      // Client user — create in their database
      const clientDb = (clientRecord as any).database_name;
      const clientPool = getPoolForDatabase(clientDb);

      const existing = await clientPool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }

      const storedOtp = await get(
        "SELECT * FROM verification_codes WHERE email = $1 AND purpose = 'signup' AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
        [email]
      ) as any;

      if (!storedOtp) {
        return NextResponse.json({ error: 'No valid verification code found. Request a new one.' }, { status: 400 });
      }

      if (storedOtp.code !== otp) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      await get('UPDATE verification_codes SET used = 1 WHERE id = $1', [storedOtp.id]);

      const passwordHash = hashPassword(password);
      const { trialStartDate, trialEndDate } = getTrialDates();

      const result = await clientPool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone,
          subscription_plan, subscription_status, verified, subscription_expiry,
          trial_start_date, trial_end_date, trial_used, license_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [email, passwordHash, firstName || '', lastName || '', phone || '',
          'trial', 'active', 1, trialEndDate,
          trialStartDate, trialEndDate, 1, 'trial']
      );

      const userId = result.rows[0].id;
      const { token } = await createSession(userId, clientDb);

      const response = NextResponse.json({
        user: {
          id: userId, email, firstName, lastName, phone,
          subscriptionPlan: 'trial', subscriptionStatus: 'active',
          trialEndDate,
        },
        trialEndDate,
        requiresPackageSelection: false,
        token,
      }, { status: 201 });

      response.cookies.set('bl_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // Auto-create isolated schema for non-admin users
    const schemaName = `usr_${email.replace(/[^a-z0-9@]/g, '_')}_${Date.now().toString(36)}`;
    await adminRun(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    const pool = getPoolForDatabase(schemaName);
    const conn = await pool.connect();
    try {
      await conn.query(`SET search_path TO "${schemaName}"`);

      const tables = [
        `CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
          first_name TEXT DEFAULT '', last_name TEXT DEFAULT '', phone TEXT DEFAULT '',
          subscription_plan TEXT DEFAULT 'trial', subscription_status TEXT DEFAULT 'active',
          verified INTEGER DEFAULT 0, subscription_expiry TIMESTAMPTZ, role TEXT DEFAULT 'admin',
          trial_start_date TIMESTAMPTZ, trial_end_date TIMESTAMPTZ, trial_used INTEGER DEFAULT 0,
          license_status TEXT DEFAULT 'trial', license_key TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY, customer_name TEXT NOT NULL DEFAULT '', company_name TEXT DEFAULT '',
          contact_person TEXT DEFAULT '', email_address TEXT DEFAULT '', phone_number TEXT DEFAULT '',
          billing_address TEXT DEFAULT '', shipping_address TEXT DEFAULT '', tax_id TEXT DEFAULT '',
          payment_terms TEXT DEFAULT 'Net 30', credit_limit REAL DEFAULT 0, notes TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY, supplier_name TEXT NOT NULL DEFAULT '', company_name TEXT DEFAULT '',
          contact_person TEXT DEFAULT '', email_address TEXT DEFAULT '', phone_number TEXT DEFAULT '',
          address TEXT DEFAULT '', bank_details TEXT DEFAULT '', tax_id TEXT DEFAULT '',
          payment_terms TEXT DEFAULT 'Net 30', supplier_category TEXT DEFAULT '', notes TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS employees (
          id SERIAL PRIMARY KEY, employee_code TEXT DEFAULT '', name TEXT NOT NULL DEFAULT '',
          date_of_birth TEXT DEFAULT '', national_id TEXT DEFAULT '', tax_pin TEXT DEFAULT '',
          phone TEXT DEFAULT '', email TEXT DEFAULT '', address TEXT DEFAULT '',
          department TEXT DEFAULT '', job_title TEXT DEFAULT '', date_of_hire TEXT DEFAULT '',
          employment_type TEXT DEFAULT 'full-time', bank_name TEXT DEFAULT '',
          account_number TEXT DEFAULT '', emergency_contact_name TEXT DEFAULT '',
          emergency_contact_phone TEXT DEFAULT '', notes TEXT DEFAULT '', salary REAL DEFAULT 0,
          salary_encrypted TEXT, national_id_encrypted TEXT, bank_account_encrypted TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS company_settings (
          id SERIAL PRIMARY KEY, company_name TEXT DEFAULT '', address TEXT DEFAULT '',
          location TEXT DEFAULT '', country TEXT DEFAULT 'Kenya', phone TEXT DEFAULT '',
          email TEXT DEFAULT '', kra_pin TEXT DEFAULT '', logo_base64 TEXT DEFAULT '',
          paybill_number TEXT DEFAULT '', bank_name TEXT DEFAULT '', account_number TEXT DEFAULT '',
          bank_branch TEXT DEFAULT '', branch_code TEXT DEFAULT '', bank_code TEXT DEFAULT '',
          swift_code TEXT DEFAULT '', terms_conditions TEXT DEFAULT '',
          invoice_prefix TEXT DEFAULT 'INV', next_invoice_number INTEGER DEFAULT 1,
          quotation_prefix TEXT DEFAULT 'QTN', next_quotation_number INTEGER DEFAULT 1,
          last_invoice_month TEXT DEFAULT '', last_quotation_month TEXT DEFAULT '',
          smtp_host TEXT DEFAULT '', smtp_port TEXT DEFAULT '587', smtp_user TEXT DEFAULT '',
          smtp_pass TEXT DEFAULT '', vat_rate REAL DEFAULT 16,
          credit_note_prefix TEXT DEFAULT 'CN', next_credit_note_number INTEGER DEFAULT 1,
          last_credit_note_month TEXT DEFAULT '', updated_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS quotations (
          id SERIAL PRIMARY KEY, quotation_number TEXT DEFAULT '',
          customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          customer_name TEXT NOT NULL, description TEXT DEFAULT '', quantity REAL DEFAULT 1,
          unit_price REAL DEFAULT 0, subtotal REAL DEFAULT 0, tax_vat REAL DEFAULT 0,
          amount REAL NOT NULL DEFAULT 0, valid_until TEXT DEFAULT '', due_date TEXT DEFAULT '',
          status TEXT DEFAULT 'draft', notes TEXT DEFAULT '', items TEXT DEFAULT '[]',
          issue_date TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS sales_invoices (
          id SERIAL PRIMARY KEY, invoice_number TEXT DEFAULT '',
          quotation_id INTEGER REFERENCES quotations(id) ON DELETE SET NULL,
          customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          customer_name TEXT NOT NULL, description TEXT DEFAULT '', quantity REAL DEFAULT 1,
          unit_price REAL DEFAULT 0, subtotal REAL DEFAULT 0, tax_vat REAL DEFAULT 0,
          discounts REAL DEFAULT 0, amount REAL NOT NULL DEFAULT 0,
          payment_terms TEXT DEFAULT 'Net 30', status TEXT DEFAULT 'unpaid',
          items TEXT DEFAULT '[]', issue_date TEXT NOT NULL, due_date TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY, invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
          customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          customer_name TEXT NOT NULL, amount REAL NOT NULL, payment_date TEXT NOT NULL,
          payment_method TEXT DEFAULT 'cash', notes TEXT DEFAULT '', created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS credit_notes (
          id SERIAL PRIMARY KEY, credit_note_number TEXT DEFAULT '',
          invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
          customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          customer_name TEXT NOT NULL, customer_email TEXT DEFAULT '', description TEXT DEFAULT '',
          quantity REAL DEFAULT 1, unit_price REAL DEFAULT 0, subtotal REAL DEFAULT 0,
          tax_vat REAL DEFAULT 0, discounts REAL DEFAULT 0, amount REAL NOT NULL DEFAULT 0,
          reason TEXT DEFAULT '', notes TEXT DEFAULT '', payment_terms TEXT DEFAULT 'Net 30',
          issue_date TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS purchase_orders (
          id SERIAL PRIMARY KEY, po_number TEXT DEFAULT '',
          client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          client_name TEXT NOT NULL, description TEXT DEFAULT '', quantity REAL DEFAULT 1,
          unit_price REAL DEFAULT 0, subtotal REAL DEFAULT 0, tax_vat REAL DEFAULT 0,
          amount REAL NOT NULL DEFAULT 0, delivery_date TEXT DEFAULT '', status TEXT DEFAULT 'pending',
          notes TEXT DEFAULT '', issue_date TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS purchase_invoices (
          id SERIAL PRIMARY KEY, invoice_number TEXT DEFAULT '',
          po_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
          client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          client_name TEXT NOT NULL, description TEXT DEFAULT '', quantity REAL DEFAULT 1,
          unit_price REAL DEFAULT 0, subtotal REAL DEFAULT 0, tax_vat REAL DEFAULT 0,
          discounts REAL DEFAULT 0, amount REAL NOT NULL DEFAULT 0,
          payment_terms TEXT DEFAULT 'Net 30', status TEXT DEFAULT 'unpaid',
          issue_date TEXT NOT NULL, due_date TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS supplier_payments (
          id SERIAL PRIMARY KEY, invoice_id INTEGER NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
          client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          client_name TEXT NOT NULL, amount REAL NOT NULL, payment_date TEXT NOT NULL,
          payment_method TEXT DEFAULT 'cash', notes TEXT DEFAULT '', created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS debit_notes (
          id SERIAL PRIMARY KEY, debit_note_number TEXT DEFAULT '',
          purchase_invoice_id INTEGER NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
          client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          client_name TEXT NOT NULL, description TEXT DEFAULT '', quantity REAL DEFAULT 1,
          unit_price REAL DEFAULT 0, amount REAL NOT NULL DEFAULT 0, reason TEXT DEFAULT '',
          notes TEXT DEFAULT '', issue_date TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS salaries (
          id SERIAL PRIMARY KEY, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
          employee_name TEXT NOT NULL, basic_salary REAL DEFAULT 0, allowances REAL DEFAULT 0,
          deductions REAL DEFAULT 0, overtime REAL DEFAULT 0, bonuses REAL DEFAULT 0,
          amount REAL NOT NULL DEFAULT 0, amount_encrypted TEXT, pay_date TEXT NOT NULL,
          payment_method TEXT DEFAULT 'bank', payslip_reference TEXT DEFAULT '',
          status TEXT DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS expenses (
          id SERIAL PRIMARY KEY, expense_code TEXT DEFAULT '', category TEXT NOT NULL DEFAULT '',
          description TEXT DEFAULT '', supplier_vendor TEXT DEFAULT '',
          invoice_receipt_number TEXT DEFAULT '', amount REAL NOT NULL DEFAULT 0,
          tax_vat REAL DEFAULT 0, expense_date TEXT NOT NULL, payment_method TEXT DEFAULT 'cash',
          paid_by TEXT DEFAULT '', status TEXT DEFAULT 'pending', notes TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS roles (
          id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT DEFAULT '',
          permissions TEXT DEFAULT '[]'
        )`,
        `INSERT INTO roles (name, description, permissions) VALUES
          ('admin', 'Full access to all features', '["all"]'),
          ('hr_manager', 'HR and payroll management', '["hr.read","hr.write","payroll.read","payroll.write","dashboard.read"]'),
          ('accountant', 'Accounting and financial reports', '["accounts.read","accounts.write","reports.read","dashboard.read"]'),
          ('employee', 'View own data only', '["dashboard.read","hr.own"]')
        ON CONFLICT (name) DO NOTHING`,
        `INSERT INTO company_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`,
      ];

      for (const sql of tables) {
        await conn.query(sql);
      }
    } finally {
      conn.release();
    }

    const { trialStartDate, trialEndDate } = getTrialDates();
    const subscriptionExpiry = trialEndDate;
    const passwordHash = hashPassword(password);

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone,
        subscription_plan, subscription_status, verified, subscription_expiry,
        trial_start_date, trial_end_date, trial_used, license_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [email, passwordHash, firstName || '', lastName || '', phone || '',
        'trial', 'active', 1, subscriptionExpiry,
        trialStartDate, trialEndDate, 1, 'trial']
    );

    const userId = userResult.rows[0].id;
    const { token } = await createSession(userId, schemaName);

    const response = NextResponse.json({
      user: {
        id: userId, email, firstName, lastName, phone,
        subscriptionPlan: 'trial', subscriptionStatus: 'active',
        trialEndDate,
      },
      trialEndDate,
      requiresPackageSelection: false,
      token,
    }, { status: 201 });

    response.cookies.set('bl_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 500 });
  }
}

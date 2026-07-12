import { NextResponse } from 'next/server';
import { adminRun } from '@/lib/db';

const TABLES = [
  {
    name: 'attendance',
    sql: `CREATE TABLE IF NOT EXISTS public.attendance (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      employee_id UUID,
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
    )`,
  },
  {
    name: 'leave_requests',
    sql: `DROP TABLE IF EXISTS public.leave_requests CASCADE;
CREATE TABLE IF NOT EXISTS public.leave_requests (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      employee_id UUID,
      employee_name TEXT DEFAULT '',
      leave_type TEXT NOT NULL DEFAULT 'annual',
      reason TEXT DEFAULT '',
      start_date TEXT NOT NULL DEFAULT '',
      end_date TEXT NOT NULL DEFAULT '',
      days REAL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending',
      approved_by INTEGER DEFAULT 0,
      approved_at TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    )`,
  },
  {
    name: 'payslips',
    sql: `CREATE TABLE IF NOT EXISTS public.payslips (
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
    )`,
  },
  {
    name: 'activity_log',
    sql: `CREATE TABLE IF NOT EXISTS public.activity_log (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      customer_id UUID,
      deal_id UUID,
      type TEXT NOT NULL DEFAULT 'note',
      subject TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    )`,
  },
  {
    name: 'leads',
    sql: `CREATE TABLE IF NOT EXISTS public.leads (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      name TEXT NOT NULL DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      source TEXT DEFAULT 'other',
      status TEXT DEFAULT 'new',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    )`,
  },
];

const INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id)',
  'CREATE INDEX IF NOT EXISTS idx_attendance_tenant_id ON public.attendance(tenant_id)',
  'CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id)',
  'CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_id ON public.leave_requests(tenant_id)',
  'CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id)',
  'CREATE INDEX IF NOT EXISTS idx_payslips_tenant_id ON public.payslips(tenant_id)',
  'CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON public.payslips(employee_id)',
];

export async function GET() {
  const results: string[] = [];

  for (const t of TABLES) {
    try {
      await adminRun(t.sql);
      results.push(`${t.name}: created OK`);
    } catch (e: any) {
      results.push(`${t.name}: FAILED - ${e.message}`);
    }
  }

  for (const idx of INDEXES) {
    const name = idx.match(/idx_\w+/)?.[0] || 'index';
    try {
      await adminRun(idx);
      results.push(`${name}: OK`);
    } catch (e: any) {
      results.push(`${name}: FAILED - ${e.message}`);
    }
  }

  // Phase 8: add missing columns (AHL, SHIF, overtime, etc.)
  const COLUMNS = [
    'ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS ahl REAL DEFAULT 0',
    'ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS employer_ahl REAL DEFAULT 0',
    'ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS overtime_hours REAL DEFAULT 0',
    "ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS overtime_type TEXT DEFAULT 'none'",
    'ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS shif REAL DEFAULT 0',
    "ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS overtime_type TEXT DEFAULT 'weekday'",
    'ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS contract_hours REAL DEFAULT 168',
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS nssf_number TEXT DEFAULT ''",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS shif_number TEXT DEFAULT ''",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active'",
    "ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'",
    "ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS lost_reason TEXT DEFAULT ''",
    "ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS lead_id UUID",
    "ALTER TABLE public.activity_log ADD COLUMN IF NOT EXISTS lead_id UUID",
  ];
  for (const col of COLUMNS) {
    const name = col.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1] || 'column';
    try {
      await adminRun(col);
      results.push(`${name}: OK`);
    } catch (e: any) {
      results.push(`${name}: FAILED - ${e.message}`);
    }
  }

  return NextResponse.json({ results, count: TABLES.length + COLUMNS.length });
}

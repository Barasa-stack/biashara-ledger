import { NextResponse } from 'next/server';
import { adminRun } from '@/lib/db';

export async function GET() {
  const results: string[] = [];

  // Create employees table if missing
  try {
    await adminRun(`CREATE TABLE IF NOT EXISTS public.employees (
      tenant_id UUID NOT NULL REFERENCES public.tenants(id),
      id UUID DEFAULT gen_random_uuid(),
      employee_code TEXT DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      date_of_birth TEXT DEFAULT '',
      national_id TEXT DEFAULT '',
      tax_pin TEXT DEFAULT '',
      nssf_number TEXT DEFAULT '',
      shif_number TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      department TEXT DEFAULT '',
      job_title TEXT DEFAULT '',
      date_of_hire TEXT DEFAULT '',
      employment_type TEXT DEFAULT 'full-time',
      employment_status TEXT DEFAULT 'active',
      contract_hours REAL DEFAULT 168,
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
    )`);
    results.push('employees: OK');
  } catch (e: any) {
    results.push(`employees: FAILED - ${e.message}`);
  }

  // Create leave_requests with UUID employee_id (safe, no DROP)
  try {
    await adminRun(`CREATE TABLE IF NOT EXISTS public.leave_requests (
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
      approved_by TEXT DEFAULT '',
      approved_at TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id)
    )`);
    results.push('leave_requests: OK');
  } catch (e: any) {
    results.push(`leave_requests: FAILED - ${e.message}`);
  }

  // Add employee_uuid column to store UUID references
  try {
    await adminRun(`ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS employee_uuid TEXT DEFAULT ''`);
    results.push('leave_requests.employee_uuid: added');
  } catch (e: any) {
    results.push(`leave_requests.employee_uuid: ${e.message}`);
  }
  try {
    await adminRun(`ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS employee_uuid TEXT DEFAULT ''`);
    results.push('attendance.employee_uuid: added');
  } catch (e: any) {
    results.push(`attendance.employee_uuid: ${e.message}`);
  }

  return NextResponse.json({ results });
}

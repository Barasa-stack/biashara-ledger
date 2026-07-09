import { NextResponse } from 'next/server';
import { computeSalary } from '@/lib/deductions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = computeSalary({
      basic_salary: body.basic_salary || 0,
      allowances: body.allowances || 0,
      deductions: body.deductions || 0,
      overtime: body.overtime || 0,
      bonuses: body.bonuses || 0,
      insurance_premium: body.insurance_premium || 0,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

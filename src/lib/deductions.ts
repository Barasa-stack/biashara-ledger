import {
  PAYE_BRACKETS,
  PERSONAL_RELIEF,
  INSURANCE_RELIEF_RATE,
  INSURANCE_RELIEF_MAX_MONTHLY,
  NSSF_RATE,
  NSSF_LEL,
  NSSF_UEL,
  SHIF_RATE,
  AHL_RATE,
  STANDARD_MONTHLY_HOURS,
  OVERTIME,
} from './payroll/constants';

/**
 * Calculate PAYE (income tax) using progressive bands.
 */
export function calculatePAYE(grossPay: number, insurancePremium = 0): number {
  let tax = 0;
  let remaining = grossPay;
  for (const bracket of PAYE_BRACKETS) {
    const bracketSize = bracket.to - bracket.from;
    const taxable = Math.min(remaining, Math.max(0, bracketSize));
    if (taxable <= 0) break;
    tax += taxable * bracket.rate;
    remaining -= taxable;
  }
  const relief =
    PERSONAL_RELIEF +
    Math.min(insurancePremium * INSURANCE_RELIEF_RATE, INSURANCE_RELIEF_MAX_MONTHLY);
  return Math.max(0, tax - relief);
}

export interface NSSFBreakdown {
  employee: number;
  employer: number;
  tier1_employee: number;
  tier1_employer: number;
  tier2_employee: number;
  tier2_employer: number;
}

/**
 * NSSF: Tier I (first KSh 9,000) + Tier II (KSh 9,001–108,000), each at 6%.
 * Per NSSF Act 2013, Third Schedule (Phase 4, effective Feb 2026).
 */
export function calculateNSSF(grossPay: number): NSSFBreakdown {
  if (grossPay <= 0) {
    return { employee: 0, employer: 0, tier1_employee: 0, tier1_employer: 0, tier2_employee: 0, tier2_employer: 0 };
  }

  // Tier I: first KSh 9,000
  const tier1Pensionable = Math.min(grossPay, NSSF_LEL);
  const tier1Employee = tier1Pensionable * NSSF_RATE;
  const tier1Employer = tier1Pensionable * NSSF_RATE;

  // Tier II: KSh 9,001 up to KSh 108,000
  const tier2Pensionable = Math.max(0, Math.min(grossPay - NSSF_LEL, NSSF_UEL - NSSF_LEL));
  const tier2Employee = tier2Pensionable * NSSF_RATE;
  const tier2Employer = tier2Pensionable * NSSF_RATE;

  return {
    employee: tier1Employee + tier2Employee,
    employer: tier1Employer + tier2Employer,
    tier1_employee: tier1Employee,
    tier1_employer: tier1Employer,
    tier2_employee: tier2Employee,
    tier2_employer: tier2Employer,
  };
}

/**
 * SHIF (Social Health Insurance Fund): 2.75% of gross salary.
 */
export function calculateSHIF(grossPay: number): number {
  return grossPay * SHIF_RATE;
}

/**
 * AHL (Affordable Housing Levy): 1.5% of gross salary.
 */
export function calculateAHL(grossPay: number): number {
  return grossPay * AHL_RATE;
}

/**
 * Convert monthly salary to hourly rate (÷225).
 */
export function hourlyRate(monthlySalary: number): number {
  return monthlySalary / STANDARD_MONTHLY_HOURS;
}

/**
 * Calculate overtime pay.
 * @param hours     Number of overtime hours worked
 * @param hourly    Hourly rate (monthly salary ÷ 225)
 * @param type      'weekday' (1.5×) or 'rest_day' (2.0×)
 */
export function calculateOvertimePay(
  hours: number,
  hourly: number,
  type: 'weekday' | 'rest_day' = 'weekday',
): number {
  const multiplier = type === 'rest_day' ? OVERTIME.REST_DAY : OVERTIME.WEEKDAY;
  return hours * hourly * multiplier;
}

export interface DeductionBreakdown {
  basic_salary: number;
  allowances: number;
  bonuses: number;
  overtime: number;
  overtime_hours: number;
  overtime_type: 'weekday' | 'rest_day' | 'none';
  gross_pay: number;
  nssf_employee: number;
  nssf_tier1_employee: number;
  nssf_tier2_employee: number;
  employer_nssf: number;
  employer_nssf_tier1: number;
  employer_nssf_tier2: number;
  nhif: number;
  shif: number;
  ahl: number;
  paye: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  employer_ahl: number;
  hourly_rate: number;
}

export function computeSalary(params: {
  basic_salary: number;
  allowances?: number;
  deductions?: number;
  overtime?: number;
  overtime_hours?: number;
  overtime_type?: 'weekday' | 'rest_day' | 'none';
  bonuses?: number;
  insurance_premium?: number;
}): DeductionBreakdown {
  const basic_salary = params.basic_salary || 0;
  const allowances = params.allowances || 0;
  const bonuses = params.bonuses || 0;
  const other_deductions = params.deductions || 0;
  const otHours = params.overtime_hours || 0;
  const otType = params.overtime_type || 'none';

  // Compute hourly rate
  const hRate = hourlyRate(basic_salary);

  // Compute overtime pay from hours if overtime not explicitly given
  const overtime =
    params.overtime ??
    (otHours > 0 ? calculateOvertimePay(otHours, hRate, otType === 'rest_day' ? 'rest_day' : 'weekday') : 0);

  const gross_pay = basic_salary + allowances + bonuses + overtime;

  const nssf = calculateNSSF(gross_pay);
  const shifVal = calculateSHIF(gross_pay);
  const ahlVal = calculateAHL(gross_pay);
  const paye = calculatePAYE(gross_pay, params.insurance_premium || 0);

  const total_deductions = nssf.employee + shifVal + ahlVal + paye + other_deductions;
  const net_pay = Math.max(0, gross_pay - total_deductions);

  return {
    basic_salary,
    allowances,
    bonuses,
    overtime,
    overtime_hours: otHours,
    overtime_type: otType,
    gross_pay,
    nssf_employee: nssf.employee,
    nssf_tier1_employee: nssf.tier1_employee,
    nssf_tier2_employee: nssf.tier2_employee,
    employer_nssf: nssf.employer,
    employer_nssf_tier1: nssf.tier1_employer,
    employer_nssf_tier2: nssf.tier2_employer,
    nhif: shifVal,
    shif: shifVal,
    ahl: ahlVal,
    paye,
    other_deductions,
    total_deductions,
    net_pay,
    employer_ahl: ahlVal,
    hourly_rate: hRate,
  };
}

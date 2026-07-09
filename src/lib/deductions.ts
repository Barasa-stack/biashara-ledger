const PAYE_BRACKETS = [
  { from: 0, to: 24000, rate: 0.10 },
  { from: 24000, to: 32333, rate: 0.25 },
  { from: 32333, to: Infinity, rate: 0.30 },
];

const PERSONAL_RELIEF = 2400;
const INSURANCE_RELIEF_RATE = 0.15;
const INSURANCE_RELIEF_MAX = 5000;

const NSSF_TIER_I_EMPLOYEE = 480;
const NSSF_TIER_I_EMPLOYER = 480;
const NSSF_PENSIONABLE_PAY = 72000;

const NHIF_RATE = 0.0275;

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
  const relief = PERSONAL_RELIEF + Math.min(insurancePremium * INSURANCE_RELIEF_RATE, INSURANCE_RELIEF_MAX);
  return Math.max(0, tax - relief);
}

export function calculateNSSF(grossPay: number): { employee: number; employer: number } {
  if (grossPay <= 0) return { employee: 0, employer: 0 };
  const pensionable = Math.min(grossPay, NSSF_PENSIONABLE_PAY);
  const employee = Math.min(pensionable * 0.06, NSSF_TIER_I_EMPLOYEE);
  const employer = Math.min(pensionable * 0.06, NSSF_TIER_I_EMPLOYER);
  return { employee, employer };
}

export function calculateNHIF(grossPay: number): number {
  return grossPay * NHIF_RATE;
}

export interface DeductionBreakdown {
  basic_salary: number;
  allowances: number;
  bonuses: number;
  overtime: number;
  gross_pay: number;
  nssf_employee: number;
  nhif: number;
  paye: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  employer_nssf: number;
}

export function computeSalary(params: {
  basic_salary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  bonuses: number;
  insurance_premium?: number;
}): DeductionBreakdown {
  const basic_salary = params.basic_salary || 0;
  const allowances = params.allowances || 0;
  const bonuses = params.bonuses || 0;
  const overtime = params.overtime || 0;
  const other_deductions = params.deductions || 0;

  const gross_pay = basic_salary + allowances + bonuses + overtime;
  const nssf = calculateNSSF(gross_pay);
  const nhif = calculateNHIF(gross_pay);
  const paye = calculatePAYE(gross_pay, params.insurance_premium || 0);
  const total_deductions = nssf.employee + nhif + paye + other_deductions;
  const net_pay = Math.max(0, gross_pay - total_deductions);

  return {
    basic_salary,
    allowances,
    bonuses,
    overtime,
    gross_pay,
    nssf_employee: nssf.employee,
    nhif,
    paye,
    other_deductions,
    total_deductions,
    net_pay,
    employer_nssf: nssf.employer,
  };
}

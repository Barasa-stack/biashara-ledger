// ---------------------------------------------------------------------------
// Kenyan Statutory Payroll Constants (2026)
// Based on Kenya Employment Act, KRA, NSSF Act, SHIF Act, & AHL Act
// ---------------------------------------------------------------------------

/** Hours per month used for hourly rate conversion (per Employment Act) */
export const STANDARD_MONTHLY_HOURS = 225;

/** Maximum total hours (normal + overtime) in a 2-week period */
export const MAX_FORTNIGHT_HOURS = 116;

/** Standard working hours per day */
export const STANDARD_DAILY_HOURS = 8;

/** Overtime multipliers */
export const OVERTIME = {
  WEEKDAY: 1.5,       // 1.5× for weekday overtime
  REST_DAY: 2.0,      // 2.0× for rest day / public holiday
} as const;

// ---------------------------------------------------------------------------
// PAYE (Pay As You Earn) — Progressive Tax Bands (2026)
// Source: KRA
// ---------------------------------------------------------------------------
export type PAYEBracket = { from: number; to: number; rate: number };

export const PAYE_BRACKETS: PAYEBracket[] = [
  { from: 0,       to: 24_000,   rate: 0.10 },
  { from: 24_001,  to: 32_333,   rate: 0.25 },
  { from: 32_334,  to: 500_000,  rate: 0.30 },
  { from: 500_001, to: 800_000,  rate: 0.325 },
  { from: 800_001, to: Infinity, rate: 0.35 },
];

/** Monthly personal relief */
export const PERSONAL_RELIEF = 2_400;

/**
 * Insurance relief: 15% of premium paid, capped per month.
 * Annual cap is KSh 60,000 → monthly cap is KSh 5,000.
 */
export const INSURANCE_RELIEF_RATE = 0.15;
export const INSURANCE_RELIEF_MAX_MONTHLY = 5_000;

// ---------------------------------------------------------------------------
// NSSF (National Social Security Fund) — Tier I & Tier II (Phase 4, Feb 2026)
// Source: NSSF Act 2013, Third Schedule
// ---------------------------------------------------------------------------
/** NSSF contribution rate (both employee & employer) */
export const NSSF_RATE = 0.06;

/**
 * Lower Earnings Limit (Tier I ceiling)
 * First KSh 9,000 → 6% → max KSh 540 per side
 */
export const NSSF_LEL = 9_000;

/**
 * Upper Earnings Limit (ceiling for combined Tier I + Tier II)
 * KSh 9,001 – 108,000 → 6% → max KSh 5,940 per side (Tier II)
 * Combined max per side: KSh 540 + KSh 5,940 = KSh 6,480
 * Combined max total: KSh 12,960
 */
export const NSSF_UEL = 108_000;

/**
 * Maximum NSSF contribution per side (employee OR employer) per month.
 * 6% × KSh 108,000 = KSh 6,480
 */
export const NSSF_MAX_CONTRIBUTION = NSSF_UEL * NSSF_RATE; // 6,480

// ---------------------------------------------------------------------------
// SHIF (Social Health Insurance Fund) — replaced NHIF July 2024+
// ---------------------------------------------------------------------------
/** SHIF rate: 2.75% of gross salary */
export const SHIF_RATE = 0.0275;

// ---------------------------------------------------------------------------
// AHL (Affordable Housing Levy)
// ---------------------------------------------------------------------------
/** AHL rate: 1.5% of gross salary (employer matches) */
export const AHL_RATE = 0.015;

// ---------------------------------------------------------------------------
// Compliance Deadlines
// ---------------------------------------------------------------------------
export const COMPLIANCE = {
  /** PAYE & statutory deductions due by 9th of following month */
  PAYE_DUE_DAY: 9,
  /** Late payment penalty rate */
  LATE_PENALTY_RATE: 0.25,
  /** Monthly interest on late amounts */
  LATE_INTEREST_MONTHLY: 0.02,
} as const;

// ---------------------------------------------------------------------------
// Employment Types & Standard Hours
// ---------------------------------------------------------------------------
export const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'contract',
  'intern',
  'casual',
] as const;

export const DEFAULT_CONTRACT_HOURS = 168; // 40 hrs/week × 4.2 weeks

// ---------------------------------------------------------------------------
// Leave Entitlements (Kenya Employment Act)
// ---------------------------------------------------------------------------
export const LEAVE = {
  /** Annual leave: 21 working days */
  ANNUAL_DAYS: 21,
  /** Sick leave: 30 days per year (with medical cert) */
  SICK_DAYS: 30,
  /** Maternity leave: 3 months */
  MATERNITY_WEEKS: 12,
  /** Paternity leave: 2 weeks */
  PATERNITY_WEEKS: 2,
} as const;

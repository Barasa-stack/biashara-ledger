/**
 * Multi-currency helpers for reports.
 * All transaction tables have `currency` (TEXT DEFAULT 'KES') and
 * `exchange_rate` (REAL DEFAULT 1) columns.
 *
 * Convention: `amount` stores the transaction's own currency value.
 * To convert to KES (base): amount * COALESCE(exchange_rate, 1)
 */

/** SQL snippet to convert a monetary field to base currency (KES). */
export function convert(field: string, alias?: string): string {
  const prefix = alias ? `${alias}.` : '';
  return `COALESCE(${field}, 0) * COALESCE(${prefix}exchange_rate, 1)`;
}

/** SQL snippet for combined current + prior period aggregation. */
export function periodSum(
  field: string,
  currentStart: number,
  currentEnd: number,
  priorStart: number,
  priorEnd: number,
  dateCol: string = 'issue_date',
): { current: string; prior: string; fullWhere: string } {
  const expr = convert(field);
  return {
    current: `COALESCE(SUM(CASE WHEN ${dateCol} BETWEEN $${currentStart} AND $${currentEnd} THEN ${expr} ELSE 0 END), 0)`,
    prior: `COALESCE(SUM(CASE WHEN ${dateCol} BETWEEN $${priorStart} AND $${priorEnd} THEN ${expr} ELSE 0 END), 0)`,
    fullWhere: `${dateCol} BETWEEN $${priorStart} AND $${currentEnd}`,
  };
}

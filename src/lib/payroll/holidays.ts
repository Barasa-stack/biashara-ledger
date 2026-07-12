// ---------------------------------------------------------------------------
// Kenyan Public Holidays (Gazetted)
// Fixed-date holidays + dynamic Good Monday/Easter
// Source: Kenya Gazette, Employment Act Section 31
// ---------------------------------------------------------------------------

function getEaster(year: number): { goodFriday: Date; easterMonday: Date } {
  // Computus — Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  return { goodFriday, easterMonday };
}

function fixed(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

export type Holiday = { name: string; date: Date; isFixed: boolean };

/**
 * Returns all Kenyan public holidays for a given year.
 * Section 31, Employment Act 2007 — employee entitled to day off with full pay.
 * If required to work: 2× daily rate.
 */
export function getKenyanHolidays(year: number): Holiday[] {
  const easter = getEaster(year);
  const holidays: Holiday[] = [
    { name: 'New Year\'s Day', date: fixed(year, 1, 1), isFixed: true },
    { name: 'Good Friday', date: easter.goodFriday, isFixed: false },
    { name: 'Easter Monday', date: easter.easterMonday, isFixed: false },
    { name: 'Labour Day', date: fixed(year, 5, 1), isFixed: true },
    { name: 'Madaraka Day', date: fixed(year, 6, 1), isFixed: true },
    { name: 'Eid al-Fitr', date: fixed(year, 3, 31), isFixed: true }, // approximate — varies with moon sighting
    { name: 'Eid al-Adha', date: fixed(year, 6, 7), isFixed: true },  // approximate
    { name: 'Mashujaa Day', date: fixed(year, 10, 20), isFixed: true },
    { name: 'Jamhuri Day', date: fixed(year, 12, 12), isFixed: true },
    { name: 'Christmas Day', date: fixed(year, 12, 25), isFixed: true },
    { name: 'Boxing Day', date: fixed(year, 12, 26), isFixed: true },
  ];
  return holidays;
}

/**
 * Check if a date falls on a Kenyan public holiday.
 */
export function isPublicHoliday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const holidays = getKenyanHolidays(year);
  return holidays.some(h =>
    h.date.getFullYear() === d.getFullYear() &&
    h.date.getMonth() === d.getMonth() &&
    h.date.getDate() === d.getDate()
  );
}

/**
 * Get the name of the holiday if the date is a public holiday.
 */
export function getHolidayName(date: Date | string): string | null {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const holidays = getKenyanHolidays(year);
  const match = holidays.find(h =>
    h.date.getFullYear() === d.getFullYear() &&
    h.date.getMonth() === d.getMonth() &&
    h.date.getDate() === d.getDate()
  );
  return match?.name ?? null;
}

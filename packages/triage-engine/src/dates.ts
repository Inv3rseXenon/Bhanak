/** Calendar-date arithmetic without the Date constructor: deterministic and timezone-free. */

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;
const MS_PER_MINUTE = 60_000;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/** Days since 1970-01-01 for a proleptic Gregorian civil date (H. Hinnant's algorithm). */
function daysFromCivil(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = (month + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146_097 + doe - 719_468;
}

/** Day number of a strict `YYYY-MM-DD` string, or undefined for anything else (incl. 2026-02-30). */
export function parseDayNumber(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const match = DATE_PATTERN.exec(value);
  if (match === null) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const monthDays = (DAYS_IN_MONTH[month - 1] ?? 0) + (month === 2 && isLeapYear(year) ? 1 : 0);
  if (month < 1 || month > 12 || day < 1 || day > monthDays) return undefined;
  return daysFromCivil(year, month, day);
}

/** The user's local calendar day number at `now`, or undefined if `now` is not a valid time. */
export function localDayNumber(now: Date, utcOffsetMinutes: number): number | undefined {
  const ms = now.getTime();
  if (!Number.isFinite(ms)) return undefined;
  return Math.floor((ms + utcOffsetMinutes * MS_PER_MINUTE) / MS_PER_DAY);
}

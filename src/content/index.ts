import readingsJson from '../../content/readings.json';
import examenJson from '../../content/examen.json';
import { Period } from '../theme';

export type { Period };

export type Reading = {
  id: string;
  month: number;
  day: number;
  period: Period;
  ref: string;
  verse: string;
  verseSource: 'WEB' | 'KJV';
  title: string;
  body: string;
  prayer: string;
};

export type ExamenSet = { id: number; questions: string[] };

/** 366 mornings + 366 evenings from Spurgeon's "Morning and Evening" (1865, public domain). */
export const READINGS = readingsJson as Reading[];
export const EXAMEN_SETS = examenJson as ExamenSet[];

const byId = new Map<string, Reading>(READINGS.map((r) => [r.id, r]));

export const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const TOTAL_DAYS = 366;

const pad = (n: number) => String(n).padStart(2, '0');

export function readingId(month: number, day: number, period: Period): string {
  return `${pad(month)}-${pad(day)}-${period === 'morning' ? 'm' : 'e'}`;
}

export function getReading(month: number, day: number, period: Period): Reading {
  const r = byId.get(readingId(month, day, period));
  if (r) return r;
  // Should never happen (the year is complete); fall back to Jan 1 rather than crash.
  return byId.get(readingId(1, 1, period)) as Reading;
}

export function getReadingById(id: string): Reading | undefined {
  return byId.get(id);
}

/** Index 0..365 in a leap-year calendar (Feb 29 always exists in the book). */
export function dayOfYear(month: number, day: number): number {
  let n = 0;
  for (let m = 1; m < month; m++) n += MONTH_DAYS[m - 1];
  return n + day - 1;
}

export function fromDayOfYear(index: number): { month: number; day: number } {
  let i = Math.max(0, Math.min(TOTAL_DAYS - 1, index));
  for (let m = 1; m <= 12; m++) {
    if (i < MONTH_DAYS[m - 1]) return { month: m, day: i + 1 };
    i -= MONTH_DAYS[m - 1];
  }
  return { month: 12, day: 31 };
}

/** Which examen set to use on a given calendar day: rotates through the 12 sets. */
export function examenSetFor(month: number, day: number): ExamenSet {
  return EXAMEN_SETS[dayOfYear(month, day) % EXAMEN_SETS.length];
}

export function dateLabel(month: number, day: number): string {
  return `${MONTH_NAMES[month - 1]} ${day}`;
}

export function periodLabel(period: Period): string {
  return period === 'morning' ? 'Morning' : 'Evening';
}

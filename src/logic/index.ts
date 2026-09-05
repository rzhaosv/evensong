import { AppState } from './types';
import { Period } from '../theme';
import { readingId, Reading } from '../content';

export * from './types';

/** The evening reading takes over at 3pm local time. */
export const EVENING_HOUR = 15;

/** YYYY-MM-DD in local time. */
export function dateKey(t: number | Date = Date.now()): string {
  const d = typeof t === 'number' ? new Date(t) : t;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysKey(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + n));
}

export function todayParts(now: number | Date = Date.now()): { month: number; day: number } {
  const d = typeof now === 'number' ? new Date(now) : now;
  return { month: d.getMonth() + 1, day: d.getDate() };
}

export function periodNow(now: number | Date = Date.now()): Period {
  const d = typeof now === 'number' ? new Date(now) : now;
  return d.getHours() < EVENING_HOUR ? 'morning' : 'evening';
}

export function isToday(month: number, day: number, now: number | Date = Date.now()): boolean {
  const t = todayParts(now);
  return t.month === month && t.day === day;
}

/** Month/day is strictly after today's month/day (same calendar year view). */
export function isFuture(month: number, day: number, now: number | Date = Date.now()): boolean {
  const t = todayParts(now);
  return month > t.month || (month === t.month && day > t.day);
}

/**
 * Free tier: today's morning reading only. Pro: everything.
 */
export function canOpen(reading: Pick<Reading, 'month' | 'day' | 'period'>, isPro: boolean, now: number | Date = Date.now()): boolean {
  if (isPro) return true;
  return reading.period === 'morning' && isToday(reading.month, reading.day, now);
}

/** Whether a calendar day can be opened from the Year grid. Free users can open today only. */
export function canOpenDay(month: number, day: number, isPro: boolean, now: number | Date = Date.now()): boolean {
  return isPro || isToday(month, day, now);
}

export function isRead(state: AppState, id: string): boolean {
  return !!state.readIds[id];
}

export type DayReadState = 0 | 1 | 2;

/** 0 = nothing read, 1 = one of the two, 2 = both. */
export function dayRead(state: AppState, month: number, day: number): DayReadState {
  const m = state.readIds[readingId(month, day, 'morning')] ? 1 : 0;
  const e = state.readIds[readingId(month, day, 'evening')] ? 1 : 0;
  return (m + e) as DayReadState;
}

export function readCount(state: AppState): number {
  return Object.keys(state.readIds).length;
}

/** Consecutive calendar days (by the date a reading was marked read) ending today or yesterday. */
export function streak(readIds: Record<string, string>, now = Date.now()): number {
  const days = new Set(Object.values(readIds).map((iso) => dateKey(new Date(iso))));
  if (days.size === 0) return 0;
  let key = dateKey(now);
  if (!days.has(key)) {
    key = addDaysKey(key, -1);
    if (!days.has(key)) return 0;
  }
  let n = 0;
  while (days.has(key)) {
    n++;
    key = addDaysKey(key, -1);
  }
  return n;
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function parseTime(hhmm: string, fallbackHour = 7): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { hour: Number.isFinite(h) ? h : fallbackHour, minute: Number.isFinite(m) ? m : 0 };
}

export function greeting(name: string, period: Period): string {
  const g = period === 'morning' ? 'Good morning' : 'Good evening';
  return name ? `${g}, ${name}` : g;
}

/** Format a "YYYY-MM-DD" key as "Thursday, September 4". */
export function formatDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dt.getDay()];
  const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1];
  return `${weekday}, ${month} ${d}`;
}

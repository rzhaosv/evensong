/**
 * Web-only demo seeding for App Store screenshots.
 *
 * When the app runs on web with `?demo=<name>` in the URL, a canned AppState is written to
 * localStorage under the AsyncStorage key *before* AppContext hydrates, and `demo.screen` /
 * `demo.tab` / `demo.period` tell App.tsx which screen to open. Every demo runs as Pro except
 * `paywall`. Billing returns canned packages on web when a demo is set.
 *
 * Everything is guarded by `Platform.OS === 'web'`; on iOS/Android `demo` is always `null`.
 */
import { Platform } from 'react-native';
import { AppState, DEFAULT_STATE } from '../logic/types';
import { RootStackParamList, TabParamList } from '../navigation';
import { Period } from '../theme';
import { readingId } from '../content';
import { dateKey } from '../logic';

const STORAGE_KEY = 'evensong.state.v1';

export type DemoName = 'today' | 'evening' | 'examen' | 'journal' | 'year' | 'paywall' | 'onboard';
const VALID: DemoName[] = ['today', 'evening', 'examen', 'journal', 'year', 'paywall', 'onboard'];

export type Demo = {
  name: DemoName;
  screen: keyof RootStackParamList | null;
  tab: keyof TabParamList;
  /** Forces the Today card regardless of the local clock. */
  period: Period | null;
  pro: boolean;
  onboardStep: number;
  snap: boolean;
};

const DAY_MS = 86_400_000;

/** Mark the last `n` days (ending yesterday) as read, morning and evening. */
function readHistory(n: number, now: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = n; i >= 1; i--) {
    const d = new Date(now - i * DAY_MS);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const am = new Date(d);
    am.setHours(7, 20, 0, 0);
    const pm = new Date(d);
    pm.setHours(21, 15, 0, 0);
    out[readingId(m, day, 'morning')] = am.toISOString();
    if (i % 5 !== 0) out[readingId(m, day, 'evening')] = pm.toISOString();
  }
  return out;
}

function examenHistory(now: number): AppState['examen'] {
  const entries: AppState['examen'] = {};
  const samples: [number, [string, string, string]][] = [
    [1, ['The walk home after dinner, when the light went gold over the rooftops.', 'I answered Maya too quickly and did not really listen.', 'Text Dad back before I open email.']],
    [2, ['Coffee with Ruth. She remembered the thing I told her last month.', 'Scrolled for an hour I said I would spend reading.', 'Leave the phone in the kitchen tonight.']],
    [4, ['A whole hour of quiet at lunch. Rain on the window.', 'Snapped at the delivery driver for something that was not his fault.', 'Say the honest thing to Sam about the deadline.']],
    [6, ['Finished the report I have been dreading. It was not as bad as I feared.', 'Kept score in my head about who has done more dishes this week.', 'Do the dishes without saying anything.']],
  ];
  for (const [daysAgo, answers] of samples) {
    const d = new Date(now - daysAgo * DAY_MS);
    d.setHours(21, 40, 0, 0);
    entries[dateKey(d)] = { set: (daysAgo * 3) % 12, answers, at: d.toISOString() };
  }
  return entries;
}

function base(now: number, extra: Partial<AppState> = {}): AppState {
  const readIds = readHistory(23, now);
  return {
    ...DEFAULT_STATE,
    onboarded: true,
    name: 'Anna',
    morningTime: '07:00',
    eveningTime: '21:00',
    remindersEnabled: true,
    readIds,
    bookmarks: ['01-01-m', '03-15-m', '05-01-e', '07-04-e'],
    examen: examenHistory(now),
    textSize: 'medium',
    longestStreak: 23,
    ...extra,
  };
}

function buildState(name: DemoName, now: number): AppState | null {
  switch (name) {
    case 'onboard':
      return null;
    case 'today': {
      const s = base(now);
      // Today's morning already read so the lamp shows lit in the capture.
      const t = new Date(now);
      s.readIds[readingId(t.getMonth() + 1, t.getDate(), 'morning')] = new Date(now - 3_600_000).toISOString();
      return s;
    }
    case 'evening':
    case 'examen':
    case 'journal':
    case 'year':
      return base(now);
    case 'paywall':
      return base(now, { readIds: {}, bookmarks: [], examen: {}, longestStreak: 0 });
  }
}

function screenFor(name: DemoName): { screen: keyof RootStackParamList | null; tab: keyof TabParamList; period: Period | null } {
  switch (name) {
    case 'today':
      return { screen: 'Tabs', tab: 'Today', period: 'morning' };
    case 'evening':
      return { screen: 'Tabs', tab: 'Today', period: 'evening' };
    case 'examen':
      return { screen: 'Examen', tab: 'Today', period: 'evening' };
    case 'journal':
      return { screen: 'Tabs', tab: 'Journal', period: null };
    case 'year':
      return { screen: 'Tabs', tab: 'Year', period: null };
    case 'paywall':
      return { screen: 'Paywall', tab: 'Today', period: null };
    case 'onboard':
      return { screen: null, tab: 'Today', period: null };
  }
}

function read(): Demo | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined' || !window.location || !window.localStorage) return null;
  const params = new URLSearchParams(window.location.search);
  const name = params.get('demo') as DemoName | null;
  if (!name || !VALID.includes(name)) return null;
  const now = Date.now();
  const state = buildState(name, now);
  try {
    if (state) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  const { screen, tab, period } = screenFor(name);
  return {
    name,
    screen,
    tab,
    period,
    pro: name !== 'paywall',
    onboardStep: name === 'onboard' ? Number(params.get('step') ?? 0) : 0,
    snap: params.get('snap') === '1',
  };
}

/** Null everywhere except web with `?demo=`. Evaluated once at module load, before hydration. */
export const demo: Demo | null = read();

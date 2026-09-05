import { TextSize } from '../theme';

export type ExamenEntry = {
  /** Which of the 12 question sets was used. */
  set: number;
  answers: [string, string, string];
  /** ISO timestamp of the last save. */
  at: string;
};

export type AppState = {
  onboarded: boolean;
  name: string;
  /** "HH:MM" 24h. */
  morningTime: string;
  eveningTime: string;
  remindersEnabled: boolean;
  /** reading id ("01-01-m") -> ISO date it was marked read. */
  readIds: Record<string, string>;
  /** Reading ids, most recent last. */
  bookmarks: string[];
  /** "YYYY-MM-DD" -> examen. */
  examen: Record<string, ExamenEntry>;
  textSize: TextSize;
  longestStreak: number;
};

export const DEFAULT_STATE: AppState = {
  onboarded: false,
  name: '',
  morningTime: '07:00',
  eveningTime: '21:00',
  remindersEnabled: false,
  readIds: {},
  bookmarks: [],
  examen: {},
  textSize: 'medium',
  longestStreak: 0,
};

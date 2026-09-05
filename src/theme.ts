import { Platform, TextStyle } from 'react-native';

/** Warm parchment by day; deep navy with candle gold for evening cards. */
export const colors = {
  bg: '#F6F1E7',
  surface: '#FFFBF3',
  surface2: '#EEE6D6',
  ink: '#2B2622',
  text: '#2B2622',
  soft: '#4F463E',
  muted: '#7A6F63',
  accent: '#B8742A',
  accentSoft: '#F1E2C8',
  line: 'rgba(43,38,34,0.10)',
  lineStrong: 'rgba(43,38,34,0.22)',
  navy: '#1C2233',
  navy2: '#262E44',
  navyLine: 'rgba(244,238,223,0.12)',
  gold: '#E6B655',
  goldSoft: 'rgba(230,182,85,0.18)',
  onAccent: '#FFF8EC',
  onNavy: '#F4EEDF',
  onNavyMuted: '#A9A79C',
  danger: '#B33A3A',
  overlay: 'rgba(43,38,34,0.45)',
};

export type Period = 'morning' | 'evening';

/** Colours that flip between the morning (parchment) and evening (navy) reading cards. */
export type Palette = {
  bg: string;
  card: string;
  text: string;
  soft: string;
  muted: string;
  accent: string;
  accentSoft: string;
  line: string;
  onAccent: string;
};

export const palettes: Record<Period, Palette> = {
  morning: {
    bg: colors.bg,
    card: colors.surface,
    text: colors.ink,
    soft: colors.soft,
    muted: colors.muted,
    accent: colors.accent,
    accentSoft: colors.accentSoft,
    line: colors.line,
    onAccent: colors.onAccent,
  },
  evening: {
    bg: colors.navy,
    card: colors.navy2,
    text: colors.onNavy,
    soft: '#D9D3C3',
    muted: colors.onNavyMuted,
    accent: colors.gold,
    accentSoft: colors.goldSoft,
    line: colors.navyLine,
    onAccent: colors.navy,
  },
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };

export const space = (n: number) => n * 4;

/** System serif; no font packages. iOS ships Georgia and Iowan Old Style, web falls back through the stack. */
export const serif = Platform.select({
  ios: 'Georgia',
  web: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
  default: 'serif',
}) as string;

export type TextSize = 'small' | 'medium' | 'large';
export const TEXT_SCALE: Record<TextSize, number> = { small: 0.92, medium: 1, large: 1.15 };

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const type: Record<string, TextStyle> = {
  display: { fontSize: 32, fontWeight: '700', color: colors.ink, letterSpacing: -0.4, fontFamily: serif },
  h1: { fontSize: 26, fontWeight: '700', color: colors.ink, letterSpacing: -0.3, fontFamily: serif },
  h2: { fontSize: 21, fontWeight: '700', color: colors.ink, letterSpacing: -0.2, fontFamily: serif },
  h3: { fontSize: 17, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, fontWeight: '400', color: colors.ink, lineHeight: 24 },
  bodySoft: { fontSize: 15, fontWeight: '400', color: colors.soft, lineHeight: 22 },
  verse: { fontSize: 24, fontWeight: '400', color: colors.ink, lineHeight: 36, fontFamily: serif, fontStyle: 'italic' },
  reading: { fontSize: 18, fontWeight: '400', color: colors.ink, lineHeight: 31, fontFamily: serif },
  prayer: { fontSize: 18, fontWeight: '400', color: colors.ink, lineHeight: 29, fontFamily: serif, fontStyle: 'italic' },
  eyebrow: { fontSize: 12, fontWeight: '700', color: colors.accent, letterSpacing: 1.6, textTransform: 'uppercase' },
  label: { fontSize: 12, fontWeight: '700', color: colors.accent, letterSpacing: 1.4, textTransform: 'uppercase' },
  sub: { fontSize: 13, fontWeight: '500', color: colors.soft },
  caption: { fontSize: 12, fontWeight: '500', color: colors.muted },
  num: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8, ...tabular },
};

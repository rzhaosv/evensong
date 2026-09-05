# Evensong: Daily Devotional

Evensong is a warm, classic Christian devotional for iOS: two readings a day for a whole year. Each morning and
evening pairs a verse with Charles Spurgeon's "Morning and Evening" (1865) and a one-line prayer; each evening ends
with a three-question examen (gratitude, where I fell short, one thing for tomorrow) saved to a journal. A small oil
lamp on the reading card fills as you scroll and lights when the reading is done. No login, no network traffic except
RevenueCat.

## Content and sources

- **Readings**: `content/readings.json`, 732 entries (366 mornings + 366 evenings, including February 29), built by
  `scripts/build_content.py` from the CCEL XML edition of Spurgeon's *Morning and Evening* (public domain). Each entry:
  `{ id, month, day, period, ref, verse, verseSource, title, body, prayer }`.
  - `body` is Spurgeon's text with a light modernization pass (thee/thou/thy/thine/ye, hath/doth/saith, `-eth` and
    `thou …-est` verb endings, shew → show); everything else is verbatim.
  - `verse` is quoted from the **World English Bible** (public domain, eBible.org USFM edition). One reading
    (Aug 25 evening, Acts 8:37) uses the KJV text Spurgeon quoted because the WEB omits that verse; `verseSource` says
    which.
  - `title` is derived from the first sentence of the reading; `prayer` is a one-sentence prompt chosen by the
    reading's dominant theme (13 morning/evening pairs), not hand-written per reading.
- **Examen**: `content/examen.json`, 12 original sets of three questions, rotated by day of year.

Rebuild after changing the script (downloads are cached in `scripts/.cache/`):

```sh
python3 scripts/build_content.py
```

## Screens

| screen | file | notes |
| --- | --- | --- |
| Onboarding | `src/screens/OnboardingScreen.tsx` | 3 steps: welcome; morning (07:00) and evening (21:00) reminder times, notification permission asked on Begin; optional name. Ends on the Paywall. |
| Paywall | `src/screens/PaywallScreen.tsx` | Navy card, `$rc_annual` (best value) and `$rc_monthly`, both with a 7-day trial; Restore, Terms, Privacy, auto-renew disclosure; "Continue with today's morning reading" free path. |
| Today (tab) | `src/screens/TodayScreen.tsx` | Morning card until 3pm local, evening card after; Morning/Evening toggle; greeting + streak. |
| Reading view | `src/components/ReadingView.tsx` | Eyebrow "Morning · January 1", title, verse in large serif, body in serif, prayer, Lamp filling with scroll, Mark as read, Bookmark, evening examen button. Locked readings show a two-sentence teaser and a Pro card. |
| Reading (any day) | `src/screens/ReadingScreen.tsx` | Same view for a day picked from the Year grid or a bookmark. |
| Evening examen | `src/screens/ExamenScreen.tsx` | Three questions with multiline inputs, saved to `examen[YYYY-MM-DD]`. Free. |
| Journal (tab) | `src/screens/JournalScreen.tsx` | Past examens (newest first) and bookmarked readings. Free users see today's entry only. |
| Year (tab) | `src/screens/YearScreen.tsx` | 366 dots by month (half = one reading, full = both, ring = today) plus stats; tap opens the day (Pro beyond today). |
| Settings (tab) | `src/screens/SettingsScreen.tsx` | Name, text size (Pro), reminders toggle + morning/evening times (evening time Pro), Restore, Manage subscription, Privacy/Terms/Support, About the readings (public-domain note), Reset. |

## Free vs Pro

Free: today's morning reading, the evening examen, today's journal entry, the morning reminder.
Pro (RevenueCat entitlement `pro`, packages `$rc_annual` and `$rc_monthly` from `offerings.current`): evening
readings, the full year archive, journal history, bookmarks, text size, the evening reminder.
`EXPO_PUBLIC_DEV_UNLOCK=1` unlocks everything locally.

## State model

Persisted as JSON in AsyncStorage under `evensong.state.v1` (`src/store/AppContext.tsx`, types in
`src/logic/types.ts`): `onboarded`, `name`, `morningTime`, `eveningTime` ("HH:MM"), `remindersEnabled`,
`readIds {id: isoDate}`, `bookmarks[]`, `examen {date: {set, answers[3], at}}`, `textSize`, `longestStreak`.

Helpers in `src/logic/index.ts`: `periodNow` (evening from 15:00), `canOpen`, `canOpenDay`, `dayRead`, `streak`,
`formatTime`; content helpers in `src/content/index.ts`: `getReading(month, day, period)`, `readingId`, `dayOfYear`,
`examenSetFor`.

## Notifications

`src/services/notifications.ts` schedules two daily local notifications (`morning-reading`, `evening-reading`) at the
chosen times; the evening one is only scheduled for Pro. The module is imported lazily behind a `Platform` check so the
web bundle never loads it.

## Demo hook (web only)

`src/dev/demo.ts` seeds localStorage before hydration when the web build is opened with `?demo=<name>`:
`today` (morning card, already read), `evening`, `examen`, `journal`, `year`, `paywall`, `onboard` (`&step=1`,
`&step=2`). Every demo runs as Pro except `paywall`; billing returns canned packages ($39.99/yr, $7.99/mo) on web when
a demo is set. Add `&snap=1` to freeze the lamp flicker. On iOS/Android `demo` is always `null`.

## Environment variables

| var | purpose |
| --- | --- |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat public iOS SDK key. Without it billing is a no-op and the app runs in free mode. |
| `EXPO_PUBLIC_DEV_UNLOCK` | `1` / `true` unlocks Pro locally. |

## Development

```sh
npm install
npx tsc --noEmit
npx expo config --json
CI=1 npx expo start --web --port 8098   # smoke test; curl http://localhost:8098/
npx expo start                          # iOS simulator / device
python3 scripts/make_icons.py           # regenerate assets/*.png (needs Pillow)
eas init && eas build -p ios --profile production
```

Before the first EAS build: run `eas init` (adds `extra.eas.projectId`), set `EXPO_PUBLIC_REVENUECAT_IOS_KEY` and
`submit.production.ios.ascAppId` in `eas.json` (both are `TBD`). Bundle id `com.formaz.evensong`, Expo SDK 57, React
Native 0.86, React 19. Legal pages: `https://tryforma.app/evensong/terms.html` and
`https://tryforma.app/evensong/privacy.html`.

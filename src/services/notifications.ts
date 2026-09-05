import { Platform } from 'react-native';
import { parseTime } from '../logic';

/**
 * Two optional local notifications a day: the morning reading and the evening reading, each at
 * the user's chosen time. expo-notifications is native-only; everything is guarded so the web
 * bundle (used for smoke tests and demo captures) never touches it.
 */

const MORNING_ID = 'morning-reading';
const EVENING_ID = 'evening-reading';

function native() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

async function mod() {
  if (!native()) return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

let handlerSet = false;
export async function setupNotificationHandler() {
  const N = await mod();
  if (!N || handlerSet) return;
  handlerSet = true;
  try {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    /* ignore */
  }
}

/** Ask for permission. Only call when the user explicitly enables reminders. */
export async function requestPermission(): Promise<boolean> {
  const N = await mod();
  if (!N) return false;
  try {
    const cur = await N.getPermissionsAsync();
    if (cur.granted) return true;
    const res = await N.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return res.granted;
  } catch {
    return false;
  }
}

export async function cancelAll() {
  const N = await mod();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
  } catch {
    /* ignore */
  }
}

/**
 * (Re)schedule the daily reminders. Pass `null` for a slot to leave it unscheduled
 * (the evening reading is Pro, so free users only get the morning reminder).
 */
export async function scheduleReminders(morning: string | null, evening: string | null) {
  const N = await mod();
  if (!N) return;
  await cancelAll();
  try {
    if (morning) {
      const { hour, minute } = parseTime(morning, 7);
      await N.scheduleNotificationAsync({
        identifier: MORNING_ID,
        content: {
          title: 'This morning’s reading is ready',
          body: 'A verse, a few minutes with Spurgeon, and a prayer for the day.',
          sound: false,
        },
        trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    }
    if (evening) {
      const { hour, minute } = parseTime(evening, 21);
      await N.scheduleNotificationAsync({
        identifier: EVENING_ID,
        content: {
          title: 'Evensong',
          body: 'The evening reading and three quiet questions before you sleep.',
          sound: false,
        },
        trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    }
  } catch {
    /* best-effort */
  }
}

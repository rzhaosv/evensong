import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, DEFAULT_STATE, ExamenEntry } from '../logic/types';
import { streak } from '../logic';
import { TextSize } from '../theme';
import { configureBilling, getCustomerInfo, isPremium, addPremiumListener } from '../services/billing';
import { scheduleReminders, cancelAll, requestPermission } from '../services/notifications';
import { demo } from '../dev/demo';

export const STORAGE_KEY = 'evensong.state.v1';
const DEV_UNLOCK = process.env.EXPO_PUBLIC_DEV_UNLOCK === '1' || process.env.EXPO_PUBLIC_DEV_UNLOCK === 'true';
const FORCE_PRO = DEV_UNLOCK || !!demo?.pro;

type Ctx = {
  ready: boolean;
  state: AppState;
  isPro: boolean;
  setPro: (v: boolean) => void;
  update: (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;
  completeOnboarding: (setup: Partial<AppState>) => void;
  markRead: (id: string) => void;
  toggleBookmark: (id: string) => void;
  saveExamen: (date: string, entry: ExamenEntry) => void;
  setTextSize: (size: TextSize) => void;
  setReminderTimes: (morning: string, evening: string) => void;
  /** Turns reminders on (asks permission) or off. Resolves to the resulting enabled state. */
  setReminders: (on: boolean) => Promise<boolean>;
  resetAll: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isPro, setIsPro] = useState(FORCE_PRO);
  const stateRef = useRef(state);
  stateRef.current = state;
  const proRef = useRef(isPro);
  proRef.current = isPro;

  // Load persisted state + billing
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState({ ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<AppState>) });
      } catch {
        /* start fresh */
      }
      configureBilling();
      const info = await getCustomerInfo();
      if (isPremium(info)) setIsPro(true);
      unsub = addPremiumListener((pro) => setIsPro(pro || FORCE_PRO));
      setReady(true);
    })();
    return () => unsub();
  }, []);

  // Persist on every change (after initial load)
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  // Keep the scheduled reminders in step with the plan (evening reminder is Pro only).
  const reschedule = useCallback((s: AppState, pro: boolean) => {
    if (!s.remindersEnabled) return;
    scheduleReminders(s.morningTime, pro ? s.eveningTime : null);
  }, []);

  useEffect(() => {
    if (!ready) return;
    reschedule(stateRef.current, isPro);
  }, [isPro, ready, reschedule]);

  const update = useCallback<Ctx['update']>((patch) => {
    setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  const completeOnboarding = useCallback((setup: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...setup, onboarded: true }));
  }, []);

  const markRead = useCallback((id: string) => {
    setState((prev) => {
      if (prev.readIds[id]) return prev;
      const readIds = { ...prev.readIds, [id]: new Date().toISOString() };
      return { ...prev, readIds, longestStreak: Math.max(prev.longestStreak, streak(readIds)) };
    });
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      bookmarks: prev.bookmarks.includes(id) ? prev.bookmarks.filter((b) => b !== id) : [...prev.bookmarks, id],
    }));
  }, []);

  const saveExamen = useCallback((date: string, entry: ExamenEntry) => {
    setState((prev) => ({ ...prev, examen: { ...prev.examen, [date]: entry } }));
  }, []);

  const setTextSize = useCallback((textSize: TextSize) => {
    setState((prev) => ({ ...prev, textSize }));
  }, []);

  const setReminderTimes = useCallback(
    (morningTime: string, eveningTime: string) => {
      setState((prev) => {
        const next = { ...prev, morningTime, eveningTime };
        reschedule(next, proRef.current);
        return next;
      });
    },
    [reschedule],
  );

  const setReminders = useCallback(
    async (on: boolean) => {
      if (on) {
        const ok = await requestPermission();
        if (!ok) return false;
        const next = { ...stateRef.current, remindersEnabled: true };
        reschedule(next, proRef.current);
        setState((prev) => ({ ...prev, remindersEnabled: true }));
        return true;
      }
      await cancelAll();
      setState((prev) => ({ ...prev, remindersEnabled: false }));
      return false;
    },
    [reschedule],
  );

  const resetAll = useCallback(async () => {
    await cancelAll();
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    setState(DEFAULT_STATE);
  }, []);

  return (
    <AppCtx.Provider
      value={{
        ready,
        state,
        isPro,
        setPro: (v) => setIsPro(v || FORCE_PRO),
        update,
        completeOnboarding,
        markRead,
        toggleBookmark,
        saveExamen,
        setTextSize,
        setReminderTimes,
        setReminders,
        resetAll,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const v = useContext(AppCtx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}

// ============================================================
// Lumina — Sleep Store (Zustand)
// Sleep logs + active timer + wake windows
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UUID, SleepType } from '../shared/types/common';
import type { SleepLog, SleepSummary, WakeWindowConfig } from '../modules/sleep/types';
import { generateUUID, type SyncQueueItem } from './createSyncedStore';

const STORAGE_KEY = '@sprout/sleep-logs';
const TIMER_KEY = '@sprout/sleep-timer';

export const WAKE_WINDOWS: WakeWindowConfig[] = [
  { age_months_start: 0, age_months_end: 2, min_minutes: 45, max_minutes: 75, naps_per_day: 5 },
  { age_months_start: 2, age_months_end: 4, min_minutes: 75, max_minutes: 120, naps_per_day: 4 },
  { age_months_start: 4, age_months_end: 6, min_minutes: 120, max_minutes: 150, naps_per_day: 3 },
  { age_months_start: 6, age_months_end: 9, min_minutes: 150, max_minutes: 210, naps_per_day: 3 },
  { age_months_start: 9, age_months_end: 12, min_minutes: 180, max_minutes: 240, naps_per_day: 2 },
  { age_months_start: 12, age_months_end: 18, min_minutes: 210, max_minutes: 300, naps_per_day: 2 },
  { age_months_start: 18, age_months_end: 36, min_minutes: 300, max_minutes: 360, naps_per_day: 1 },
];

export interface SleepTimer {
  sleepId: UUID;
  type: SleepType;
  startedAt: number; // Date.now() timestamp
}

interface SleepState {
  items: SleepLog[];
  syncQueue: SyncQueueItem[];
  activeTimer: SleepTimer | null;
  isHydrated: boolean;

  addItem: (item: SleepLog) => void;
  updateItem: (id: UUID, updates: Partial<SleepLog>) => void;
  deleteItem: (id: UUID) => void;
  hydrate: () => Promise<void>;

  startSleep: (type: SleepType) => UUID;
  endSleep: () => SleepLog | null;
  clearTimer: () => void;

  getSummaryToday: (babyId: UUID) => SleepSummary;
  getWakeWindowMinutes: (babyId: UUID) => number | null;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function persistItems(items: SleepLog[], syncQueue: SyncQueueItem[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items, syncQueue })).catch(() => {});
}

function persistTimer(timer: SleepTimer | null) {
  if (timer) {
    AsyncStorage.setItem(TIMER_KEY, JSON.stringify(timer)).catch(() => {});
  } else {
    AsyncStorage.removeItem(TIMER_KEY).catch(() => {});
  }
}

export const useSleepStore = create<SleepState>((set, get) => ({
  items: [],
  syncQueue: [],
  activeTimer: null,
  isHydrated: false,

  addItem: (item) => {
    const state = get();
    const newItems = [...state.items, item];
    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      operation: 'insert',
      table: 'sleep_logs',
      data: item as unknown as Record<string, unknown>,
      timestamp: Date.now(),
      retryCount: 0,
    };
    const newQueue = [...state.syncQueue, queueItem];
    set({ items: newItems, syncQueue: newQueue });
    persistItems(newItems, newQueue);
  },

  updateItem: (id, updates) => {
    const state = get();
    const newItems = state.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      operation: 'update',
      table: 'sleep_logs',
      data: { id, ...updates } as Record<string, unknown>,
      timestamp: Date.now(),
      retryCount: 0,
    };
    const newQueue = [...state.syncQueue, queueItem];
    set({ items: newItems, syncQueue: newQueue });
    persistItems(newItems, newQueue);
  },

  deleteItem: (id) => {
    const state = get();
    const newItems = state.items.filter((item) => item.id !== id);
    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      operation: 'delete',
      table: 'sleep_logs',
      data: { id },
      timestamp: Date.now(),
      retryCount: 0,
    };
    const newQueue = [...state.syncQueue, queueItem];
    set({ items: newItems, syncQueue: newQueue });
    persistItems(newItems, newQueue);
  },

  hydrate: async () => {
    try {
      const [logsRaw, timerRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(TIMER_KEY),
      ]);
      const logs = logsRaw ? JSON.parse(logsRaw) : {};
      const timer = timerRaw ? JSON.parse(timerRaw) : null;
      set({
        items: logs.items ?? [],
        syncQueue: logs.syncQueue ?? [],
        activeTimer: timer,
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  startSleep: (type) => {
    const sleepId = generateUUID();
    const timer: SleepTimer = {
      sleepId,
      type,
      startedAt: Date.now(),
    };
    set({ activeTimer: timer });
    persistTimer(timer);
    return sleepId;
  },

  endSleep: () => {
    const timer = get().activeTimer;
    if (!timer) return null;

    const now = new Date();
    const startedAt = new Date(timer.startedAt);
    const durationMinutes = Math.round((now.getTime() - startedAt.getTime()) / 60000);

    const log: SleepLog = {
      id: timer.sleepId,
      baby_id: '' as UUID, // Caller must set
      family_id: '' as UUID,
      logged_by: '' as UUID,
      type: timer.type,
      started_at: startedAt.toISOString(),
      ended_at: now.toISOString(),
      duration_minutes: durationMinutes,
      method: null,
      location: null,
      quality: null,
      night_wakings: null,
      room_temperature_celsius: null,
      notes: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    set({ activeTimer: null });
    persistTimer(null);
    return log;
  },

  clearTimer: () => {
    set({ activeTimer: null });
    persistTimer(null);
  },

  getSummaryToday: (babyId) => {
    const items = get().items.filter(
      (item) => item.baby_id === babyId && isToday(item.started_at)
    );

    const nightSleeps = items.filter((i) => i.type === 'night');
    const naps = items.filter((i) => i.type === 'nap');

    const nightHours = nightSleeps.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) / 60;
    const napHours = naps.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) / 60;
    const avgWakings = nightSleeps.length > 0
      ? nightSleeps.reduce((sum, s) => sum + (s.night_wakings ?? 0), 0) / nightSleeps.length
      : 0;

    const lastEnded = items
      .filter((i) => i.ended_at)
      .sort((a, b) => new Date(b.ended_at!).getTime() - new Date(a.ended_at!).getTime())[0];

    const minutesSinceWake = lastEnded?.ended_at
      ? Math.round((Date.now() - new Date(lastEnded.ended_at).getTime()) / 60000)
      : null;

    return {
      total_sleep_hours: Math.round((nightHours + napHours) * 10) / 10,
      night_sleep_hours: Math.round(nightHours * 10) / 10,
      nap_hours: Math.round(napHours * 10) / 10,
      nap_count: naps.length,
      avg_night_wakings: Math.round(avgWakings * 10) / 10,
      last_sleep_ended_at: lastEnded?.ended_at ?? null,
      minutes_since_last_wake: minutesSinceWake,
    };
  },

  getWakeWindowMinutes: (babyId) => {
    const items = get().items.filter((i) => i.baby_id === babyId && i.ended_at);
    if (items.length === 0) return null;

    const lastEnded = items.sort(
      (a, b) => new Date(b.ended_at!).getTime() - new Date(a.ended_at!).getTime()
    )[0];

    return Math.round((Date.now() - new Date(lastEnded.ended_at!).getTime()) / 60000);
  },
}));

export function getWakeWindowConfig(ageMonths: number): WakeWindowConfig {
  return WAKE_WINDOWS.find(
    (w) => ageMonths >= w.age_months_start && ageMonths < w.age_months_end
  ) ?? WAKE_WINDOWS[WAKE_WINDOWS.length - 1];
}

// ============================================================
// Sprout — Feeding Store (Zustand)
// Feeding logs + active timer with side tracking
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UUID, ISO8601, BreastSide } from '../shared/types/common';
import type { FeedingLog, FeedingSummary } from '../modules/feeding/types';
import { createSyncedStore, generateUUID, type SyncQueueItem } from './createSyncedStore';

const STORAGE_KEY = '@sprout/feeding-logs';
const TIMER_KEY = '@sprout/feeding-timer';

export interface FeedingTimer {
  feedingId: UUID;
  type: 'breast' | 'bottle';
  side: BreastSide | null;
  startedAt: number; // Date.now() timestamp
  pausedAt: number | null;
  accumulatedSeconds: number; // seconds accumulated before current start
  leftSeconds: number;
  rightSeconds: number;
}

interface FeedingState {
  items: FeedingLog[];
  syncQueue: SyncQueueItem[];
  activeTimer: FeedingTimer | null;
  isHydrated: boolean;

  addItem: (item: FeedingLog) => void;
  updateItem: (id: UUID, updates: Partial<FeedingLog>) => void;
  deleteItem: (id: UUID) => void;
  hydrate: () => Promise<void>;

  startTimer: (type: 'breast' | 'bottle', side?: BreastSide) => UUID;
  pauseTimer: () => void;
  resumeTimer: () => void;
  switchSide: () => void;
  stopTimer: () => FeedingLog | null;
  clearTimer: () => void;

  getSummaryToday: (babyId: UUID) => FeedingSummary;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function persistItems(items: FeedingLog[], syncQueue: SyncQueueItem[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items, syncQueue })).catch(() => {});
}

function persistTimer(timer: FeedingTimer | null) {
  if (timer) {
    AsyncStorage.setItem(TIMER_KEY, JSON.stringify(timer)).catch(() => {});
  } else {
    AsyncStorage.removeItem(TIMER_KEY).catch(() => {});
  }
}

export const useFeedingStore = create<FeedingState>((set, get) => ({
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
      table: 'feeding_logs',
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
      table: 'feeding_logs',
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
      table: 'feeding_logs',
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

  startTimer: (type, side) => {
    const feedingId = generateUUID();
    const timer: FeedingTimer = {
      feedingId,
      type,
      side: side ?? (type === 'breast' ? 'left' : null),
      startedAt: Date.now(),
      pausedAt: null,
      accumulatedSeconds: 0,
      leftSeconds: 0,
      rightSeconds: 0,
    };
    set({ activeTimer: timer });
    persistTimer(timer);
    return feedingId;
  },

  pauseTimer: () => {
    const timer = get().activeTimer;
    if (!timer || timer.pausedAt) return;

    const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
    const totalAccumulated = timer.accumulatedSeconds + elapsed;

    const sideElapsed = elapsed;
    const updatedTimer: FeedingTimer = {
      ...timer,
      pausedAt: Date.now(),
      accumulatedSeconds: totalAccumulated,
      leftSeconds: timer.side === 'left' ? timer.leftSeconds + sideElapsed : timer.leftSeconds,
      rightSeconds: timer.side === 'right' ? timer.rightSeconds + sideElapsed : timer.rightSeconds,
      startedAt: Date.now(), // reset for next resume
    };
    set({ activeTimer: updatedTimer });
    persistTimer(updatedTimer);
  },

  resumeTimer: () => {
    const timer = get().activeTimer;
    if (!timer || !timer.pausedAt) return;

    const updatedTimer: FeedingTimer = {
      ...timer,
      startedAt: Date.now(),
      pausedAt: null,
    };
    set({ activeTimer: updatedTimer });
    persistTimer(updatedTimer);
  },

  switchSide: () => {
    const timer = get().activeTimer;
    if (!timer || timer.type !== 'breast') return;

    // Save accumulated time to current side
    const elapsed = timer.pausedAt ? 0 : Math.floor((Date.now() - timer.startedAt) / 1000);
    const newSide: BreastSide = timer.side === 'left' ? 'right' : 'left';

    const updatedTimer: FeedingTimer = {
      ...timer,
      side: newSide,
      startedAt: Date.now(),
      accumulatedSeconds: timer.accumulatedSeconds + elapsed,
      leftSeconds: timer.side === 'left' ? timer.leftSeconds + elapsed : timer.leftSeconds,
      rightSeconds: timer.side === 'right' ? timer.rightSeconds + elapsed : timer.rightSeconds,
    };
    set({ activeTimer: updatedTimer });
    persistTimer(updatedTimer);
  },

  stopTimer: () => {
    const timer = get().activeTimer;
    if (!timer) return null;

    const elapsed = timer.pausedAt ? 0 : Math.floor((Date.now() - timer.startedAt) / 1000);
    const finalLeft = timer.side === 'left' ? timer.leftSeconds + elapsed : timer.leftSeconds;
    const finalRight = timer.side === 'right' ? timer.rightSeconds + elapsed : timer.rightSeconds;
    const totalSeconds = timer.accumulatedSeconds + elapsed;

    const now = new Date().toISOString();
    const startedAt = new Date(Date.now() - totalSeconds * 1000).toISOString();

    const log: FeedingLog = {
      id: timer.feedingId,
      baby_id: '' as UUID, // Caller must set this
      family_id: '' as UUID,
      logged_by: '' as UUID,
      type: timer.type,
      started_at: startedAt,
      ended_at: now,
      breast_side: timer.side,
      left_duration_seconds: timer.type === 'breast' ? finalLeft : null,
      right_duration_seconds: timer.type === 'breast' ? finalRight : null,
      bottle_amount_ml: null,
      bottle_content: null,
      bottle_temperature: null,
      solid_foods: null,
      notes: null,
      baby_response: null,
      photo_url: null,
      created_at: now,
      updated_at: now,
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

    const breastFeeds = items.filter((i) => i.type === 'breast');
    const bottleFeeds = items.filter((i) => i.type === 'bottle');
    const solidFeeds = items.filter((i) => i.type === 'solid' || i.type === 'snack');

    const totalBreastMinutes = breastFeeds.reduce((sum, f) => {
      const left = f.left_duration_seconds ?? 0;
      const right = f.right_duration_seconds ?? 0;
      return sum + (left + right) / 60;
    }, 0);

    const totalBottleMl = bottleFeeds.reduce((sum, f) => sum + (f.bottle_amount_ml ?? 0), 0);

    const lastFeed = items.length > 0
      ? items.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0]
      : null;

    const hoursSince = lastFeed
      ? (Date.now() - new Date(lastFeed.started_at).getTime()) / 3600000
      : null;

    return {
      total_feeds: items.length,
      breast_feeds: breastFeeds.length,
      bottle_feeds: bottleFeeds.length,
      solid_feeds: solidFeeds.length,
      total_breast_minutes: Math.round(totalBreastMinutes),
      total_bottle_ml: totalBottleMl,
      last_feed_at: lastFeed?.started_at ?? null,
      hours_since_last_feed: hoursSince ? Math.round(hoursSince * 10) / 10 : null,
    };
  },
}));

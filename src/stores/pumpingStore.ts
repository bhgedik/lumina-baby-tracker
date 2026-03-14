import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UUID, ISO8601, PumpingSide } from '../shared/types/common';
import type { PumpingLog, PumpingSummary, PumpingTimer } from '../modules/pumping/types';

const STORAGE_KEY = '@sprout/pumping-logs';
const TIMER_KEY = '@sprout/pumping-timer';

function generateUUID(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface SyncQueueItem {
  id: UUID;
  operation: 'insert' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

interface PumpingState {
  items: PumpingLog[];
  syncQueue: SyncQueueItem[];
  activeTimer: PumpingTimer | null;
  isHydrated: boolean;

  addItem: (item: PumpingLog) => void;
  deleteItem: (id: UUID) => void;
  hydrate: () => Promise<void>;

  startTimer: (side: PumpingSide) => UUID;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => { pumpingId: UUID; durationSeconds: number } | null;
  clearTimer: () => void;

  getSummaryToday: (babyId: UUID) => PumpingSummary;
}

export const usePumpingStore = create<PumpingState>((set, get) => ({
  items: [],
  syncQueue: [],
  activeTimer: null,
  isHydrated: false,

  addItem: (item) => {
    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      operation: 'insert',
      table: 'pumping_logs',
      data: item as unknown as Record<string, unknown>,
      timestamp: Date.now(),
      retryCount: 0,
    };

    set((s) => ({
      items: [item, ...s.items],
      syncQueue: [...s.syncQueue, queueItem],
    }));

    const state = get();
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)).catch(() => {});
  },

  deleteItem: (id) => {
    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
    }));
    const state = get();
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)).catch(() => {});
  },

  hydrate: async () => {
    try {
      const [itemsRaw, timerRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(TIMER_KEY),
      ]);
      set({
        items: itemsRaw ? JSON.parse(itemsRaw) : [],
        activeTimer: timerRaw ? JSON.parse(timerRaw) : null,
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  startTimer: (side) => {
    const pumpingId = generateUUID();
    const timer: PumpingTimer = {
      pumpingId,
      side,
      startedAt: Date.now(),
      pausedAt: null,
      accumulatedSeconds: 0,
    };
    set({ activeTimer: timer });
    AsyncStorage.setItem(TIMER_KEY, JSON.stringify(timer)).catch(() => {});
    return pumpingId;
  },

  pauseTimer: () => {
    const { activeTimer } = get();
    if (!activeTimer || activeTimer.pausedAt) return;

    const totalElapsed = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
    const updated: PumpingTimer = {
      ...activeTimer,
      pausedAt: Date.now(),
      accumulatedSeconds: totalElapsed,
    };

    set({ activeTimer: updated });
    AsyncStorage.setItem(TIMER_KEY, JSON.stringify(updated)).catch(() => {});
  },

  resumeTimer: () => {
    const { activeTimer } = get();
    if (!activeTimer || !activeTimer.pausedAt) return;

    const updated: PumpingTimer = {
      ...activeTimer,
      startedAt: Date.now() - activeTimer.accumulatedSeconds * 1000,
      pausedAt: null,
    };
    set({ activeTimer: updated });
    AsyncStorage.setItem(TIMER_KEY, JSON.stringify(updated)).catch(() => {});
  },

  stopTimer: () => {
    const { activeTimer } = get();
    if (!activeTimer) return null;

    const durationSeconds = activeTimer.pausedAt
      ? activeTimer.accumulatedSeconds
      : Math.floor((Date.now() - activeTimer.startedAt) / 1000);

    set({ activeTimer: null });
    AsyncStorage.removeItem(TIMER_KEY).catch(() => {});

    return { pumpingId: activeTimer.pumpingId, durationSeconds };
  },

  clearTimer: () => {
    set({ activeTimer: null });
    AsyncStorage.removeItem(TIMER_KEY).catch(() => {});
  },

  getSummaryToday: (babyId) => {
    const today = new Date().toISOString().slice(0, 10);
    const todayItems = get().items.filter(
      (i) => i.baby_id === babyId && i.started_at.slice(0, 10) === today,
    );
    const totalVol = todayItems.reduce((sum, i) => sum + (i.total_volume_ml || 0), 0);
    const lastItem = todayItems[0] || null;
    const hoursSince = lastItem
      ? (Date.now() - new Date(lastItem.started_at).getTime()) / 3600000
      : null;

    return {
      total_sessions: todayItems.length,
      total_volume_ml: totalVol,
      avg_volume_ml: todayItems.length > 0 ? Math.round(totalVol / todayItems.length) : 0,
      last_pump_at: lastItem?.started_at ?? null,
      hours_since_last_pump: hoursSince !== null ? Math.round(hoursSince * 10) / 10 : null,
    };
  },
}));

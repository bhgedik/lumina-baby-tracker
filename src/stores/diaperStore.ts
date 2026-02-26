// ============================================================
// Sprout — Diaper Store (Zustand)
// Diaper logs + quickLog shortcut
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UUID, DiaperType } from '../shared/types/common';
import type { DiaperLog, DiaperSummary } from '../modules/diaper/types';
import { generateUUID, type SyncQueueItem } from './createSyncedStore';

const STORAGE_KEY = '@sprout/diaper-logs';

interface DiaperState {
  items: DiaperLog[];
  syncQueue: SyncQueueItem[];
  isHydrated: boolean;

  addItem: (item: DiaperLog) => void;
  updateItem: (id: UUID, updates: Partial<DiaperLog>) => void;
  deleteItem: (id: UUID) => void;
  hydrate: () => Promise<void>;

  quickLog: (babyId: UUID, familyId: UUID, loggedBy: UUID, type: DiaperType) => DiaperLog;
  getSummaryToday: (babyId: UUID) => DiaperSummary;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function persistItems(items: DiaperLog[], syncQueue: SyncQueueItem[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items, syncQueue })).catch(() => {});
}

export const useDiaperStore = create<DiaperState>((set, get) => ({
  items: [],
  syncQueue: [],
  isHydrated: false,

  addItem: (item) => {
    const state = get();
    const newItems = [...state.items, item];
    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      operation: 'insert',
      table: 'diaper_logs',
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
      table: 'diaper_logs',
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
      table: 'diaper_logs',
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
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      set({
        items: parsed.items ?? [],
        syncQueue: parsed.syncQueue ?? [],
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  quickLog: (babyId, familyId, loggedBy, type) => {
    const now = new Date().toISOString();
    const log: DiaperLog = {
      id: generateUUID(),
      baby_id: babyId,
      family_id: familyId,
      logged_by: loggedBy,
      logged_at: now,
      type,
      stool_color: null,
      stool_consistency: null,
      has_rash: false,
      notes: null,
      created_at: now,
      updated_at: now,
    };
    get().addItem(log);
    return log;
  },

  getSummaryToday: (babyId) => {
    const items = get().items.filter(
      (item) => item.baby_id === babyId && isToday(item.logged_at)
    );

    const lastChange = items.length > 0
      ? items.sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())[0]
      : null;

    const hoursSince = lastChange
      ? (Date.now() - new Date(lastChange.logged_at).getTime()) / 3600000
      : null;

    return {
      total_changes: items.length,
      wet_count: items.filter((i) => i.type === 'wet').length,
      dirty_count: items.filter((i) => i.type === 'dirty').length,
      both_count: items.filter((i) => i.type === 'both').length,
      has_rash_today: items.some((i) => i.has_rash),
      last_change_at: lastChange?.logged_at ?? null,
      hours_since_last_change: hoursSince ? Math.round(hoursSince * 10) / 10 : null,
    };
  },
}));

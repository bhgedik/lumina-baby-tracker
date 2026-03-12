// ============================================================
// Lumina — Generic Offline-First Synced Store Factory
// Zustand + AsyncStorage persistence with sync queue
// ============================================================

import { create, StateCreator } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UUID } from '../shared/types/common';

export type SyncOperation = 'insert' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string;
  operation: SyncOperation;
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export interface SyncedStoreState<T extends { id: UUID }> {
  items: T[];
  syncQueue: SyncQueueItem[];
  isHydrated: boolean;
  addItem: (item: T) => void;
  updateItem: (id: UUID, updates: Partial<T>) => void;
  deleteItem: (id: UUID) => void;
  hydrate: () => Promise<void>;
  getItemsByBabyId: (babyId: UUID) => T[];
}

function generateUUID(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export { generateUUID };

export function createSyncedStore<T extends { id: UUID; baby_id?: UUID }>(
  storageKey: string,
  table: string
) {
  type StoreState = SyncedStoreState<T>;

  const storeCreator: StateCreator<StoreState> = (set, get) => ({
    items: [],
    syncQueue: [],
    isHydrated: false,

    addItem: (item: T) => {
      const state = get();
      const newItems = [...state.items, item];
      const newQueueItem: SyncQueueItem = {
        id: generateUUID(),
        operation: 'insert',
        table,
        data: item as unknown as Record<string, unknown>,
        timestamp: Date.now(),
        retryCount: 0,
      };
      const newQueue = [...state.syncQueue, newQueueItem];
      set({ items: newItems, syncQueue: newQueue });
      persistState(storageKey, { items: newItems, syncQueue: newQueue });
    },

    updateItem: (id: UUID, updates: Partial<T>) => {
      const state = get();
      const newItems = state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      const newQueueItem: SyncQueueItem = {
        id: generateUUID(),
        operation: 'update',
        table,
        data: { id, ...updates } as Record<string, unknown>,
        timestamp: Date.now(),
        retryCount: 0,
      };
      const newQueue = [...state.syncQueue, newQueueItem];
      set({ items: newItems, syncQueue: newQueue });
      persistState(storageKey, { items: newItems, syncQueue: newQueue });
    },

    deleteItem: (id: UUID) => {
      const state = get();
      const newItems = state.items.filter((item) => item.id !== id);
      const newQueueItem: SyncQueueItem = {
        id: generateUUID(),
        operation: 'delete',
        table,
        data: { id },
        timestamp: Date.now(),
        retryCount: 0,
      };
      const newQueue = [...state.syncQueue, newQueueItem];
      set({ items: newItems, syncQueue: newQueue });
      persistState(storageKey, { items: newItems, syncQueue: newQueue });
    },

    hydrate: async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          set({
            items: parsed.items ?? [],
            syncQueue: parsed.syncQueue ?? [],
            isHydrated: true,
          });
        } else {
          set({ isHydrated: true });
        }
      } catch {
        set({ isHydrated: true });
      }
    },

    getItemsByBabyId: (babyId: UUID) => {
      return get().items.filter((item) => 'baby_id' in item && item.baby_id === babyId);
    },
  });

  return create<StoreState>(storeCreator);
}

async function persistState(key: string, data: { items: unknown[]; syncQueue: SyncQueueItem[] }) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Silent fail — persistence is best-effort
  }
}

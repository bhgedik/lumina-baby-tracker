// ============================================================
// Nodd — Insight Dismiss Store (Zustand)
// Tracks dismissed insight content hashes with auto-resurface
// When underlying data changes, hash changes, card resurfaces
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@nodd/insight-dismiss-v1';
const PRUNE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface PersistedData {
  dismissedHashes: Record<string, number>; // contentHash → dismissedAt timestamp
}

interface InsightDismissState {
  dismissedHashes: Record<string, number>;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  dismiss: (contentHash: string) => void;
  isDismissed: (contentHash: string) => boolean;
  clearAll: () => void;
}

function persist(data: PersistedData) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

/** Remove entries older than 7 days to prevent unbounded growth */
function pruneOld(hashes: Record<string, number>): Record<string, number> {
  const cutoff = Date.now() - PRUNE_AGE_MS;
  const pruned: Record<string, number> = {};
  for (const [hash, ts] of Object.entries(hashes)) {
    if (ts > cutoff) pruned[hash] = ts;
  }
  return pruned;
}

export const useInsightDismissStore = create<InsightDismissState>((set, get) => ({
  dismissedHashes: {},
  isHydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: PersistedData = JSON.parse(raw);
        const pruned = pruneOld(data.dismissedHashes ?? {});
        set({ dismissedHashes: pruned, isHydrated: true });
        persist({ dismissedHashes: pruned });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  dismiss: (contentHash: string) => {
    const { dismissedHashes } = get();
    const next = { ...dismissedHashes, [contentHash]: Date.now() };
    set({ dismissedHashes: next });
    persist({ dismissedHashes: next });
  },

  isDismissed: (contentHash: string) => {
    return contentHash in get().dismissedHashes;
  },

  clearAll: () => {
    set({ dismissedHashes: {} });
    persist({ dismissedHashes: {} });
  },
}));

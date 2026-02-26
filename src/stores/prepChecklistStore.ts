// ============================================================
// Sprout — Prep Checklist Store (Zustand)
// AI-powered + static pregnancy prep items with persistence
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_PREP_SUGGESTIONS } from '../modules/pregnancy/data/prepContent';
import { fetchPrepSuggestions } from '../modules/pregnancy/services/prepSuggestionsService';
import type { PrepSuggestion } from '../modules/pregnancy/types';

const STORAGE_KEY = '@sprout/prep-checklist-v5';

interface PersistedData {
  items: PrepSuggestion[];
  checkedIds: string[];
  dismissedIds: string[];
  hasLoadedAI: boolean;
}

export interface SuggestionParams {
  gestational_week: number;
  baby_name?: string;
  experience_level?: 'first_time' | 'experienced';
  feeding_method?: string;
}

interface PrepChecklistState {
  items: PrepSuggestion[];
  checkedIds: string[];
  dismissedIds: string[];
  isLoading: boolean;
  isSurpriseLoading: boolean;
  hasLoadedAI: boolean;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  toggleChecked: (id: string) => void;
  dismissItem: (id: string) => void;
  loadAISuggestions: (params: SuggestionParams) => Promise<void>;
  loadSurprise: (params: SuggestionParams) => Promise<void>;
}

function seedFromStatic(): PrepSuggestion[] {
  return [...INITIAL_PREP_SUGGESTIONS];
}

function persist(state: Pick<PrepChecklistState, 'items' | 'checkedIds' | 'dismissedIds' | 'hasLoadedAI'>) {
  const data: PersistedData = {
    items: state.items,
    checkedIds: state.checkedIds,
    dismissedIds: state.dismissedIds,
    hasLoadedAI: state.hasLoadedAI,
  };
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

export const usePrepChecklistStore = create<PrepChecklistState>((set, get) => ({
  items: [],
  checkedIds: [],
  dismissedIds: [],
  isLoading: false,
  isSurpriseLoading: false,
  hasLoadedAI: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: PersistedData = JSON.parse(raw);
        set({
          items: Array.isArray(data.items) ? data.items : seedFromStatic(),
          checkedIds: Array.isArray(data.checkedIds) ? data.checkedIds : [],
          dismissedIds: Array.isArray(data.dismissedIds) ? data.dismissedIds : [],
          hasLoadedAI: !!data.hasLoadedAI,
          isHydrated: true,
        });
      } else {
        set({
          items: seedFromStatic(),
          isHydrated: true,
        });
      }
    } catch {
      set({
        items: seedFromStatic(),
        isHydrated: true,
      });
    }
  },

  toggleChecked: (id: string) => {
    const { checkedIds } = get();
    const next = checkedIds.includes(id)
      ? checkedIds.filter((cid) => cid !== id)
      : [...checkedIds, id];
    set({ checkedIds: next });
    persist({ ...get(), checkedIds: next });
  },

  dismissItem: (id: string) => {
    const { items, dismissedIds } = get();
    const nextDismissed = [...dismissedIds, id];
    const nextItems = items.filter((i) => i.id !== id);
    set({ items: nextItems, dismissedIds: nextDismissed });
    persist({ ...get(), items: nextItems, dismissedIds: nextDismissed });
  },

  loadAISuggestions: async (params: SuggestionParams) => {
    const { dismissedIds, checkedIds, items } = get();
    const existingIds = [...items.map((i) => i.id), ...checkedIds, ...dismissedIds];
    set({ isLoading: true });
    try {
      const suggestions = await fetchPrepSuggestions(
        { ...params, dismissed_ids: dismissedIds, count: 5 },
        existingIds,
      );
      if (suggestions.length > 0) {
        // Strict dedup: reject items whose ID or title already exists
        const idSet = new Set(items.map((i) => i.id));
        const titleSet = new Set(items.map((i) => i.title.toLowerCase()));
        const deduped = suggestions.filter(
          (s) => !idSet.has(s.id) && !titleSet.has(s.title.toLowerCase()),
        );
        if (deduped.length > 0) {
          const nextItems = [...items, ...deduped];
          set({ items: nextItems, hasLoadedAI: true, isLoading: false });
          persist({ ...get(), items: nextItems, hasLoadedAI: true });
        } else {
          set({ hasLoadedAI: true, isLoading: false });
          persist({ ...get(), hasLoadedAI: true });
        }
      } else {
        set({ hasLoadedAI: true, isLoading: false });
        persist({ ...get(), hasLoadedAI: true });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  loadSurprise: async (params: SuggestionParams) => {
    const { dismissedIds, checkedIds, items } = get();
    const existingIds = [...items.map((i) => i.id), ...checkedIds, ...dismissedIds];
    set({ isSurpriseLoading: true });
    try {
      const suggestions = await fetchPrepSuggestions(
        { ...params, dismissed_ids: dismissedIds, count: 5 },
        existingIds,
      );
      if (suggestions.length > 0) {
        // Strict dedup: reject items whose ID or title already exists
        const idSet = new Set(items.map((i) => i.id));
        const titleSet = new Set(items.map((i) => i.title.toLowerCase()));
        const deduped = suggestions.filter(
          (s) => !idSet.has(s.id) && !titleSet.has(s.title.toLowerCase()),
        );
        if (deduped.length > 0) {
          const nextItems = [...items, ...deduped];
          set({ items: nextItems, isSurpriseLoading: false });
          persist({ ...get(), items: nextItems });
        } else {
          set({ isSurpriseLoading: false });
        }
      } else {
        set({ isSurpriseLoading: false });
      }
    } catch {
      set({ isSurpriseLoading: false });
    }
  },
}));

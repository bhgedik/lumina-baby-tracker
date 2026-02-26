// ============================================================
// Nodd — Milestone Store (Zustand)
// Tracks celebrated milestones with persist to AsyncStorage
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@nodd/milestones';

interface CelebratedMilestone {
  achievedDate: string; // ISO8601
  notes: string | null;
}

interface MilestoneState {
  celebrated: Record<string, CelebratedMilestone>;
  isHydrated: boolean;

  celebrate: (milestoneId: string, notes?: string) => void;
  isCelebrated: (milestoneId: string) => boolean;
  hydrate: () => Promise<void>;
}

export const useMilestoneStore = create<MilestoneState>((set, get) => ({
  celebrated: {},
  isHydrated: false,

  celebrate: (milestoneId: string, notes?: string) => {
    const entry: CelebratedMilestone = {
      achievedDate: new Date().toISOString(),
      notes: notes?.trim() || null,
    };
    const updated = { ...get().celebrated, [milestoneId]: entry };
    set({ celebrated: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  isCelebrated: (milestoneId: string) => {
    return milestoneId in get().celebrated;
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ celebrated: JSON.parse(raw), isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },
}));

// ============================================================
// Sprout — Baby Store (Zustand)
// Baby list + active baby selection
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../data/supabase/client';
import type { UUID } from '../shared/types/common';
import type { Baby } from '../modules/baby/types';

const STORAGE_KEY = '@sprout/active-baby';
const BABIES_KEY = '@sprout/babies';

interface BabyState {
  babies: Baby[];
  activeBabyId: UUID | null;
  isHydrated: boolean;

  setActiveBaby: (babyId: UUID) => void;
  getActiveBaby: () => Baby | null;
  setBabies: (babies: Baby[]) => void;
  addBaby: (baby: Baby) => void;
  updateBaby: (babyId: UUID, updates: Partial<Baby>) => void;
  hydrate: () => Promise<void>;
}

export const useBabyStore = create<BabyState>((set, get) => ({
  babies: [],
  activeBabyId: null,
  isHydrated: false,

  setActiveBaby: (babyId: UUID) => {
    set({ activeBabyId: babyId });
    AsyncStorage.setItem(STORAGE_KEY, babyId).catch(() => {});
  },

  getActiveBaby: () => {
    const { babies, activeBabyId } = get();
    if (!activeBabyId) return babies[0] ?? null;
    return babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;
  },

  setBabies: (babies: Baby[]) => {
    set({ babies });
    AsyncStorage.setItem(BABIES_KEY, JSON.stringify(babies)).catch(() => {});
  },

  addBaby: (baby: Baby) => {
    const newBabies = [...get().babies, baby];
    set({ babies: newBabies });
    AsyncStorage.setItem(BABIES_KEY, JSON.stringify(newBabies)).catch(() => {});
  },

  updateBaby: (babyId: UUID, updates: Partial<Baby>) => {
    const now = new Date().toISOString();
    const newBabies = get().babies.map((b) =>
      b.id === babyId ? { ...b, ...updates, updated_at: now } : b,
    );
    set({ babies: newBabies });
    AsyncStorage.setItem(BABIES_KEY, JSON.stringify(newBabies)).catch(() => {});
    if (isSupabaseConfigured) {
      supabase.from('babies').update({ ...updates, updated_at: now }).eq('id', babyId).then(() => {});
    }
  },

  hydrate: async () => {
    try {
      const [activeId, babiesRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(BABIES_KEY),
      ]);
      set({
        activeBabyId: activeId,
        babies: babiesRaw ? JSON.parse(babiesRaw) : [],
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },
}));

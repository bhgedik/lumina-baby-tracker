// ============================================================
// Sprout — Mother's Mood Store (Zustand)
// Daily mood check-in with emoji selection
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sprout/mother-mood';

export type MoodEmoji = 'radiant' | 'good' | 'okay' | 'struggling' | 'overwhelmed';

export interface MoodConfig {
  label: string;
  color: string;
}

export const MOOD_CONFIG: Record<MoodEmoji, MoodConfig> = {
  radiant:     { label: 'Radiant',     color: '#FFD700' },
  good:        { label: 'Good',        color: '#5E8A72' },
  okay:        { label: 'Okay',        color: '#87807A' },
  struggling:  { label: 'Struggling',  color: '#F17C4C' },
  overwhelmed: { label: 'Overwhelmed', color: '#E53935' },
};

export interface MoodEntry {
  id: string;
  mood: MoodEmoji;
  loggedAt: number; // Date.now() timestamp
  notes: string | null;
}

interface MotherMoodState {
  entries: MoodEntry[];
  isHydrated: boolean;

  logMood: (mood: MoodEmoji, notes?: string) => void;
  getTodaysMood: () => MoodEntry | null;
  hydrate: () => Promise<void>;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function isToday(timestamp: number): boolean {
  const d = new Date(timestamp);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function persist(entries: MoodEntry[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ entries })).catch(() => {});
}

export const useMotherMoodStore = create<MotherMoodState>((set, get) => ({
  entries: [],
  isHydrated: false,

  logMood: (mood, notes) => {
    const state = get();
    const entry: MoodEntry = {
      id: generateId(),
      mood,
      loggedAt: Date.now(),
      notes: notes ?? null,
    };
    const newEntries = [...state.entries, entry];
    set({ entries: newEntries });
    persist(newEntries);
  },

  getTodaysMood: () => {
    const todayEntries = get().entries.filter((e) => isToday(e.loggedAt));
    if (todayEntries.length === 0) return null;
    return todayEntries[todayEntries.length - 1];
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          entries: parsed.entries ?? [],
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },
}));

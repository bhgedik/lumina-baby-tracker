// ============================================================
// Nodd — Mother's Wellness Store (Zustand)
// Symptom tracking (body areas + severity) & weight logging
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sprout/mother-wellness';

export type BodyArea =
  | 'head'
  | 'breast'
  | 'abdomen'
  | 'pelvis'
  | 'back'
  | 'perineum'
  | 'incision'
  | 'legs'
  | 'other';

export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

export interface SymptomEntry {
  id: string;
  bodyArea: BodyArea;
  symptom: string;
  severity: SeverityLevel;
  notes: string | null;
  loggedAt: number;
}

export interface WeightEntry {
  id: string;
  weightKg: number;
  loggedAt: number;
  notes: string | null;
}

interface MotherWellnessState {
  symptoms: SymptomEntry[];
  weights: WeightEntry[];
  isHydrated: boolean;

  logSymptom: (bodyArea: BodyArea, symptom: string, severity: SeverityLevel, notes?: string) => void;
  logWeight: (weightKg: number, notes?: string) => void;
  getTodaysSymptoms: () => SymptomEntry[];
  getLatestWeight: () => WeightEntry | null;
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

function persist(symptoms: SymptomEntry[], weights: WeightEntry[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ symptoms, weights })).catch(() => {});
}

export const useMotherWellnessStore = create<MotherWellnessState>((set, get) => ({
  symptoms: [],
  weights: [],
  isHydrated: false,

  logSymptom: (bodyArea, symptom, severity, notes) => {
    const state = get();
    const entry: SymptomEntry = {
      id: generateId(),
      bodyArea,
      symptom,
      severity,
      notes: notes ?? null,
      loggedAt: Date.now(),
    };
    const newSymptoms = [...state.symptoms, entry];
    set({ symptoms: newSymptoms });
    persist(newSymptoms, state.weights);
  },

  logWeight: (weightKg, notes) => {
    const state = get();
    const entry: WeightEntry = {
      id: generateId(),
      weightKg,
      loggedAt: Date.now(),
      notes: notes ?? null,
    };
    const newWeights = [...state.weights, entry];
    set({ weights: newWeights });
    persist(state.symptoms, newWeights);
  },

  getTodaysSymptoms: () => {
    return get().symptoms.filter((s) => isToday(s.loggedAt));
  },

  getLatestWeight: () => {
    const weights = get().weights;
    if (weights.length === 0) return null;
    return weights[weights.length - 1];
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          symptoms: parsed.symptoms ?? [],
          weights: parsed.weights ?? [],
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

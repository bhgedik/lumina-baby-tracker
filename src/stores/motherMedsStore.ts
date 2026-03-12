// ============================================================
// Lumina — Mother's Medication Store (Zustand)
// Tracks postpartum medication schedules + next-due countdown
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sprout/mother-meds';

export interface ActiveMed {
  medName: string;
  intervalHours: number;
  lastTakenAt: number | null; // Date.now() timestamp
  nextDueAt: number | null;   // Date.now() timestamp
}

export interface MedEntry {
  id: string;
  medName: string;
  intervalHours: number;
  takenAt: number; // Date.now() timestamp
}

export const PREDEFINED_MEDS = [
  { name: 'Ibuprofen', intervalHours: 6 },
  { name: 'Paracetamol', intervalHours: 4 },
  { name: 'Stool Softener', intervalHours: 12 },
] as const;

interface MotherMedsState {
  activeMeds: ActiveMed[];
  history: MedEntry[];
  isHidden: boolean;
  isHydrated: boolean;

  addMedication: (medName: string, intervalHours: number) => void;
  removeMedication: (medName: string) => void;
  recordTaken: (medName: string) => void;
  setHidden: (hidden: boolean) => void;
  getNextDue: () => ActiveMed | null;
  hydrate: () => Promise<void>;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function persist(activeMeds: ActiveMed[], history: MedEntry[], isHidden: boolean) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ activeMeds, history, isHidden })).catch(() => {});
}

export const useMotherMedsStore = create<MotherMedsState>((set, get) => ({
  activeMeds: [],
  history: [],
  isHidden: false,
  isHydrated: false,

  addMedication: (medName, intervalHours) => {
    const state = get();
    if (state.activeMeds.some((m) => m.medName === medName)) return;
    const newMed: ActiveMed = { medName, intervalHours, lastTakenAt: null, nextDueAt: null };
    const newActiveMeds = [...state.activeMeds, newMed];
    set({ activeMeds: newActiveMeds });
    persist(newActiveMeds, state.history, state.isHidden);
  },

  removeMedication: (medName) => {
    const state = get();
    const newActiveMeds = state.activeMeds.filter((m) => m.medName !== medName);
    set({ activeMeds: newActiveMeds });
    persist(newActiveMeds, state.history, state.isHidden);
  },

  recordTaken: (medName) => {
    const state = get();
    const now = Date.now();
    const med = state.activeMeds.find((m) => m.medName === medName);
    if (!med) return;

    const entry: MedEntry = {
      id: generateId(),
      medName,
      intervalHours: med.intervalHours,
      takenAt: now,
    };

    const newActiveMeds = state.activeMeds.map((m) =>
      m.medName === medName
        ? { ...m, lastTakenAt: now, nextDueAt: now + m.intervalHours * 3600000 }
        : m
    );
    const newHistory = [...state.history, entry];
    set({ activeMeds: newActiveMeds, history: newHistory });
    persist(newActiveMeds, newHistory, state.isHidden);
  },

  setHidden: (hidden) => {
    const state = get();
    set({ isHidden: hidden });
    persist(state.activeMeds, state.history, hidden);
  },

  getNextDue: () => {
    const { activeMeds } = get();
    const withDue = activeMeds.filter((m) => m.nextDueAt !== null);
    if (withDue.length === 0) return null;

    const now = Date.now();
    // Overdue meds first (nextDueAt < now), then soonest
    const overdue = withDue.filter((m) => m.nextDueAt! <= now);
    if (overdue.length > 0) {
      return overdue.sort((a, b) => a.nextDueAt! - b.nextDueAt!)[0];
    }
    return withDue.sort((a, b) => a.nextDueAt! - b.nextDueAt!)[0];
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          activeMeds: parsed.activeMeds ?? [],
          history: parsed.history ?? [],
          isHidden: parsed.isHidden ?? false,
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

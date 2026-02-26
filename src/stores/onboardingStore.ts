// ============================================================
// Sprout — Onboarding Store (Zustand)
// Accumulates data across onboarding steps, persists locally
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Gender, PrimaryFeedingMethod } from '../shared/types/common';

const STORAGE_KEY = '@sprout/onboarding';
const COMPLETED_KEY = '@sprout/onboarding-completed';

interface OnboardingData {
  // Parent profile (step 1)
  parentName: string;
  experienceLevel: 'first_time' | 'experienced' | null;

  // Baby profile (step 2)
  babyName: string;
  dateOfBirth: string;
  gender: Gender | null;
  feedingMethod: PrimaryFeedingMethod | null;
  isPregnant: boolean;
  dueDate: string;

  // Gestational age (step 3)
  wasPreterm: boolean | null;
  gestationalWeeks: number | null;

  // Preferences (step 4)
  preferredUnits: 'metric' | 'imperial';
}

interface OnboardingState extends OnboardingData {
  isCompleted: boolean;
  isHydrated: boolean;

  setParentProfile: (data: {
    parentName: string;
    experienceLevel: 'first_time' | 'experienced';
  }) => void;
  setBabyProfile: (data: {
    babyName: string;
    dateOfBirth: string;
    gender: Gender;
    feedingMethod: PrimaryFeedingMethod;
    isPregnant: boolean;
    dueDate: string;
  }) => void;
  setGestationalAge: (data: {
    wasPreterm: boolean;
    gestationalWeeks: number | null;
  }) => void;
  setPreferences: (data: {
    preferredUnits: 'metric' | 'imperial';
  }) => void;
  markCompleted: () => void;
  reset: () => void;
  hydrate: () => Promise<void>;
}

const INITIAL_DATA: OnboardingData = {
  parentName: '',
  experienceLevel: null,
  babyName: '',
  dateOfBirth: '',
  gender: null,
  feedingMethod: null,
  isPregnant: false,
  dueDate: '',
  wasPreterm: null,
  gestationalWeeks: null,
  preferredUnits: 'metric',
};

function persistData(state: OnboardingState) {
  const data: OnboardingData = {
    parentName: state.parentName,
    experienceLevel: state.experienceLevel,
    babyName: state.babyName,
    dateOfBirth: state.dateOfBirth,
    gender: state.gender,
    feedingMethod: state.feedingMethod,
    isPregnant: state.isPregnant,
    dueDate: state.dueDate,
    wasPreterm: state.wasPreterm,
    gestationalWeeks: state.gestationalWeeks,
    preferredUnits: state.preferredUnits,
  };
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...INITIAL_DATA,
  isCompleted: false,
  isHydrated: false,

  setParentProfile: (data) => {
    set(data);
    persistData({ ...get(), ...data });
  },

  setBabyProfile: (data) => {
    set(data);
    persistData({ ...get(), ...data });
  },

  setGestationalAge: (data) => {
    set(data);
    persistData({ ...get(), ...data });
  },

  setPreferences: (data) => {
    set(data);
    persistData({ ...get(), ...data });
  },

  markCompleted: () => {
    set({ isCompleted: true });
    AsyncStorage.setItem(COMPLETED_KEY, 'true').catch(() => {});
  },

  reset: () => {
    set({ ...INITIAL_DATA, isCompleted: false });
    AsyncStorage.multiRemove([STORAGE_KEY, COMPLETED_KEY]).catch(() => {});
  },

  hydrate: async () => {
    try {
      const [raw, completed] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(COMPLETED_KEY),
      ]);
      const data = raw ? JSON.parse(raw) : {};
      set({
        ...data,
        isCompleted: completed === 'true',
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },
}));

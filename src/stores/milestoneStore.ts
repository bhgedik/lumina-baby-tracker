// ============================================================
// Nodd — Milestone Store (Zustand)
// Tracks celebrated milestones + opened period boxes
// Persists to AsyncStorage
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@nodd/milestones';
const BOXES_KEY = '@nodd/opened-boxes';

interface CelebratedMilestone {
  achievedDate: string; // ISO8601
  notes: string | null;
}

interface MilestoneState {
  celebrated: Record<string, CelebratedMilestone>;
  openedBoxes: Record<string, string>; // periodId → ISO8601 opened date
  isHydrated: boolean;

  celebrate: (milestoneId: string, notes?: string) => void;
  uncelebrate: (milestoneId: string) => void;
  isCelebrated: (milestoneId: string) => boolean;
  openBox: (periodId: string) => void;
  isBoxOpened: (periodId: string) => boolean;
  hydrate: () => Promise<void>;
}

export const useMilestoneStore = create<MilestoneState>((set, get) => ({
  celebrated: {},
  openedBoxes: {},
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

  uncelebrate: (milestoneId: string) => {
    const { [milestoneId]: _, ...rest } = get().celebrated;
    set({ celebrated: rest });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rest)).catch(() => {});
  },

  isCelebrated: (milestoneId: string) => {
    return milestoneId in get().celebrated;
  },

  openBox: (periodId: string) => {
    const updated = { ...get().openedBoxes, [periodId]: new Date().toISOString() };
    set({ openedBoxes: updated });
    AsyncStorage.setItem(BOXES_KEY, JSON.stringify(updated)).catch(() => {});
  },

  isBoxOpened: (periodId: string) => {
    return periodId in get().openedBoxes;
  },

  hydrate: async () => {
    try {
      const [rawMilestones, rawBoxes] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(BOXES_KEY),
      ]);
      set({
        celebrated: rawMilestones ? JSON.parse(rawMilestones) : {},
        openedBoxes: rawBoxes ? JSON.parse(rawBoxes) : {},
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },
}));

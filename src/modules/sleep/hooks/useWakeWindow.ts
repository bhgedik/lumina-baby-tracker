// ============================================================
// Sprout — Wake Window Hook
// Returns wake window status using corrected age
// ============================================================

import { useSleepStore, getWakeWindowConfig } from '../../../stores/sleepStore';
import type { UUID } from '../../../shared/types/common';
import type { WakeWindowConfig } from '../types';

interface WakeWindowState {
  minutesSinceWake: number | null;
  wakeWindowConfig: WakeWindowConfig;
  status: 'early' | 'ideal' | 'overdue';
}

export function useWakeWindow(babyId: UUID | undefined, ageMonths: number): WakeWindowState {
  const getWakeWindowMinutes = useSleepStore((s) => s.getWakeWindowMinutes);
  const minutesSinceWake = babyId ? getWakeWindowMinutes(babyId) : null;
  const config = getWakeWindowConfig(ageMonths);

  let status: 'early' | 'ideal' | 'overdue' = 'early';
  if (minutesSinceWake !== null) {
    if (minutesSinceWake >= config.max_minutes) {
      status = 'overdue';
    } else if (minutesSinceWake >= config.min_minutes) {
      status = 'ideal';
    }
  }

  return {
    minutesSinceWake,
    wakeWindowConfig: config,
    status,
  };
}

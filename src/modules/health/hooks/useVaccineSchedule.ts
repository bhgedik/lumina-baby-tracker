// ============================================================
// Lumina — useVaccineSchedule Hook
// Age-gated vaccine schedule: dueNow / future / completed
// Uses chronological age only (NEVER corrected age for vaccines)
// ============================================================

import { useMemo } from 'react';
import { useBabyStore } from '../../../stores/babyStore';
import { useHealthStore } from '../../../stores/healthStore';
import { computeVaccineSchedule } from '../utils/vaccineScheduler';
import type { VaccineTrackingItem } from '../types';

export function useVaccineSchedule() {
  const baby = useBabyStore((s) => s.getActiveBaby());
  const vaccinations = useHealthStore((s) => s.vaccinations);

  const items = useMemo<VaccineTrackingItem[]>(() => {
    if (!baby?.date_of_birth) return [];
    const babyVax = vaccinations.filter((v) => v.baby_id === baby.id);
    return computeVaccineSchedule(baby, babyVax);
  }, [baby, vaccinations]);

  // Due now = overdue + due (needs attention now)
  const dueNow = useMemo(
    () => items.filter((i) => i.status === 'overdue' || i.status === 'due'),
    [items],
  );

  // Future = upcoming vaccines not yet due (months away)
  const future = useMemo(
    () => items.filter((i) => i.status === 'upcoming'),
    [items],
  );

  const completed = useMemo(
    () => items.filter((i) => i.status === 'completed'),
    [items],
  );

  return { items, dueNow, future, completed };
}

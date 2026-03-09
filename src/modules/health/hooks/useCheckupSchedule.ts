// ============================================================
// Sprouty — useCheckupSchedule Hook
// Age-gated checkup schedule: dueNow / future / completed
// ============================================================

import { useMemo } from 'react';
import { useBabyStore } from '../../../stores/babyStore';
import { useHealthStore } from '../../../stores/healthStore';
import { computeCheckupSchedule } from '../utils/vaccineScheduler';
import type { CheckupTrackingItem } from '../types';

export function useCheckupSchedule() {
  const baby = useBabyStore((s) => s.getActiveBaby());
  const healthLogs = useHealthStore((s) => s.healthLogs);

  const items = useMemo<CheckupTrackingItem[]>(() => {
    if (!baby?.date_of_birth) return [];
    const babyLogs = healthLogs.filter((l) => l.baby_id === baby.id);
    return computeCheckupSchedule(baby, babyLogs);
  }, [baby, healthLogs]);

  // Due now = overdue + due
  const dueNow = useMemo(
    () => items.filter((i) => i.status === 'overdue' || i.status === 'due'),
    [items],
  );

  // Future = upcoming checkups not yet due
  const future = useMemo(
    () => items.filter((i) => i.status === 'upcoming'),
    [items],
  );

  const completed = useMemo(
    () => items.filter((i) => i.status === 'completed'),
    [items],
  );

  const next = useMemo<CheckupTrackingItem | null>(() => {
    return items.find((i) => i.status === 'due' || i.status === 'upcoming') ?? null;
  }, [items]);

  return { items, dueNow, future, completed, next };
}

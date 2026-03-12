// ============================================================
// Lumina — Seed Data Hook
// Seeds all tracking domains with 30-day demo data
// Checks store contents directly instead of flags
// ============================================================

import { useEffect, useRef } from 'react';
import { useBabyStore } from '../stores/babyStore';
import { useFeedingStore } from '../stores/feedingStore';
import { useSleepStore } from '../stores/sleepStore';
import { useDiaperStore } from '../stores/diaperStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import {
  generateSeedFeedingData,
  generateSeedSleepData,
  generateSeedDiaperData,
} from './seedAllData';

export function useSeedData(): void {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const feedingHydrated = useFeedingStore((s) => s.isHydrated);
  const sleepHydrated = useSleepStore((s) => s.isHydrated);
  const diaperHydrated = useDiaperStore((s) => s.isHydrated);
  const feedingItems = useFeedingStore((s) => s.items);
  const sleepItems = useSleepStore((s) => s.items);
  const diaperItems = useDiaperStore((s) => s.items);
  const feedingMethod = useOnboardingStore((s) => s.feedingMethod) ?? 'mixed';

  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;

    const allHydrated = feedingHydrated && sleepHydrated && diaperHydrated;
    if (!allHydrated) return;

    const baby = activeBabyId
      ? babies.find((b) => b.id === activeBabyId)
      : babies[0];

    if (!baby || (baby.is_pregnant && baby.due_date)) return;

    // Check if this baby already has data in any store
    const hasFeedingData = feedingItems.some((i) => i.baby_id === baby.id);
    const hasSleepData = sleepItems.some((i) => i.baby_id === baby.id);
    const hasDiaperData = diaperItems.some((i) => i.baby_id === baby.id);

    if (hasFeedingData && hasSleepData && hasDiaperData) return;

    seededRef.current = true;

    const feedingStore = useFeedingStore.getState();
    const sleepStore = useSleepStore.getState();
    const diaperStore = useDiaperStore.getState();

    if (!hasFeedingData) {
      const logs = generateSeedFeedingData(baby, feedingMethod);
      for (const log of logs) feedingStore.addItem(log);
    }

    if (!hasSleepData) {
      const logs = generateSeedSleepData(baby);
      for (const log of logs) sleepStore.addItem(log);
    }

    if (!hasDiaperData) {
      const logs = generateSeedDiaperData(baby);
      for (const log of logs) diaperStore.addItem(log);
    }
  }, [
    feedingHydrated, sleepHydrated, diaperHydrated,
    babies, activeBabyId, feedingMethod,
    feedingItems, sleepItems, diaperItems,
  ]);
}

// ============================================================
// Nodd — Growth Seed Data Hook
// Auto-seeds growth data for the active baby if none exists.
// Runs once per baby via AsyncStorage flag.
// ============================================================

import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBabyStore } from '../../../stores/babyStore';
import { useGrowthStore } from '../../../stores/growthStore';
import { generateSeedGrowthData } from '../utils/seedGrowthData';

const SEED_FLAG_PREFIX = '@nodd/growth-seeded:';

export function useGrowthSeedData(): void {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const growthItems = useGrowthStore((s) => s.items);
  const isHydrated = useGrowthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    const baby = activeBabyId
      ? babies.find((b) => b.id === activeBabyId)
      : babies[0];

    if (!baby || baby.is_pregnant) return;

    // Check if this baby already has growth data
    const hasData = growthItems.some((item) => item.baby_id === baby.id);
    if (hasData) return;

    const flagKey = `${SEED_FLAG_PREFIX}${baby.id}`;

    (async () => {
      // Check AsyncStorage flag to avoid re-seeding
      const seeded = await AsyncStorage.getItem(flagKey);
      if (seeded) return;

      const seedLogs = generateSeedGrowthData(baby);
      if (seedLogs.length === 0) return;

      // Add each log to the store
      const addItem = useGrowthStore.getState().addItem;
      for (const log of seedLogs) {
        addItem(log);
      }

      // Mark as seeded
      await AsyncStorage.setItem(flagKey, 'true');
    })();
  }, [isHydrated, babies, activeBabyId, growthItems]);
}

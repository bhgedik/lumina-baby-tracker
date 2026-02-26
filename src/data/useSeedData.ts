// ============================================================
// Nodd — Seed Data Hook
// Seeds all tracking domains with demo data on first visit
// ============================================================

import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBabyStore } from '../stores/babyStore';
import { useFeedingStore } from '../stores/feedingStore';
import { useSleepStore } from '../stores/sleepStore';
import { useDiaperStore } from '../stores/diaperStore';
import { useMotherMoodStore } from '../stores/motherMoodStore';
import { useMotherWellnessStore } from '../stores/motherWellnessStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import {
  generateSeedFeedingData,
  generateSeedSleepData,
  generateSeedDiaperData,
  generateSeedMoodData,
  generateSeedWellnessData,
} from './seedAllData';

const FLAG_PREFIX = '@nodd/';

export function useSeedData(): void {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const feedingHydrated = useFeedingStore((s) => s.isHydrated);
  const sleepHydrated = useSleepStore((s) => s.isHydrated);
  const diaperHydrated = useDiaperStore((s) => s.isHydrated);
  const moodHydrated = useMotherMoodStore((s) => s.isHydrated);
  const wellnessHydrated = useMotherWellnessStore((s) => s.isHydrated);
  const feedingMethod = useOnboardingStore((s) => s.feedingMethod) ?? 'mixed';

  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;

    const allHydrated = feedingHydrated && sleepHydrated && diaperHydrated && moodHydrated && wellnessHydrated;
    if (!allHydrated) return;

    const baby = activeBabyId
      ? babies.find((b) => b.id === activeBabyId)
      : babies[0];

    if (!baby || baby.is_pregnant) return;

    seededRef.current = true;

    (async () => {
      // Feeding
      const hasFeedingData = useFeedingStore.getState().items.some((i) => i.baby_id === baby.id);
      if (!hasFeedingData) {
        const feedingFlag = `${FLAG_PREFIX}feeding-seeded:${baby.id}`;
        const feedingSeeded = await AsyncStorage.getItem(feedingFlag);
        if (!feedingSeeded) {
          const logs = generateSeedFeedingData(baby, feedingMethod);
          const addItem = useFeedingStore.getState().addItem;
          for (const log of logs) addItem(log);
          await AsyncStorage.setItem(feedingFlag, 'true');
        }
      }

      // Sleep
      const hasSleepData = useSleepStore.getState().items.some((i) => i.baby_id === baby.id);
      if (!hasSleepData) {
        const sleepFlag = `${FLAG_PREFIX}sleep-seeded:${baby.id}`;
        const sleepSeeded = await AsyncStorage.getItem(sleepFlag);
        if (!sleepSeeded) {
          const logs = generateSeedSleepData(baby);
          const addItem = useSleepStore.getState().addItem;
          for (const log of logs) addItem(log);
          await AsyncStorage.setItem(sleepFlag, 'true');
        }
      }

      // Diapers
      const hasDiaperData = useDiaperStore.getState().items.some((i) => i.baby_id === baby.id);
      if (!hasDiaperData) {
        const diaperFlag = `${FLAG_PREFIX}diaper-seeded:${baby.id}`;
        const diaperSeeded = await AsyncStorage.getItem(diaperFlag);
        if (!diaperSeeded) {
          const logs = generateSeedDiaperData(baby);
          const addItem = useDiaperStore.getState().addItem;
          for (const log of logs) addItem(log);
          await AsyncStorage.setItem(diaperFlag, 'true');
        }
      }

      // Mood — set entries directly to preserve historical timestamps
      const moodStore = useMotherMoodStore.getState();
      if (moodStore.entries.length === 0) {
        const moodFlag = `${FLAG_PREFIX}mood-seeded:${baby.id}`;
        const moodSeeded = await AsyncStorage.getItem(moodFlag);
        if (!moodSeeded) {
          const entries = generateSeedMoodData();
          useMotherMoodStore.setState({
            entries: [...moodStore.entries, ...entries],
          });
          // Persist manually since we bypassed logMood
          AsyncStorage.setItem(
            '@sprout/mother-mood',
            JSON.stringify({ entries: [...moodStore.entries, ...entries] }),
          ).catch(() => {});
          await AsyncStorage.setItem(moodFlag, 'true');
        }
      }

      // Wellness — set state directly to preserve historical timestamps
      const wellnessStore = useMotherWellnessStore.getState();
      if (wellnessStore.symptoms.length === 0 && wellnessStore.weights.length === 0) {
        const wellnessFlag = `${FLAG_PREFIX}wellness-seeded:${baby.id}`;
        const wellnessSeeded = await AsyncStorage.getItem(wellnessFlag);
        if (!wellnessSeeded) {
          const { symptoms, weights } = generateSeedWellnessData();
          const newSymptoms = [...wellnessStore.symptoms, ...symptoms];
          const newWeights = [...wellnessStore.weights, ...weights];
          useMotherWellnessStore.setState({
            symptoms: newSymptoms,
            weights: newWeights,
          });
          // Persist manually since we bypassed logSymptom/logWeight
          AsyncStorage.setItem(
            '@sprout/mother-wellness',
            JSON.stringify({ symptoms: newSymptoms, weights: newWeights }),
          ).catch(() => {});
          await AsyncStorage.setItem(wellnessFlag, 'true');
        }
      }
    })();
  }, [
    feedingHydrated, sleepHydrated, diaperHydrated, moodHydrated, wellnessHydrated,
    babies, activeBabyId, feedingMethod,
  ]);
}

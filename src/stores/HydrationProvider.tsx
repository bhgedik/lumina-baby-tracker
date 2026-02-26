// ============================================================
// Sprout — Hydration Provider
// Hydrates all Zustand stores on app start
// ============================================================

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './authStore';
import { useBabyStore } from './babyStore';
import { useFeedingStore } from './feedingStore';
import { useSleepStore } from './sleepStore';
import { useDiaperStore } from './diaperStore';
import { useOnboardingStore } from './onboardingStore';
import { usePrepChecklistStore } from './prepChecklistStore';
import { useMotherMedsStore } from './motherMedsStore';
import { useMotherMoodStore } from './motherMoodStore';
import { useInsightDismissStore } from './insightDismissStore';
import { useGrowthStore } from './growthStore';
import { useMotherWellnessStore } from './motherWellnessStore';
import { colors } from '../shared/constants/theme';

// ⚠️  TEMPORARY: Set to true to wipe all data and restart onboarding.
//     Set back to false after testing, then remove this block.
const DEV_FORCE_RESET = false;

interface Props {
  children: React.ReactNode;
}

export function HydrationProvider({ children }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function hydrate() {
      try {
        // ⚠️  TEMPORARY: Wipe all storage before hydrating
        if (DEV_FORCE_RESET) {
          await AsyncStorage.clear();
          console.log('[Sprout] DEV_FORCE_RESET: All storage cleared');
        }

        await Promise.all([
          useAuthStore.getState().hydrate(),
          useBabyStore.getState().hydrate(),
          useFeedingStore.getState().hydrate(),
          useSleepStore.getState().hydrate(),
          useDiaperStore.getState().hydrate(),
          useOnboardingStore.getState().hydrate(),
          usePrepChecklistStore.getState().hydrate(),
          useMotherMedsStore.getState().hydrate(),
          useMotherMoodStore.getState().hydrate(),
          useInsightDismissStore.getState().hydrate(),
          useGrowthStore.getState().hydrate(),
          useMotherWellnessStore.getState().hydrate(),
        ]);
      } catch (e) {
        console.warn('[Sprout] Hydration error (non-fatal):', e);
      }
      setReady(true);
    }
    hydrate();
  }, []);

  if (!ready) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

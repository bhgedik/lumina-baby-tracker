// ============================================================
// Lumina — Create Account (Bypassed)
// Auth is disabled — auto-flushes onboarding data and redirects
// ============================================================

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/shared/constants/theme';
import { flushOnboardingToStores } from '../../src/services/onboardingFlush';

export default function CreateAccountScreen() {
  const router = useRouter();

  useEffect(() => {
    const finish = async () => {
      await flushOnboardingToStores({
        userId: 'local-user-' + Date.now(),
        userEmail: 'user@lumina.local',
      });
      router.replace('/(app)/(tabs)/home');
    };
    finish();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
    </View>
  );
}

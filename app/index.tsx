import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/stores/authStore';
import { useOnboardingStore } from '../src/stores/onboardingStore';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';
import { colors } from '../src/shared/constants/theme';

/**
 * Entry point — routes based on onboarding state.
 * Uses useEffect for navigation to prevent infinite render loops.
 */
export default function Index() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const onboardingCompleted = useOnboardingStore((s) => s.isCompleted);
  const onboardingHydrated = useOnboardingStore((s) => s.isHydrated);
  const authHydrated = useAuthStore((s) => s.isHydrated);
  const [hasNavigated, setHasNavigated] = useState(false);

  const hasCompletedOnboarding =
    profile?.onboarding_completed === true || onboardingCompleted;

  useEffect(() => {
    // Wait for stores to hydrate before routing
    if (!onboardingHydrated || !authHydrated) return;
    // Only navigate once
    if (hasNavigated) return;

    setHasNavigated(true);

    // Defer navigation by one frame to ensure the navigation container is ready
    const navigateAfterMount = () => {
      try {
        // Onboarding not completed → go to onboarding
        if (!hasCompletedOnboarding) {
          router.replace('/(onboarding)/welcome');
          return;
        }

        // Initialize RevenueCat (non-blocking)
        useSubscriptionStore.getState().initialize().catch(() => {});

        // Fully ready → app
        router.replace('/(app)/(tabs)/home');
      } catch (e) {
        console.warn('[Lumina] Navigation error:', e);
      }
    };

    // Small delay ensures Expo Router navigation container is fully mounted
    setTimeout(navigateAfterMount, 50);
  }, [onboardingHydrated, authHydrated, hasNavigated]);

  // Show loading while determining route
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
    </View>
  );
}

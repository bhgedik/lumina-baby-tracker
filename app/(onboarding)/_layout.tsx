import { Stack } from 'expo-router';
import { colors } from '../../src/shared/constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="step1-parent" />
      <Stack.Screen name="step2-journey" />
      <Stack.Screen name="step3-baby" />
      <Stack.Screen name="step4-focus" />
      <Stack.Screen name="analyzing" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="paywall" options={{ gestureEnabled: false }} />
      <Stack.Screen name="create-account" />
    </Stack>
  );
}

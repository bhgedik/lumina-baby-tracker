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
      <Stack.Screen name="parent-profile" />
      <Stack.Screen name="baby-profile" />
      <Stack.Screen name="challenge" />
      <Stack.Screen name="analyzing" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="paywall" options={{ gestureEnabled: false }} />
      <Stack.Screen name="create-account" />
      <Stack.Screen name="gestational-age" />
      <Stack.Screen name="preferences" />
    </Stack>
  );
}

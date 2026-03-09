import { Stack } from 'expo-router';
import { colors } from '../../../src/shared/constants/theme';

export default function HealthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

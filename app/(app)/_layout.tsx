import { View } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/shared/constants/theme';

export default function AppLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerBackTitle: 'Home',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerBackTitle: 'Home' }} />
      </Stack>
    </View>
  );
}

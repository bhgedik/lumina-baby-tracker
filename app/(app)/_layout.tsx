import { View } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../src/shared/constants/theme';
import { useInterventionWatch } from '../../src/ai/hooks/useInterventionWatch';
import { InsightToast } from '../../src/shared/components/InsightToast';

export default function AppLayout() {
  const { nudge, dismiss } = useInterventionWatch();

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

      <InsightToast
        visible={!!nudge}
        title={nudge?.title ?? ''}
        body={nudge?.body ?? ''}
        severity={nudge?.severity ?? 'info'}
        source="Intervention Engine"
        onDismiss={dismiss}
        autoDismissMs={nudge?.severity === 'urgent' ? 15000 : 8000}
      />
    </View>
  );
}

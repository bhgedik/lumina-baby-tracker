// Auth is disabled — redirect to home
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/shared/constants/theme';

export default function LoginScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(app)/(tabs)/home');
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
    </View>
  );
}

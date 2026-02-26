import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';

const LOG_TYPES = [
  { id: 'feeding', label: 'Feeding', icon: 'coffee' as const, color: colors.secondary[400], route: '/(app)/log/feeding' },
  { id: 'sleep', label: 'Sleep', icon: 'moon' as const, color: colors.primary[400], route: '/(app)/log/sleep' },
  { id: 'diaper', label: 'Diaper', icon: 'droplet' as const, color: colors.warning, route: '/(app)/log/diaper' },
  { id: 'growth', label: 'Growth', icon: 'trending-up' as const, color: colors.success, route: '/(app)/log/growth' },
  { id: 'health', label: 'Health', icon: 'heart' as const, color: colors.error, route: '/(app)/log/health' },
  { id: 'activity', label: 'Activity', icon: 'activity' as const, color: colors.info, route: '/(app)/log/activity' },
] as const;

export default function TrackScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Quick Log</Text>
        <Text style={styles.subtitle}>What would you like to track?</Text>

        <View style={styles.grid}>
          {LOG_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.card, shadows.soft]}
              onPress={() => router.push(type.route as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconCircle, { backgroundColor: type.color + '15' }]}>
                <Feather name={type.icon} size={26} color={type.color} />
              </View>
              <Text style={styles.cardLabel}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 100 },
  title: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, paddingHorizontal: spacing.sm },
  subtitle: { fontSize: typography.fontSize.base, color: colors.textSecondary, paddingHorizontal: spacing.sm, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});

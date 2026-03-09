// ============================================================
// Sprouty — Full Article Reader
// Clean, long-form reading experience with generous typography
// Receives article data via route search params
// ============================================================

import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';

export default function ArticleScreen() {
  const router = useRouter();
  const { title, body, label, icon, accentColor } = useLocalSearchParams<{
    title: string;
    body: string;
    label?: string;
    icon?: string;
    accentColor?: string;
  }>();

  const accent = accentColor || colors.primary[500];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header bar */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Label pill */}
        {label && (
          <View style={[styles.labelPill, { backgroundColor: accent + '15' }]}>
            {icon && (
              <Feather name={icon as any} size={14} color={accent} />
            )}
            <Text style={[styles.labelText, { color: accent }]}>{label}</Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{title || 'Article'}</Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: accent + '30' }]} />

        {/* Body */}
        <Text style={styles.body}>{body || 'Content is loading...'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },

  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },

  // Label
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  labelText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Title
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight,
    marginBottom: spacing.lg,
  },

  // Divider
  divider: {
    height: 3,
    width: 48,
    borderRadius: 2,
    marginBottom: spacing['2xl'],
  },

  // Body — optimized for long-form reading
  body: {
    fontSize: typography.fontSize.md,
    color: '#3D3D3D',
    lineHeight: 28,
    letterSpacing: 0.2,
  },
});

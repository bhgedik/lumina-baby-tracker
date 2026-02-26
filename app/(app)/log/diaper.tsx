// ============================================================
// Sprout — Diaper Log Screen
// The FASTEST log in the app. WET = instant save under 2 seconds.
// Warm, squishy, emotional design.
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
// SafeAreaView not needed — Stack header handles top safe area
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { timeAgo } from '../../../src/shared/utils/dateTime';
import { useDiaperStore } from '../../../src/stores/diaperStore';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { DiaperDetailsSheet } from '../../../src/modules/diaper/components/DiaperDetailsSheet';
import { InsightToast } from '../../../src/shared/components/InsightToast';
import type { DiaperType, StoolColor, StoolConsistency } from '../../../src/shared/types/common';

export default function DiaperLogScreen() {
  const router = useRouter();
  const headerLeft = useCallback(
    () => (
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: Platform.OS === 'ios' ? -8 : 0 }}>
        <Feather name="chevron-left" size={26} color={colors.primary[600]} />
        <Text style={{ fontSize: 17, color: colors.primary[600], marginLeft: -2 }}>Home</Text>
      </Pressable>
    ),
    [router],
  );
  const baby = useBabyStore((s) => s.getActiveBaby());
  const profile = useAuthStore((s) => s.profile);
  const { quickLog, addItem, getSummaryToday, updateItem } = useDiaperStore();
  const summary = baby ? getSummaryToday(baby.id) : null;

  const [showDetails, setShowDetails] = useState(false);
  const [pendingType, setPendingType] = useState<DiaperType | null>(null);
  const [pendingLogId, setPendingLogId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; body: string; severity: 'info' | 'warning'; source: string } | null>(null);

  const lastChangeText = summary?.last_change_at
    ? timeAgo(summary.last_change_at)
    : 'No changes today';

  const handleQuickLog = useCallback((type: DiaperType) => {
    if (!baby) return;
    const familyId = profile?.family_id ?? baby.family_id;
    const loggedBy = profile?.id ?? '';

    if (type === 'wet') {
      quickLog(baby.id, familyId, loggedBy, 'wet');
      setTimeout(() => router.back(), 1500);
    } else {
      const log = quickLog(baby.id, familyId, loggedBy, type);
      setPendingType(type);
      setPendingLogId(log.id);
      setShowDetails(true);
    }
  }, [baby, profile, quickLog, router]);

  const handleDetailsSave = useCallback((details: {
    stool_color: StoolColor | null;
    stool_consistency: StoolConsistency | null;
    has_rash: boolean;
    notes: string | null;
  }) => {
    if (pendingLogId) {
      updateItem(pendingLogId, details);
      if (details.has_rash) {
        setToast({
          title: 'Diaper Rash Care: Dry First',
          body: 'Before applying rash cream, ensure the skin is COMPLETELY DRY. Applying cream on damp skin traps moisture and worsens the rash.',
          severity: 'info',
          source: 'Dermatology Best Practices',
        });
      }
    }
    setShowDetails(false);
    setPendingType(null);
    setPendingLogId(null);
    setTimeout(() => router.back(), toast ? 2000 : 500);
  }, [pendingLogId, updateItem, router]);

  const handleShowDetailsForWet = useCallback(() => {
    if (!baby) return;
    const familyId = profile?.family_id ?? baby.family_id;
    const loggedBy = profile?.id ?? '';
    const log = quickLog(baby.id, familyId, loggedBy, 'wet');
    setPendingType('wet');
    setPendingLogId(log.id);
    setShowDetails(true);
  }, [baby, profile, quickLog]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Log Diaper', headerTintColor: colors.primary[600], headerLeft, headerStyle: { backgroundColor: colors.background }, headerShadowVisible: false }} />

      <View style={styles.content}>
        <View style={[styles.lastChangePill, shadows.sm]}>
          <Feather name="clock" size={14} color={colors.textSecondary} />
          <Text style={styles.lastChange}>Last change: {lastChangeText}</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <View style={styles.circleRow}>
            <BigCircleButton
              label="WET"
              iconName="droplet"
              color={colors.info}
              onPress={() => handleQuickLog('wet')}
            />
            <BigCircleButton
              label="DIRTY"
              iconName="cloud"
              color={colors.warning}
              onPress={() => handleQuickLog('dirty')}
            />
          </View>

          <Pressable
            style={[styles.bothButton, shadows.sm]}
            onPress={() => handleQuickLog('both')}
            accessibilityRole="button"
            accessibilityLabel="Log both wet and dirty diaper"
          >
            <View style={styles.bothIconRow}>
              <Feather name="droplet" size={20} color={colors.secondary[500]} />
              <Feather name="cloud" size={20} color={colors.secondary[500]} />
            </View>
            <Text style={styles.bothLabel}>BOTH</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.addDetailsLink}
          onPress={handleShowDetailsForWet}
          accessibilityRole="button"
        >
          <Feather name="plus-circle" size={16} color={colors.primary[500]} />
          <Text style={styles.addDetailsText}>Add Details (optional)</Text>
        </Pressable>

        {summary && (
          <View style={[styles.todaySummary, shadows.soft]}>
            <Text style={styles.summaryTitle}>Today</Text>
            <View style={styles.summaryRow}>
              <SummaryStat label="Wet" value={summary.wet_count} />
              <SummaryStat label="Dirty" value={summary.dirty_count} />
              <SummaryStat label="Both" value={summary.both_count} />
              <SummaryStat label="Total" value={summary.total_changes} />
            </View>
          </View>
        )}
      </View>

      <DiaperDetailsSheet
        visible={showDetails}
        onClose={() => {
          setShowDetails(false);
          setPendingType(null);
          setPendingLogId(null);
        }}
        onSave={handleDetailsSave}
      />

      {toast && (
        <InsightToast
          visible={!!toast}
          title={toast.title}
          body={toast.body}
          severity={toast.severity}
          source={toast.source}
          onDismiss={() => setToast(null)}
        />
      )}
    </View>
  );
}

function BigCircleButton({
  label,
  iconName,
  color,
  onPress,
}: {
  label: string;
  iconName: keyof typeof Feather.glyphMap;
  color: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      accessibilityRole="button"
      accessibilityLabel={`Log ${label} diaper`}
    >
      <Animated.View style={[styles.bigCircle, shadows.md, { backgroundColor: color + '12', borderColor: color, transform: [{ scale }] }]}>
        <Feather name={iconName} size={34} color={color} />
        <Text style={[styles.bigLabel, { color }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xl, alignItems: 'center' },
  lastChangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    marginBottom: spacing['2xl'],
    marginTop: spacing.base,
  },
  lastChange: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xl,
  },
  circleRow: {
    flexDirection: 'row',
    gap: spacing['2xl'],
  },
  bigCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bigLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  bothButton: {
    width: '100%',
    height: 80,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: colors.secondary[300],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  bothIconRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bothLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary[500],
  },
  addDetailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  addDetailsText: {
    fontSize: typography.fontSize.base,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
  todaySummary: {
    marginTop: spacing.xl,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

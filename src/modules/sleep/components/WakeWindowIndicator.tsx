// ============================================================
// Lumina — Wake Window Indicator
// Color-coded progress bar: green→yellow→red
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import { formatDuration } from '../../../shared/utils/dateTime';

interface Props {
  minutesSinceWake: number;
  minMinutes: number;
  maxMinutes: number;
  status: 'early' | 'ideal' | 'overdue';
}

const STATUS_COLORS = {
  early: colors.primary[400],
  ideal: '#F5C842',
  overdue: colors.error,
};

export function WakeWindowIndicator({ minutesSinceWake, minMinutes, maxMinutes, status }: Props) {
  const totalRange = maxMinutes * 1.3; // extend bar beyond max for overdue
  const progress = Math.min(minutesSinceWake / totalRange, 1);
  const barColor = STATUS_COLORS[status];

  const statusText = status === 'early'
    ? 'Not yet sleepy'
    : status === 'ideal'
      ? 'Ideal sleep window'
      : 'May be overtired';

  return (
    <View style={[styles.container, shadows.sm]}>
      <View style={styles.labelRow}>
        <View style={styles.awakeRow}>
          <Feather name="sun" size={15} color={colors.secondary[500]} />
          <Text style={styles.awakeText}>Awake for {formatDuration(minutesSinceWake)}</Text>
        </View>
        <Text style={[styles.statusText, { color: barColor }]}>{statusText}</Text>
      </View>
      <View style={styles.trackOuter}>
        <View style={[styles.trackFill, { width: `${progress * 100}%`, backgroundColor: barColor }]} />
        {/* Ideal zone markers */}
        <View style={[styles.marker, { left: `${(minMinutes / totalRange) * 100}%` }]} />
        <View style={[styles.marker, { left: `${(maxMinutes / totalRange) * 100}%` }]} />
      </View>
      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>{formatDuration(minMinutes)}</Text>
        <Text style={styles.rangeText}>{formatDuration(maxMinutes)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing.base,
  },
  awakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  awakeText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  trackOuter: {
    height: 10,
    backgroundColor: colors.neutral[100],
    borderRadius: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 5,
  },
  marker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 12,
    backgroundColor: colors.neutral[400],
    borderRadius: 1,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  rangeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
});

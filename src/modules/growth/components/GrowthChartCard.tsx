// ============================================================
// Nodd — Growth Chart Card for Insights Feed
// Card with WHO percentile chart, segment tabs, and summary
// ============================================================

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import { SegmentControl } from '../../../shared/components/SegmentControl';
import { GrowthChart } from './GrowthChart';
import { useGrowthChartData } from '../hooks/useGrowthChartData';
import type { GrowthMetric } from '../data/whoGrowthStandards';

const METRIC_SEGMENTS = [
  { value: 'weight', label: 'Weight' },
  { value: 'length', label: 'Length' },
  { value: 'head', label: 'Head' },
];

function formatLatestValue(metric: GrowthMetric, value: number | null): string {
  if (value == null) return '—';
  if (metric === 'weight') {
    return value >= 1000 ? `${(value / 1000).toFixed(1)} kg` : `${Math.round(value)} g`;
  }
  return `${value.toFixed(1)} cm`;
}

export function GrowthChartCard() {
  const [activeMetric, setActiveMetric] = useState<GrowthMetric>('weight');
  const { measurements, sex, maxAgeMonths, latestPercentiles, latestValues, babyName, hasData } = useGrowthChartData();

  if (!hasData) return null;

  const currentPercentile = latestPercentiles[activeMetric === 'length' ? 'length' : activeMetric === 'head' ? 'head' : 'weight'];
  const currentValue = latestValues[activeMetric === 'length' ? 'length' : activeMetric === 'head' ? 'head' : 'weight'];
  const currentMeasurements = measurements[activeMetric];

  // Average percentile across all metrics for summary
  const avgPercentile = Math.round(
    (latestPercentiles.weight + latestPercentiles.length + latestPercentiles.head) / 3,
  );

  return (
    <View style={[styles.card, shadows.md]}>
      {/* Left accent bar */}
      <View style={styles.accentBar} />

      {/* Tag row */}
      <View style={styles.tagRow}>
        <View style={styles.tag}>
          <Feather name="trending-up" size={12} color={colors.primary[600]} />
          <Text style={styles.tagText}>Growth & Development</Text>
        </View>
      </View>

      {/* Hook text */}
      <Text style={styles.hook}>
        Here's how {babyName} is growing...
      </Text>

      {/* Segment Control */}
      <View style={styles.segmentWrapper}>
        <SegmentControl
          options={METRIC_SEGMENTS}
          selected={activeMetric}
          onSelect={(v) => setActiveMetric(v as GrowthMetric)}
        />
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <GrowthChart
          metric={activeMetric}
          sex={sex}
          measurements={currentMeasurements}
          maxAgeMonths={maxAgeMonths}
          compact
        />
      </View>

      {/* Summary line */}
      <Text style={styles.summary}>
        Tracking at ~{avgPercentile}th percentile • Last: {formatLatestValue(activeMetric, currentValue)}
      </Text>

      {/* CTA */}
      <Pressable style={styles.ctaButton}>
        <Feather name="message-circle" size={14} color={colors.primary[600]} />
        <Text style={styles.ctaText}>Discuss with your AI Nurse</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary[500],
    borderTopLeftRadius: borderRadius['2xl'],
    borderBottomLeftRadius: borderRadius['2xl'],
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  hook: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  segmentWrapper: {
    marginBottom: spacing.md,
  },
  chartContainer: {
    marginBottom: spacing.md,
  },
  summary: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  ctaText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
});

// ============================================================
// Lumina — Growth Chart Card
// Visual-first, interactive growth visualization
// Tap data points for percentile drill-down
// "Ask the Nurse" integration for trend context
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import { GrowthChart } from './GrowthChart';
import { useGrowthChartData } from '../hooks/useGrowthChartData';
import { calculatePercentile } from '../utils/percentileCalculation';
import type { GrowthMetric } from '../data/whoGrowthStandards';

const METRICS: { key: GrowthMetric; label: string; icon: string }[] = [
  { key: 'weight', label: 'Weight', icon: 'bar-chart-2' },
  { key: 'length', label: 'Height', icon: 'maximize-2' },
  { key: 'head', label: 'Head', icon: 'circle' },
];

function formatValue(metric: GrowthMetric, value: number): string {
  if (metric === 'weight') {
    return value >= 1000 ? `${(value / 1000).toFixed(1)} kg` : `${Math.round(value)} g`;
  }
  return `${value.toFixed(1)} cm`;
}

interface GrowthChartCardProps {
  onAskNurse?: (context: string) => void;
}

export function GrowthChartCard({ onAskNurse }: GrowthChartCardProps) {
  const [activeMetric, setActiveMetric] = useState<GrowthMetric>('weight');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const data = useGrowthChartData();

  if (!data.hasData) return null;

  const currentMeasurements = data.measurements[activeMetric];

  // Sort once for consistent indexing with GrowthChart
  const sortedMeasurements = useMemo(
    () => [...currentMeasurements].sort((a, b) => a.ageMonths - b.ageMonths),
    [currentMeasurements],
  );

  // Compute tooltip label when a point is selected
  const tooltipLabel = useMemo(() => {
    if (selectedIndex == null) return undefined;
    const point = sortedMeasurements[selectedIndex];
    if (!point) return undefined;
    const percentile = calculatePercentile(data.sex, activeMetric, point.ageMonths, point.value);
    return `${formatValue(activeMetric, point.value)} · P${Math.round(percentile)}`;
  }, [selectedIndex, sortedMeasurements, data.sex, activeMetric]);

  const handleMetricChange = useCallback((metric: GrowthMetric) => {
    setActiveMetric(metric);
    setSelectedIndex(null);
  }, []);

  const handlePointPress = useCallback((index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handleAskNurse = useCallback(() => {
    const p = data.latestPercentiles;
    const latestWeight = data.latestValues.weight != null ? formatValue('weight', data.latestValues.weight) : 'N/A';
    const latestLength = data.latestValues.length != null ? formatValue('length', data.latestValues.length) : 'N/A';

    const context = [
      `${data.babyName}'s current growth:`,
      `Weight: ${latestWeight} (P${Math.round(p.weight)})`,
      `Height: ${latestLength} (P${Math.round(p.length)})`,
      `Head: ${data.latestValues.head != null ? formatValue('head', data.latestValues.head) : 'N/A'} (P${Math.round(p.head)})`,
    ].join('\n');

    onAskNurse?.(context);
  }, [data, onAskNurse]);

  const currentPercentile = Math.round(data.latestPercentiles[activeMetric]);

  return (
    <View style={[styles.card, shadows.soft]}>
      {/* Metric toggle pills */}
      <View style={styles.metricRow}>
        {METRICS.map(({ key, label }) => {
          const isActive = activeMetric === key;
          return (
            <Pressable
              key={key}
              style={[styles.metricPill, isActive && styles.metricPillActive]}
              onPress={() => handleMetricChange(key)}
            >
              <Text style={[styles.metricPillText, isActive && styles.metricPillTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}

        {/* Current percentile badge */}
        <View style={styles.percentileBadge}>
          <Text style={styles.percentileText}>P{currentPercentile}</Text>
        </View>
      </View>

      {/* Interactive chart — hero element */}
      <Pressable onPress={handleClearSelection} style={styles.chartWrap}>
        <GrowthChart
          metric={activeMetric}
          sex={data.sex}
          measurements={currentMeasurements}
          maxAgeMonths={data.maxAgeMonths}
          selectedIndex={selectedIndex}
          onPointPress={handlePointPress}
          tooltipLabel={tooltipLabel}
        />
      </Pressable>

      {/* Hint text */}
      {selectedIndex == null && (
        <Text style={styles.hint}>Tap a data point for details</Text>
      )}

      {/* Ask Nurse CTA */}
      {onAskNurse && (
        <Pressable style={styles.nurseButton} onPress={handleAskNurse}>
          <Feather name="message-circle" size={16} color={colors.primary[600]} />
          <Text style={styles.nurseButtonText}>Ask the Nurse about this trend</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  metricPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[50],
  },
  metricPillActive: {
    backgroundColor: colors.primary[500],
  },
  metricPillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
  },
  metricPillTextActive: {
    color: colors.textInverse,
    fontWeight: typography.fontWeight.semibold,
  },
  percentileBadge: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary[50],
  },
  percentileText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary[600],
  },
  chartWrap: {
    marginHorizontal: -spacing.xs,
  },
  hint: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  nurseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  nurseButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
});

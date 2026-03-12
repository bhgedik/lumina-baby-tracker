// ============================================================
// Lumina — Pulse Card
// Dynamic daily summary hero card showing domain status
// at a glance with colored dots and summary
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import type { PulseData, DomainStatus } from '../types';

interface Props {
  pulse: PulseData;
}

const STATUS_DOT_COLOR: Record<DomainStatus, string> = {
  good: colors.success,
  attention: colors.warning,
  no_data: colors.neutral[300],
};

export function PulseCard({ pulse }: Props) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Today's Snapshot</Text>
        <Text style={styles.dayLabel}>{pulse.dayLabel}</Text>
      </View>

      {/* Domains */}
      <View style={styles.domainsRow}>
        {pulse.domains.map((domain) => (
          <View key={domain.key} style={styles.domainChip}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: STATUS_DOT_COLOR[domain.status] },
              ]}
            />
            <Feather
              name={domain.icon as any}
              size={12}
              color={STATUS_DOT_COLOR[domain.status]}
              style={styles.domainIcon}
            />
            <Text style={styles.domainLabel}>{domain.label}</Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <Text style={styles.summary}>{pulse.summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius['2xl'],
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    padding: spacing.base,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  dayLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
  },
  domainsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
    marginBottom: spacing.md,
  },
  domainChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  domainIcon: {
    marginRight: spacing.xs,
  },
  domainLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  summary: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    color: colors.primary[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
});

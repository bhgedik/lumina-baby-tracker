// ============================================================
// Lumina — Summary Card
// Dashboard stat card — warm, squishy, color-coded
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/theme';

interface StatItem {
  label: string;
  value: string;
}

interface Props {
  title: string;
  icon: React.ReactNode;
  color: string;
  stats: StatItem[];
  lastUpdated?: string | null;
  quickAction?: {
    label: string;
    onPress: () => void;
  };
}

export function SummaryCard({ title, icon, color, stats, lastUpdated, quickAction }: Props) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: color + '18' }]}>
          {icon}
        </View>
        <Text style={styles.title}>{title}</Text>
        {quickAction && (
          <Pressable
            onPress={quickAction.onPress}
            style={styles.quickAction}
            accessibilityRole="button"
          >
            <Text style={styles.quickActionText}>{quickAction.label}</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
      {lastUpdated && (
        <Text style={styles.lastUpdated}>Last: {lastUpdated}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  quickAction: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.full,
  },
  quickActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.secondary[600],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
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
  lastUpdated: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'right',
  },
});

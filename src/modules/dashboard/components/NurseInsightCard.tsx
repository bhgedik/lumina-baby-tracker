// ============================================================
// Sprout — Nurse Insight Card
// Daily static nurse briefing with sage green accent
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import type { NurseInsight } from '../../../ai/dailyNurseInsights';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

interface Props {
  insight: NurseInsight;
  ageLabel: string; // "Day 3" or "Week 6"
}

const CATEGORY_COLORS: Record<string, string> = {
  Feeding: colors.secondary[500],
  Recovery: colors.primary[500],
  Sleep: '#6B7DB3',
  Bonding: '#C9A88C',
};

export function NurseInsightCard({ insight, ageLabel }: Props) {
  const categoryColor = CATEGORY_COLORS[insight.category] ?? colors.primary[500];

  return (
    <View style={[styles.container, shadows.sm]}>
      {/* Sage green left accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Feather name="activity" size={16} color={colors.primary[500]} />
          <Text style={styles.headerTitle}>Your Nurse's Note</Text>
          <Text style={styles.ageLabel}>{ageLabel}</Text>
        </View>

        {/* Title */}
        <Text style={styles.insightTitle}>{insight.title}</Text>

        {/* Body */}
        <Text style={styles.insightBody}>{insight.body}</Text>

        {/* Category pill */}
        <View style={[styles.categoryPill, { backgroundColor: categoryColor + '18' }]}>
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {insight.category}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  accentBar: {
    width: 4,
    backgroundColor: colors.primary[500],
  },
  content: {
    flex: 1,
    padding: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
    flex: 1,
  },
  ageLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
  },
  insightTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  insightBody: {
    fontSize: typography.fontSize.base,
    fontFamily: SERIF_FONT,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    marginBottom: spacing.md,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  categoryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});

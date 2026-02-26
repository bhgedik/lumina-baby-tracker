// ============================================================
// Sprout — Baby Summary Section
// Anxiety-free baby view with natural language stat pills
// and massive one-tap quick-log buttons
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import type { CorrectedAgeResult } from '../../baby/types';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

interface Props {
  babyName: string | null;
  babyAgeDisplay: string | null;
  correctedAge: CorrectedAgeResult | null;
  lastFedAgo: string | null;
  totalFeedsToday: number;
  totalWetToday: number;
  totalDirtyToday: number;
  onQuickFeed: () => void;
  onQuickDiaper: () => void;
}

export function BabySummarySection({
  babyName,
  babyAgeDisplay,
  correctedAge,
  lastFedAgo,
  totalFeedsToday,
  totalWetToday,
  totalDirtyToday,
  onQuickFeed,
  onQuickDiaper,
}: Props) {
  const statPills: string[] = [];
  if (lastFedAgo) statPills.push(`Last fed ${lastFedAgo}`);
  if (totalFeedsToday > 0) statPills.push(`${totalFeedsToday} feed${totalFeedsToday !== 1 ? 's' : ''} today`);
  if (totalWetToday > 0) statPills.push(`${totalWetToday} wet`);
  if (totalDirtyToday > 0) statPills.push(`${totalDirtyToday} dirty`);

  return (
    <View style={styles.container}>
      {/* Baby name + age */}
      <View style={styles.nameRow}>
        <Text style={styles.babyName}>{babyName || 'Baby'}</Text>
        {babyAgeDisplay && (
          <View style={styles.ageBadge}>
            <Text style={styles.ageBadgeText}>{babyAgeDisplay}</Text>
          </View>
        )}
      </View>

      {correctedAge?.isPreterm && correctedAge.corrected && (
        <View style={styles.correctedPill}>
          <Feather name="calendar" size={11} color={colors.secondary[600]} />
          <Text style={styles.correctedText}>
            {correctedAge.forDisplay.label}: {correctedAge.forDisplay.primary}
          </Text>
        </View>
      )}

      {/* Stat pills */}
      {statPills.length > 0 && (
        <View style={styles.statRow}>
          {statPills.map((pill, i) => (
            <React.Fragment key={pill}>
              <Text style={styles.statPill}>{pill}</Text>
              {i < statPills.length - 1 && <Text style={styles.statDot}>{'\u00B7'}</Text>}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Quick-log buttons */}
      <View style={styles.quickRow}>
        <View style={styles.quickButtonWrap}>
          <Pressable
            style={[styles.quickButton, styles.quickSageShadow]}
            onPress={onQuickFeed}
            accessibilityLabel="Quick feed log"
          >
            <MaterialCommunityIcons name="baby-bottle-outline" size={32} color="#FFFDF8" />
          </Pressable>
          <Text style={styles.quickButtonLabel}>Feed</Text>
        </View>

        <View style={styles.quickButtonWrap}>
          <Pressable
            style={[styles.quickButton, styles.quickSageShadow]}
            onPress={onQuickDiaper}
            accessibilityLabel="Quick diaper log"
          >
            <Feather name="droplet" size={30} color="#FFFDF8" />
          </Pressable>
          <Text style={styles.quickButtonLabel}>Diaper</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  babyName: {
    fontSize: typography.fontSize.xl,
    fontFamily: SERIF_FONT,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  ageBadge: {
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  ageBadgeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: SERIF_FONT,
    fontWeight: typography.fontWeight.semibold,
    fontStyle: 'italic',
    color: colors.secondary[600],
  },
  correctedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  correctedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.secondary[600],
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  statPill: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  statDot: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginHorizontal: 2,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing['2xl'] + spacing.md,
  },
  quickButtonWrap: {
    alignItems: 'center',
  },
  quickButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[300],
  },
  quickSageShadow: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  quickButtonLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});

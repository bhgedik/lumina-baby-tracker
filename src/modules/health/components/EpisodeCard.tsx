// ============================================================
// Lumina — Episode Card
// Displays an illness episode with symptoms and log count
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import type { IllnessEpisode } from '../types';

interface Props {
  episode: IllnessEpisode;
  logCount: number;
  onPress: () => void;
}

function formatDateRange(started: string, resolved: string | null): string {
  const start = new Date(started);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (!resolved) return `${startStr} — ongoing`;
  const end = new Date(resolved);
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} — ${endStr}`;
}

export function EpisodeCard({ episode, logCount, onPress }: Props) {
  const isActive = episode.status === 'active';

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.card, shadows.sm, isActive && styles.activeAccent]}>
        <View style={styles.topRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title}>{episode.title}</Text>
            <Text style={styles.dateRange}>
              {formatDateRange(episode.started_at, episode.resolved_at)}
            </Text>
          </View>
          <View style={styles.logBadge}>
            <Text style={styles.logBadgeText}>{logCount}</Text>
            <Feather name="file-text" size={11} color={colors.textTertiary} />
          </View>
        </View>

        {episode.primary_symptoms.length > 0 && (
          <View style={styles.chipRow}>
            {episode.primary_symptoms.map((s) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {episode.diagnosis && (
          <View style={styles.diagnosisRow}>
            <Feather name="clipboard" size={12} color={colors.primary[500]} />
            <Text style={styles.diagnosisText}>{episode.diagnosis}</Text>
          </View>
        )}

        <View style={styles.arrowRow}>
          <Text style={styles.viewDetail}>View details</Text>
          <Feather name="chevron-right" size={16} color={colors.textTertiary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  activeAccent: {
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary[400],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  dateRange: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  logBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  logBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    color: colors.secondary[600],
  },
  diagnosisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  diagnosisText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  viewDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
});

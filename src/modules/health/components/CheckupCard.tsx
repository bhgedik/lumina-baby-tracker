// ============================================================
// Lumina — Well-Child Checkup Card (Premium)
// Warm squircle card with screening chips and age label
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants/theme';
import type { CheckupTrackingItem, VaccineStatus } from '../types';

interface Props {
  item: CheckupTrackingItem;
  onMarkCompleted: (item: CheckupTrackingItem) => void;
  dimmed?: boolean;
}

const STATUS_PALETTE: Record<VaccineStatus, {
  label: string;
  pillBg: string;
  pillText: string;
  iconBg: string;
  iconTint: string;
}> = {
  upcoming: {
    label: 'Upcoming',
    pillBg: colors.neutral[100],
    pillText: colors.textTertiary,
    iconBg: '#F0ECE6',
    iconTint: '#A8A099',
  },
  due: {
    label: 'Due Now',
    pillBg: '#FFF3E0',
    pillText: '#BF5A00',
    iconBg: '#FFF3E0',
    iconTint: '#BF5A00',
  },
  overdue: {
    label: 'Overdue',
    pillBg: '#FFEBEE',
    pillText: colors.emergency,
    iconBg: '#FFEBEE',
    iconTint: colors.emergency,
  },
  completed: {
    label: 'Done',
    pillBg: colors.primary[50],
    pillText: colors.primary[600],
    iconBg: '#EDF3EE',
    iconTint: colors.primary[500],
  },
};

export function CheckupCard({ item, onMarkCompleted, dimmed = false }: Props) {
  const palette = STATUS_PALETTE[item.status];
  const isActionable = item.status !== 'completed' && !dimmed;

  return (
    <View style={[styles.card, dimmed && styles.cardDimmed]}>
      {/* Left icon */}
      <View style={[styles.iconWrap, { backgroundColor: dimmed ? colors.neutral[100] : palette.iconBg }]}>
        <Feather
          name="clipboard" as any
          size={20}
          color={dimmed ? colors.neutral[300] : palette.iconTint}
        />
      </View>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.label, dimmed && styles.textMuted]} numberOfLines={1}>
            {item.label} Checkup
          </Text>
          <View style={[styles.statusPill, { backgroundColor: dimmed ? colors.neutral[50] : palette.pillBg }]}>
            <Text style={[styles.statusText, { color: dimmed ? colors.neutral[300] : palette.pillText }]}>
              {palette.label}
            </Text>
          </View>
        </View>

        <View style={styles.meta}>
          <Feather name="calendar" size={12} color={dimmed ? colors.neutral[300] : colors.textTertiary} />
          <Text style={[styles.date, dimmed && styles.textFaded]}>
            {item.completedDate
              ? `Completed ${item.completedDate.split('T')[0]}`
              : `Around ${item.scheduledDate}`}
          </Text>
        </View>

        {/* Screening chips */}
        {item.typicalScreenings.length > 0 && (
          <View style={styles.chipRow}>
            {item.typicalScreenings.slice(0, 3).map((s) => (
              <View key={s} style={[styles.chip, dimmed && styles.chipDimmed]}>
                <Text style={[styles.chipText, dimmed && styles.textFaded]}>{s}</Text>
              </View>
            ))}
            {item.typicalScreenings.length > 3 && (
              <View style={[styles.chip, dimmed && styles.chipDimmed]}>
                <Text style={[styles.chipText, dimmed && styles.textFaded]}>
                  +{item.typicalScreenings.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}

        {isActionable && (
          <Pressable
            style={styles.actionBtn}
            onPress={() => onMarkCompleted(item)}
            hitSlop={6}
          >
            <Feather name="check-circle" size={14} color="#FFF" />
            <Text style={styles.actionText}>Log Checkup</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: spacing.base,
    marginBottom: spacing.md,
    gap: 14,
    ...CARD_SHADOW,
  },
  cardDimmed: {
    opacity: 0.50,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  label: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    letterSpacing: -0.1,
    marginRight: spacing.sm,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  date: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  chipDimmed: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[100],
  },
  chipText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: spacing.base,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  textMuted: {
    color: colors.neutral[400],
  },
  textFaded: {
    color: colors.neutral[300],
  },
});

// ============================================================
// Lumina — Vaccine Card (Premium)
// Warm squircle card with tinted icon, status accent, and
// satisfying "Mark Given" action button
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants/theme';
import type { VaccineTrackingItem, VaccineStatus } from '../types';

interface Props {
  item: VaccineTrackingItem;
  onMarkAdministered: (item: VaccineTrackingItem) => void;
  dimmed?: boolean;
}

const STATUS_PALETTE: Record<VaccineStatus, {
  label: string;
  pillBg: string;
  pillText: string;
  iconBg: string;
  iconTint: string;
  featherIcon: string;
}> = {
  upcoming: {
    label: 'Upcoming',
    pillBg: colors.neutral[100],
    pillText: colors.textTertiary,
    iconBg: '#F0ECE6',
    iconTint: '#A8A099',
    featherIcon: 'clock',
  },
  due: {
    label: 'Due Now',
    pillBg: '#FFF3E0',
    pillText: '#BF5A00',
    iconBg: '#FFF3E0',
    iconTint: '#BF5A00',
    featherIcon: 'alert-circle',
  },
  overdue: {
    label: 'Overdue',
    pillBg: '#FFEBEE',
    pillText: colors.emergency,
    iconBg: '#FFEBEE',
    iconTint: colors.emergency,
    featherIcon: 'alert-triangle',
  },
  completed: {
    label: 'Given',
    pillBg: colors.primary[50],
    pillText: colors.primary[600],
    iconBg: '#EDF3EE',
    iconTint: colors.primary[500],
    featherIcon: 'check-circle',
  },
};

export function VaccineCard({ item, onMarkAdministered, dimmed = false }: Props) {
  const palette = STATUS_PALETTE[item.status];
  const isActionable = item.status !== 'completed' && !dimmed;

  return (
    <View style={[styles.card, dimmed && styles.cardDimmed]}>
      {/* Left accent icon wrap (like Home grid buttons) */}
      <View style={[styles.iconWrap, { backgroundColor: dimmed ? colors.neutral[100] : palette.iconBg }]}>
        <Feather
          name="shield" as any
          size={20}
          color={dimmed ? colors.neutral[300] : palette.iconTint}
        />
      </View>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.nameCol}>
            <Text style={[styles.name, dimmed && styles.textMuted]} numberOfLines={1}>
              {item.vaccineName}
            </Text>
            <Text style={[styles.dose, dimmed && styles.textFaded]}>
              Dose {item.doseNumber} · {item.shortName}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: dimmed ? colors.neutral[50] : palette.pillBg }]}>
            <Text style={[styles.statusText, { color: dimmed ? colors.neutral[300] : palette.pillText }]}>
              {palette.label}
            </Text>
          </View>
        </View>

        <View style={styles.meta}>
          <Feather name="calendar" size={12} color={dimmed ? colors.neutral[300] : colors.textTertiary} />
          <Text style={[styles.date, dimmed && styles.textFaded]}>
            {item.administeredDate
              ? `Given ${item.administeredDate}`
              : `Scheduled ${item.scheduledDate}`}
          </Text>
        </View>

        {/* Action button — only for actionable cards */}
        {isActionable && (
          <Pressable
            style={styles.actionBtn}
            onPress={() => onMarkAdministered(item)}
            hitSlop={6}
          >
            <Feather name="check-circle" size={14} color="#FFF" />
            <Text style={styles.actionText}>Mark Given</Text>
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
  nameCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  dose: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 1,
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
    marginBottom: 10,
  },
  date: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
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

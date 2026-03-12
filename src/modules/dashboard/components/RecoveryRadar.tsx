// ============================================================
// Lumina — Recovery Radar
// Mother's recovery section: Medication tracker
// ============================================================

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import {
  useMotherMedsStore,
  type ActiveMed,
} from '../../../stores/motherMedsStore';

interface Props {
  nextMedDue: ActiveMed | null;
  activeMeds: ActiveMed[];
  isMedHidden: boolean;
  onAddMedPress: () => void;
  onHideMeds: () => void;
}

function formatCountdown(nextDueAt: number): string {
  const diff = nextDueAt - Date.now();
  if (diff <= 0) return 'Overdue';
  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

function formatDueTime(nextDueAt: number): string {
  const d = new Date(nextDueAt);
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${period}`;
}

export function RecoveryRadar({ nextMedDue, activeMeds, isMedHidden, onAddMedPress, onHideMeds }: Props) {
  const recordTaken = useMotherMedsStore((s) => s.recordTaken);

  // Tick every 60s for live countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const isOverdue = nextMedDue?.nextDueAt ? nextMedDue.nextDueAt <= Date.now() : false;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Feather name="heart" size={16} color={colors.secondary[500]} />
        <Text style={styles.sectionTitle}>Your Recovery</Text>
      </View>

      {/* Medication Card */}
      {!isMedHidden && (
        activeMeds.length === 0 ? (
          <View style={[styles.medCard, shadows.sm]}>
            <Pressable style={styles.medEmptyRow} onPress={onAddMedPress}>
              <Feather name="plus-circle" size={20} color={colors.primary[500]} />
              <View style={styles.medCardTextWrap}>
                <Text style={styles.medCardTitle}>Track your medication</Text>
                <Text style={styles.medCardSub}>Tap to add pain meds or supplements</Text>
              </View>
            </Pressable>
            <Pressable style={styles.hideLink} onPress={onHideMeds}>
              <Feather name="eye-off" size={14} color={colors.textTertiary} />
              <Text style={styles.hideLinkText}>Hide this section</Text>
            </Pressable>
          </View>
        ) : nextMedDue?.nextDueAt ? (
          <View style={[styles.medCard, shadows.sm, isOverdue && styles.medCardOverdue]}>
            <View style={styles.medCardContent}>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{nextMedDue.medName}</Text>
                <Text style={[styles.medDueText, isOverdue && styles.medDueOverdue]}>
                  {isOverdue
                    ? `Overdue — was due at ${formatDueTime(nextMedDue.nextDueAt)}`
                    : `Due at ${formatDueTime(nextMedDue.nextDueAt)} (${formatCountdown(nextMedDue.nextDueAt)})`
                  }
                </Text>
              </View>
              <Pressable
                style={[styles.takenButton, isOverdue && styles.takenButtonOverdue]}
                onPress={() => recordTaken(nextMedDue.medName)}
              >
                <Feather name="check" size={18} color={colors.textInverse} />
                <Text style={styles.takenButtonText}>Taken</Text>
              </Pressable>
            </View>
            {activeMeds.length > 1 && (
              <Pressable style={styles.manageMedsLink} onPress={onAddMedPress}>
                <Text style={styles.manageMedsText}>Manage medications</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={[styles.medCard, shadows.sm]}>
            <View style={styles.medCardContent}>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{activeMeds[0].medName}</Text>
                <Text style={styles.medDueText}>Tap "Taken" when you take your next dose</Text>
              </View>
              <Pressable
                style={styles.takenButton}
                onPress={() => recordTaken(activeMeds[0].medName)}
              >
                <Feather name="check" size={18} color={colors.textInverse} />
                <Text style={styles.takenButtonText}>Taken</Text>
              </Pressable>
            </View>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  medCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  medCardOverdue: {
    backgroundColor: colors.secondary[50],
  },
  medEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  medCardTextWrap: {
    flex: 1,
  },
  hideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  hideLinkText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  medCardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  medCardSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  medCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  medDueText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  medDueOverdue: {
    color: colors.secondary[600],
    fontWeight: typography.fontWeight.medium,
  },
  takenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  takenButtonOverdue: {
    backgroundColor: colors.secondary[500],
  },
  takenButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },
  manageMedsLink: {
    marginTop: spacing.sm,
  },
  manageMedsText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
});

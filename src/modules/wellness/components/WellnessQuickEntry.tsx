// ============================================================
// Nodd — Wellness Quick Entry (Home Screen Card)
// Mood emoji row + symptom/weight action buttons
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import { MoodIconMap } from '../../../shared/components/MoodIcons';
import { useMotherMoodStore, MOOD_CONFIG, type MoodEmoji } from '../../../stores/motherMoodStore';

const MOODS: MoodEmoji[] = ['radiant', 'good', 'okay', 'struggling', 'overwhelmed'];

interface Props {
  onNavigate: () => void;
}

export function WellnessQuickEntry({ onNavigate }: Props) {
  const logMood = useMotherMoodStore((s) => s.logMood);
  const entries = useMotherMoodStore((s) => s.entries);
  const todaysMood = useMemo(() => {
    const todayEntries = entries.filter((e) => {
      const d = new Date(e.loggedAt);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();
    });
    return todayEntries.length > 0 ? todayEntries[todayEntries.length - 1] : null;
  }, [entries]);

  return (
    <View style={[styles.card, shadows.soft]}>
      {/* Header */}
      <View style={styles.header}>
        <Feather name="heart" size={18} color={colors.secondary[500]} />
        <Text style={styles.headerText}>My Wellness</Text>
      </View>

      {/* Mood icons — no labels */}
      <View style={styles.moodRow}>
        {MOODS.map((mood) => {
          const Icon = MoodIconMap[mood];
          const isSelected = todaysMood?.mood === mood;
          return (
            <Pressable
              key={mood}
              style={[styles.moodButton, isSelected && styles.moodButtonSelected]}
              onPress={() => logMood(mood)}
              accessibilityLabel={MOOD_CONFIG[mood].label}
            >
              <Icon size={32} color={MOOD_CONFIG[mood].color} />
            </Pressable>
          );
        })}
      </View>

      {/* Action button */}
      <Pressable style={styles.actionButton} onPress={onNavigate}>
        <Feather name="thermometer" size={16} color={colors.primary[600]} />
        <Text style={styles.actionText}>Log Symptom</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodButtonSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
});

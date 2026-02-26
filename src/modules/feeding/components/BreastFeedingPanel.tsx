// ============================================================
// Sprout — Breast Feeding Panel
// Warm, squishy Left/Right toggle + timer + side switching
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SegmentControl } from '../../../shared/components/SegmentControl';
import { TimerDisplay } from '../../../shared/components/TimerDisplay';
import { QuickButton } from '../../../shared/components/QuickButton';
import { useFeedingTimer } from '../hooks/useFeedingTimer';
import { useFeedingStore } from '../../../stores/feedingStore';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import { formatTimerSeconds } from '../../../shared/utils/dateTime';

const SIDE_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

interface Props {
  onTimerStop: () => void;
}

export function BreastFeedingPanel({ onTimerStop }: Props) {
  const { startTimer, pauseTimer, resumeTimer, switchSide, stopTimer, activeTimer } = useFeedingStore();
  const { elapsedSeconds, leftSeconds, rightSeconds, isRunning, isPaused, currentSide } = useFeedingTimer();

  const hasStarted = !!activeTimer;

  const handleStart = () => {
    startTimer('breast', 'left');
  };

  const handleStop = () => {
    stopTimer();
    onTimerStop();
  };

  return (
    <View style={styles.container}>
      {/* Side selector */}
      {hasStarted && (
        <SegmentControl
          options={SIDE_OPTIONS}
          selected={currentSide ?? 'left'}
          onSelect={() => switchSide()}
          size="large"
        />
      )}

      {/* Timer */}
      <TimerDisplay
        elapsedSeconds={elapsedSeconds}
        isRunning={isRunning}
        label={hasStarted ? `${currentSide === 'left' ? 'Left' : 'Right'} breast` : 'Breast feeding'}
        onStart={handleStart}
        onPause={pauseTimer}
        onResume={resumeTimer}
        onStop={handleStop}
      />

      {/* Switch side button */}
      {hasStarted && (
        <View style={styles.switchContainer}>
          <QuickButton
            icon={<Feather name="refresh-cw" size={24} color={colors.secondary[500]} />}
            label="Switch Side"
            onPress={switchSide}
            size={70}
            color={colors.secondary[500]}
            variant="outlined"
          />
        </View>
      )}

      {/* Side durations */}
      {hasStarted && (
        <View style={[styles.sidesRow, shadows.sm]}>
          <View style={[styles.sideBox, currentSide === 'left' && styles.sideBoxActive]}>
            <Text style={styles.sideLabel}>Left</Text>
            <Text style={[styles.sideDuration, currentSide === 'left' && styles.activeSide]}>
              {formatTimerSeconds(leftSeconds)}
            </Text>
          </View>
          <View style={styles.sideDivider} />
          <View style={[styles.sideBox, currentSide === 'right' && styles.sideBoxActive]}>
            <Text style={styles.sideLabel}>Right</Text>
            <Text style={[styles.sideDuration, currentSide === 'right' && styles.activeSide]}>
              {formatTimerSeconds(rightSeconds)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.base,
  },
  switchContainer: {
    alignItems: 'center',
  },
  sidesRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.base,
    marginTop: spacing.xs,
  },
  sideBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  sideBoxActive: {
    backgroundColor: colors.primary[50],
  },
  sideDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
    marginHorizontal: spacing.sm,
  },
  sideLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  sideDuration: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  activeSide: {
    color: colors.primary[600],
  },
});

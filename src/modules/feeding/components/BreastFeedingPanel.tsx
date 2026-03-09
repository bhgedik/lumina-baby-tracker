// ============================================================
// Sprouty — Breast Feeding Panel
// Side-by-side "Start Left" / "Start Right" pills
// Active = Sage Green · Inactive = Dimmed · No modals
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TimerDisplay } from '../../../shared/components/TimerDisplay';
import { useFeedingTimer } from '../hooks/useFeedingTimer';
import { useFeedingStore } from '../../../stores/feedingStore';
import { typography, spacing } from '../../../shared/constants/theme';
import { formatTimerSeconds } from '../../../shared/utils/dateTime';

interface Props {
  onTimerStop: () => void;
}

export function BreastFeedingPanel({ onTimerStop }: Props) {
  const { startTimer, pauseTimer, resumeTimer, switchSide, stopTimer, activeTimer } = useFeedingStore();
  const { elapsedSeconds, leftSeconds, rightSeconds, isRunning, isPaused, currentSide } = useFeedingTimer();

  const hasStarted = !!activeTimer;

  const handleSideTap = (side: 'left' | 'right') => {
    if (!hasStarted) {
      startTimer('breast', side);
    } else if (currentSide !== side) {
      switchSide();
      // If paused, resume on the new side
      if (isPaused) resumeTimer();
    }
  };

  const handleStop = () => {
    stopTimer();
    onTimerStop();
  };

  const isLeftActive = hasStarted && currentSide === 'left';
  const isRightActive = hasStarted && currentSide === 'right';

  return (
    <View style={styles.container}>
      {/* Timer — always rendered, controls appear only after start */}
      <TimerDisplay
        elapsedSeconds={elapsedSeconds}
        isRunning={isRunning}
        label={hasStarted ? `${currentSide === 'left' ? 'Left' : 'Right'} breast` : 'Breast feeding'}
        onPause={hasStarted ? pauseTimer : undefined}
        onResume={hasStarted ? resumeTimer : undefined}
        onStop={hasStarted ? handleStop : undefined}
      />

      {/* Side-by-side pills */}
      <View style={styles.pillRow}>
        {/* Left pill */}
        <Pressable
          style={[
            styles.pill,
            isLeftActive && styles.pillActive,
            hasStarted && !isLeftActive && styles.pillDimmed,
          ]}
          onPress={() => handleSideTap('left')}
          accessibilityLabel={hasStarted ? 'Switch to left' : 'Start left breast'}
        >
          <Feather
            name="chevron-left"
            size={18}
            color={isLeftActive ? '#FFF' : '#3D3D3D'}
          />
          <View style={styles.pillInner}>
            <Text style={[styles.pillLabel, isLeftActive && styles.pillLabelActive]}>
              {hasStarted ? 'Left' : 'Start Left'}
            </Text>
            {hasStarted && (
              <Text style={[styles.pillTime, isLeftActive && styles.pillTimeActive]}>
                {formatTimerSeconds(leftSeconds)}
              </Text>
            )}
          </View>
        </Pressable>

        {/* Right pill */}
        <Pressable
          style={[
            styles.pill,
            isRightActive && styles.pillActive,
            hasStarted && !isRightActive && styles.pillDimmed,
          ]}
          onPress={() => handleSideTap('right')}
          accessibilityLabel={hasStarted ? 'Switch to right' : 'Start right breast'}
        >
          <View style={styles.pillInner}>
            <Text style={[styles.pillLabel, isRightActive && styles.pillLabelActive]}>
              {hasStarted ? 'Right' : 'Start Right'}
            </Text>
            {hasStarted && (
              <Text style={[styles.pillTime, isRightActive && styles.pillTimeActive]}>
                {formatTimerSeconds(rightSeconds)}
              </Text>
            )}
          </View>
          <Feather
            name="chevron-right"
            size={18}
            color={isRightActive ? '#FFF' : '#3D3D3D'}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },

  // Side-by-side pill row
  pillRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0EAE1',
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  pillActive: {
    backgroundColor: '#8BA88E',
  },
  pillDimmed: {
    opacity: 0.5,
  },
  pillInner: {
    alignItems: 'center',
    gap: 2,
  },
  pillLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3D3D3D',
  },
  pillLabelActive: {
    color: '#FFFFFF',
  },
  pillTime: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8A8A',
    fontVariant: ['tabular-nums'],
  },
  pillTimeActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
});

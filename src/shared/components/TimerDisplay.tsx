// ============================================================
// Sprout — Timer Display
// Warm, squishy countup display with Feather icon controls
// ============================================================

import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../constants/theme';
import { formatTimerSeconds } from '../utils/dateTime';

interface Props {
  elapsedSeconds: number;
  isRunning: boolean;
  label?: string;
  mode?: 'full' | 'compact';
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

export function TimerDisplay({
  elapsedSeconds,
  isRunning,
  label,
  mode = 'full',
  onStart,
  onPause,
  onResume,
  onStop,
}: Props) {
  if (mode === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactTime}>{formatTimerSeconds(elapsedSeconds)}</Text>
        {label && <Text style={styles.compactLabel}>{label}</Text>}
      </View>
    );
  }

  const hasStarted = elapsedSeconds > 0 || isRunning;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Text style={styles.time}>{formatTimerSeconds(elapsedSeconds)}</Text>
      <View style={styles.controls}>
        {!hasStarted && onStart && (
          <TimerButton
            iconName="play"
            label="Start"
            color={colors.primary[500]}
            onPress={onStart}
          />
        )}
        {hasStarted && isRunning && onPause && (
          <TimerButton
            iconName="pause"
            label="Pause"
            color={colors.warning}
            onPress={onPause}
          />
        )}
        {hasStarted && !isRunning && onResume && (
          <TimerButton
            iconName="play"
            label="Resume"
            color={colors.primary[500]}
            onPress={onResume}
          />
        )}
        {hasStarted && onStop && (
          <TimerButton
            iconName="square"
            label="Stop"
            color={colors.error}
            onPress={onStop}
          />
        )}
      </View>
    </View>
  );
}

function TimerButton({
  iconName,
  label,
  color,
  onPress,
}: {
  iconName: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
      }
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[styles.button, { backgroundColor: color, transform: [{ scale }] }, shadows.md]}
      >
        <Feather name={iconName} size={20} color={colors.textInverse} />
        <Text style={styles.buttonLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  time: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.lg,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 9,
    color: colors.textInverse,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compactTime: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  compactLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});

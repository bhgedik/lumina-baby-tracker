// ============================================================
// Sprout — Active Timer Bar
// Warm floating mini-bar when any timer is active
// ============================================================

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/theme';
import { formatTimerSeconds } from '../utils/dateTime';
import { useFeedingStore } from '../../stores/feedingStore';
import { useSleepStore } from '../../stores/sleepStore';

export function ActiveTimerBar() {
  const router = useRouter();
  const feedingTimer = useFeedingStore((s) => s.activeTimer);
  const sleepTimer = useSleepStore((s) => s.activeTimer);
  const pauseFeeding = useFeedingStore((s) => s.pauseTimer);

  const [elapsed, setElapsed] = useState(0);

  const activeTimer = feedingTimer ?? sleepTimer;
  const timerType = feedingTimer ? 'feeding' : sleepTimer ? 'sleep' : null;

  useEffect(() => {
    if (!activeTimer) {
      setElapsed(0);
      return;
    }

    const tick = () => {
      const isPaused = feedingTimer && feedingTimer.pausedAt;
      if (isPaused) {
        setElapsed(feedingTimer.accumulatedSeconds);
      } else {
        const base = feedingTimer ? feedingTimer.accumulatedSeconds : 0;
        const running = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
        setElapsed(base + running);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeTimer, feedingTimer]);

  if (!activeTimer) return null;

  const iconName: keyof typeof Feather.glyphMap = timerType === 'feeding' ? 'coffee' : 'moon';
  const label = timerType === 'feeding'
    ? `Feeding${feedingTimer?.side ? ` (${feedingTimer.side})` : ''}`
    : `Sleep (${sleepTimer?.type})`;
  const navTarget = timerType === 'feeding' ? '/(app)/log/feeding' : '/(app)/log/sleep';

  return (
    <Pressable
      style={[styles.container, shadows.md]}
      onPress={() => router.push(navTarget as any)}
      accessibilityRole="button"
      accessibilityLabel={`${label} timer running`}
    >
      <View style={styles.iconWrap}>
        <Feather name={iconName} size={16} color={colors.primary[600]} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.time}>{formatTimerSeconds(elapsed)}</Text>
      {timerType === 'feeding' && feedingTimer && !feedingTimer.pausedAt && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            pauseFeeding();
          }}
          style={styles.pauseButton}
          accessibilityLabel="Pause timer"
        >
          <Feather name="pause" size={14} color={colors.primary[600]} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[700],
  },
  time: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    fontVariant: ['tabular-nums'],
  },
  pauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
});

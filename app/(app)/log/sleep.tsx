// ============================================================
// Sprout — Sleep Log Screen
// Warm, squishy timer-based sleep tracking with wake window
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, Animated, ScrollView, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
// SafeAreaView not needed — Stack header handles top safe area
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { formatTimerSeconds } from '../../../src/shared/utils/dateTime';
import { SegmentControl } from '../../../src/shared/components/SegmentControl';
import { InsightToast } from '../../../src/shared/components/InsightToast';
import { WakeWindowIndicator } from '../../../src/modules/sleep/components/WakeWindowIndicator';
import { SleepDetailsPanel } from '../../../src/modules/sleep/components/SleepDetailsPanel';
import { useSleepTimer } from '../../../src/modules/sleep/hooks/useSleepTimer';
import { useWakeWindow } from '../../../src/modules/sleep/hooks/useWakeWindow';
import { useSleepStore } from '../../../src/stores/sleepStore';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { useFeedingStore } from '../../../src/stores/feedingStore';
import { calculateCorrectedAge } from '../../../src/modules/baby/utils/correctedAge';
import type { SleepType, SleepMethod, SleepLocation, Rating } from '../../../src/shared/types/common';

const SLEEP_TYPE_OPTIONS = [
  { value: 'nap', label: 'Nap' },
  { value: 'night', label: 'Night' },
];

export default function SleepLogScreen() {
  const router = useRouter();
  const headerLeft = useCallback(
    () => (
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: Platform.OS === 'ios' ? -8 : 0 }}>
        <Feather name="chevron-left" size={26} color={colors.primary[600]} />
        <Text style={{ fontSize: 17, color: colors.primary[600], marginLeft: -2 }}>Home</Text>
      </Pressable>
    ),
    [router],
  );
  const baby = useBabyStore((s) => s.getActiveBaby());
  const profile = useAuthStore((s) => s.profile);
  const { startSleep, endSleep, addItem, updateItem, activeTimer } = useSleepStore();
  const feedingTimer = useFeedingStore((s) => s.activeTimer);

  const correctedAge = baby ? calculateCorrectedAge(baby) : null;
  const ageMonths = correctedAge?.effectiveAgeMonths ?? 3;

  const { elapsedSeconds, isRunning } = useSleepTimer();
  const { minutesSinceWake, wakeWindowConfig, status } = useWakeWindow(baby?.id, ageMonths);

  const [sleepType, setSleepType] = useState<SleepType>('nap');
  const [showDetails, setShowDetails] = useState(false);
  const [completedLogId, setCompletedLogId] = useState<string | null>(null);

  const [method, setMethod] = useState<SleepMethod | null>(null);
  const [location, setLocation] = useState<SleepLocation | null>(null);
  const [roomTemp, setRoomTemp] = useState(21.0);
  const [quality, setQuality] = useState<Rating | null>(null);
  const [nightWakings, setNightWakings] = useState(0);
  const [toast, setToast] = useState<{ title: string; body: string; severity: 'info' | 'warning'; source: string } | null>(null);

  const startScale = useRef(new Animated.Value(1)).current;
  const stopScale = useRef(new Animated.Value(1)).current;

  const handleStartSleep = useCallback(() => {
    if (feedingTimer) return;
    startSleep(sleepType);
  }, [feedingTimer, startSleep, sleepType]);

  const handleEndSleep = useCallback(() => {
    const log = endSleep();
    if (log && baby) {
      const completedLog = {
        ...log,
        baby_id: baby.id,
        family_id: profile?.family_id ?? baby.family_id,
        logged_by: profile?.id ?? '',
        type: sleepType,
      };
      addItem(completedLog);
      setCompletedLogId(completedLog.id);
      setShowDetails(true);

      if (roomTemp) {
        setToast({
          title: 'Sleep Layering Guide (TOG Scale)',
          body: roomTemp > 25
            ? 'Room is warm — use only a short-sleeve bodysuit or light 0.5 TOG sleep sack.'
            : roomTemp < 18
              ? 'Room is cool — use a bodysuit with a 2.5-3.5 TOG sleep sack.'
              : 'Room is ideal (20-22°C) — bodysuit + 1.0-1.5 TOG sleep sack is perfect.',
          severity: 'info',
          source: 'The Lullaby Trust / Red Nose Safe Sleep',
        });
      }
    }
  }, [endSleep, baby, profile, sleepType, addItem, roomTemp]);

  const handleSaveDetails = useCallback(() => {
    if (completedLogId) {
      updateItem(completedLogId, {
        method,
        location,
        room_temperature_celsius: roomTemp,
        quality,
        night_wakings: sleepType === 'night' ? nightWakings : null,
      });
    }
    setShowDetails(false);
    setTimeout(() => router.back(), 500);
  }, [completedLogId, method, location, roomTemp, quality, nightWakings, sleepType, updateItem, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Log Sleep', headerTintColor: colors.primary[600], headerLeft, headerStyle: { backgroundColor: colors.background }, headerShadowVisible: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Wake Window */}
        {minutesSinceWake !== null && (
          <WakeWindowIndicator
            minutesSinceWake={minutesSinceWake}
            minMinutes={wakeWindowConfig.min_minutes}
            maxMinutes={wakeWindowConfig.max_minutes}
            status={status}
          />
        )}

        {/* Sleep Type Selector */}
        {!activeTimer && (
          <View style={styles.typeSelector}>
            <SegmentControl
              options={SLEEP_TYPE_OPTIONS}
              selected={sleepType}
              onSelect={(v) => setSleepType(v as SleepType)}
              size="large"
            />
          </View>
        )}

        {/* Start Button */}
        {!activeTimer && !showDetails && (
          <View style={styles.startContainer}>
            {feedingTimer && (
              <View style={styles.conflictPill}>
                <Feather name="alert-circle" size={14} color={colors.warning} />
                <Text style={styles.conflictText}>Feeding timer is active — stop it first</Text>
              </View>
            )}
            <Pressable
              onPress={handleStartSleep}
              onPressIn={() => Animated.spring(startScale, { toValue: 0.92, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(startScale, { toValue: 1, useNativeDriver: true }).start()}
              disabled={!!feedingTimer}
              accessibilityRole="button"
              accessibilityLabel="Start sleep"
            >
              <Animated.View style={[
                styles.hugeButton,
                styles.startButton,
                shadows.soft,
                feedingTimer && styles.disabledButton,
                { transform: [{ scale: startScale }] },
              ]}>
                <Feather name="moon" size={40} color={colors.textInverse} />
                <Text style={styles.hugeButtonLabel}>Start Sleep</Text>
              </Animated.View>
            </Pressable>
          </View>
        )}

        {/* Active Timer */}
        {activeTimer && !showDetails && (
          <View style={styles.timerContainer}>
            <View style={styles.timerLabelRow}>
              <Feather name="moon" size={18} color={colors.primary[500]} />
              <Text style={styles.timerLabel}>
                {activeTimer.type === 'nap' ? 'Nap' : 'Night Sleep'} in progress
              </Text>
            </View>
            <Text style={styles.timerDisplay}>{formatTimerSeconds(elapsedSeconds)}</Text>
            <Pressable
              onPress={handleEndSleep}
              onPressIn={() => Animated.spring(stopScale, { toValue: 0.92, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(stopScale, { toValue: 1, useNativeDriver: true }).start()}
              accessibilityRole="button"
              accessibilityLabel="End sleep"
            >
              <Animated.View style={[styles.hugeButton, styles.stopButton, shadows.md, { transform: [{ scale: stopScale }] }]}>
                <Feather name="square" size={36} color={colors.textInverse} />
                <Text style={styles.hugeButtonLabel}>End Sleep</Text>
              </Animated.View>
            </Pressable>
          </View>
        )}

        {/* Details after stopping */}
        {showDetails && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Sleep Details</Text>
            <SleepDetailsPanel
              method={method}
              location={location}
              roomTemp={roomTemp}
              quality={quality}
              nightWakings={nightWakings}
              sleepType={sleepType}
              onMethodChange={setMethod}
              onLocationChange={setLocation}
              onRoomTempChange={setRoomTemp}
              onQualityChange={setQuality}
              onNightWakingsChange={setNightWakings}
            />
            <Pressable style={[styles.saveButton, shadows.sm]} onPress={handleSaveDetails} accessibilityRole="button">
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {toast && (
        <InsightToast
          visible={!!toast}
          title={toast.title}
          body={toast.body}
          severity={toast.severity}
          source={toast.source}
          onDismiss={() => setToast(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, alignItems: 'center' },
  typeSelector: { width: '100%', marginBottom: spacing.xl },
  startContainer: { alignItems: 'center', marginTop: spacing['2xl'] },
  conflictPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  conflictText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
  },
  hugeButton: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  startButton: {
    backgroundColor: colors.primary[500],
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  disabledButton: {
    opacity: 0.4,
  },
  hugeButtonLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xl,
  },
  timerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timerLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  timerDisplay: {
    fontSize: 56,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  detailsContainer: {
    width: '100%',
    marginTop: spacing.base,
  },
  detailsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  saveButton: {
    height: 56,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },
});

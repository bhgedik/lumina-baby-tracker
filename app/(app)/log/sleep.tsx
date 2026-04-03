// ============================================================
// Lumina — Sleep Log Screen (State-Based)
// Three vertical state buttons: Falling Asleep → Deep Sleep → Waking Up
// No timers — each tap logs a timestamped state transition
// ============================================================

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  ScrollView,
  StyleSheet,
  Platform,
  Vibration,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { LuminaWhisper } from '../../../src/shared/components/LuminaWhisper';
import { useSleepStore } from '../../../src/stores/sleepStore';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { generateUUID } from '../../../src/stores/createSyncedStore';
import type { SleepLog } from '../../../src/modules/sleep/types';

// ── Design tokens ────────────────────────────────────────────
const UI = {
  bg: '#F7F4F0',
  card: '#FFFFFF',
  text: '#2D2A26',
  textSecondary: '#5C5C5C',  // body text — readable on cream
  textMuted: '#8A8A8A',      // small labels, captions
  accent: '#F2B89C',
};

const CLAY_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 6,
};

const CLAY_INNER = {
  borderTopWidth: 2,
  borderLeftWidth: 1.5,
  borderTopColor: 'rgba(255,255,255,0.9)',
  borderLeftColor: 'rgba(255,255,255,0.6)',
  borderBottomWidth: 1.5,
  borderRightWidth: 1,
  borderBottomColor: 'rgba(0,0,0,0.04)',
  borderRightColor: 'rgba(0,0,0,0.02)',
};

// ── Sleep states ─────────────────────────────────────────────

type SleepPhase = 'falling_asleep' | 'deep_sleep' | 'waking_up';

interface SleepState {
  id: SleepPhase;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  iconBg: string;
  iconTint: string;
  activeBg: string;
  activeBorder: string;
}

const SLEEP_STATES: SleepState[] = [
  {
    id: 'falling_asleep',
    label: 'Falling Asleep',
    description: 'Baby is in my arms, transitioning to sleep.',
    icon: 'heart',
    iconBg: '#F3EEF8',
    iconTint: '#9B7DB8',
    activeBg: '#F0EAF5',
    activeBorder: '#C4ABD8',
  },
  {
    id: 'deep_sleep',
    label: 'Deep Sleep',
    description: 'Baby is now in the crib, sound asleep.',
    icon: 'moon',
    iconBg: '#F0EBF5',
    iconTint: '#A78BBA',
    activeBg: '#E8F0E9',
    activeBorder: '#B199CE',
  },
  {
    id: 'waking_up',
    label: 'Waking Up',
    description: 'Baby has woken up, ending the session.',
    icon: 'sun',
    iconBg: '#FEF4E8',
    iconTint: '#C4943A',
    activeBg: '#FDF0DE',
    activeBorder: '#D4A84B',
  },
];

// ── Helpers ──────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}

function hapticTap() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    Vibration.vibrate(10);
  }
}

// ── Main component ───────────────────────────────────────────

export default function SleepLogScreen() {
  const router = useRouter();
  const baby = useBabyStore((s) => s.getActiveBaby());
  const profile = useAuthStore((s) => s.profile);
  const { addItem } = useSleepStore();

  const headerLeft = useCallback(
    () => (
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ flexDirection: 'row', alignItems: 'center', marginLeft: Platform.OS === 'ios' ? -8 : 0 }}
      >
        <Feather name="chevron-left" size={26} color={colors.primary[600]} />
        <Text style={{ fontSize: 17, color: colors.primary[600], marginLeft: -2 }}>Home</Text>
      </Pressable>
    ),
    [router],
  );

  // Current active phase + timestamps for each phase
  const [activePhase, setActivePhase] = useState<SleepPhase | null>(null);
  const [phaseTimestamps, setPhaseTimestamps] = useState<Record<string, string>>({});
  const [sessionLogId, setSessionLogId] = useState<string | null>(null);
  const [whisper, setWhisper] = useState<string | null>(null);

  // Animated scales for each button
  const scales = useRef(
    SLEEP_STATES.reduce(
      (acc, s) => ({ ...acc, [s.id]: new Animated.Value(1) }),
      {} as Record<SleepPhase, Animated.Value>,
    ),
  ).current;

  const babyName = baby?.name ?? 'Baby';

  const statusText = useMemo(() => {
    if (!activePhase) return null;
    const state = SLEEP_STATES.find((s) => s.id === activePhase);
    if (!state) return null;

    switch (activePhase) {
      case 'falling_asleep':
        return `${babyName} is falling asleep...`;
      case 'deep_sleep':
        return `${babyName} is in deep sleep`;
      case 'waking_up':
        return `${babyName} has woken up`;
      default:
        return null;
    }
  }, [activePhase, babyName]);

  const handlePhasePress = useCallback(
    (phase: SleepPhase) => {
      hapticTap();

      const now = new Date().toISOString();

      // Record the timestamp for this phase
      setPhaseTimestamps((prev) => ({ ...prev, [phase]: now }));
      setActivePhase(phase);

      // If "Waking Up" is pressed, finalize and log the sleep session
      if (phase === 'waking_up') {
        if (!baby) return;

        const startedAt = phaseTimestamps.falling_asleep ?? phaseTimestamps.deep_sleep ?? now;
        const endedAt = now;
        const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
        const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

        const log: SleepLog = {
          id: generateUUID(),
          baby_id: baby.id,
          family_id: profile?.family_id ?? baby.family_id,
          logged_by: profile?.id ?? '',
          type: 'nap',
          started_at: startedAt,
          ended_at: endedAt,
          duration_minutes: durationMinutes,
          method: null,
          location: null,
          quality: null,
          night_wakings: null,
          room_temperature_celsius: null,
          notes: buildNotes(phaseTimestamps, now),
          created_at: now,
          updated_at: now,
        };

        addItem(log);
        setSessionLogId(log.id);
        setWhisper(`\u2728 Sweet dreams recorded. ${durationMinutes} min.`);
      } else {
        setWhisper(`\u2728 ${SLEEP_STATES.find((s) => s.id === phase)?.label} noted.`);
      }
    },
    [baby, profile, addItem, phaseTimestamps],
  );

  // Check if a phase is disabled (enforce order: falling_asleep → deep_sleep → waking_up)
  const isPhaseDisabled = useCallback(
    (phase: SleepPhase): boolean => {
      if (phase === 'falling_asleep') return activePhase !== null;
      if (phase === 'deep_sleep') return activePhase !== 'falling_asleep';
      if (phase === 'waking_up') return activePhase !== 'deep_sleep' && activePhase !== 'falling_asleep';
      return false;
    },
    [activePhase],
  );

  const sessionComplete = activePhase === 'waking_up';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Sleep',
          headerTintColor: colors.primary[600],
          headerLeft,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status banner */}
        {statusText && (
          <View style={styles.statusBanner}>
            <Feather
              name={activePhase === 'waking_up' ? 'sun' : 'moon'}
              size={16}
              color={UI.accent}
            />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        )}

        {/* Phase timeline */}
        {Object.keys(phaseTimestamps).length > 0 && !sessionComplete && (
          <View style={styles.timeline}>
            {SLEEP_STATES.filter((s) => phaseTimestamps[s.id]).map((s) => (
              <View key={s.id} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: s.iconTint }]} />
                <Text style={styles.timelineLabel}>{s.label}</Text>
                <Text style={styles.timelineTime}>{formatTime(phaseTimestamps[s.id])}</Text>
              </View>
            ))}
          </View>
        )}

        {/* State buttons */}
        <View style={styles.stateButtons}>
          {SLEEP_STATES.map((state) => {
            const isActive = activePhase === state.id;
            const disabled = isPhaseDisabled(state.id);

            return (
              <Pressable
                key={state.id}
                disabled={disabled || sessionComplete}
                onPress={() => handlePhasePress(state.id)}
                onPressIn={() =>
                  Animated.spring(scales[state.id], { toValue: 0.97, useNativeDriver: true }).start()
                }
                onPressOut={() =>
                  Animated.spring(scales[state.id], { toValue: 1, useNativeDriver: true }).start()
                }
                accessibilityRole="button"
                accessibilityLabel={state.label}
                accessibilityState={{ selected: isActive, disabled }}
              >
                <Animated.View
                  style={[
                    styles.stateCard,
                    isActive && {
                      backgroundColor: state.activeBg,
                      borderColor: state.activeBorder,
                      borderWidth: 1.5,
                    },
                    (disabled || sessionComplete) && !isActive && styles.stateCardDisabled,
                    { transform: [{ scale: scales[state.id] }] },
                  ]}
                >
                  <View style={[styles.stateIconWrap, { backgroundColor: state.iconBg }]}>
                    <Feather name={state.icon} size={28} color={state.iconTint} />
                  </View>
                  <View style={styles.stateTextWrap}>
                    <Text
                      style={[
                        styles.stateLabel,
                        isActive && { color: state.iconTint },
                      ]}
                    >
                      {state.label}
                    </Text>
                    <Text style={styles.stateDesc}>{state.description}</Text>
                    {isActive && phaseTimestamps[state.id] && (
                      <Text style={[styles.stateTime, { color: state.iconTint }]}>
                        {formatTime(phaseTimestamps[state.id])}
                      </Text>
                    )}
                  </View>
                  {isActive && (
                    <View style={[styles.activeIndicator, { backgroundColor: state.iconTint }]}>
                      <Feather name="check" size={14} color="#FFF" />
                    </View>
                  )}
                </Animated.View>
              </Pressable>
            );
          })}
        </View>

        {/* Session complete — done button */}
        {sessionComplete && (
          <View style={styles.completeSection}>
            <View style={styles.completeSummary}>
              {SLEEP_STATES.filter((s) => phaseTimestamps[s.id]).map((s) => (
                <View key={s.id} style={styles.completeSummaryRow}>
                  <View style={[styles.completeDot, { backgroundColor: s.iconTint }]} />
                  <Text style={styles.completeSummaryLabel}>{s.label}</Text>
                  <Text style={styles.completeSummaryTime}>{formatTime(phaseTimestamps[s.id])}</Text>
                </View>
              ))}
            </View>
            <Pressable style={styles.doneButton} onPress={() => router.back()}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <LuminaWhisper
        visible={!!whisper}
        message={whisper ?? ''}
        onDismiss={() => setWhisper(null)}
      />
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function buildNotes(timestamps: Record<string, string>, wakingAt: string): string {
  const parts: string[] = [];
  if (timestamps.falling_asleep) parts.push(`Falling asleep: ${formatTime(timestamps.falling_asleep)}`);
  if (timestamps.deep_sleep) parts.push(`Deep sleep: ${formatTime(timestamps.deep_sleep)}`);
  parts.push(`Waking up: ${formatTime(wakingAt)}`);
  return parts.join(' → ');
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },

  // ── Status banner ──
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: UI.card,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: UI.text,
  },

  // ── Timeline ──
  timeline: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8A9F',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '600',
    color: UI.text,
  },

  // ── State buttons ──
  stateButtons: {
    gap: 16,
  },
  stateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.card,
    borderRadius: 24,
    minHeight: 96,
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 16,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  stateCardDisabled: {
    opacity: 0.4,
  },
  stateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTextWrap: {
    flex: 1,
    gap: 3,
  },
  stateLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: UI.text,
  },
  stateDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8A8A8A',
    lineHeight: 18,
  },
  stateTime: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  activeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Complete section ──
  completeSection: {
    marginTop: 24,
    gap: 16,
  },
  completeSummary: {
    backgroundColor: UI.card,
    borderRadius: 24,
    padding: 20,
    gap: 14,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  completeSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  completeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  completeSummaryLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: UI.text,
  },
  completeSummaryTime: {
    fontSize: 14,
    fontWeight: '600',
    color: UI.text,
  },
  doneButton: {
    height: 56,
    backgroundColor: UI.accent,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2A26',
  },
});

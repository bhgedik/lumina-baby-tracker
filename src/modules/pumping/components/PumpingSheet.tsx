import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet, LayoutAnimation, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ClayIcon } from '../../../shared/components/ClayIcons';
import * as Haptics from 'expo-haptics';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { usePumpingStore } from '../../../stores/pumpingStore';
import { colors, spacing, borderRadius, typography } from '../../../shared/constants/theme';
import type { PumpingSide } from '../../../shared/types/common';
import type { PumpingLog } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  babyId: string;
  familyId: string;
  loggedBy: string;
  onLogged?: (msg: string) => void;
}

const ACCENT = '#A78BBA';
const ACCENT_BG = '#F0EBF5';
const ACCENT_DARK = '#8E72A4';

type Mode = null | 'timer' | 'past';
type TimerPhase = 'running' | 'paused' | 'volume';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function PumpingSheet({ visible, onClose, babyId, familyId, loggedBy, onLogged }: Props) {
  const store = usePumpingStore();

  const [mode, setMode] = useState<Mode>(null);
  const [timerPhase, setTimerPhase] = useState<TimerPhase>('running');
  const [elapsed, setElapsed] = useState(0);
  const [side, setSide] = useState<PumpingSide>('both');

  const [leftMl, setLeftMl] = useState('');
  const [rightMl, setRightMl] = useState('');
  const [totalMl, setTotalMl] = useState('');
  const [totalEdited, setTotalEdited] = useState(false);

  const [pastTime, setPastTime] = useState(new Date());
  const [pastDuration, setPastDuration] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationSeconds = useRef(0);

  useEffect(() => {
    if (!totalEdited) {
      const l = parseInt(leftMl, 10) || 0;
      const r = parseInt(rightMl, 10) || 0;
      setTotalMl(l + r > 0 ? String(l + r) : '');
    }
  }, [leftMl, rightMl, totalEdited]);

  useEffect(() => {
    if (mode === 'timer' && timerPhase === 'running' && store.activeTimer) {
      intervalRef.current = setInterval(() => {
        const timer = usePumpingStore.getState().activeTimer;
        if (timer && !timer.pausedAt) {
          setElapsed(Math.floor((Date.now() - timer.startedAt) / 1000));
        }
      }, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [mode, timerPhase, store.activeTimer]);

  const resetState = useCallback(() => {
    setMode(null);
    setTimerPhase('running');
    setElapsed(0);
    setSide('both');
    setLeftMl('');
    setRightMl('');
    setTotalMl('');
    setTotalEdited(false);
    setPastTime(new Date());
    setPastDuration('');
    setShowTimePicker(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleStartTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.easeInEaseOut();
    setMode('timer');
    setTimerPhase('running');
    store.startTimer(side);
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    store.pauseTimer();
    setTimerPhase('paused');
  };

  const handleResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    store.resumeTimer();
    setTimerPhase('running');
  };

  const handleStopTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    LayoutAnimation.easeInEaseOut();
    const result = store.stopTimer();
    if (result) {
      durationSeconds.current = result.durationSeconds;
    }
    setTimerPhase('volume');
  };

  const handleLogPast = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.easeInEaseOut();
    setMode('past');
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const total = parseInt(totalMl, 10) || 0;
    const left = parseInt(leftMl, 10) || 0;
    const right = parseInt(rightMl, 10) || 0;
    const now = new Date().toISOString();

    let startedAt: string;
    let endedAt: string | null;
    let durSecs: number | null;

    if (mode === 'timer') {
      durSecs = durationSeconds.current;
      endedAt = now;
      startedAt = new Date(Date.now() - durSecs * 1000).toISOString();
    } else {
      startedAt = pastTime.toISOString();
      durSecs = parseInt(pastDuration, 10) ? parseInt(pastDuration, 10) * 60 : null;
      endedAt = durSecs ? new Date(pastTime.getTime() + durSecs * 1000).toISOString() : null;
    }

    const log: PumpingLog = {
      id: generateUUID(),
      baby_id: babyId,
      family_id: familyId,
      logged_by: loggedBy,
      started_at: startedAt,
      ended_at: endedAt,
      duration_seconds: durSecs,
      side,
      left_volume_ml: left || null,
      right_volume_ml: right || null,
      total_volume_ml: total,
      notes: null,
      created_at: now,
      updated_at: now,
    };

    store.addItem(log);
    onLogged?.(`Pumped ${total} ml logged`);
    handleClose();
  };

  const canSave = (parseInt(totalMl, 10) || 0) > 0;

  if (mode === null) {
    return (
      <BottomSheet visible={visible} onClose={handleClose} title="Log Pumping">
        <View style={styles.cardGrid}>
          <Pressable style={styles.modeCard} onPress={handleStartTimer}>
            <ClayIcon name="play-timer" size={56} />
            <Text style={styles.modeLabel}>Start Timer</Text>
            <Text style={styles.modeSub}>Begin pumping now</Text>
          </Pressable>

          <Pressable style={styles.modeCard} onPress={handleLogPast}>
            <ClayIcon name="clock-past" size={56} />
            <Text style={styles.modeLabel}>Log Past</Text>
            <Text style={styles.modeSub}>Record a past session</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Which side?</Text>
        <View style={styles.sideRow}>
          {(['left', 'right', 'both'] as PumpingSide[]).map((s) => (
            <Pressable
              key={s}
              style={[styles.sideBtn, side === s && styles.sideBtnActive]}
              onPress={() => { Haptics.selectionAsync(); setSide(s); }}
            >
              <Text style={[styles.sideBtnText, side === s && styles.sideBtnTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    );
  }

  if (mode === 'timer' && timerPhase !== 'volume') {
    return (
      <BottomSheet visible={visible} onClose={handleClose} title="Pumping">
        <View style={styles.timerContainer}>
          <Text style={styles.timerDisplay}>{formatTimer(elapsed)}</Text>
          <Text style={styles.timerSide}>{side === 'both' ? 'Both sides' : `${side.charAt(0).toUpperCase() + side.slice(1)} side`}</Text>

          <View style={styles.timerControls}>
            {timerPhase === 'running' ? (
              <Pressable style={[styles.timerBtn, { backgroundColor: '#F5EDE8' }]} onPress={handlePause}>
                <Feather name="pause" size={22} color="#A08B6E" />
                <Text style={[styles.timerBtnText, { color: '#A08B6E' }]}>Pause</Text>
              </Pressable>
            ) : (
              <Pressable style={[styles.timerBtn, { backgroundColor: ACCENT_BG }]} onPress={handleResume}>
                <Feather name="play" size={22} color={ACCENT} />
                <Text style={[styles.timerBtnText, { color: ACCENT }]}>Resume</Text>
              </Pressable>
            )}

            <Pressable style={[styles.timerBtn, { backgroundColor: '#F5EDE8' }]} onPress={handleStopTimer}>
              <Feather name="square" size={22} color="#A08B6E" />
              <Text style={[styles.timerBtnText, { color: '#A08B6E' }]}>Stop</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose} title={mode === 'past' ? 'Log Past Session' : 'Session Complete'}>
      {mode === 'past' && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>When did you pump?</Text>
          <Pressable style={[styles.timeBtn]} onPress={() => setShowTimePicker(true)}>
            <Feather name="clock" size={16} color={ACCENT} />
            <Text style={styles.timeBtnText}>
              {pastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Pressable>
          {showTimePicker && (
            <DateTimePicker
              value={pastTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (date) setPastTime(date);
              }}
            />
          )}

          <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Duration (minutes)</Text>
          <TextInput
            style={[styles.volumeInput]}
            value={pastDuration}
            onChangeText={setPastDuration}
            keyboardType="number-pad"
            placeholder="e.g. 20"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      )}

      {mode === 'timer' && (
        <View style={styles.durationSummary}>
          <Feather name="clock" size={16} color={ACCENT} />
          <Text style={styles.durationText}>{formatTimer(durationSeconds.current)}</Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>Volume (ml)</Text>
      <View style={styles.volumeRow}>
        <View style={styles.volumeCol}>
          <Text style={styles.volumeLabel}>Left</Text>
          <TextInput
            style={[styles.volumeInput]}
            value={leftMl}
            onChangeText={(t) => { setLeftMl(t.replace(/[^0-9]/g, '')); setTotalEdited(false); }}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View style={styles.volumeCol}>
          <Text style={styles.volumeLabel}>Right</Text>
          <TextInput
            style={[styles.volumeInput]}
            value={rightMl}
            onChangeText={(t) => { setRightMl(t.replace(/[^0-9]/g, '')); setTotalEdited(false); }}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <TextInput
          style={[styles.totalInput]}
          value={totalMl}
          onChangeText={(t) => { setTotalMl(t.replace(/[^0-9]/g, '')); setTotalEdited(true); }}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
        />
        <Text style={styles.totalUnit}>ml</Text>
      </View>

      <Pressable
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!canSave}
      >
        <Text style={styles.saveBtnText}>Save</Text>
        <Feather name="check" size={18} color={colors.textInverse} />
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  cardGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  modeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: spacing.lg,
    paddingVertical: spacing['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#B0A090',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  modeLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '700' as const,
    color: '#2D2A26',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  modeSub: {
    fontSize: typography.fontSize.sm,
    color: '#A08060',
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '700' as const,
    color: '#2D2A26',
    marginBottom: spacing.md,
  },
  sideRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  sideBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#EDE8E2',
    backgroundColor: '#F7F4F0',
    alignItems: 'center',
  },
  sideBtnActive: {
    borderColor: ACCENT,
    backgroundColor: ACCENT_BG,
  },
  sideBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  sideBtnTextActive: {
    color: ACCENT_DARK,
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  timerDisplay: {
    fontSize: 56,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  timerSide: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  timerControls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.full,
  },
  timerBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  section: {
    marginBottom: spacing.lg,
  },
  durationSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: ACCENT_BG,
    borderRadius: borderRadius.xl,
  },
  durationText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: ACCENT_DARK,
  },
  volumeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  volumeCol: {
    flex: 1,
  },
  volumeLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700' as const,
    color: '#A08060',
    marginBottom: spacing.sm,
  },
  volumeInput: {
    backgroundColor: '#F7F4F0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE8E2',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  totalInput: {
    flex: 1,
    backgroundColor: '#F7F4F0',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EDE8E2',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#2D2A26',
    textAlign: 'center',
  },
  totalUnit: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F7F4F0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE8E2',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  timeBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#7C9A8E',
    borderRadius: 22,
    paddingVertical: spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

// ============================================================
// Lumina — Pumping Sheet (State-Machine Rewrite)
// Flow: idle → running ↔ paused → review → save
// ============================================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { usePumpingStore } from '../../../stores/pumpingStore';
import { colors, spacing, borderRadius, typography } from '../../../shared/constants/theme';
import type { PumpingSide } from '../../../shared/types/common';
import type { PumpingLog } from '../types';

// ── Design tokens ───────────────────────────────────────────
const ACCENT = '#A78BBA';
const ACCENT_BG = '#F0EBF5';
const ACCENT_DARK = '#8E72A4';

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

// Inset (concave) clay for text inputs
const INSET_CLAY = {
  backgroundColor: '#EDE8E2',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1,
  borderTopWidth: 1.5,
  borderLeftWidth: 1,
  borderTopColor: 'rgba(0,0,0,0.06)',
  borderLeftColor: 'rgba(0,0,0,0.03)',
  borderBottomWidth: 1.5,
  borderRightWidth: 1,
  borderBottomColor: 'rgba(255,255,255,0.8)',
  borderRightColor: 'rgba(255,255,255,0.5)',
};

// ── Helpers ─────────────────────────────────────────────────
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

// ── Types ───────────────────────────────────────────────────
type FlowState = 'idle' | 'running' | 'paused' | 'review';

interface Props {
  visible: boolean;
  onClose: () => void;
  babyId: string;
  familyId: string;
  loggedBy: string;
  onLogged?: (msg: string) => void;
}

// ── Component ───────────────────────────────────────────────
export function PumpingSheet({ visible, onClose, babyId, familyId, loggedBy, onLogged }: Props) {
  const store = usePumpingStore();

  // ── State machine ──
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [selectedSide, setSelectedSide] = useState<PumpingSide>('both');

  // ── Timer state ──
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationSecondsRef = useRef(0);

  // ── Review state ──
  const [leftMl, setLeftMl] = useState('');
  const [rightMl, setRightMl] = useState('');
  const [editedDuration, setEditedDuration] = useState('');
  const [isPastSession, setIsPastSession] = useState(false);

  // ── Past session state ──
  const [pastTime, setPastTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ── Derived ──
  const leftVal = parseInt(leftMl, 10) || 0;
  const rightVal = parseInt(rightMl, 10) || 0;
  const autoTotal = selectedSide === 'both' ? leftVal + rightVal
    : selectedSide === 'left' ? leftVal : rightVal;

  // ── Timer tick ──
  useEffect(() => {
    if (flowState === 'running') {
      intervalRef.current = setInterval(() => {
        const timer = usePumpingStore.getState().activeTimer;
        if (timer && !timer.pausedAt) {
          const base = timer.accumulatedSeconds;
          const running = Math.floor((Date.now() - timer.startedAt) / 1000);
          setElapsed(base + running);
        }
      }, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
    if (flowState === 'paused') {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [flowState]);

  // ── Reset ──
  const resetState = useCallback(() => {
    setFlowState('idle');
    setSelectedSide('both');
    setElapsed(0);
    setLeftMl('');
    setRightMl('');
    setEditedDuration('');
    setIsPastSession(false);
    setPastTime(new Date());
    setShowTimePicker(false);
    durationSecondsRef.current = 0;
  }, []);

  const handleClose = useCallback(() => {
    // If timer is running/paused, don't clear store timer — just close sheet
    resetState();
    onClose();
  }, [onClose, resetState]);

  // ── Actions: IDLE → RUNNING ──
  const handleStartTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    store.startTimer(selectedSide);
    setFlowState('running');
  };

  // ── Actions: IDLE → REVIEW (log past) ──
  const handleLogPast = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPastSession(true);
    setFlowState('review');
  };

  // ── Actions: RUNNING → PAUSED ──
  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    store.pauseTimer();
    setFlowState('paused');
  };

  // ── Actions: PAUSED → RUNNING ──
  const handleResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    store.resumeTimer();
    setFlowState('running');
  };

  // ── Actions: RUNNING/PAUSED → REVIEW ──
  const handleStopAndReview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = store.stopTimer();
    if (result) {
      durationSecondsRef.current = result.durationSeconds;
      setEditedDuration(String(Math.ceil(result.durationSeconds / 60)));
    }
    setFlowState('review');
  };

  // ── Actions: REVIEW → SAVE ──
  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = new Date().toISOString();

    let startedAt: string;
    let endedAt: string;
    let durSecs: number;

    if (isPastSession) {
      const durationMin = parseInt(editedDuration, 10) || 0;
      durSecs = durationMin * 60;
      startedAt = pastTime.toISOString();
      endedAt = new Date(pastTime.getTime() + durSecs * 1000).toISOString();
    } else {
      const editedMin = parseInt(editedDuration, 10) || 0;
      durSecs = editedMin > 0 ? editedMin * 60 : durationSecondsRef.current;
      endedAt = now;
      startedAt = new Date(Date.now() - durSecs * 1000).toISOString();
    }

    const log: PumpingLog = {
      id: generateUUID(),
      baby_id: babyId,
      family_id: familyId,
      logged_by: loggedBy,
      started_at: startedAt,
      ended_at: endedAt,
      duration_seconds: durSecs,
      side: selectedSide,
      left_volume_ml: selectedSide === 'right' ? null : (leftVal || null),
      right_volume_ml: selectedSide === 'left' ? null : (rightVal || null),
      total_volume_ml: autoTotal,
      notes: null,
      created_at: now,
      updated_at: now,
    };

    store.addItem(log);
    onLogged?.(`Pumped ${autoTotal} ml logged`);
    handleClose();
  };

  const canSave = autoTotal > 0;

  // ── Side selector (shared across idle + review) ──
  const renderSideSelector = () => (
    <View style={styles.sideRow}>
      {(['both', 'left', 'right'] as PumpingSide[]).map((s) => {
        const isActive = selectedSide === s;
        return (
          <Pressable
            key={s}
            style={[styles.sideChip, isActive && styles.sideChipActive]}
            onPress={() => { Haptics.selectionAsync(); setSelectedSide(s); }}
          >
            <Text style={[styles.sideChipText, isActive && styles.sideChipTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  // ═══════════════════════════════════════════════════════════
  // VIEW 1: IDLE
  // ═══════════════════════════════════════════════════════════
  if (flowState === 'idle') {
    return (
      <BottomSheet visible={visible} onClose={handleClose} title="Log Pumping">
        {/* Side selector */}
        <Text style={styles.fieldLabel}>Which side?</Text>
        {renderSideSelector()}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.clayBtn, styles.clayBtnAccent, pressed && styles.clayBtnPressed]}
            onPress={handleStartTimer}
          >
            <Feather name="play" size={20} color="#FFFFFF" />
            <Text style={styles.clayBtnAccentText}>Start Timer</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.clayBtn, pressed && styles.clayBtnPressed]}
            onPress={handleLogPast}
          >
            <Feather name="clock" size={20} color={ACCENT_DARK} />
            <Text style={styles.clayBtnText}>Log Past Session</Text>
          </Pressable>
        </View>
      </BottomSheet>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // VIEW 2: RUNNING / PAUSED
  // ═══════════════════════════════════════════════════════════
  if (flowState === 'running' || flowState === 'paused') {
    const sideLabel = selectedSide === 'both'
      ? 'Both sides'
      : `${selectedSide.charAt(0).toUpperCase() + selectedSide.slice(1)} side`;

    return (
      <BottomSheet visible={visible} onClose={handleClose} title="Pumping">
        <View style={styles.timerCenter}>
          {/* Side badge */}
          <View style={styles.sideBadge}>
            <Feather name="droplet" size={14} color={ACCENT_DARK} />
            <Text style={styles.sideBadgeText}>{sideLabel}</Text>
          </View>

          {/* Timer display */}
          <Text style={styles.timerDisplay}>{formatTimer(elapsed)}</Text>

          {/* Status */}
          {flowState === 'paused' && (
            <Text style={styles.pausedLabel}>PAUSED</Text>
          )}
        </View>

        {/* Controls */}
        <View style={styles.actionRow}>
          {flowState === 'running' ? (
            <Pressable
              style={({ pressed }) => [styles.clayBtn, pressed && styles.clayBtnPressed]}
              onPress={handlePause}
            >
              <Feather name="pause" size={20} color="#A08B6E" />
              <Text style={styles.clayBtnText}>Pause</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.clayBtn, pressed && styles.clayBtnPressed]}
              onPress={handleResume}
            >
              <Feather name="play" size={20} color={ACCENT} />
              <Text style={[styles.clayBtnText, { color: ACCENT_DARK }]}>Resume</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.clayBtn, styles.clayBtnAccent, pressed && styles.clayBtnPressed]}
            onPress={handleStopAndReview}
          >
            <Feather name="square" size={18} color="#FFFFFF" />
            <Text style={styles.clayBtnAccentText}>Stop & Review</Text>
          </Pressable>
        </View>
      </BottomSheet>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // VIEW 3: REVIEW & SAVE
  // ═══════════════════════════════════════════════════════════
  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={isPastSession ? 'Log Past Session' : 'Session Complete'}
    >
      {/* Side selector (still editable) */}
      <Text style={styles.fieldLabel}>Side</Text>
      {renderSideSelector()}

      {/* Past session: time picker */}
      {isPastSession && (
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>When did you pump?</Text>
          <Pressable style={styles.timePickerBtn} onPress={() => setShowTimePicker(true)}>
            <Feather name="clock" size={16} color={ACCENT} />
            <Text style={styles.timePickerText}>
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
        </View>
      )}

      {/* Duration */}
      <Text style={styles.fieldLabel}>Duration (minutes)</Text>
      <View style={styles.durationRow}>
        {!isPastSession && (
          <View style={styles.durationBadge}>
            <Feather name="clock" size={14} color={ACCENT_DARK} />
            <Text style={styles.durationBadgeText}>
              {formatTimer(durationSecondsRef.current)}
            </Text>
          </View>
        )}
        <TextInput
          style={styles.insetInput}
          value={editedDuration}
          onChangeText={(t) => setEditedDuration(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder={isPastSession ? 'e.g. 20' : 'Edit minutes'}
          placeholderTextColor="#B0A898"
        />
      </View>

      {/* Volume inputs */}
      <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Volume (ml)</Text>
      {selectedSide === 'both' ? (
        <View style={styles.volumeRow}>
          <View style={styles.volumeCol}>
            <Text style={styles.volumeLabel}>Left</Text>
            <TextInput
              style={styles.insetInput}
              value={leftMl}
              onChangeText={(t) => setLeftMl(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#B0A898"
            />
          </View>
          <View style={styles.volumeCol}>
            <Text style={styles.volumeLabel}>Right</Text>
            <TextInput
              style={styles.insetInput}
              value={rightMl}
              onChangeText={(t) => setRightMl(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#B0A898"
            />
          </View>
        </View>
      ) : (
        <TextInput
          style={styles.insetInput}
          value={selectedSide === 'left' ? leftMl : rightMl}
          onChangeText={(t) => {
            const clean = t.replace(/[^0-9]/g, '');
            if (selectedSide === 'left') setLeftMl(clean);
            else setRightMl(clean);
          }}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#B0A898"
        />
      )}

      {/* Auto-total */}
      {selectedSide === 'both' && autoTotal > 0 && (
        <View style={styles.totalDisplay}>
          <Text style={styles.totalDisplayLabel}>Total</Text>
          <Text style={styles.totalDisplayValue}>{autoTotal} ml</Text>
        </View>
      )}

      {/* Save button */}
      <Pressable
        style={({ pressed }) => [
          styles.saveBtn,
          !canSave && styles.saveBtnDisabled,
          pressed && canSave && { transform: [{ scale: 0.97 }] },
        ]}
        onPress={handleSave}
        disabled={!canSave}
      >
        <Text style={styles.saveBtnText}>Save Session</Text>
        <Feather name="check" size={18} color="#FFFFFF" />
      </Pressable>
    </BottomSheet>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Shared ──
  fieldLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#2D2A26',
    marginBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
  },

  // ── Side selector ──
  sideRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  sideChip: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#F7F4F0',
    borderWidth: 1.5,
    borderColor: '#EDE8E2',
  },
  sideChipActive: {
    backgroundColor: ACCENT_BG,
    borderColor: ACCENT,
  },
  sideChipText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#8A8A8A',
  },
  sideChipTextActive: {
    color: ACCENT_DARK,
    fontWeight: typography.fontWeight.bold,
  },

  // ── Action row (two equal buttons) ──
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  clayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  clayBtnAccent: {
    backgroundColor: ACCENT,
    borderTopColor: 'rgba(255,255,255,0.35)',
    borderLeftColor: 'rgba(255,255,255,0.2)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    borderRightColor: 'rgba(0,0,0,0.06)',
  },
  clayBtnPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  clayBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#2D2A26',
  },
  clayBtnAccentText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },

  // ── Timer (running/paused) ──
  timerCenter: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  sideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ACCENT_BG,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  sideBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: ACCENT_DARK,
  },
  timerDisplay: {
    fontSize: 64,
    fontWeight: '200',
    color: '#2D2A26',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  pausedLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#D4A574',
    letterSpacing: 2,
    marginTop: spacing.md,
  },

  // ── Review: duration ──
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ACCENT_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  durationBadgeText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: ACCENT_DARK,
  },

  // ── Inset clay input ──
  insetInput: {
    flex: 1,
    ...INSET_CLAY,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: '#2D2A26',
    textAlign: 'center',
  },

  // ── Volume ──
  volumeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  volumeCol: {
    flex: 1,
  },
  volumeLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: '#A08060',
    marginBottom: spacing.sm,
  },

  // ── Total display ──
  totalDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ACCENT_BG,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  totalDisplayLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: ACCENT_DARK,
  },
  totalDisplayValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: ACCENT_DARK,
  },

  // ── Time picker (past session) ──
  timePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...INSET_CLAY,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  timePickerText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: '#2D2A26',
  },

  // ── Save ──
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: ACCENT,
    borderRadius: 26,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    ...CLAY_SHADOW,
    borderTopWidth: 2,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.35)',
    borderLeftColor: 'rgba(255,255,255,0.2)',
    borderBottomWidth: 1.5,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.12)',
    borderRightColor: 'rgba(0,0,0,0.06)',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});

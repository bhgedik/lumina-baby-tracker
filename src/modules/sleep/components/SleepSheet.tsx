// ============================================================
// Lumina — Sleep Quick Action Sheet
// Nap Now / Night Sleep + Log Past Sleep with time pickers
// Timer running view with Stop & Review + Save/Discard flow
// ============================================================

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Alert, StyleSheet, LayoutAnimation, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { ChipSelector } from '../../../shared/components/ChipSelector';
import { useSleepStore } from '../../../stores/sleepStore';
import { generateUUID } from '../../../stores/createSyncedStore';
import { formatTimerSeconds, formatTime, formatDuration } from '../../../shared/utils/dateTime';
import { colors, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import type { SleepType } from '../../../shared/types/common';
import type { SleepLog } from '../types';

const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

type TimerView = null | 'running' | 'review';

const SLEEP_TYPE_OPTIONS = [
  { value: 'nap', label: 'Nap' },
  { value: 'night', label: 'Night' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  babyId: string;
  familyId: string;
  loggedBy: string;
  onTimerStarted?: () => void;
  onLogged?: (msg: string) => void;
}

/**
 * Parse time input like "14:30", "2:30 PM", "2:30pm", "14:30"
 * Returns a Date on today's date with that time, or null if invalid.
 */
function parseTimeInput(input: string): Date | null {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return null;

  // Try HH:MM AM/PM
  const ampm = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    if (h < 1 || h > 12 || m > 59) return null;
    if (ampm[3] === 'PM' && h !== 12) h += 12;
    if (ampm[3] === 'AM' && h === 12) h = 0;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  // Try 24h HH:MM
  const h24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const h = parseInt(h24[1], 10);
    const m = parseInt(h24[2], 10);
    if (h > 23 || m > 59) return null;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  return null;
}

export function SleepSheet({ visible, onClose, babyId, familyId, loggedBy, onTimerStarted, onLogged }: Props) {
  const [showPastSleep, setShowPastSleep] = useState(true);
  const [sleepType, setSleepType] = useState<SleepType>('nap');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // ── Timer view state ──
  const [timerView, setTimerView] = useState<TimerView>(null);
  const [sheetElapsed, setSheetElapsed] = useState(0);
  const sleepTimer = useSleepStore((s) => s.activeTimer);

  // Review state (Date objects for DateTimePicker)
  const [reviewStartTime, setReviewStartTime] = useState<Date>(new Date());
  const [reviewEndTime, setReviewEndTime] = useState<Date>(new Date());
  const [reviewSleepType, setReviewSleepType] = useState<SleepType>('nap');
  const [showReviewStartPicker, setShowReviewStartPicker] = useState(false);
  const [showReviewEndPicker, setShowReviewEndPicker] = useState(false);

  // Detect active timer on open
  useEffect(() => {
    if (visible && sleepTimer) {
      setTimerView('running');
    } else if (!visible) {
      setTimerView(null);
      setSheetElapsed(0);
      setReviewStartTime(new Date());
      setReviewEndTime(new Date());
      setShowReviewStartPicker(false);
      setShowReviewEndPicker(false);
    }
  }, [visible]);

  // Timer elapsed tick
  useEffect(() => {
    if (timerView !== 'running' || !sleepTimer) return;
    const tick = () => {
      const running = Math.floor((Date.now() - sleepTimer.startedAt) / 1000);
      setSheetElapsed(running);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timerView, sleepTimer]);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setShowPastSleep(true);
      setSleepType('nap');
      setStartTime('');
      setEndTime('');
    }
  }, [visible]);

  const handleSleepNow = (type: SleepType) => {
    useSleepStore.getState().startSleep(type);
    onTimerStarted?.();
    onClose();
  };

  const handleShowPastSleep = () => {
    LayoutAnimation.easeInEaseOut();
    setShowPastSleep(true);
  };

  const handleSavePast = () => {
    const startParsed = parseTimeInput(startTime);
    const endParsed = parseTimeInput(endTime);
    if (!startParsed || !endParsed) {
      Alert.alert('Invalid Time', 'Please enter times in HH:MM format (e.g. 14:30 or 2:30 PM).');
      return;
    }

    // If end is before start, assume it crossed midnight (next day)
    if (endParsed.getTime() <= startParsed.getTime()) {
      endParsed.setDate(endParsed.getDate() + 1);
    }

    const durationMinutes = Math.round((endParsed.getTime() - startParsed.getTime()) / 60000);
    if (durationMinutes > 1440) {
      Alert.alert('Invalid Duration', 'Sleep duration cannot exceed 24 hours.');
      return;
    }

    const now = new Date().toISOString();
    const log: SleepLog = {
      id: generateUUID(),
      baby_id: babyId,
      family_id: familyId,
      logged_by: loggedBy,
      type: sleepType,
      started_at: startParsed.toISOString(),
      ended_at: endParsed.toISOString(),
      duration_minutes: durationMinutes,
      method: null,
      location: null,
      quality: null,
      night_wakings: null,
      room_temperature_celsius: null,
      notes: null,
      created_at: now,
      updated_at: now,
    };
    useSleepStore.getState().addItem(log);

    const hrs = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    const durStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    onLogged?.(`${sleepType === 'nap' ? 'Nap' : 'Night sleep'} logged — ${durStr}`);
    onClose();
  };

  // ── Timer: Stop & Review ──
  const handleStopAndReview = () => {
    const timer = sleepTimer;
    if (!timer) return;
    setReviewSleepType(timer.type);
    setReviewStartTime(new Date(timer.startedAt));
    setReviewEndTime(new Date());
    LayoutAnimation.easeInEaseOut();
    setTimerView('review');
  };

  // ── Timer: Save Review ──
  const handleSaveReview = () => {
    let end = reviewEndTime;
    if (end.getTime() <= reviewStartTime.getTime()) {
      end = new Date(end);
      end.setDate(end.getDate() + 1);
    }
    const durationMinutes = Math.round((end.getTime() - reviewStartTime.getTime()) / 60000);
    if (durationMinutes > 1440) {
      Alert.alert('Invalid Duration', 'Sleep duration cannot exceed 24 hours.');
      return;
    }
    const now = new Date().toISOString();
    const log: SleepLog = {
      id: generateUUID(),
      baby_id: babyId,
      family_id: familyId,
      logged_by: loggedBy,
      type: reviewSleepType,
      started_at: reviewStartTime.toISOString(),
      ended_at: end.toISOString(),
      duration_minutes: durationMinutes,
      method: null,
      location: null,
      quality: null,
      night_wakings: null,
      room_temperature_celsius: null,
      notes: null,
      created_at: now,
      updated_at: now,
    };
    useSleepStore.getState().addItem(log);
    useSleepStore.getState().clearTimer();
    const hrs = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    const durStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    onLogged?.(`${reviewSleepType === 'nap' ? 'Nap' : 'Night sleep'} logged — ${durStr}`);
    onClose();
  };

  // ── Timer: Discard ──
  const handleDiscard = () => {
    Alert.alert('Discard Timer?', 'The timer data will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          useSleepStore.getState().clearTimer();
          setTimerView(null);
          onClose();
        },
      },
    ]);
  };

  const canSave = !!parseTimeInput(startTime) && !!parseTimeInput(endTime);

  // Auto-calculated review duration
  const reviewDurationMins = Math.max(0, Math.round(
    (reviewEndTime.getTime() - reviewStartTime.getTime()) / 60000
  ));

  const sheetTitle = timerView === 'running' ? 'Sleep Timer'
    : timerView === 'review' ? 'Review Sleep'
    : 'Log Sleep';

  return (
    <BottomSheet visible={visible} onClose={onClose} title={sheetTitle}>
      {/* ── Timer Running View ── */}
      {timerView === 'running' && sleepTimer && (
        <View style={styles.timerRunningView}>
          {/* Type badge */}
          <View style={[styles.timerBadge, sleepTimer.type === 'night' && styles.timerBadgeNight]}>
            <Text style={[styles.timerBadgeText, sleepTimer.type === 'night' && styles.timerBadgeTextNight]}>
              {sleepTimer.type === 'night' ? 'Night' : 'Nap'}
            </Text>
          </View>

          {/* Elapsed time */}
          <Text style={styles.timerElapsed}>{formatTimerSeconds(sheetElapsed)}</Text>
          <Text style={styles.timerSubLabel}>Recording</Text>

          {/* Stop & Review */}
          <Pressable style={[styles.saveButton, { alignSelf: 'stretch' }]} onPress={handleStopAndReview}>
            <Feather name="check-circle" size={16} color="#FFF" />
            <Text style={styles.saveButtonText}>Stop & Review</Text>
          </Pressable>

          {/* Discard */}
          <Pressable style={styles.discardButton} onPress={handleDiscard}>
            <Text style={styles.discardButtonText}>Discard</Text>
          </Pressable>
        </View>
      )}

      {/* ── Timer Review View ── */}
      {timerView === 'review' && (
        <View style={styles.pastSection}>
          {/* Type selector */}
          <View style={styles.chipRow}>
            <ChipSelector
              options={SLEEP_TYPE_OPTIONS}
              selected={reviewSleepType}
              onSelect={(v) => setReviewSleepType(v as SleepType)}
            />
          </View>

          {/* Start time */}
          <View style={styles.reviewTimeRow}>
            <Text style={styles.reviewTimeLabel}>Start</Text>
            <Pressable
              style={styles.reviewTimeButton}
              onPress={() => setShowReviewStartPicker(true)}
            >
              <Feather name="clock" size={14} color={colors.primary[600]} />
              <Text style={styles.reviewTimeButtonText}>{formatTime(reviewStartTime)}</Text>
            </Pressable>
          </View>
          {showReviewStartPicker && (
            <DateTimePicker
              value={reviewStartTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                if (Platform.OS !== 'ios') setShowReviewStartPicker(false);
                if (event.type === 'set' && date) setReviewStartTime(date);
              }}
            />
          )}
          {Platform.OS === 'ios' && showReviewStartPicker && (
            <Pressable style={styles.pickerDone} onPress={() => setShowReviewStartPicker(false)}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          )}

          {/* End time */}
          <View style={styles.reviewTimeRow}>
            <Text style={styles.reviewTimeLabel}>End</Text>
            <Pressable
              style={styles.reviewTimeButton}
              onPress={() => setShowReviewEndPicker(true)}
            >
              <Feather name="clock" size={14} color={colors.primary[600]} />
              <Text style={styles.reviewTimeButtonText}>{formatTime(reviewEndTime)}</Text>
            </Pressable>
          </View>
          {showReviewEndPicker && (
            <DateTimePicker
              value={reviewEndTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                if (Platform.OS !== 'ios') setShowReviewEndPicker(false);
                if (event.type === 'set' && date) setReviewEndTime(date);
              }}
            />
          )}
          {Platform.OS === 'ios' && showReviewEndPicker && (
            <Pressable style={styles.pickerDone} onPress={() => setShowReviewEndPicker(false)}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          )}

          {/* Duration display */}
          {reviewDurationMins > 0 && (
            <View style={styles.durationDisplay}>
              <Text style={styles.durationText}>{formatDuration(reviewDurationMins)}</Text>
              <Text style={styles.durationLabel}>duration</Text>
            </View>
          )}

          {/* Save */}
          <Pressable
            style={[styles.saveButton, reviewDurationMins <= 0 && styles.saveButtonDisabled]}
            onPress={handleSaveReview}
            disabled={reviewDurationMins <= 0}
          >
            <Feather name="check" size={16} color="#FFF" />
            <Text style={styles.saveButtonText}>Save Sleep Log</Text>
          </Pressable>

          {/* Discard */}
          <Pressable style={styles.discardButton} onPress={handleDiscard}>
            <Text style={styles.discardButtonText}>Discard Timer</Text>
          </Pressable>
        </View>
      )}

      {/* ── Normal view (no active timer) ── */}
      {!timerView && (<>
      {/* Start Timer Cards */}
      <View style={styles.timerRow}>
        <Pressable style={styles.timerCard} onPress={() => handleSleepNow('nap')}>
          <View style={[styles.iconWrap, { backgroundColor: '#EDF3EE' }]}>
            <Feather name="moon" size={24} color="#6B8E6F" />
          </View>
          <Text style={[styles.cardLabel, { color: '#6B8E6F' }]}>Nap Now</Text>
          <Text style={styles.cardSub}>Start nap timer</Text>
        </Pressable>

        <Pressable style={styles.timerCard} onPress={() => handleSleepNow('night')}>
          <View style={[styles.iconWrap, { backgroundColor: '#EDE8F5' }]}>
            <Feather name="moon" size={24} color="#6B5B8A" />
          </View>
          <Text style={[styles.cardLabel, { color: '#6B5B8A' }]}>Night Sleep</Text>
          <Text style={styles.cardSub}>Start night timer</Text>
        </Pressable>
      </View>

      {/* Log Past Sleep Toggle */}
      {!showPastSleep ? (
        <Pressable style={styles.pastToggle} onPress={handleShowPastSleep}>
          <Feather name="clock" size={16} color={colors.primary[600]} />
          <Text style={styles.pastToggleText}>Log Past Sleep</Text>
          <Feather name="chevron-down" size={16} color={colors.neutral[400]} />
        </Pressable>
      ) : (
        <View style={styles.pastSection}>
          <Text style={styles.pastTitle}>Log Past Sleep</Text>

          <View style={styles.chipRow}>
            <ChipSelector
              options={SLEEP_TYPE_OPTIONS}
              selected={sleepType}
              onSelect={(v) => setSleepType(v as SleepType)}
            />
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>Start</Text>
              <TextInput
                style={styles.timeInput}
                placeholder="14:30"
                placeholderTextColor="#BBBBBB"
                value={startTime}
                onChangeText={setStartTime}
                keyboardType="default"
                autoCapitalize="none"
              />
            </View>
            <Feather name="arrow-right" size={16} color={colors.neutral[400]} style={styles.timeArrow} />
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>End</Text>
              <TextInput
                style={styles.timeInput}
                placeholder="15:45"
                placeholderTextColor="#BBBBBB"
                value={endTime}
                onChangeText={setEndTime}
                keyboardType="default"
                autoCapitalize="none"
              />
            </View>
          </View>

          <Pressable
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSavePast}
            disabled={!canSave}
          >
            <Feather name="check" size={16} color="#FFF" />
            <Text style={styles.saveButtonText}>Save Past Sleep</Text>
          </Pressable>
        </View>
      )}
      </>)}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  // ── Timer running view ──
  timerRunningView: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  timerBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#EDF3EE',
  },
  timerBadgeNight: {
    backgroundColor: '#EDE8F5',
  },
  timerBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B8E6F',
  },
  timerBadgeTextNight: {
    color: '#6B5B8A',
  },
  timerElapsed: {
    fontSize: 48,
    fontWeight: '800',
    color: '#3D3D3D',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  timerSubLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8A8A',
    marginTop: -8,
  },
  discardButton: {
    paddingVertical: 8,
  },
  discardButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C44B4B',
  },

  // ── Review time pickers ──
  reviewTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewTimeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  reviewTimeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[700],
  },
  pickerDone: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  pickerDoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  durationDisplay: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  durationText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3D3D3D',
  },
  durationLabel: {
    fontSize: 11,
    color: '#8A8A8A',
    fontFamily: SERIF_FONT,
  },

  // ── Normal view ──
  timerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timerCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
    ...shadows.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  cardSub: {
    fontSize: 12,
    color: '#8A8A8A',
    fontFamily: SERIF_FONT,
  },
  pastToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  pastToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[600],
  },
  pastSection: {
    backgroundColor: colors.neutral[50],
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  pastTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3D3D3D',
  },
  chipRow: {
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  timeField: {
    flex: 1,
    gap: 4,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '500',
    color: '#3D3D3D',
    textAlign: 'center',
  },
  timeArrow: {
    marginBottom: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary[500],
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 2,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

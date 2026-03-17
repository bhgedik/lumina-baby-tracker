// ============================================================
// Lumina — Feeding Quick Action Sheet
// 4-mode card grid: Breast / Bottle·BM / Bottle·Formula / Solids
// Each mode reveals inline sub-view for data entry
// All modes support manual time entry for past logging
// ============================================================

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, StyleSheet, LayoutAnimation, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { ClayIcon, ClayIconName } from '../../../shared/components/ClayIcons';
import { ChipSelector } from '../../../shared/components/ChipSelector';
import { SolidFeedingPanel } from './SolidFeedingPanel';
import { useFeedingStore } from '../../../stores/feedingStore';
import { generateUUID } from '../../../stores/createSyncedStore';
import { formatTime, formatDuration, formatTimerSeconds } from '../../../shared/utils/dateTime';
import { colors, spacing, borderRadius } from '../../../shared/constants/theme';
import type { BreastSide, BottleContentType } from '../../../shared/types/common';
import type { FeedingLog, SolidFoodEntry } from '../types';

const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

type FeedingMode = null | 'breast' | 'bottle_bm' | 'bottle_formula' | 'solids';
type TimerView = null | 'running' | 'review';

interface Props {
  visible: boolean;
  onClose: () => void;
  babyId: string;
  familyId: string;
  loggedBy: string;
  feedingMethod: string;
  knownAllergies: string[];
  babyAgeMonths: number;
  onTimerStarted?: () => void;
  onLogged?: (msg: string) => void;
}

const SIDE_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

interface CardConfig {
  mode: FeedingMode;
  icon: keyof typeof Feather.glyphMap;
  clayIcon?: ClayIconName;
  label: string;
  sub: string;
  color: string;
  bg: string;
}

const CARDS: CardConfig[] = [
  { mode: 'breast', icon: 'heart', clayIcon: 'breast', label: 'Breast', sub: 'Timer or log past', color: '#A78BBA', bg: '#F0EBF5' },
  { mode: 'bottle_bm', icon: 'droplet', clayIcon: 'bottle-bm', label: 'Bottle · BM', sub: 'Breast milk', color: '#4A7FA5', bg: '#E8F0F7' },
  { mode: 'bottle_formula', icon: 'droplet', clayIcon: 'bottle-formula', label: 'Bottle · Formula', sub: 'Formula', color: '#F2B89C', bg: '#FDF0EB' },
  { mode: 'solids', icon: 'coffee', clayIcon: 'solids', label: 'Solids', sub: 'Food + reactions', color: '#C4943A', bg: '#F9F3E8' },
];

export function FeedingSheet({
  visible, onClose, babyId, familyId, loggedBy,
  feedingMethod, knownAllergies, babyAgeMonths,
  onTimerStarted, onLogged,
}: Props) {
  const [mode, setMode] = useState<FeedingMode>(null);
  const [bottleAmount, setBottleAmount] = useState(120);
  const [solidFoods, setSolidFoods] = useState<SolidFoodEntry[]>([]);

  // ── Time picker state (bottle / solids) ──
  const [feedTime, setFeedTime] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ── Past breast feed state ──
  const [showPastBreast, setShowPastBreast] = useState(false);
  const [breastSide, setBreastSide] = useState<BreastSide>('left');
  const [breastStartTime, setBreastStartTime] = useState<Date>(new Date());
  const [breastEndTime, setBreastEndTime] = useState<Date>(new Date());
  const [showBreastStartPicker, setShowBreastStartPicker] = useState(false);
  const [showBreastEndPicker, setShowBreastEndPicker] = useState(false);

  // ── Timer view state (running / review) ──
  const [timerView, setTimerView] = useState<TimerView>(null);
  const [sheetElapsed, setSheetElapsed] = useState(0);
  const [sideLeftDisplay, setSideLeftDisplay] = useState(0);
  const [sideRightDisplay, setSideRightDisplay] = useState(0);
  const [totalDisplay, setTotalDisplay] = useState(0);
  const [reviewLeftSeconds, setReviewLeftSeconds] = useState(0);
  const [reviewRightSeconds, setReviewRightSeconds] = useState(0);
  const feedingTimer = useFeedingStore((s) => s.activeTimer);
  const pauseFeeding = useFeedingStore((s) => s.pauseTimer);
  const resumeFeeding = useFeedingStore((s) => s.resumeTimer);
  const switchSide = useFeedingStore((s) => s.switchSide);

  // Detect active timer on open
  useEffect(() => {
    if (visible && feedingTimer) {
      setTimerView('running');
    } else if (!visible) {
      setTimerView(null);
      setSheetElapsed(0);
    }
  }, [visible]);

  // Timer elapsed tick — shows current side's elapsed time
  useEffect(() => {
    if (timerView !== 'running' || !feedingTimer) return;
    const tick = () => {
      const sideBase = feedingTimer.side === 'left'
        ? feedingTimer.leftSeconds
        : feedingTimer.rightSeconds;
      const running = feedingTimer.pausedAt
        ? 0
        : Math.floor((Date.now() - feedingTimer.startedAt) / 1000);

      setSheetElapsed(sideBase + running);
      setSideLeftDisplay(feedingTimer.leftSeconds + (feedingTimer.side === 'left' ? running : 0));
      setSideRightDisplay(feedingTimer.rightSeconds + (feedingTimer.side === 'right' ? running : 0));
      setTotalDisplay(feedingTimer.accumulatedSeconds + running);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timerView, feedingTimer]);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setMode(null);
      setBottleAmount(120);
      setSolidFoods([]);
      setFeedTime(new Date());
      setShowTimePicker(false);
      setShowPastBreast(false);
      setBreastSide('left');
      setBreastStartTime(new Date());
      setBreastEndTime(new Date());
      setShowBreastStartPicker(false);
      setShowBreastEndPicker(false);
      setReviewLeftSeconds(0);
      setReviewRightSeconds(0);
      setSideLeftDisplay(0);
      setSideRightDisplay(0);
      setTotalDisplay(0);
    }
  }, [visible]);

  const handleCardPress = (cardMode: FeedingMode) => {
    if (cardMode === 'solids' && babyAgeMonths < 6) {
      Alert.alert(
        'Too Early for Solids',
        'The WHO recommends starting solids at 6 months. Your baby is not yet old enough.',
      );
      return;
    }
    LayoutAnimation.easeInEaseOut();
    setMode(mode === cardMode ? null : cardMode);
  };

  // ── Breast: start live timer ──
  const handleBreastSide = (side: BreastSide) => {
    useFeedingStore.getState().startTimer('breast', side);
    onTimerStarted?.();
    onClose();
  };

  // ── Breast: save past feed ──
  const handleSavePastBreast = () => {
    let end = breastEndTime;
    if (end.getTime() <= breastStartTime.getTime()) {
      end = new Date(end);
      end.setDate(end.getDate() + 1);
    }
    const durationSecs = Math.round((end.getTime() - breastStartTime.getTime()) / 1000);
    if (durationSecs > 7200) {
      Alert.alert('Long Feed', 'Duration exceeds 2 hours. Please check the times.');
      return;
    }
    const now = new Date().toISOString();
    const log: FeedingLog = {
      id: generateUUID(),
      baby_id: babyId,
      family_id: familyId,
      logged_by: loggedBy,
      type: 'breast',
      started_at: breastStartTime.toISOString(),
      ended_at: end.toISOString(),
      breast_side: breastSide,
      left_duration_seconds: breastSide === 'left' || breastSide === 'both' ? durationSecs : null,
      right_duration_seconds: breastSide === 'right' || breastSide === 'both' ? durationSecs : null,
      bottle_amount_ml: null,
      bottle_content: null,
      bottle_temperature: null,
      solid_foods: null,
      sensitivity_notes: null,
      notes: null,
      baby_response: null,
      photo_url: null,
      created_at: now,
      updated_at: now,
    };
    useFeedingStore.getState().addItem(log);
    useFeedingStore.getState().clearTimer();
    const mins = Math.round(durationSecs / 60);
    onLogged?.(`Breast (${breastSide}) — ${mins}m logged`);
    onClose();
  };

  // ── Bottle: save log ──
  const handleSaveBottle = () => {
    const content: BottleContentType = mode === 'bottle_bm' ? 'breast_milk' : 'formula';
    const time = feedTime.toISOString();
    const now = new Date().toISOString();
    const log: FeedingLog = {
      id: generateUUID(),
      baby_id: babyId,
      family_id: familyId,
      logged_by: loggedBy,
      type: 'bottle',
      started_at: time,
      ended_at: time,
      breast_side: null,
      left_duration_seconds: null,
      right_duration_seconds: null,
      bottle_amount_ml: bottleAmount,
      bottle_content: content,
      bottle_temperature: null,
      solid_foods: null,
      sensitivity_notes: null,
      notes: null,
      baby_response: null,
      photo_url: null,
      created_at: now,
      updated_at: now,
    };
    useFeedingStore.getState().addItem(log);
    const label = content === 'breast_milk' ? 'breast milk' : 'formula';
    onLogged?.(`${bottleAmount} ml ${label} logged`);
    onClose();
  };

  // ── Solids: save log ──
  const handleSaveSolids = () => {
    const time = feedTime.toISOString();
    const now = new Date().toISOString();
    const log: FeedingLog = {
      id: generateUUID(),
      baby_id: babyId,
      family_id: familyId,
      logged_by: loggedBy,
      type: 'solid',
      started_at: time,
      ended_at: time,
      breast_side: null,
      left_duration_seconds: null,
      right_duration_seconds: null,
      bottle_amount_ml: null,
      bottle_content: null,
      bottle_temperature: null,
      solid_foods: solidFoods.length > 0 ? solidFoods : null,
      sensitivity_notes: null,
      notes: null,
      baby_response: null,
      photo_url: null,
      created_at: now,
      updated_at: now,
    };
    useFeedingStore.getState().addItem(log);
    const foodNames = solidFoods.map((f) => f.food_name).join(', ');
    onLogged?.(foodNames ? `Solids: ${foodNames}` : 'Solids logged');
    onClose();
  };

  // ── Timer: Stop & Review ──
  const handleStopAndReview = () => {
    const timer = feedingTimer;
    if (!timer) return;

    // Pause if running (accumulates current interval into side counters)
    if (!timer.pausedAt) pauseFeeding();

    // Read current timer state (after pause)
    const t = useFeedingStore.getState().activeTimer!;
    const totalSecs = t.accumulatedSeconds;

    // Capture per-side durations from timer
    setReviewLeftSeconds(t.leftSeconds);
    setReviewRightSeconds(t.rightSeconds);

    // Set time boundaries
    setBreastStartTime(new Date(Date.now() - totalSecs * 1000));
    setBreastEndTime(new Date());

    // Derive side from actual usage
    setBreastSide(
      t.leftSeconds > 0 && t.rightSeconds > 0 ? 'both'
      : t.leftSeconds > 0 ? 'left' : 'right'
    );

    LayoutAnimation.easeInEaseOut();
    setTimerView('review');
  };

  // ── Timer: Discard ──
  const handleDiscard = () => {
    Alert.alert('Discard Timer?', 'The timer data will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          useFeedingStore.getState().clearTimer();
          setTimerView(null);
          onClose();
        },
      },
    ]);
  };

  // ── Timer: Save review with per-side durations ──
  const handleSaveTimerReview = () => {
    const totalSecs = reviewLeftSeconds + reviewRightSeconds;
    if (totalSecs <= 0) return;

    let end = breastEndTime;
    if (end.getTime() <= breastStartTime.getTime()) {
      end = new Date(end);
      end.setDate(end.getDate() + 1);
    }

    const now = new Date().toISOString();
    const side: BreastSide =
      reviewLeftSeconds > 0 && reviewRightSeconds > 0 ? 'both'
      : reviewLeftSeconds > 0 ? 'left' : 'right';

    const log: FeedingLog = {
      id: generateUUID(),
      baby_id: babyId,
      family_id: familyId,
      logged_by: loggedBy,
      type: 'breast',
      started_at: breastStartTime.toISOString(),
      ended_at: end.toISOString(),
      breast_side: side,
      left_duration_seconds: reviewLeftSeconds > 0 ? reviewLeftSeconds : null,
      right_duration_seconds: reviewRightSeconds > 0 ? reviewRightSeconds : null,
      bottle_amount_ml: null,
      bottle_content: null,
      bottle_temperature: null,
      solid_foods: null,
      sensitivity_notes: null,
      notes: null,
      baby_response: null,
      photo_url: null,
      created_at: now,
      updated_at: now,
    };

    useFeedingStore.getState().addItem(log);
    useFeedingStore.getState().clearTimer();

    const leftMin = Math.round(reviewLeftSeconds / 60);
    const rightMin = Math.round(reviewRightSeconds / 60);
    const parts: string[] = [];
    if (reviewLeftSeconds > 0) parts.push(`L: ${leftMin}m`);
    if (reviewRightSeconds > 0) parts.push(`R: ${rightMin}m`);
    onLogged?.(`Breast (${parts.join(', ')}) logged`);
    onClose();
  };

  // Determine which card is the default based on feedingMethod
  const defaultMode: FeedingMode =
    feedingMethod === 'formula_only' ? 'bottle_formula'
    : feedingMethod === 'breast_only' ? 'breast'
    : null;

  // Auto-calculated breast duration
  const breastDurationMins = Math.max(0, Math.round(
    (breastEndTime.getTime() - breastStartTime.getTime()) / 60000
  ));

  return (
    <BottomSheet visible={visible} onClose={onClose} title={timerView === 'running' ? 'Feeding Timer' : timerView === 'review' ? 'Review Feed' : 'Log Feed'}>
      {/* ── Timer Running View ── */}
      {timerView === 'running' && feedingTimer && (
        <View style={styles.timerRunningView}>
          {/* Side pill toggle */}
          {feedingTimer.type === 'breast' && (
            <View style={styles.sidePillRow}>
              {(['left', 'right'] as const).map((s) => {
                const isActive = feedingTimer.side === s;
                return (
                  <Pressable
                    key={s}
                    style={[styles.sidePill, isActive && styles.sidePillActive]}
                    onPress={() => { if (!isActive) switchSide(); }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[styles.sidePillText, isActive && styles.sidePillTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Current side elapsed time */}
          <Text style={styles.timerElapsed}>{formatTimerSeconds(sheetElapsed)}</Text>
          <Text style={styles.timerSubLabel}>
            {feedingTimer.pausedAt ? 'Paused' : 'Recording'}
          </Text>

          {/* Per-side summary */}
          {feedingTimer.type === 'breast' && (sideLeftDisplay > 0 || sideRightDisplay > 0) && (
            <View style={styles.sideSummaryRow}>
              <Text style={styles.sideSummaryText}>L: {formatTimerSeconds(sideLeftDisplay)}</Text>
              <Text style={styles.sideSummaryDot}>{'\u00B7'}</Text>
              <Text style={styles.sideSummaryText}>R: {formatTimerSeconds(sideRightDisplay)}</Text>
              <Text style={styles.sideSummaryDot}>{'\u00B7'}</Text>
              <Text style={styles.sideSummaryText}>Total: {formatTimerSeconds(totalDisplay)}</Text>
            </View>
          )}

          {/* Controls row */}
          <View style={styles.timerControls}>
            <Pressable
              style={styles.timerControlButton}
              onPress={() => feedingTimer.pausedAt ? resumeFeeding() : pauseFeeding()}
            >
              <Feather
                name={feedingTimer.pausedAt ? 'play' : 'pause'}
                size={18}
                color="#A78BBA"
              />
              <Text style={styles.timerControlText}>
                {feedingTimer.pausedAt ? 'Resume' : 'Pause'}
              </Text>
            </Pressable>
            {feedingTimer.type === 'breast' && (
              <Pressable style={styles.timerControlButton} onPress={switchSide}>
                <Feather name="repeat" size={18} color="#A78BBA" />
                <Text style={styles.timerControlText}>Switch Side</Text>
              </Pressable>
            )}
          </View>

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
        <View style={styles.subView}>
          {(reviewLeftSeconds > 0 || reviewRightSeconds > 0) ? (
            <>
              {/* Per-side duration breakdown (read-only) */}
              <Text style={styles.subTitle}>Session Summary</Text>
              <View style={styles.reviewBreakdown}>
                {reviewLeftSeconds > 0 && (
                  <View style={styles.reviewSideRow}>
                    <View style={[styles.reviewSideDot, { backgroundColor: '#A78BBA' }]} />
                    <Text style={styles.reviewSideLabel}>Left</Text>
                    <Text style={styles.reviewSideValue}>{formatTimerSeconds(reviewLeftSeconds)}</Text>
                  </View>
                )}
                {reviewRightSeconds > 0 && (
                  <View style={styles.reviewSideRow}>
                    <View style={[styles.reviewSideDot, { backgroundColor: '#4A7FA5' }]} />
                    <Text style={styles.reviewSideLabel}>Right</Text>
                    <Text style={styles.reviewSideValue}>{formatTimerSeconds(reviewRightSeconds)}</Text>
                  </View>
                )}
                <View style={styles.reviewTotalRow}>
                  <Text style={styles.reviewTotalLabel}>Total</Text>
                  <Text style={styles.reviewTotalValue}>
                    {formatTimerSeconds(reviewLeftSeconds + reviewRightSeconds)}
                  </Text>
                </View>
              </View>

              {/* Start time */}
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Start</Text>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => setShowBreastStartPicker(true)}
                >
                  <Feather name="clock" size={14} color={colors.primary[600]} />
                  <Text style={styles.timeButtonText}>{formatTime(breastStartTime)}</Text>
                </Pressable>
              </View>
              {showBreastStartPicker && (
                <DateTimePicker
                  value={breastStartTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS !== 'ios') setShowBreastStartPicker(false);
                    if (event.type === 'set' && date) setBreastStartTime(date);
                  }}
                />
              )}
              {Platform.OS === 'ios' && showBreastStartPicker && (
                <Pressable style={styles.pickerDone} onPress={() => setShowBreastStartPicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </Pressable>
              )}

              {/* End time */}
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>End</Text>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => setShowBreastEndPicker(true)}
                >
                  <Feather name="clock" size={14} color={colors.primary[600]} />
                  <Text style={styles.timeButtonText}>{formatTime(breastEndTime)}</Text>
                </Pressable>
              </View>
              {showBreastEndPicker && (
                <DateTimePicker
                  value={breastEndTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS !== 'ios') setShowBreastEndPicker(false);
                    if (event.type === 'set' && date) setBreastEndTime(date);
                  }}
                />
              )}
              {Platform.OS === 'ios' && showBreastEndPicker && (
                <Pressable style={styles.pickerDone} onPress={() => setShowBreastEndPicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </Pressable>
              )}

              {/* Save */}
              <Pressable style={styles.saveButton} onPress={handleSaveTimerReview}>
                <Feather name="check" size={16} color="#FFF" />
                <Text style={styles.saveButtonText}>Save Feed</Text>
              </Pressable>

              {/* Discard */}
              <Pressable style={styles.discardButton} onPress={handleDiscard}>
                <Text style={styles.discardButtonText}>Discard Timer</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* Fallback: past-breast form for edge cases */}
              <ChipSelector
                options={SIDE_OPTIONS}
                selected={breastSide}
                onSelect={(v) => setBreastSide(v as BreastSide)}
              />

              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Start</Text>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => setShowBreastStartPicker(true)}
                >
                  <Feather name="clock" size={14} color={colors.primary[600]} />
                  <Text style={styles.timeButtonText}>{formatTime(breastStartTime)}</Text>
                </Pressable>
              </View>
              {showBreastStartPicker && (
                <DateTimePicker
                  value={breastStartTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS !== 'ios') setShowBreastStartPicker(false);
                    if (event.type === 'set' && date) setBreastStartTime(date);
                  }}
                />
              )}
              {Platform.OS === 'ios' && showBreastStartPicker && (
                <Pressable style={styles.pickerDone} onPress={() => setShowBreastStartPicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </Pressable>
              )}

              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>End</Text>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => setShowBreastEndPicker(true)}
                >
                  <Feather name="clock" size={14} color={colors.primary[600]} />
                  <Text style={styles.timeButtonText}>{formatTime(breastEndTime)}</Text>
                </Pressable>
              </View>
              {showBreastEndPicker && (
                <DateTimePicker
                  value={breastEndTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS !== 'ios') setShowBreastEndPicker(false);
                    if (event.type === 'set' && date) setBreastEndTime(date);
                  }}
                />
              )}
              {Platform.OS === 'ios' && showBreastEndPicker && (
                <Pressable style={styles.pickerDone} onPress={() => setShowBreastEndPicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </Pressable>
              )}

              {breastDurationMins > 0 && (
                <View style={styles.durationDisplay}>
                  <Text style={styles.durationText}>{formatDuration(breastDurationMins)}</Text>
                  <Text style={styles.durationLabel}>duration</Text>
                </View>
              )}

              <Pressable
                style={[styles.saveButton, breastDurationMins <= 0 && styles.saveButtonDisabled]}
                onPress={handleSavePastBreast}
                disabled={breastDurationMins <= 0}
              >
                <Feather name="check" size={16} color="#FFF" />
                <Text style={styles.saveButtonText}>Save Feed</Text>
              </Pressable>

              <Pressable style={styles.discardButton} onPress={handleDiscard}>
                <Text style={styles.discardButtonText}>Discard Timer</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {/* ── Normal view (no active timer) ── */}
      {!timerView && (<>
      {/* ── 4-Card Grid ── */}
      <View style={styles.grid}>
        {CARDS.map((card) => {
          const isSelected = mode === card.mode;
          const isDefault = defaultMode === card.mode && mode === null;
          const isSolidsDisabled = card.mode === 'solids' && babyAgeMonths < 6;

          return (
            <Pressable
              key={card.mode}
              style={[
                styles.card,
                isSelected && { borderColor: card.color, borderWidth: 2 },
                isDefault && !isSelected && { borderColor: card.color + '60', borderWidth: 1.5 },
                isSolidsDisabled && { opacity: 0.4 },
              ]}
              onPress={() => handleCardPress(card.mode)}
            >
              {card.clayIcon ? (
                <ClayIcon name={card.clayIcon} size={56} />
              ) : (
                <Feather name={card.icon} size={32} color={card.color} />
              )}
              <Text style={[styles.cardLabel, { color: '#2D2A26' }]} numberOfLines={1}>
                {card.label}
              </Text>
              <Text style={styles.cardSub}>
                {isSolidsDisabled ? '6+ months' : card.sub}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Breast: Timer + Past Feed ── */}
      {mode === 'breast' && (
        <View style={styles.subView}>
          <Text style={styles.subTitle}>Start timer</Text>
          <View style={styles.sideRow}>
            <Pressable style={[styles.sideButton, { borderColor: '#A78BBA' }]} onPress={() => handleBreastSide('left')}>
              <Feather name="arrow-left" size={16} color="#A78BBA" />
              <Text style={[styles.sideText, { color: '#A78BBA' }]}>Left</Text>
            </Pressable>
            <Pressable style={[styles.sideButton, { borderColor: '#A78BBA' }]} onPress={() => handleBreastSide('right')}>
              <Text style={[styles.sideText, { color: '#A78BBA' }]}>Right</Text>
              <Feather name="arrow-right" size={16} color="#A78BBA" />
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Log Past Feed toggle / section */}
          {!showPastBreast ? (
            <Pressable
              style={styles.pastToggle}
              onPress={() => {
                LayoutAnimation.easeInEaseOut();
                setShowPastBreast(true);
              }}
            >
              <Feather name="clock" size={14} color={colors.primary[600]} />
              <Text style={styles.pastToggleText}>Log Past Feed</Text>
              <Feather name="chevron-down" size={14} color={colors.neutral[400]} />
            </Pressable>
          ) : (
            <View style={styles.pastSection}>
              {/* Side selector */}
              <ChipSelector
                options={SIDE_OPTIONS}
                selected={breastSide}
                onSelect={(v) => setBreastSide(v as BreastSide)}
              />

              {/* Start time */}
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Start</Text>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => setShowBreastStartPicker(true)}
                >
                  <Feather name="clock" size={14} color={colors.primary[600]} />
                  <Text style={styles.timeButtonText}>{formatTime(breastStartTime)}</Text>
                </Pressable>
              </View>
              {showBreastStartPicker && (
                <DateTimePicker
                  value={breastStartTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS !== 'ios') setShowBreastStartPicker(false);
                    if (event.type === 'set' && date) setBreastStartTime(date);
                  }}
                />
              )}
              {Platform.OS === 'ios' && showBreastStartPicker && (
                <Pressable style={styles.pickerDone} onPress={() => setShowBreastStartPicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </Pressable>
              )}

              {/* End time */}
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>End</Text>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => setShowBreastEndPicker(true)}
                >
                  <Feather name="clock" size={14} color={colors.primary[600]} />
                  <Text style={styles.timeButtonText}>{formatTime(breastEndTime)}</Text>
                </Pressable>
              </View>
              {showBreastEndPicker && (
                <DateTimePicker
                  value={breastEndTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS !== 'ios') setShowBreastEndPicker(false);
                    if (event.type === 'set' && date) setBreastEndTime(date);
                  }}
                />
              )}
              {Platform.OS === 'ios' && showBreastEndPicker && (
                <Pressable style={styles.pickerDone} onPress={() => setShowBreastEndPicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </Pressable>
              )}

              {/* Duration display */}
              {breastDurationMins > 0 && (
                <View style={styles.durationDisplay}>
                  <Text style={styles.durationText}>{formatDuration(breastDurationMins)}</Text>
                  <Text style={styles.durationLabel}>duration</Text>
                </View>
              )}

              {/* Save */}
              <Pressable
                style={[styles.saveButton, breastDurationMins <= 0 && styles.saveButtonDisabled]}
                onPress={handleSavePastBreast}
                disabled={breastDurationMins <= 0}
              >
                <Feather name="check" size={16} color="#FFF" />
                <Text style={styles.saveButtonText}>Log Feed</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* ── Bottle: Amount + Time ── */}
      {(mode === 'bottle_bm' || mode === 'bottle_formula') && (
        <View style={styles.subView}>
          <Text style={styles.subTitle}>
            {mode === 'bottle_bm' ? 'Breast Milk Bottle' : 'Formula Bottle'}
          </Text>

          {/* Amount display (hero) */}
          <View style={styles.amountRow}>
            <Text style={styles.amountValue}>{bottleAmount}</Text>
            <Text style={styles.amountUnit}>ml</Text>
          </View>

          {/* Stepper buttons */}
          <View style={styles.stepperRow}>
            {[-25, -5, 5, 25].map((delta) => (
              <Pressable
                key={delta}
                style={styles.stepperButton}
                onPress={() => setBottleAmount(Math.max(0, Math.min(500, bottleAmount + delta)))}
              >
                <Text style={styles.stepperText}>{delta > 0 ? `+${delta}` : `${delta}`}</Text>
              </Pressable>
            ))}
          </View>

          {/* Time selector */}
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Time</Text>
            <Pressable
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Feather name="clock" size={14} color={colors.primary[600]} />
              <Text style={styles.timeButtonText}>{formatTime(feedTime)}</Text>
            </Pressable>
          </View>
          {showTimePicker && (
            <DateTimePicker
              value={feedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                if (Platform.OS !== 'ios') setShowTimePicker(false);
                if (event.type === 'set' && date) setFeedTime(date);
              }}
            />
          )}
          {Platform.OS === 'ios' && showTimePicker && (
            <Pressable style={styles.pickerDone} onPress={() => setShowTimePicker(false)}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          )}

          {/* Save */}
          <Pressable
            style={[styles.saveButton, bottleAmount <= 0 && styles.saveButtonDisabled]}
            onPress={handleSaveBottle}
            disabled={bottleAmount <= 0}
          >
            <Feather name="check" size={16} color="#FFF" />
            <Text style={styles.saveButtonText}>Log Feed</Text>
          </Pressable>
        </View>
      )}

      {/* ── Solids: Food Panel + Time ── */}
      {mode === 'solids' && (
        <View style={styles.subView}>
          <SolidFeedingPanel
            foods={solidFoods}
            onFoodsChange={setSolidFoods}
            knownAllergies={knownAllergies}
          />

          {/* Time selector */}
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Time</Text>
            <Pressable
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Feather name="clock" size={14} color={colors.primary[600]} />
              <Text style={styles.timeButtonText}>{formatTime(feedTime)}</Text>
            </Pressable>
          </View>
          {showTimePicker && (
            <DateTimePicker
              value={feedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                if (Platform.OS !== 'ios') setShowTimePicker(false);
                if (event.type === 'set' && date) setFeedTime(date);
              }}
            />
          )}
          {Platform.OS === 'ios' && showTimePicker && (
            <Pressable style={styles.pickerDone} onPress={() => setShowTimePicker(false)}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.saveButton, solidFoods.length === 0 && styles.saveButtonDisabled]}
            onPress={handleSaveSolids}
            disabled={solidFoods.length === 0}
          >
            <Feather name="check" size={16} color="#FFF" />
            <Text style={styles.saveButtonText}>Log Solids</Text>
          </Pressable>
        </View>
      )}
      </>)}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  card: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#B0A090',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginTop: 2,
  },
  cardSub: {
    fontSize: 12,
    color: '#A08060',
  },

  // ── Sub-views ──
  subView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    gap: 14,
    shadowColor: '#B0A090',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2A26',
  },

  // ── Breast side picker ──
  sideRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sideButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: '#F7F4F0',
  },
  sideText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EDE8E2',
  },
  dividerText: {
    fontSize: 12,
    color: '#8A8A8A',
    fontFamily: SERIF_FONT,
  },

  // ── Past feed toggle ──
  pastToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E2',
    backgroundColor: '#F7F4F0',
  },
  pastToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7B5EA7',
  },
  pastSection: {
    gap: 12,
  },

  // ── Bottle amount (hero) ──
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#3D3D3D',
  },
  amountUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8A8A8A',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  stepperButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#F7F4F0',
    borderWidth: 1,
    borderColor: '#EDE8E2',
  },
  stepperText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D3D3D',
  },

  // ── Time picker ──
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A08060',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F7F4F0',
    borderWidth: 1,
    borderColor: '#EDE8E2',
  },
  timeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2A26',
  },
  pickerDone: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  pickerDoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B5EA7',
  },

  // ── Duration display ──
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

  // ── Timer running view ──
  timerRunningView: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  sidePillRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'center',
  },
  sidePill: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0EBF5',
    borderWidth: 1.5,
    borderColor: '#A78BBA' + '30',
  },
  sidePillActive: {
    backgroundColor: '#A78BBA',
    borderColor: '#A78BBA',
  },
  sidePillText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A78BBA',
  },
  sidePillTextActive: {
    color: '#FFFFFF',
  },
  sideSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: -4,
  },
  sideSummaryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8A8A',
    fontVariant: ['tabular-nums'],
  },
  sideSummaryDot: {
    fontSize: 13,
    color: '#C9C2B8',
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
  timerControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  timerControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#F7F4F0',
    borderWidth: 1,
    borderColor: '#EDE8E2',
  },
  timerControlText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BBA',
  },
  discardButton: {
    paddingVertical: 8,
  },
  discardButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A08060',
  },

  // ── Review breakdown ──
  reviewBreakdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    gap: 12,
    shadowColor: '#B0A090',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  reviewSideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewSideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reviewSideLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3D3D3D',
    flex: 1,
  },
  reviewSideValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3D3D3D',
    fontVariant: ['tabular-nums'],
  },
  reviewTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2DCD4',
  },
  reviewTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A8A8A',
    flex: 1,
    paddingLeft: 18,
  },
  reviewTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D3D3D',
    fontVariant: ['tabular-nums'],
  },

  // ── Save button ──
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C9A8E',
    borderRadius: 22,
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

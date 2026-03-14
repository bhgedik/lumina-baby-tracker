# Pumping Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dedicated Pumping (expressing milk) module with timer, per-side volume tracking, and full integration across home screen, calendar, and database.

**Architecture:** New `src/modules/pumping/` module with Zustand store, types, and sheet component. Follows the exact same patterns as the existing feeding/diaper modules. Timer persists via AsyncStorage.

**Tech Stack:** React Native, Expo, TypeScript, Zustand, Supabase, react-native-svg, expo-haptics

---

### Task 1: Add Pumping Types

**Files:**
- Modify: `src/shared/types/common.ts` (after line 52, after BottleContentType)
- Create: `src/modules/pumping/types.ts`

**Step 1: Add PumpingSide type to common.ts**

In `src/shared/types/common.ts`, add after the `BottleContentType` line:

```typescript
export type PumpingSide = 'left' | 'right' | 'both';
```

**Step 2: Create pumping types file**

Create `src/modules/pumping/types.ts`:

```typescript
import type { UUID, ISO8601, Timestamps, PumpingSide } from '../../shared/types/common';

export interface PumpingLog extends Timestamps {
  id: UUID;
  baby_id: UUID;
  family_id: UUID;
  logged_by: UUID;
  started_at: ISO8601;
  ended_at: ISO8601 | null;
  duration_seconds: number | null;
  side: PumpingSide;
  left_volume_ml: number | null;
  right_volume_ml: number | null;
  total_volume_ml: number;
  notes: string | null;
}

export interface PumpingSummary {
  total_sessions: number;
  total_volume_ml: number;
  avg_volume_ml: number;
  last_pump_at: ISO8601 | null;
  hours_since_last_pump: number | null;
}

export interface PumpingTimer {
  pumpingId: UUID;
  side: PumpingSide;
  startedAt: number;
  pausedAt: number | null;
  accumulatedSeconds: number;
}
```

**Step 3: Commit**

```bash
git add src/shared/types/common.ts src/modules/pumping/types.ts
git commit -m "feat(pumping): add PumpingLog, PumpingSummary, and PumpingTimer types"
```

---

### Task 2: Create Pumping Store

**Files:**
- Create: `src/stores/pumpingStore.ts`

**Step 1: Create the Zustand store**

Create `src/stores/pumpingStore.ts` following the feedingStore pattern (`src/stores/feedingStore.ts`):

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UUID, ISO8601, PumpingSide } from '../shared/types/common';
import type { PumpingLog, PumpingSummary, PumpingTimer } from '../modules/pumping/types';

const STORAGE_KEY = '@sprout/pumping-logs';
const TIMER_KEY = '@sprout/pumping-timer';

function generateUUID(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface SyncQueueItem {
  id: UUID;
  operation: 'insert' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

interface PumpingState {
  items: PumpingLog[];
  syncQueue: SyncQueueItem[];
  activeTimer: PumpingTimer | null;
  isHydrated: boolean;

  addItem: (item: PumpingLog) => void;
  deleteItem: (id: UUID) => void;
  hydrate: () => Promise<void>;

  startTimer: (side: PumpingSide) => UUID;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => { pumpingId: UUID; durationSeconds: number } | null;
  clearTimer: () => void;

  getSummaryToday: (babyId: UUID) => PumpingSummary;
}

export const usePumpingStore = create<PumpingState>((set, get) => ({
  items: [],
  syncQueue: [],
  activeTimer: null,
  isHydrated: false,

  addItem: (item) => {
    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      operation: 'insert',
      table: 'pumping_logs',
      data: item as unknown as Record<string, unknown>,
      timestamp: Date.now(),
      retryCount: 0,
    };

    set((s) => ({
      items: [item, ...s.items],
      syncQueue: [...s.syncQueue, queueItem],
    }));

    // Persist
    const state = get();
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)).catch(() => {});
  },

  deleteItem: (id) => {
    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
    }));
    const state = get();
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)).catch(() => {});
  },

  hydrate: async () => {
    try {
      const [itemsRaw, timerRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(TIMER_KEY),
      ]);
      set({
        items: itemsRaw ? JSON.parse(itemsRaw) : [],
        activeTimer: timerRaw ? JSON.parse(timerRaw) : null,
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  startTimer: (side) => {
    const pumpingId = generateUUID();
    const timer: PumpingTimer = {
      pumpingId,
      side,
      startedAt: Date.now(),
      pausedAt: null,
      accumulatedSeconds: 0,
    };
    set({ activeTimer: timer });
    AsyncStorage.setItem(TIMER_KEY, JSON.stringify(timer)).catch(() => {});
    return pumpingId;
  },

  pauseTimer: () => {
    const { activeTimer } = get();
    if (!activeTimer || activeTimer.pausedAt) return;

    const elapsed = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
    const updated: PumpingTimer = {
      ...activeTimer,
      pausedAt: Date.now(),
      accumulatedSeconds: activeTimer.accumulatedSeconds + elapsed - activeTimer.accumulatedSeconds,
    };

    // Recalculate: total elapsed since startedAt minus any previous pauses
    const totalElapsed = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
    updated.accumulatedSeconds = totalElapsed;

    set({ activeTimer: updated });
    AsyncStorage.setItem(TIMER_KEY, JSON.stringify(updated)).catch(() => {});
  },

  resumeTimer: () => {
    const { activeTimer } = get();
    if (!activeTimer || !activeTimer.pausedAt) return;

    const updated: PumpingTimer = {
      ...activeTimer,
      startedAt: Date.now() - activeTimer.accumulatedSeconds * 1000,
      pausedAt: null,
    };
    set({ activeTimer: updated });
    AsyncStorage.setItem(TIMER_KEY, JSON.stringify(updated)).catch(() => {});
  },

  stopTimer: () => {
    const { activeTimer } = get();
    if (!activeTimer) return null;

    const durationSeconds = activeTimer.pausedAt
      ? activeTimer.accumulatedSeconds
      : Math.floor((Date.now() - activeTimer.startedAt) / 1000);

    set({ activeTimer: null });
    AsyncStorage.removeItem(TIMER_KEY).catch(() => {});

    return { pumpingId: activeTimer.pumpingId, durationSeconds };
  },

  clearTimer: () => {
    set({ activeTimer: null });
    AsyncStorage.removeItem(TIMER_KEY).catch(() => {});
  },

  getSummaryToday: (babyId) => {
    const today = new Date().toISOString().slice(0, 10);
    const todayItems = get().items.filter(
      (i) => i.baby_id === babyId && i.started_at.slice(0, 10) === today,
    );
    const totalVol = todayItems.reduce((sum, i) => sum + (i.total_volume_ml || 0), 0);
    const lastItem = todayItems[0] || null;
    const hoursSince = lastItem
      ? (Date.now() - new Date(lastItem.started_at).getTime()) / 3600000
      : null;

    return {
      total_sessions: todayItems.length,
      total_volume_ml: totalVol,
      avg_volume_ml: todayItems.length > 0 ? Math.round(totalVol / todayItems.length) : 0,
      last_pump_at: lastItem?.started_at ?? null,
      hours_since_last_pump: hoursSince !== null ? Math.round(hoursSince * 10) / 10 : null,
    };
  },
}));
```

**Step 2: Commit**

```bash
git add src/stores/pumpingStore.ts
git commit -m "feat(pumping): create Zustand store with timer and sync queue"
```

---

### Task 3: Create PumpingSheet Component

**Files:**
- Create: `src/modules/pumping/components/PumpingSheet.tsx`

**Step 1: Create the pumping sheet modal**

Create `src/modules/pumping/components/PumpingSheet.tsx`. This is a BottomSheet with two entry modes (Start Timer / Log Past), then a volume entry screen after timer stop.

```typescript
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet, LayoutAnimation, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { usePumpingStore } from '../../../stores/pumpingStore';
import { colors, spacing, borderRadius, shadows, typography } from '../../../shared/constants/theme';
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

  // Volume entry
  const [leftMl, setLeftMl] = useState('');
  const [rightMl, setRightMl] = useState('');
  const [totalMl, setTotalMl] = useState('');
  const [totalEdited, setTotalEdited] = useState(false);

  // Past session
  const [pastTime, setPastTime] = useState(new Date());
  const [pastDuration, setPastDuration] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationSeconds = useRef(0);

  // Auto-calc total
  useEffect(() => {
    if (!totalEdited) {
      const l = parseInt(leftMl, 10) || 0;
      const r = parseInt(rightMl, 10) || 0;
      setTotalMl(l + r > 0 ? String(l + r) : '');
    }
  }, [leftMl, rightMl, totalEdited]);

  // Timer tick
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

  // ── Timer mode ──
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

  // ── Past mode ──
  const handleLogPast = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.easeInEaseOut();
    setMode('past');
  };

  // ── Save ──
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

  // ── Render ──

  // Mode selection cards
  if (mode === null) {
    return (
      <BottomSheet visible={visible} onClose={handleClose} title="Log Pumping">
        <View style={styles.cardGrid}>
          <Pressable style={[styles.modeCard, shadows.sm]} onPress={handleStartTimer}>
            <View style={[styles.modeIconWrap, { backgroundColor: ACCENT_BG }]}>
              <Feather name="play" size={24} color={ACCENT} />
            </View>
            <Text style={styles.modeLabel}>Start Timer</Text>
            <Text style={styles.modeSub}>Begin pumping now</Text>
          </Pressable>

          <Pressable style={[styles.modeCard, shadows.sm]} onPress={handleLogPast}>
            <View style={[styles.modeIconWrap, { backgroundColor: ACCENT_BG }]}>
              <Feather name="clock" size={24} color={ACCENT} />
            </View>
            <Text style={styles.modeLabel}>Log Past</Text>
            <Text style={styles.modeSub}>Record a past session</Text>
          </Pressable>
        </View>

        {/* Side selector */}
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

  // Timer running / paused
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

            <Pressable style={[styles.timerBtn, { backgroundColor: '#FCE8E8' }]} onPress={handleStopTimer}>
              <Feather name="square" size={22} color="#C45C5C" />
              <Text style={[styles.timerBtnText, { color: '#C45C5C' }]}>Stop</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    );
  }

  // Volume entry (after timer stop OR past mode)
  return (
    <BottomSheet visible={visible} onClose={handleClose} title={mode === 'past' ? 'Log Past Session' : 'Session Complete'}>
      {/* Past mode: time picker */}
      {mode === 'past' && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>When did you pump?</Text>
          <Pressable style={[styles.timeBtn, shadows.sm]} onPress={() => setShowTimePicker(true)}>
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
            style={[styles.volumeInput, shadows.sm]}
            value={pastDuration}
            onChangeText={setPastDuration}
            keyboardType="number-pad"
            placeholder="e.g. 20"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      )}

      {/* Duration summary for timer mode */}
      {mode === 'timer' && (
        <View style={styles.durationSummary}>
          <Feather name="clock" size={16} color={ACCENT} />
          <Text style={styles.durationText}>{formatTimer(durationSeconds.current)}</Text>
        </View>
      )}

      {/* Volume inputs */}
      <Text style={styles.sectionLabel}>Volume (ml)</Text>
      <View style={styles.volumeRow}>
        <View style={styles.volumeCol}>
          <Text style={styles.volumeLabel}>Left</Text>
          <TextInput
            style={[styles.volumeInput, shadows.sm]}
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
            style={[styles.volumeInput, shadows.sm]}
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
          style={[styles.totalInput, shadows.sm]}
          value={totalMl}
          onChangeText={(t) => { setTotalMl(t.replace(/[^0-9]/g, '')); setTotalEdited(true); }}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
        />
        <Text style={styles.totalUnit}>ml</Text>
      </View>

      {/* Save */}
      <Pressable
        style={[styles.saveBtn, shadows.sm, !canSave && styles.saveBtnDisabled]}
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    paddingVertical: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  modeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modeLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modeSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
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
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
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
  // Timer
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
  // Volume
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
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  volumeInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[100],
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
    backgroundColor: ACCENT_BG,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: ACCENT + '40',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: ACCENT_DARK,
    textAlign: 'center',
  },
  totalUnit: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  // Time picker
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  timeBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  // Save
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: ACCENT,
    borderRadius: borderRadius.full,
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
```

**Step 2: Commit**

```bash
git add src/modules/pumping/components/PumpingSheet.tsx
git commit -m "feat(pumping): create PumpingSheet with timer and volume entry"
```

---

### Task 4: Integrate Pump Button on Home Screen

**Files:**
- Modify: `app/(app)/(tabs)/home.tsx`

**Step 1: Add import for PumpingSheet**

Near the existing FeedingSheet/SleepSheet/DiaperSheet imports, add:

```typescript
import { PumpingSheet } from '../../../src/modules/pumping/components/PumpingSheet';
```

**Step 2: Add pumping to PRIMARY_ACTIONS array (line ~78)**

Add after the diaper entry, before activity:

```typescript
{ id: 'pumping', label: 'Pump', icon: 'droplet' as const, bg: '#F0EBF5', tint: '#A78BBA', route: '/(app)/log/pumping' },
```

**Step 3: Add sheet state (line ~427)**

After `showDiaperSheet` state:

```typescript
const [showPumpingSheet, setShowPumpingSheet] = useState(false);
```

**Step 4: Add onPress handler (line ~828)**

In the button onPress, add before the `else router.push`:

```typescript
else if (action.id === 'pumping') setShowPumpingSheet(true);
```

**Step 5: Add sheet render (line ~900)**

After the DiaperSheet render block, add:

```typescript
<PumpingSheet
  visible={showPumpingSheet}
  onClose={() => setShowPumpingSheet(false)}
  babyId={babyId}
  familyId={familyId}
  loggedBy={userId}
  onLogged={(msg) => {
    setToastMsg(msg);
    setShowToast(true);
  }}
/>
```

**Step 6: Commit**

```bash
git add app/(app)/(tabs)/home.tsx
git commit -m "feat(pumping): add Pump button and sheet to home screen"
```

---

### Task 5: Add Pumping to Calendar/Timeline

**Files:**
- Modify: `app/(app)/calendar.tsx`

**Step 1: Add pumping event type (line ~34)**

In `EVENT_TYPES`, add:

```typescript
pumping: { color: '#A78BBA', bg: '#F0EBF5', icon: 'droplet' as const, label: 'Pumping' },
```

**Step 2: Add pumping sample events to SAMPLE_EVENTS**

Add 2-3 pumping events to the mock data:

```typescript
{ id: 'p1', type: 'pumping' as const, time: '9:00 AM', detail: 'Pumped — 90 ml (L: 40, R: 50)' },
{ id: 'p2', type: 'pumping' as const, time: '2:30 PM', detail: 'Pumped — 110 ml' },
```

**Step 3: Add pumping to WEEKLY_PATTERN_DATA feeds arrays**

In the weekly pattern data, add pumping entries with `type: 'pumping'`:

```typescript
{ hour: 9.0, type: 'pumping', detail: '90 ml' },
```

**Step 4: Ensure WeeklyPatternGrid handles pumping color**

If the grid uses hardcoded color mapping, add pumping to the feed type → color map. The lavender `#A78BBA` should be used for pumping blocks.

**Step 5: Commit**

```bash
git add app/(app)/calendar.tsx
git commit -m "feat(pumping): integrate pumping events into calendar and timeline views"
```

---

### Task 6: Create Database Migration

**Files:**
- Create: `supabase/migrations/00023_create_pumping_logs.sql`

**Step 1: Write migration**

```sql
-- ============================================================
-- Pumping (expressing milk) logs
-- ============================================================

CREATE TABLE pumping_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  side TEXT NOT NULL CHECK (side IN ('left', 'right', 'both')) DEFAULT 'both',
  left_volume_ml NUMERIC(5,1),
  right_volume_ml NUMERIC(5,1),
  total_volume_ml NUMERIC(5,1) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pumping_logs_baby_time ON pumping_logs(baby_id, started_at DESC);
CREATE INDEX idx_pumping_logs_family ON pumping_logs(family_id);

-- RLS
ALTER TABLE pumping_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY pumping_logs_select ON pumping_logs
  FOR SELECT USING (family_id = get_user_family_id());

CREATE POLICY pumping_logs_insert ON pumping_logs
  FOR INSERT WITH CHECK (family_id = get_user_family_id());

CREATE POLICY pumping_logs_update ON pumping_logs
  FOR UPDATE USING (family_id = get_user_family_id());

CREATE POLICY pumping_logs_delete ON pumping_logs
  FOR DELETE USING (family_id = get_user_family_id());

-- Auto-update updated_at
CREATE TRIGGER set_pumping_logs_updated_at
  BEFORE UPDATE ON pumping_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Commit**

```bash
git add supabase/migrations/00023_create_pumping_logs.sql
git commit -m "feat(pumping): add pumping_logs table with RLS policies"
```

---

### Task 7: Final Integration Check

**Step 1: Verify all imports resolve**

Run TypeScript check:
```bash
cd /Users/bernahazalgedik/sprout-baby-tracker/nodd && npx tsc --noEmit 2>&1 | head -30
```

**Step 2: Fix any type errors found**

**Step 3: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix(pumping): resolve type errors from integration"
```

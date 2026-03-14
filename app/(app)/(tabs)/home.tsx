// ============================================================
// Lumina — AI-First Home Screen (Command Center)
// Greeting → Omni-Input → 6-button action grid
// Intent router: data logging | medical queries | data queries
// ============================================================

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../src/shared/constants/theme';
import { formatTimerSeconds } from '../../../src/shared/utils/dateTime';
import { BottomSheet } from '../../../src/shared/components/BottomSheet';
import { KeyboardDoneBar, KEYBOARD_DONE_ID } from '../../../src/shared/components/KeyboardDoneBar';
import { CelebrationModal } from '../../../src/shared/components/CelebrationModal';
import { PrepDashboard } from '../../../src/modules/pregnancy/components/PrepDashboard';
import { ChatSheet } from '../../../src/modules/insights/components/ChatSheet';
import { FeedingSheet } from '../../../src/modules/feeding/components/FeedingSheet';
import { SleepSheet } from '../../../src/modules/sleep/components/SleepSheet';
import { DiaperSheet } from '../../../src/modules/diaper/components/DiaperSheet';
import { PumpingSheet } from '../../../src/modules/pumping/components/PumpingSheet';

import { useDashboardData } from '../../../src/modules/dashboard/hooks/useDashboardData';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useFeedingStore } from '../../../src/stores/feedingStore';
import { useDiaperStore } from '../../../src/stores/diaperStore';
import { useSleepStore } from '../../../src/stores/sleepStore';
import { useHealthStore } from '../../../src/stores/healthStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { useDateFormat } from '../../../src/shared/hooks/useDateFormat';
import { useSeedData } from '../../../src/data/useSeedData';
import { generateUUID } from '../../../src/stores/createSyncedStore';
import { LuminaWhisper } from '../../../src/shared/components/LuminaWhisper';
import { parseLogInput } from '../../../src/modules/logging/services/parseLogInputService';
import type { ParsedLogAction } from '../../../src/modules/logging/types';
import type { FeedingLog } from '../../../src/modules/feeding/types';
import type { SleepLog } from '../../../src/modules/sleep/types';
import type { HealthLog } from '../../../src/modules/health/types';
import type { GrowthLog } from '../../../src/modules/growth/types';
import type { Baby } from '../../../src/modules/baby/types';
import type { DiaperType } from '../../../src/shared/types/common';
import { useGrowthStore } from '../../../src/stores/growthStore';
import { calculatePercentile, resolveSex } from '../../../src/modules/growth/utils/percentileCalculation';

// ── Pixel-perfect design tokens ─────────────────────────────
const UI = {
  bg: '#F7F4F0',
  text: '#3D3D3D',
  textSecondary: '#5C5C5C',  // body text — readable on cream
  textMuted: '#8A8A8A',      // small labels, captions
  accent: '#B199CE',
  card: '#FFFFFF',
  logBg: '#F0EAE1',
  secondary: '#F2B89C',
};

const SOFT_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
};

// ── Action grid — split into primary (daily) and secondary (occasional) ──
// Row 1: Sleep (full width), Row 2: Feed + Pump, Row 3: Diaper + Play Time
const PRIMARY_ACTIONS_ROW1 = [
  { id: 'sleep', label: 'Sleep', icon: 'moon' as const, iconBg: '#E8DDF3', iconTint: '#735A88', route: '/(app)/log/sleep' },
];
const PRIMARY_ACTIONS_ROW2 = [
  { id: 'feeding', label: 'Feed', icon: 'droplet' as const, iconBg: '#FEE8DC', iconTint: '#96624A', route: '/(app)/log/feeding' },
  { id: 'pumping', label: 'Pump', icon: 'zap' as const, iconBg: '#E8DDF3', iconTint: '#735A88', route: '/(app)/log/pumping' },
];
const PRIMARY_ACTIONS_ROW3 = [
  { id: 'diaper', label: 'Diaper', icon: 'diaper' as const, iconBg: '#F0ECE6', iconTint: '#7A6B5A', route: '/(app)/log/diaper' },
  { id: 'activity', label: 'Play Time', icon: 'smile' as const, iconBg: '#FEE8DC', iconTint: '#96624A', route: '/(app)/log/activity' },
];

const SECONDARY_ACTIONS = [
  { id: 'growth', label: 'Growth', subtitle: 'Weight, height & head', icon: 'trending-up' as const, tint: '#A78BBA', route: '/(app)/log/growth' },
  { id: 'health', label: 'Health', subtitle: 'Symptoms, meds & visits', icon: 'thermometer' as const, tint: '#A88978', route: '/(app)/health' },
];

// ── Simulator / dev detection ────────────────────────────────
// __DEV__ is true in development builds (simulator/emulator).
// In production builds on real devices, this is false.
const IS_SIMULATOR = __DEV__;

const MOCK_TRANSCRIPTIONS = [
  'I just changed a dirty diaper',
  'Baby had 120ml of formula',
  'She fell asleep at 2pm',
  'He just woke up from a nap',
  'Fed on the left side for 10 minutes',
  'Changed a wet diaper',
];

// ── Intent detection patterns ────────────────────────────────

const LOGGING_PATTERNS = [
  // Diaper
  { pattern: /(?:changed?\s+(?:a\s+)?(?:wet|dirty|poopy|soiled)\s+diaper|(?:wet|dirty|poopy)\s+diaper|diaper\s+change)/i, type: 'diaper' as const },
  { pattern: /(?:just\s+)?(?:had\s+)?(?:a\s+)?(?:poop|pooped|poo)/i, type: 'diaper_dirty' as const },
  // Feeding
  { pattern: /(?:fed|nursed|breastfee?d|gave\s+(?:a\s+)?bottle|drank\s+\d+\s*(?:ml|oz)|finished\s+(?:a\s+)?feed|bottle|formula|ate)/i, type: 'feed' as const },
  { pattern: /(?:just\s+)?(?:had\s+)?(?:\d+\s*(?:ml|oz)\s+(?:of\s+)?(?:milk|formula|breast\s*milk))/i, type: 'feed_amount' as const },
  // Sleep
  { pattern: /(?:fell\s+asleep|went\s+to\s+sleep|(?:just\s+)?(?:started|began)\s+(?:a\s+)?(?:nap|sleeping)|put\s+(?:down|to\s+bed|to\s+sleep))/i, type: 'sleep_start' as const },
  { pattern: /(?:woke\s+up|just\s+(?:woke|awake)|finished\s+(?:a\s+)?nap|napped\s+for)/i, type: 'sleep_end' as const },
  // Growth (requires number + unit to distinguish from questions)
  { pattern: /(?:weigh(?:s|ed)?\s+\d|(?:\d+\.?\d*\s*(?:kg|lbs?|pounds?|grams?|g)\b)|(?:\d+\.?\d*\s*(?:cm|in(?:ches)?)\s*(?:tall|long))|head\s+(?:circumference|circ))/i, type: 'growth' as const },
];

const DATA_QUERY_PATTERNS = [
  /(?:show|display|see|view|how\s+(?:much|many)|what\s+(?:was|were)|look\s+at|give\s+me)\s+(?:.*?)(?:log|chart|data|history|trend|record|stat|summary|graph|report)/i,
  /(?:last|past|previous)\s+(?:\d+\s+)?(?:day|week|month)s?\s+(?:of\s+)?(?:feed|sleep|diaper|growth|weight)/i,
  /(?:how\s+(?:much|many|long))\s+(?:did|has|does)\s+(?:\w+\s+)?(?:eat|feed|sleep|nap|poop|wet)/i,
  /(?:average|total)\s+(?:feed|sleep|diaper|milk|intake)/i,
];

type IntentType = 'log' | 'medical' | 'data_query';

interface IntentResult {
  type: IntentType;
  subType?: string;
  confidence: number;
}

function classifyIntent(text: string): IntentResult {
  const lower = text.toLowerCase().trim();

  // Check for data logging patterns
  for (const { pattern, type } of LOGGING_PATTERNS) {
    if (pattern.test(lower)) {
      return { type: 'log', subType: type, confidence: 0.9 };
    }
  }

  // Check for data query patterns
  for (const pattern of DATA_QUERY_PATTERNS) {
    if (pattern.test(lower)) {
      return { type: 'data_query', confidence: 0.85 };
    }
  }

  // Default: treat as medical/care question for Lumina
  return { type: 'medical', confidence: 0.7 };
}

// ── AI Command Center: execute parsed log actions ────────────

function executeLogAction(
  parsed: ParsedLogAction,
  baby: Baby,
  loggedBy: string,
  feedingMethod: string,
): { success: boolean; toastMsg: string } {
  const now = new Date().toISOString();

  switch (parsed.action_type) {
    case 'diaper': {
      const diaperType: DiaperType = parsed.diaper?.type ?? 'wet';
      useDiaperStore.getState().quickLog(baby.id, baby.family_id, loggedBy, diaperType);
      return { success: true, toastMsg: parsed.summary };
    }

    case 'feeding': {
      const f = parsed.feeding;
      const feedType = f?.type ?? (feedingMethod === 'formula_only' ? 'bottle' : 'breast');
      const durationSecs = f?.duration_minutes ? f.duration_minutes * 60 : null;
      const log: FeedingLog = {
        id: generateUUID(),
        baby_id: baby.id,
        family_id: baby.family_id,
        logged_by: loggedBy,
        type: feedType,
        started_at: now,
        ended_at: now,
        breast_side: f?.breast_side ?? (feedType === 'breast' ? 'both' : null),
        left_duration_seconds: f?.breast_side === 'left' ? durationSecs : (f?.breast_side === 'both' && durationSecs ? Math.round(durationSecs / 2) : null),
        right_duration_seconds: f?.breast_side === 'right' ? durationSecs : (f?.breast_side === 'both' && durationSecs ? Math.round(durationSecs / 2) : null),
        bottle_amount_ml: f?.amount_ml ?? null,
        bottle_content: f?.bottle_content ?? null,
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
      return { success: true, toastMsg: parsed.summary };
    }

    case 'sleep': {
      const s = parsed.sleep;
      if (s?.event === 'start') {
        useSleepStore.getState().startSleep(s.type ?? 'nap');
        return { success: true, toastMsg: parsed.summary };
      }
      if (s?.event === 'end') {
        const sleepLog = useSleepStore.getState().endSleep();
        if (sleepLog) {
          const filledLog: SleepLog = { ...sleepLog, baby_id: baby.id, family_id: baby.family_id, logged_by: loggedBy };
          useSleepStore.getState().addItem(filledLog);
        }
        return { success: true, toastMsg: parsed.summary };
      }
      if (s?.event === 'completed' && s.duration_minutes) {
        const endedAt = new Date();
        const startedAt = new Date(endedAt.getTime() - s.duration_minutes * 60000);
        const log: SleepLog = {
          id: generateUUID(),
          baby_id: baby.id,
          family_id: baby.family_id,
          logged_by: loggedBy,
          type: s.type ?? 'nap',
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
          duration_minutes: s.duration_minutes,
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
        return { success: true, toastMsg: parsed.summary };
      }
      return { success: false, toastMsg: '' };
    }

    case 'health': {
      const h = parsed.health;
      const log: HealthLog = {
        id: generateUUID(),
        baby_id: baby.id,
        family_id: baby.family_id,
        logged_by: loggedBy,
        logged_at: now,
        type: h?.type ?? 'symptom',
        temperature_celsius: h?.temperature_celsius ?? null,
        temperature_method: null,
        medication_name: h?.medication_name ?? null,
        medication_dose: null,
        symptoms: h?.symptoms ?? null,
        doctor_name: null,
        diagnosis: null,
        notes: null,
        attachments: null,
        episode_id: null,
        created_at: now,
        updated_at: now,
      };
      useHealthStore.getState().addHealthLog(log);
      return { success: true, toastMsg: parsed.summary };
    }

    case 'growth': {
      const g = parsed.growth;
      if (!g?.weight_grams && !g?.height_cm && !g?.head_circumference_cm) {
        return { success: false, toastMsg: '' };
      }

      const birthDate = new Date(baby.date_of_birth);
      const nowDate = new Date();
      const ageMonths = (nowDate.getTime() - birthDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
      const sex = resolveSex(baby.gender);

      const wPerc = g.weight_grams ? calculatePercentile(sex, 'weight', ageMonths, g.weight_grams) : null;
      const hPerc = g.height_cm ? calculatePercentile(sex, 'length', ageMonths, g.height_cm) : null;
      const headPerc = g.head_circumference_cm ? calculatePercentile(sex, 'head', ageMonths, g.head_circumference_cm) : null;

      const growthLog: GrowthLog = {
        id: generateUUID(),
        baby_id: baby.id,
        family_id: baby.family_id,
        logged_by: loggedBy,
        measured_at: now,
        weight_grams: g.weight_grams ?? null,
        height_cm: g.height_cm ?? null,
        head_circumference_cm: g.head_circumference_cm ?? null,
        weight_percentile: wPerc,
        height_percentile: hPerc,
        head_percentile: headPerc,
        chart_type: 'who',
        notes: null,
        created_at: now,
        updated_at: now,
      };
      useGrowthStore.getState().addItem(growthLog);

      // Rich toast with percentile: "6.5 kg (P45)"
      const parts: string[] = [];
      if (g.weight_grams) parts.push(`${(g.weight_grams / 1000).toFixed(1)} kg${wPerc != null ? ` (P${Math.round(wPerc)})` : ''}`);
      if (g.height_cm) parts.push(`${g.height_cm.toFixed(1)} cm${hPerc != null ? ` (P${Math.round(hPerc)})` : ''}`);
      if (g.head_circumference_cm) parts.push(`Head ${g.head_circumference_cm.toFixed(1)} cm${headPerc != null ? ` (P${Math.round(headPerc)})` : ''}`);

      return { success: true, toastMsg: parts.join(' · ') || parsed.summary };
    }

    default:
      return { success: false, toastMsg: '' };
  }
}

// ── Helpers ──────────────────────────────────────────────────

function getAffirmation(babyName: string | null, ageDays: number | null): string {
  // Day 0 — baby born today
  if (ageDays === 0) {
    return babyName
      ? `Welcome to the world, ${babyName}! Take it one moment at a time.`
      : 'Welcome to the world, little one! Take it one moment at a time.';
  }
  // Older baby — time-of-day affirmations (postpartum-appropriate only)
  const hour = new Date().getHours();
  if (hour < 5) return "You're not alone in this. We're here.";
  if (hour < 12) return "Take a deep breath, you're doing great.";
  if (hour < 17) return "You're doing an amazing job today.";
  if (hour < 21) return "You've earned some rest. You're doing beautifully.";
  return 'Rest when you can. Tomorrow is a new day.';
}

// ── Voice recording state (visual mock) ──────────────────────

function VoiceRecordingOverlay({ onCancel, onFinish }: { onCancel: () => void; onFinish: () => void }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.voiceOverlay}>
      <View style={styles.voiceContent}>
        <Animated.View
          style={[styles.voiceGlow, { transform: [{ scale: pulseAnim }] }]}
        >
          <View style={styles.voiceMicCircle}>
            <Feather name="mic" size={28} color="#FFF" />
          </View>
        </Animated.View>
        <Text style={styles.voiceLabel}>{IS_SIMULATOR ? 'Simulating...' : 'Listening...'}</Text>
        <Text style={styles.voiceHint}>
          {IS_SIMULATOR
            ? 'Mock mode — will auto-transcribe in 2s'
            : 'Speak naturally — e.g. "I changed a dirty diaper"'}
        </Text>
        <View style={styles.voiceButtonRow}>
          <Pressable style={styles.voiceCancelButton} onPress={onCancel}>
            <Text style={styles.voiceCancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.voiceFinishButton} onPress={onFinish}>
            <Feather name="check" size={16} color="#FFF" />
            <Text style={styles.voiceFinishText}>Finish</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── Main component ───────────────────────────────────────────

export default function HomeScreen() {
  useSeedData();
  const router = useRouter();
  const {
    greeting,
    parentName,
    babyName,
    babyAge,
    isPregnant,
    dueDate,
    gestationalInfo,
    feedingMethod,
  } = useDashboardData();

  // Sheet props — hook-level subscriptions
  const activeBaby = useBabyStore((s) => s.getActiveBaby());
  const session = useAuthStore((s) => s.session);
  const loggedBy = session?.user?.id ?? '';
  const babyAgeMonths = babyAge ? Math.floor(babyAge.days / 30.44) : 0;

  // ── Timer subscriptions for live grid buttons ──
  const feedingTimer = useFeedingStore((s) => s.activeTimer);
  const sleepTimer = useSleepStore((s) => s.activeTimer);
  const [timerElapsed, setTimerElapsed] = useState(0);

  useEffect(() => {
    const active = feedingTimer ?? sleepTimer;
    if (!active) { setTimerElapsed(0); return; }

    const tick = () => {
      if (feedingTimer?.pausedAt) {
        setTimerElapsed(feedingTimer.accumulatedSeconds);
      } else {
        const base = feedingTimer ? feedingTimer.accumulatedSeconds : 0;
        const running = Math.floor((Date.now() - active.startedAt) / 1000);
        setTimerElapsed(base + running);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [feedingTimer, sleepTimer]);

  const [showNurseChat, setShowNurseChat] = useState(false);
  const [showFeedingSheet, setShowFeedingSheet] = useState(false);
  const [showSleepSheet, setShowSleepSheet] = useState(false);
  const [showDiaperSheet, setShowDiaperSheet] = useState(false);
  const [showPumpingSheet, setShowPumpingSheet] = useState(false);
  const [smartText, setSmartText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // ── AI Command Center: two-tier intent processing ──
  // Shared processor used by both text submit and voice transcription
  const processInput = useCallback(async (text: string) => {
    const baby = useBabyStore.getState().getActiveBaby();
    const session = useAuthStore.getState().session;
    const loggedBy = session?.user?.id ?? '';

    // ── TIER 1: Fast regex path (no network, instant) ──
    const regexIntent = classifyIntent(text);

    // Data queries — explicit regex match, route immediately
    if (regexIntent.type === 'data_query') {
      router.push('/(app)/(tabs)/guide' as any);
      return;
    }
    // NOTE: 'medical' is the default fallback (confidence 0.7) for anything
    // the regex can't classify. We do NOT short-circuit here — let the AI
    // parser handle it in Tier 2. Only truly obvious medical questions
    // (e.g. "is this rash normal?") should go to chat, and the AI parser
    // will route those via intent='medical' in its response.

    // Simple diaper quicklog — regex is plenty, skip AI
    if (regexIntent.type === 'log' && regexIntent.subType?.startsWith('diaper') && baby) {
      const diaperType = regexIntent.subType === 'diaper_dirty' ? 'dirty' : 'wet';
      useDiaperStore.getState().quickLog(baby.id, baby.family_id, loggedBy, diaperType);
      setToastMsg(`\u2728 ${diaperType === 'dirty' ? 'Dirty' : 'Wet'} diaper tracked.`);
      setShowToast(true);
      return;
    }

    // No baby context — can't log, open chat instead
    if (!baby) {
      if (regexIntent.type === 'log' && regexIntent.subType?.startsWith('diaper')) {
        router.push('/(app)/log/diaper' as any);
      } else if (regexIntent.type === 'log' && regexIntent.subType?.startsWith('feed')) {
        router.push('/(app)/log/feeding' as any);
      } else if (regexIntent.type === 'log' && regexIntent.subType?.startsWith('sleep')) {
        router.push('/(app)/log/sleep' as any);
      } else if (regexIntent.type === 'log' && regexIntent.subType === 'growth') {
        router.push('/(app)/log/growth' as any);
      } else {
        setShowNurseChat(true);
      }
      return;
    }

    // ── TIER 2: AI parse for complex inputs ──
    const result = await parseLogInput(text, feedingMethod);

    if (result.error || !result.parsed) {
      // Offline/error fallback: use regex with basic field construction
      if (regexIntent.type === 'log' && regexIntent.subType?.startsWith('feed')) {
        const now = new Date().toISOString();
        const feedType = feedingMethod === 'formula_only' ? 'bottle' : 'breast';
        const log: FeedingLog = {
          id: generateUUID(),
          baby_id: baby.id,
          family_id: baby.family_id,
          logged_by: loggedBy,
          type: feedType,
          started_at: now,
          ended_at: now,
          breast_side: feedType === 'breast' ? 'both' : null,
          left_duration_seconds: null,
          right_duration_seconds: null,
          bottle_amount_ml: null,
          bottle_content: null,
          bottle_temperature: null,
          solid_foods: null,
          sensitivity_notes: null,
          notes: text,
          baby_response: null,
          photo_url: null,
          created_at: now,
          updated_at: now,
        };
        useFeedingStore.getState().addItem(log);
        setToastMsg('\u2728 Feeding saved.');
        setShowToast(true);
        return;
      }
      if (regexIntent.type === 'log' && regexIntent.subType?.startsWith('sleep')) {
        router.push('/(app)/log/sleep' as any);
        return;
      }
      if (regexIntent.type === 'log' && regexIntent.subType === 'growth') {
        router.push('/(app)/log/growth' as any);
        return;
      }
      // Can't parse offline — open chat for help
      setShowNurseChat(true);
      return;
    }

    // Route non-log intents from AI
    const parsed = result.parsed;
    if (parsed.intent === 'medical') {
      setShowNurseChat(true);
      return;
    }
    if (parsed.intent === 'data_query') {
      router.push('/(app)/(tabs)/guide' as any);
      return;
    }

    // Execute the parsed log action
    const { success, toastMsg: msg } = executeLogAction(parsed, baby, loggedBy, feedingMethod);
    if (success) {
      setToastMsg(`\u2728 ${msg}`);
      setShowToast(true);
    } else if (parsed.action_type === 'sleep') {
      router.push('/(app)/log/sleep' as any);
    } else {
      setShowNurseChat(true);
    }
  }, [feedingMethod, router]);

  const handleSmartSubmit = useCallback(() => {
    const text = smartText.trim();
    if (!text) return;
    setSmartText('');
    processInput(text);
  }, [smartText, processInput]);

  const mockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processTranscription = useCallback((text: string) => {
    setSmartText(text);
    setTimeout(() => {
      setSmartText('');
      processInput(text);
    }, 50);
  }, [processInput]);

  const handleMicPress = useCallback(() => {
    if (IS_SIMULATOR) {
      // Mock mode: show recording UI for 2s, then inject random transcription
      setIsRecording(true);
      mockTimerRef.current = setTimeout(() => {
        setIsRecording(false);
        const mock = MOCK_TRANSCRIPTIONS[Math.floor(Math.random() * MOCK_TRANSCRIPTIONS.length)];
        processTranscription(mock);
      }, 2000);
    } else {
      // Real device: show recording overlay for actual audio capture
      setIsRecording(true);
    }
  }, [processTranscription]);

  const handleCancelRecording = useCallback(() => {
    if (mockTimerRef.current) {
      clearTimeout(mockTimerRef.current);
      mockTimerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const handleFinishRecording = useCallback(() => {
    if (mockTimerRef.current) {
      // Simulator: finish early — inject mock immediately
      clearTimeout(mockTimerRef.current);
      mockTimerRef.current = null;
      setIsRecording(false);
      const mock = MOCK_TRANSCRIPTIONS[Math.floor(Math.random() * MOCK_TRANSCRIPTIONS.length)];
      processTranscription(mock);
    } else {
      // Real device: TODO — transcribe actual audio
      setIsRecording(false);
      setShowNurseChat(true);
    }
  }, [processTranscription]);

  // Celebration + birth capture state
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBirthSheet, setShowBirthSheet] = useState(false);
  const [birthDateDisplay, setBirthDateDisplay] = useState('');

  const updateBaby = useBabyStore((s) => s.updateBaby);
  const getActiveBaby = useBabyStore((s) => s.getActiveBaby);
  const { formatDateInput, toISO, fromISO, placeholder: DATE_PLACEHOLDER } = useDateFormat();

  const birthDateValid = useMemo(() => {
    const iso = toISO(birthDateDisplay);
    if (!iso || iso.length !== 10) return false;
    const d = new Date(iso);
    return !isNaN(d.getTime());
  }, [birthDateDisplay, toISO]);

  const handleBabyArrivedPress = () => setShowCelebration(true);

  const handleCelebrationContinue = () => {
    setShowCelebration(false);
    const todayISO = new Date().toISOString().split('T')[0];
    setBirthDateDisplay(fromISO(todayISO));
    setTimeout(() => setShowBirthSheet(true), 300);
  };

  const handleConfirmBirth = () => {
    const iso = toISO(birthDateDisplay);
    if (!iso || !birthDateValid) return;
    const baby = getActiveBaby();
    if (!baby) return;
    setShowBirthSheet(false);
    setBirthDateDisplay('');
    updateBaby(baby.id, { is_pregnant: false, date_of_birth: iso });
  };

  // ── Pregnancy mode ──
  if (isPregnant && dueDate) {
    const safeGestationalInfo = {
      week: gestationalInfo?.week ?? 4,
      dayOfWeek: gestationalInfo?.dayOfWeek ?? 0,
      progress: gestationalInfo?.progress ?? 0,
    };
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <PrepDashboard
            babyName={babyName || 'your little one'}
            dueDate={dueDate}
            gestationalInfo={safeGestationalInfo}
            onBabyArrivedPress={handleBabyArrivedPress}
            onJournal={() => setShowNurseChat(true)}
            onAskLumina={() => setShowNurseChat(true)}
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Voice recording overlay */}
        {isRecording && (
          <VoiceRecordingOverlay onCancel={handleCancelRecording} onFinish={handleFinishRecording} />
        )}

        {/* AI Chat */}
        <ChatSheet
          visible={showNurseChat}
          onClose={() => setShowNurseChat(false)}
          insight={null}
          babyName={babyName}
          babyAgeDays={null}
          feedingMethod={feedingMethod}
          isPregnant
        />

        <CelebrationModal visible={showCelebration} onContinue={handleCelebrationContinue} />
        <BottomSheet visible={showBirthSheet} onClose={() => setShowBirthSheet(false)} title="Congratulations!">
          <Text style={styles.sheetSubtitle}>When did your little one arrive?</Text>
          <View style={styles.sheetDateRow}>
            <Feather name="calendar" size={18} color={UI.textMuted} style={styles.sheetDateIcon} />
            <TextInput
              style={styles.sheetDateInput}
              placeholder={DATE_PLACEHOLDER}
              placeholderTextColor={UI.textMuted}
              value={birthDateDisplay}
              onChangeText={(t) => setBirthDateDisplay(formatDateInput(t))}
              keyboardType="number-pad"
              maxLength={10}
              autoFocus
              inputAccessoryViewID={KEYBOARD_DONE_ID}
            />
          </View>
          <Pressable
            style={[styles.sheetConfirmButton, !birthDateValid && styles.sheetConfirmDisabled]}
            onPress={handleConfirmBirth}
            disabled={!birthDateValid}
          >
            <Feather name="heart" size={18} color="#FFF" />
            <Text style={styles.sheetConfirmText}>Welcome Baby</Text>
          </Pressable>
        </BottomSheet>

        <LuminaWhisper
          visible={showToast}
          message={toastMsg}
          onDismiss={() => setShowToast(false)}
        />
        <KeyboardDoneBar />
      </SafeAreaView>
    );
  }

  // ── Postpartum — AI-first layout ──
  const affirmation = getAffirmation(babyName, babyAge?.days ?? null);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* ── Greeting ── */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTitle}>
            {greeting}{parentName ? `, ${parentName}` : ''}.
          </Text>
          {babyAge && babyName && (
            <Text style={styles.greetingAge}>{babyName} is {babyAge.display}</Text>
          )}
          {babyAge && !babyName && (
            <Text style={styles.greetingAge}>{babyAge.display}</Text>
          )}
          <Text style={styles.greetingAffirmation}>{affirmation}</Text>
        </View>

        {/* ── Lumina AI Hub ── */}
        <View style={styles.luminaHub}>
          {/* Header row */}
          <View style={styles.luminaHubHeader}>
            <View style={styles.luminaHubIcon}>
              <Feather name="message-circle" size={22} color={colors.primary[600]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.luminaHubTitle}>Lumina</Text>
              <Text style={styles.luminaHubSubtitle}>Your AI parenting companion</Text>
            </View>
          </View>

          {/* Input bar */}
          <Pressable style={styles.luminaInputBar} onPress={() => setShowNurseChat(true)}>
            <Feather name="search" size={18} color={UI.textMuted} />
            <Text style={styles.luminaInputPlaceholder}>
              {babyName ? `What's on your mind about ${babyName}?` : 'Ask me anything...'}
            </Text>
            <Pressable
              style={styles.luminaHubMic}
              onPress={(e) => {
                e.stopPropagation();
                handleMicPress();
              }}
              hitSlop={12}
              accessibilityLabel="Voice input"
            >
              <Feather name="mic" size={18} color={colors.primary[600]} />
            </Pressable>
          </Pressable>

          {/* Suggested prompt chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promptChipsRow}
          >
            {[
              `Is 38°C a fever?`,
              babyName ? `Analyze ${babyName}'s sleep` : 'Analyze sleep patterns',
              `Play ideas for ${babyAgeMonths || 2} months`,
              'When to start solids?',
              'Normal poop colors',
            ].map((prompt) => (
              <Pressable
                key={prompt}
                style={styles.promptChip}
                onPress={() => {
                  setSmartText(prompt);
                  setShowNurseChat(true);
                }}
              >
                <Text style={styles.promptChipText}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Primary Actions (Row 1: Sleep, Row 2: Feed+Pump, Row 3: Diaper+Play) ── */}
        <View style={styles.actionGrid}>
          {[...PRIMARY_ACTIONS_ROW1, ...PRIMARY_ACTIONS_ROW2, ...PRIMARY_ACTIONS_ROW3].map((action, idx) => {
            const isFeedingLive = action.id === 'feeding' && !!feedingTimer;
            const isSleepLive = action.id === 'sleep' && !!sleepTimer;
            const isLive = isFeedingLive || isSleepLive;
            const liveColor = isFeedingLive ? '#A78BBA' : '#6B5B8A';
            const isFullWidth = idx === 0; // Sleep is first, full width

            const liveSub = isFeedingLive
              ? (feedingTimer?.side ? `${feedingTimer.side.charAt(0).toUpperCase() + feedingTimer.side.slice(1)} breast` : 'Breast')
              : isSleepLive
              ? (sleepTimer?.type === 'night' ? 'Night' : 'Nap')
              : null;

            return (
              <Pressable
                key={action.id}
                style={[
                  styles.actionButton,
                  isFullWidth && styles.actionButtonFull,
                  isLive && { borderWidth: 1.5, borderColor: liveColor + '40' },
                ]}
                onPress={() => {
                  if (action.id === 'feeding') setShowFeedingSheet(true);
                  else if (action.id === 'sleep') setShowSleepSheet(true);
                  else if (action.id === 'diaper') setShowDiaperSheet(true);
                  else if (action.id === 'pumping') setShowPumpingSheet(true);
                  else router.push(action.route as any);
                }}
                accessibilityLabel={isLive ? `${action.label} timer running` : `Log ${action.label}`}
              >
                <View style={[
                  styles.actionIconWrap,
                  { backgroundColor: action.iconBg },
                  isLive && { borderWidth: 2, borderColor: liveColor },
                ]}>
                  {action.icon === 'diaper' ? (
                    <MaterialCommunityIcons name="human-baby-changing-table" size={24} color={isLive ? liveColor : action.iconTint} />
                  ) : (
                    <Feather name={action.icon} size={24} color={isLive ? liveColor : action.iconTint} />
                  )}
                </View>
                <View>
                  <Text style={[styles.actionLabel, { color: isLive ? liveColor : '#33302B' }]}>
                    {isLive ? formatTimerSeconds(timerElapsed) : action.label}
                  </Text>
                  {isLive && liveSub && (
                    <Text style={styles.actionLiveSub}>{liveSub}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ── Secondary Actions (Health & Growth) ── */}
        <View style={styles.secondarySection}>
          <Text style={styles.secondarySectionTitle}>Health & Growth</Text>
          {SECONDARY_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={styles.secondaryRow}
              onPress={() => router.push(action.route as any)}
              accessibilityLabel={`Log ${action.label}`}
            >
              <View style={[styles.secondaryIcon, { backgroundColor: action.tint + '15' }]}>
                <Feather name={action.icon} size={20} color={action.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.secondaryLabel}>{action.label}</Text>
                <Text style={styles.secondarySubtitle}>{action.subtitle}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={UI.textMuted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Voice recording overlay */}
      {isRecording && (
        <VoiceRecordingOverlay onCancel={handleCancelRecording} onFinish={handleFinishRecording} />
      )}

      {/* AI Chat (opened by medical/care queries) */}
      <ChatSheet
        visible={showNurseChat}
        onClose={() => setShowNurseChat(false)}
        insight={null}
        babyName={babyName}
        babyAgeDays={babyAge?.days ?? null}
        feedingMethod={feedingMethod}
      />

      {/* Quick Action Sheets */}
      <FeedingSheet
        visible={showFeedingSheet}
        onClose={() => setShowFeedingSheet(false)}
        babyId={activeBaby?.id ?? ''}
        familyId={activeBaby?.family_id ?? ''}
        loggedBy={loggedBy}
        feedingMethod={feedingMethod}
        knownAllergies={activeBaby?.known_allergies ?? []}
        babyAgeMonths={babyAgeMonths}
        onTimerStarted={() => {
          setToastMsg('\u2728 Feeding timer started.');
          setShowToast(true);
        }}
        onLogged={() => {
          setToastMsg('\u2728 Feeding saved.');
          setShowToast(true);
        }}
      />
      <SleepSheet
        visible={showSleepSheet}
        onClose={() => setShowSleepSheet(false)}
        babyId={activeBaby?.id ?? ''}
        familyId={activeBaby?.family_id ?? ''}
        loggedBy={loggedBy}
        onTimerStarted={() => {
          setToastMsg('\u2728 Sleep timer started.');
          setShowToast(true);
        }}
        onLogged={() => {
          setToastMsg('\u2728 Sweet dreams recorded.');
          setShowToast(true);
        }}
      />
      <DiaperSheet
        visible={showDiaperSheet}
        onClose={() => setShowDiaperSheet(false)}
        babyId={activeBaby?.id ?? ''}
        familyId={activeBaby?.family_id ?? ''}
        loggedBy={loggedBy}
        onLogged={() => {
          setToastMsg('\u2728 Diaper tracked.');
          setShowToast(true);
        }}
      />
      <PumpingSheet
        visible={showPumpingSheet}
        onClose={() => setShowPumpingSheet(false)}
        babyId={activeBaby?.id ?? ''}
        familyId={activeBaby?.family_id ?? ''}
        loggedBy={loggedBy}
        onLogged={(msg) => {
          setToastMsg(msg);
          setShowToast(true);
        }}
      />

      {/* Lumina Whisper */}
      <LuminaWhisper
        visible={showToast}
        message={toastMsg}
        onDismiss={() => setShowToast(false)}
      />
      <KeyboardDoneBar />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.base,
    paddingTop: 8,
    paddingBottom: 20,
  },

  // ── Greeting ──
  greetingBlock: {
    gap: 6,
    marginBottom: 20,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: UI.text,
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  greetingAge: {
    fontSize: 15,
    fontWeight: '500',
    color: UI.textSecondary,
    letterSpacing: 0.2,
    marginTop: 2,
  },
  greetingAffirmation: {
    fontSize: 16,
    fontWeight: '400',
    color: UI.textSecondary,
    letterSpacing: 0.1,
    lineHeight: 24,
    marginTop: 4,
  },

  // ── Lumina AI Hub ──
  luminaHub: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    paddingBottom: 16,
    marginBottom: 20,
    shadowColor: '#8E72A4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  luminaHubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  luminaHubIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  luminaHubTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary[700],
  },
  luminaHubSubtitle: {
    fontSize: 13,
    color: colors.primary[500],
    marginTop: 1,
  },
  luminaInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  luminaInputPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: UI.textMuted,
  },
  luminaHubMic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptChipsRow: {
    gap: 8,
    paddingRight: 4,
  },
  promptChip: {
    backgroundColor: colors.primary[50],
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  promptChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary[700],
  },

  // ── Primary Action Grid (2×2) ──
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    marginBottom: 24,
  },
  actionButton: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius['2xl'],
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 14,
    ...SOFT_SHADOW,
  },
  actionButtonFull: {
    width: '100%',
    justifyContent: 'center',
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  actionLiveSub: {
    fontSize: 11,
    color: '#8A8A8A',
    marginTop: 1,
  },

  // ── Secondary Actions (Health & Growth) ──
  secondarySection: {
    flex: 1,
    marginBottom: 8,
  },
  secondarySectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: UI.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  secondaryRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UI.card,
    borderRadius: borderRadius['2xl'],
    paddingVertical: 20,
    paddingHorizontal: 18,
    gap: 14,
    marginBottom: 10,
    minHeight: 72,
    ...SOFT_SHADOW,
  },
  secondaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: UI.text,
    marginBottom: 2,
  },
  secondarySubtitle: {
    fontSize: 13,
    color: UI.textMuted,
  },

  // ── Voice Recording Overlay ──
  voiceOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 244, 240, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  voiceContent: {
    alignItems: 'center',
    gap: 16,
  },
  voiceGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139, 168, 142, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceMicCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: UI.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: UI.text,
    marginTop: 8,
  },
  voiceHint: {
    fontSize: 14,
    color: UI.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  voiceButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  voiceCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: UI.logBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceCancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: UI.text,
  },
  voiceFinishButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: UI.accent,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  voiceFinishText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── Birth date sheet (kept) ──
  sheetSubtitle: {
    fontSize: typography.fontSize.base,
    color: UI.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  sheetDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.bg,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xl,
  },
  sheetDateIcon: {
    marginRight: spacing.sm,
  },
  sheetDateInput: {
    flex: 1,
    paddingVertical: spacing.base,
    fontSize: typography.fontSize.md,
    color: UI.text,
  },
  sheetConfirmButton: {
    flexDirection: 'row',
    backgroundColor: UI.accent,
    borderRadius: 999,
    paddingVertical: spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    ...SOFT_SHADOW,
  },
  sheetConfirmDisabled: { opacity: 0.4 },
  sheetConfirmText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});

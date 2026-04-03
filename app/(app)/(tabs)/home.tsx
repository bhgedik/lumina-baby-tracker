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
import { Image as RNImage } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const luminaMascot = require('../../../assets/illustrations/lumina-mascot.png');
const profileIcon = require('../../../assets/illustrations/profile-icon.png');
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
import { CardIllustrationMap } from '../../../src/shared/components/CardIllustrations';
import { PetIconMap } from '../../../src/shared/components/PetIcons';
import type { PetState } from '../../../src/shared/components/PetIcons';
import { usePumpingStore } from '../../../src/stores/pumpingStore';

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
  card: '#FEFCFA',
  logBg: '#F0EAE1',
  secondary: '#F2B89C',
};

const SOFT_SHADOW = {
  shadowColor: '#B0A090',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 14,
  elevation: 4,
};

// ── Claymorphism tokens ─────────────────────────────────────
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

// ── 2x2 Grid: Row 1: Sleep+Feed, Row 2: Diaper+Pump ────────
const GRID_ROW1 = [
  { id: 'sleep', label: 'Sleep', domainColor: '#B199CE', domainColorLight: '#E8DDF3', route: '/(app)/log/sleep', neutralMins: 120, urgentMins: 210 },
  { id: 'feeding', label: 'Feed', domainColor: '#F49770', domainColorLight: '#FEE8DC', route: '/(app)/log/feeding', neutralMins: 120, urgentMins: 240 },
];
const GRID_ROW2 = [
  { id: 'diaper', label: 'Diaper', domainColor: '#FF9800', domainColorLight: '#FFF3E0', route: '/(app)/log/diaper', neutralMins: 120, urgentMins: 240 },
  { id: 'pumping', label: 'Pump', domainColor: '#A78BBA', domainColorLight: '#EDE7F6', route: '/(app)/log/pumping', neutralMins: 180, urgentMins: 360 },
];

// ── List items below the grid ───────────────────────────────
const LIST_ITEMS = [
  { id: 'activity', label: 'Play Time', description: 'Log tummy time and developmental activities.', domainColor: '#A78BBA', domainColorLight: '#F3E5F5', route: '/(app)/log/activity', neutralMins: 240, urgentMins: 480 },
  { id: 'growth', label: 'Growth', description: 'Track height, weight, and head circumference.', domainColor: '#4CAF50', domainColorLight: '#E8F5E9', route: '/(app)/log/growth', neutralMins: 10080, urgentMins: 43200 },
  { id: 'health', label: 'Health', description: 'Record vaccinations, illnesses, and symptoms.', domainColor: '#E53935', domainColorLight: '#FFEBEE', route: '/(app)/log/health', neutralMins: 10080, urgentMins: 43200 },
];

// Combined for pet state / last log calculation
const ALL_ACTIONS = [...GRID_ROW1, ...GRID_ROW2, ...LIST_ITEMS];

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

function getTimeSince(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getPetState(isoDate: string | null | undefined, neutralMins: number, urgentMins: number): PetState {
  if (!isoDate) return 'neutral';
  const mins = (Date.now() - new Date(isoDate).getTime()) / 60000;
  if (mins < neutralMins) return 'happy';
  if (mins < urgentMins) return 'urgent';
  return 'neutral';
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
  const pumpingTimer = usePumpingStore((s) => s.activeTimer);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [pumpTimerElapsed, setPumpTimerElapsed] = useState(0);

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

  useEffect(() => {
    if (!pumpingTimer) { setPumpTimerElapsed(0); return; }

    const tick = () => {
      if (pumpingTimer.pausedAt) {
        setPumpTimerElapsed(pumpingTimer.accumulatedSeconds);
      } else {
        const base = pumpingTimer.accumulatedSeconds;
        const running = Math.floor((Date.now() - pumpingTimer.startedAt) / 1000);
        setPumpTimerElapsed(base + running);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pumpingTimer]);

  // Get last log times for each domain
  // Duration-based events use ended_at (when baby woke / feed ended / pump finished)
  // Point-in-time events use created_at
  const lastFeedingAt = useFeedingStore((s) => {
    if (s.items.length === 0) return null;
    const last = s.items[s.items.length - 1];
    return last?.ended_at ?? last?.started_at ?? null;
  });
  const lastSleepAt = useSleepStore((s) => {
    if (s.items.length === 0) return null;
    const last = s.items[s.items.length - 1];
    return last?.ended_at ?? last?.started_at ?? null;
  });
  const lastDiaperAt = useDiaperStore((s) => s.items.length > 0 ? s.items[s.items.length - 1]?.created_at : null);
  const lastPumpingAt = usePumpingStore((s) => {
    if (s.items.length === 0) return null;
    const last = s.items[s.items.length - 1];
    return last?.ended_at ?? last?.started_at ?? null;
  });

  const lastLogMap: Record<string, string | null> = {
    feeding: getTimeSince(lastFeedingAt),
    sleep: getTimeSince(lastSleepAt),
    diaper: getTimeSince(lastDiaperAt),
    pumping: getTimeSince(lastPumpingAt),
    activity: null,
    growth: null,
    health: null,
  };

  const petStateMap: Record<string, PetState> = {};
  ALL_ACTIONS.forEach(a => {
    const lastAt = a.id === 'feeding' ? lastFeedingAt : a.id === 'sleep' ? lastSleepAt : a.id === 'diaper' ? lastDiaperAt : a.id === 'pumping' ? lastPumpingAt : null;
    petStateMap[a.id] = getPetState(lastAt, a.neutralMins, a.urgentMins);
  });

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
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* ── Greeting row with profile icon (matching postpartum) ── */}
          <View style={styles.greetingRow}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greetingTitle}>
                {greeting}{parentName ? `, ${parentName}` : ''}.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/profile')}
              hitSlop={10}
              style={styles.profileBtn}
              accessibilityRole="button"
              accessibilityLabel="Profile"
            >
              <RNImage source={profileIcon} style={styles.profileIcon} resizeMode="contain" />
            </Pressable>
          </View>

          <PrepDashboard
            babyName={babyName || 'your little one'}
            dueDate={dueDate}
            gestationalInfo={safeGestationalInfo}
            onBabyArrivedPress={handleBabyArrivedPress}
            onJournal={() => setShowNurseChat(true)}
            onAskLumina={() => setShowNurseChat(true)}
          />

          <View style={{ height: 30 }} />
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* ── Greeting row with profile icon ── */}
        <View style={styles.greetingRow}>
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
          </View>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/profile')}
            hitSlop={10}
            style={styles.profileBtn}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <RNImage source={profileIcon} style={styles.profileIcon} resizeMode="contain" />
          </Pressable>
        </View>

        {/* ── Lumina AI Hub ── */}
        <View style={styles.luminaHub}>
          {/* Header row */}
          <View style={styles.luminaHubHeader}>
            <RNImage source={luminaMascot} style={styles.luminaMascot} resizeMode="contain" />
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
              `Is 38\u00B0C a fever?`,
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

        {/* ── Section: Quick Log ── */}
        <Text style={styles.sectionHeader}>QUICK LOG</Text>
        <View style={styles.actionGrid}>
          {[GRID_ROW1, GRID_ROW2].map((row, rowIdx) => (
            <View key={rowIdx} style={styles.actionRow}>
              {row.map((action) => {
                const isFeedingLive = action.id === 'feeding' && !!feedingTimer;
                const isSleepLive = action.id === 'sleep' && !!sleepTimer;
                const isPumpingLive = action.id === 'pumping' && !!pumpingTimer;
                const isLive = isFeedingLive || isSleepLive || isPumpingLive;
                const liveColor = isFeedingLive ? '#A78BBA' : isPumpingLive ? '#A78BBA' : '#6B5B8A';

                const liveSub = isFeedingLive
                  ? (feedingTimer?.side ? `${feedingTimer.side.charAt(0).toUpperCase() + feedingTimer.side.slice(1)} breast` : 'Breast')
                  : isSleepLive
                  ? (sleepTimer?.type === 'night' ? 'Night' : 'Nap')
                  : isPumpingLive
                  ? (pumpingTimer?.side === 'both' ? 'Both sides' : pumpingTimer?.side === 'left' ? 'Left side' : 'Right side')
                  : null;

                const activeElapsed = isFeedingLive || isSleepLive
                  ? timerElapsed
                  : isPumpingLive
                  ? pumpTimerElapsed
                  : 0;

                const lastLogged = lastLogMap[action.id];
                const IllustrationComponent = CardIllustrationMap[action.id];

                return (
                  <Pressable
                    key={action.id}
                    style={({ pressed }) => [
                      styles.clayCard,
                      isLive && { borderColor: liveColor + '40', borderWidth: 1.5 },
                      pressed && styles.clayCardPressed,
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
                    <View style={styles.clayCardInner}>
                      {IllustrationComponent ? (
                        <IllustrationComponent size={48} />
                      ) : (
                        <Feather name="zap" size={28} color={action.domainColor} />
                      )}
                      <Text style={styles.clayCardLabel}>
                        {isLive ? formatTimerSeconds(activeElapsed) : action.label}
                      </Text>
                      {lastLogged && !isLive && (
                        <Text style={styles.clayCardSub}>{lastLogged}</Text>
                      )}
                      {isLive && liveSub && (
                        <Text style={styles.clayCardSub}>{liveSub}</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* ── Section: Health & Growth ── */}
        <Text style={styles.sectionHeader}>HEALTH & GROWTH</Text>
        <View style={styles.listSection}>
          {LIST_ITEMS.map((item) => {
            const IllustrationComponent = CardIllustrationMap[item.id];

            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.clayListItem,
                  pressed && styles.clayListItemPressed,
                ]}
                onPress={() => router.push(item.route as any)}
                accessibilityLabel={item.label}
              >
                <View style={[styles.clayListIcon, { backgroundColor: item.domainColor + '15' }]}>
                  {IllustrationComponent ? (
                    <IllustrationComponent size={40} />
                  ) : (
                    <Feather name="trending-up" size={24} color={item.domainColor} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clayListLabel}>{item.label}</Text>
                  <Text style={styles.clayListDesc}>{item.description}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={UI.textMuted} />
              </Pressable>
            );
          })}
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
        onLogged={(_type, msg) => {
          setToastMsg(msg || '\u2728 Diaper tracked.');
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
    paddingTop: 2,
    paddingBottom: 30,
  },

  // ── Greeting ──
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  greetingBlock: {
    flex: 1,
    gap: 4,
  },
  profileBtn: {
    padding: 4,
    marginTop: 2,
    marginLeft: 8,
  },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontWeight: '600',
    color: '#7C6A55',
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
    borderRadius: 22,
    padding: 16,
    paddingBottom: 14,
    marginBottom: 2,
    shadowColor: '#B0A090',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  luminaHubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  luminaHubIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  luminaMascot: {
    width: 90,
    height: 90,
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
    backgroundColor: '#F7F4F0',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE8E2',
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
    backgroundColor: '#F7F4F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EDE8E2',
  },
  promptChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B5B4E',
  },

  // ── Section Headers ──
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#8E8A9F',
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 2,
  },

  // ── 2x2 Clay Grid ──
  actionGrid: {
    gap: 12,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  clayCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    minHeight: 100,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  clayCardPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  clayCardInner: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  clayCardLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#2D2A26',
    letterSpacing: 0.2,
    textAlign: 'center' as const,
  },
  clayCardSub: {
    fontSize: 12,
    color: '#A08060',
    textAlign: 'center' as const,
  },

  // ── List Items (Clay) ──
  listSection: {
    gap: 12,
    marginBottom: 8,
  },
  clayListItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  clayListItemPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  clayListIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  clayListLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#2D2A26',
    marginBottom: 2,
  },
  clayListDesc: {
    fontSize: 13,
    color: '#8A8A8A',
    lineHeight: 18,
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

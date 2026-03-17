// ============================================================
// Nodd — Journal Tab
// Health check card + Calendar/Timeline (Daily | Weekly | Monthly)
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useDashboardData } from '../../../src/modules/dashboard/hooks/useDashboardData';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { SleepTrendLine, type TrendDay } from '../../../src/modules/insights/components/SleepTrendLine';
import { GroundedBarChart } from '../../../src/modules/insights/components/GroundedBarChart';
import type { BarDay } from '../../../src/modules/insights/components/GroundedBarChart';
import { WeeklyPatternGrid, type PatternDay } from '../../../src/modules/insights/components/WeeklyPatternGrid';
import { GrowthChartCard } from '../../../src/modules/growth/components/GrowthChartCard';
import { useGrowthChartData } from '../../../src/modules/growth/hooks/useGrowthChartData';

// ── Design tokens (Health Check card) ────────────────────────
const UI = {
  bg: '#F7F4F0',
  card: '#FFFFFF',
  text: '#3D3D3D',
  textSecondary: '#5C5C5C',
  textMuted: '#8A8A8A',
  textLight: '#B0AAA2',
  accent: '#B199CE',
  accentLight: '#F0EBF5',
  warmLight: '#FEF4E8',
  warmTint: '#C4943A',
  blushLight: '#FDF0F0',
  blushTint: '#C47A7A',
};

const SOFT_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
};

// ── Health status helpers ────────────────────────────────────

interface HealthSignal {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  detail: string;
  tint: string;
  bg: string;
}

function buildHealthSignals(
  totalFeeds: number,
  totalWet: number,
  totalDirty: number,
  lastFedAgo: string | null,
  lastSleepAgo: string | null,
  sleepHours: number | null,
): HealthSignal[] {
  const signals: HealthSignal[] = [];

  // Sleep signal
  if (sleepHours !== null) {
    const sleepGood = sleepHours >= 3;
    signals.push({
      icon: 'moon',
      label: 'Sleep',
      detail: sleepGood
        ? `${sleepHours.toFixed(1)}h today — looking consistent`
        : `${sleepHours.toFixed(1)}h today — might need more rest`,
      tint: sleepGood ? '#A78BBA' : UI.warmTint,
      bg: sleepGood ? UI.accentLight : UI.warmLight,
    });
  }

  // Feeding signal
  if (totalFeeds > 0) {
    const feedFreq = totalFeeds >= 6 ? 'on track' : 'fewer than usual';
    signals.push({
      icon: 'droplet',
      label: 'Feeding',
      detail: `${totalFeeds} feeds today — ${feedFreq}${lastFedAgo ? ` (last ${lastFedAgo})` : ''}`,
      tint: totalFeeds >= 6 ? '#A78BBA' : UI.warmTint,
      bg: totalFeeds >= 6 ? UI.accentLight : UI.warmLight,
    });
  }

  // Diaper signal
  if (totalWet + totalDirty > 0) {
    signals.push({
      icon: 'droplet',
      label: 'Diapers',
      detail: `${totalWet} wet, ${totalDirty} dirty today`,
      tint: '#A78BBA',
      bg: UI.accentLight,
    });
  }

  return signals;
}

// ── Pregnancy weekly data ────────────────────────────────────

interface PregnancyWeekInfo {
  babySize: string;
  babyDev: string;
  momBody: string;
  tip: string;
  tipIcon: React.ComponentProps<typeof Feather>['name'];
}

function getPregnancyWeekInfo(week: number): PregnancyWeekInfo {
  if (week <= 12) return {
    babySize: 'Lime',
    babyDev: 'All major organs are forming. Tiny fingers and toes are developing, and baby can make small movements.',
    momBody: 'Fatigue and nausea are common. Your body is building the placenta — the hardest behind-the-scenes work.',
    tip: 'Small, frequent meals can ease nausea. Stay hydrated and rest when you can.',
    tipIcon: 'droplet',
  };
  if (week <= 16) return {
    babySize: 'Avocado',
    babyDev: 'Baby is growing rapidly. Facial features are becoming more defined, and they may start sucking their thumb.',
    momBody: 'Energy often returns in the second trimester. You may notice a small bump forming.',
    tip: 'This is a great time to start prenatal yoga or gentle walks.',
    tipIcon: 'heart',
  };
  if (week <= 20) return {
    babySize: 'Banana',
    babyDev: 'Baby can hear sounds now! They\'re developing sleep-wake cycles and you may feel the first flutters of movement.',
    momBody: 'The "quickening" — first movements you can feel. Round ligament pain is common as your uterus grows.',
    tip: 'Talk and sing to your baby. They\'re learning to recognize your voice.',
    tipIcon: 'music',
  };
  if (week <= 24) return {
    babySize: 'Papaya',
    babyDev: 'Baby\'s lungs are developing rapidly. They respond to light, sound, and touch. Taste buds are forming.',
    momBody: 'You may feel Braxton Hicks contractions — practice contractions that are irregular and painless.',
    tip: 'Start thinking about your birth preferences. No pressure to decide yet, just explore.',
    tipIcon: 'book-open',
  };
  if (week <= 28) return {
    babySize: 'Cauliflower',
    babyDev: 'Baby can open and close their eyes. Brain development is accelerating rapidly. They dream during REM sleep.',
    momBody: 'Backaches and leg cramps may increase. Your belly is growing noticeably now.',
    tip: 'Consider your birth plan and start preparing the nursery at your own pace.',
    tipIcon: 'home',
  };
  if (week <= 32) return {
    babySize: 'Squash',
    babyDev: 'Baby is putting on weight and developing fat layers. Bones are hardening except the skull, which stays flexible for birth.',
    momBody: 'Shortness of breath and heartburn are common as baby takes up more space.',
    tip: 'Pack your hospital bag. It\'s early, but one less thing to worry about later.',
    tipIcon: 'briefcase',
  };
  if (week <= 36) return {
    babySize: 'Honeydew melon',
    babyDev: 'Baby is nearly fully developed. They\'re gaining about half a pound per week and settling into head-down position.',
    momBody: 'Nesting instinct may kick in. Braxton Hicks may become more frequent.',
    tip: 'Practice breathing techniques. Rest as much as possible — your body is doing incredible work.',
    tipIcon: 'wind',
  };
  return {
    babySize: 'Watermelon',
    babyDev: 'Baby is full-term and ready! Lungs are mature, reflexes are coordinated, and they\'re just putting on final weight.',
    momBody: 'Baby may "drop" lower. You might feel pressure but also breathe easier. The finish line is near!',
    tip: 'Trust your body and your instincts. You\'re about to meet someone amazing.',
    tipIcon: 'star',
  };
}

interface PregnancyWellnessTip {
  id: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
  tint: string;
  bg: string;
}

function getPregnancyWellnessTips(week: number): PregnancyWellnessTip[] {
  const tips: PregnancyWellnessTip[] = [
    {
      id: 'hydration',
      icon: 'droplet',
      title: 'Stay hydrated',
      body: 'Aim for 8-10 glasses of water daily. Proper hydration supports amniotic fluid levels and helps with fatigue.',
      tint: '#5B9BD5',
      bg: '#EBF3FB',
    },
    {
      id: 'prenatal',
      icon: 'shield',
      title: 'Prenatal vitamins',
      body: 'Folic acid, iron, and DHA are essential. Take them with food to reduce nausea.',
      tint: '#6BAF7B',
      bg: '#EDF7EF',
    },
    {
      id: 'movement',
      icon: 'activity',
      title: 'Gentle movement',
      body: 'Walking, swimming, or prenatal yoga for 30 minutes most days supports circulation and mood.',
      tint: '#A78BBA',
      bg: UI.accentLight,
    },
  ];

  if (week >= 28) {
    tips.push({
      id: 'kicks',
      icon: 'zap',
      title: 'Count the kicks',
      body: 'From week 28, track baby\'s movements daily. 10 movements in 2 hours during baby\'s active time is a good sign.',
      tint: '#E8945A',
      bg: '#FEF4E8',
    });
  }

  if (week >= 20) {
    tips.push({
      id: 'sleep-position',
      icon: 'moon',
      title: 'Sleep on your side',
      body: 'Left side sleeping improves blood flow to baby. Use pillows between knees and behind your back for comfort.',
      tint: '#735A88',
      bg: '#E8DDF3',
    });
  }

  tips.push({
    id: 'self-care',
    icon: 'heart',
    title: 'A moment for you',
    body: 'Your wellbeing matters deeply. Even 5 minutes of calm breathing or a warm (not hot) bath can reset your whole day.',
    tint: '#C47A7A',
    bg: UI.blushLight,
  });

  return tips;
}

// ── Pregnancy Daily View ─────────────────────────────────────

function PregnancyDailyView({ week, parentName }: { week: number; parentName: string }) {
  const weekInfo = useMemo(() => getPregnancyWeekInfo(week), [week]);
  const wellnessTips = useMemo(() => getPregnancyWellnessTips(week), [week]);
  const [expandedTips, setExpandedTips] = useState<Record<string, boolean>>({});

  const toggleTip = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTips((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const trimester = week <= 13 ? '1st' : week <= 27 ? '2nd' : '3rd';

  return (
    <>
      {/* ── Baby This Week Card ── */}
      <View style={healthStyles.healthCard}>
        <View style={healthStyles.healthHeader}>
          <View style={[healthStyles.healthIconWrap, { backgroundColor: '#FEF4E8' }]}>
            <Feather name="heart" size={18} color="#E8945A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={healthStyles.healthTitle}>Baby This Week</Text>
            <Text style={healthStyles.healthAge}>Size of a {weekInfo.babySize.toLowerCase()}</Text>
          </View>
        </View>
        <Text style={healthStyles.pregCardBody}>{weekInfo.babyDev}</Text>
      </View>

      {/* ── Your Body Card ── */}
      <View style={healthStyles.healthCard}>
        <View style={healthStyles.healthHeader}>
          <View style={[healthStyles.healthIconWrap, { backgroundColor: UI.blushLight }]}>
            <Feather name="user" size={18} color={UI.blushTint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={healthStyles.healthTitle}>Your Body</Text>
          </View>
        </View>
        <Text style={healthStyles.pregCardBody}>{weekInfo.momBody}</Text>
      </View>

      {/* ── Weekly Tip Highlight ── */}
      <View style={[healthStyles.healthCard, { backgroundColor: '#FDFAF5', borderWidth: 1, borderColor: '#F0EAE1' }]}>
        <View style={healthStyles.healthHeader}>
          <View style={[healthStyles.healthIconWrap, { backgroundColor: '#FEF4E8' }]}>
            <Feather name={weekInfo.tipIcon} size={18} color={UI.warmTint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={healthStyles.healthTitle}>Tip of the Week</Text>
          </View>
        </View>
        <Text style={healthStyles.pregCardBody}>{weekInfo.tip}</Text>
      </View>

      {/* ── Wellness Checklist ── */}
      <View style={healthStyles.smartFeedSection}>
        <Text style={healthStyles.sectionLabel}>DAILY WELLNESS</Text>
        {wellnessTips.map((tip) => {
          const isExpanded = expandedTips[tip.id] ?? false;
          return (
            <Pressable
              key={tip.id}
              style={healthStyles.suggestionCard}
              onPress={() => toggleTip(tip.id)}
            >
              <View style={healthStyles.suggestionLeft}>
                <View style={[healthStyles.suggestionIconWrap, { backgroundColor: tip.bg }]}>
                  <Feather name={tip.icon} size={18} color={tip.tint} />
                </View>
              </View>
              <View style={healthStyles.suggestionContent}>
                <Text style={healthStyles.suggestionTitle}>{tip.title}</Text>
                <Text
                  style={healthStyles.suggestionSnippet}
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {tip.body}
                </Text>
                {!isExpanded && (
                  <Text style={healthStyles.readMoreText}>Read more</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// Calendar / Timeline content (from calendar.tsx)
// ══════════════════════════════════════════════════════════════

type ViewMode = 'daily' | 'weekly' | 'monthly';

const SEGMENTS: { key: ViewMode; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

// Color-coded event types
const EVENT_TYPES = {
  feed: { color: '#D4874E', bg: '#FDF2E9', icon: 'droplet' as const, label: 'Feed' },
  sleep: { color: '#6B7DB3', bg: '#EEF0F7', icon: 'moon' as const, label: 'Sleep' },
  diaper: { color: '#A0927D', bg: '#F3EFE8', icon: 'droplet' as const, label: 'Diaper' },
  activity: { color: '#B199CE', bg: '#F0EBF5', icon: 'smile' as const, label: 'Activity' },
  health: { color: '#C4696B', bg: '#F9EDED', icon: 'thermometer' as const, label: 'Health' },
  growth: { color: '#A78BBA', bg: '#F0EBF5', icon: 'trending-up' as const, label: 'Growth' },
  pumping: { color: '#A78BBA', bg: '#F0EBF5', icon: 'droplet' as const, label: 'Pumping' },
};

// Daily view sample events
const SAMPLE_EVENTS = [
  { id: '1', type: 'feed' as const, time: '6:30 AM', detail: 'Breastfeed — 15 min left' },
  { id: '2', type: 'diaper' as const, time: '7:15 AM', detail: 'Wet diaper' },
  { id: '3', type: 'feed' as const, time: '8:30 AM', detail: 'Bottle — 120 ml' },
  { id: '4', type: 'sleep' as const, time: '9:00 AM', detail: 'Morning nap — 1h 15m' },
  { id: '5', type: 'diaper' as const, time: '10:20 AM', detail: 'Dirty diaper' },
  { id: '6', type: 'feed' as const, time: '11:00 AM', detail: 'Breastfeed — 12 min right' },
  { id: '7', type: 'activity' as const, time: '11:45 AM', detail: 'Tummy time — 10 min' },
  { id: '8', type: 'diaper' as const, time: '12:30 PM', detail: 'Wet diaper' },
  { id: '9', type: 'sleep' as const, time: '1:00 PM', detail: 'Afternoon nap — 1h 30m' },
  { id: '10', type: 'feed' as const, time: '2:30 PM', detail: 'Bottle — 100 ml' },
  { id: '11', type: 'diaper' as const, time: '3:15 PM', detail: 'Wet diaper' },
  { id: '12', type: 'feed' as const, time: '5:00 PM', detail: 'Breastfeed — 10 min left' },
  { id: '13', type: 'sleep' as const, time: '5:30 PM', detail: 'Catnap — 30 min' },
  { id: '14', type: 'diaper' as const, time: '6:15 PM', detail: 'Dirty diaper' },
  { id: '15', type: 'feed' as const, time: '7:00 PM', detail: 'Bottle — 130 ml' },
  { id: '16', type: 'sleep' as const, time: '7:30 PM', detail: 'Bedtime' },
  { id: 'p1', type: 'pumping' as const, time: '9:00 AM', detail: 'Pumped — 90 ml (L: 40, R: 50)' },
  { id: 'p2', type: 'pumping' as const, time: '2:30 PM', detail: 'Pumped — 110 ml' },
];

// ── Weekly dummy data ──

const BREAST_COLOR = '#E8A87C';
const FORMULA_COLOR = '#D4874E';
const NIGHT_COLOR = '#4A5899';
const NAP_COLOR = '#A2B4E8';
const WET_COLOR = EVENT_TYPES.diaper.color;
const DIRTY_COLOR = '#C4B8A8';

// Unified weekly pattern data — all events with timestamps
const WEEKLY_PATTERN_DATA: PatternDay[] = [
  {
    label: 'Mon',
    sleep: [
      { startHour: 19.5, endHour: 6, type: 'night' },
      { startHour: 9, endHour: 10.25, type: 'nap' },
      { startHour: 13, endHour: 14.5, type: 'nap' },
      { startHour: 16.5, endHour: 17.25, type: 'nap' },
    ],
    feeds: [
      { hour: 6.5, type: 'breast', detail: '15 min L' },
      { hour: 8.5, type: 'bottle', detail: '120 ml' },
      { hour: 11, type: 'breast', detail: '12 min R' },
      { hour: 14.5, type: 'bottle', detail: '90 ml' },
      { hour: 17.5, type: 'breast', detail: '10 min L' },
      { hour: 19, type: 'bottle', detail: '120 ml' },
      { hour: 23, type: 'breast', detail: '8 min R' },
      { hour: 3, type: 'breast', detail: '10 min L' },
      { hour: 9.0, type: 'pumping', detail: '90 ml' },
    ],
    diapers: [
      { hour: 6.25, type: 'wet' },
      { hour: 9, type: 'dirty' },
      { hour: 11.5, type: 'wet' },
      { hour: 14, type: 'wet' },
      { hour: 16, type: 'dirty' },
      { hour: 18.5, type: 'wet' },
      { hour: 21, type: 'wet' },
      { hour: 1, type: 'wet' },
      { hour: 4, type: 'dirty' },
    ],
  },
  {
    label: 'Tue',
    sleep: [
      { startHour: 19, endHour: 5.5, type: 'night' },
      { startHour: 8.5, endHour: 9.75, type: 'nap' },
      { startHour: 12.5, endHour: 14.5, type: 'nap' },
      { startHour: 16, endHour: 17, type: 'nap' },
    ],
    feeds: [
      { hour: 6, type: 'breast', detail: '14 min R' },
      { hour: 10, type: 'bottle', detail: '110 ml' },
      { hour: 12, type: 'breast', detail: '12 min L' },
      { hour: 15, type: 'bottle', detail: '100 ml' },
      { hour: 17.5, type: 'breast', detail: '10 min R' },
      { hour: 18.75, type: 'bottle', detail: '130 ml' },
      { hour: 22.5, type: 'breast', detail: '8 min L' },
    ],
    diapers: [
      { hour: 6.5, type: 'wet' },
      { hour: 8, type: 'dirty' },
      { hour: 10.5, type: 'wet' },
      { hour: 13, type: 'wet' },
      { hour: 15.5, type: 'wet' },
      { hour: 17, type: 'dirty' },
      { hour: 20, type: 'wet' },
      { hour: 23, type: 'wet' },
      { hour: 3.5, type: 'wet' },
    ],
  },
  {
    label: 'Wed',
    sleep: [
      { startHour: 20, endHour: 5.5, type: 'night' },
      { startHour: 9, endHour: 10, type: 'nap' },
      { startHour: 13, endHour: 14, type: 'nap' },
      { startHour: 16, endHour: 16.75, type: 'nap' },
    ],
    feeds: [
      { hour: 6, type: 'breast', detail: '15 min L' },
      { hour: 8, type: 'bottle', detail: '100 ml' },
      { hour: 10.5, type: 'breast', detail: '13 min R' },
      { hour: 12.5, type: 'bottle', detail: '110 ml' },
      { hour: 14.5, type: 'breast', detail: '10 min L' },
      { hour: 17, type: 'breast', detail: '12 min R' },
      { hour: 19.5, type: 'bottle', detail: '130 ml' },
      { hour: 23, type: 'breast', detail: '8 min L' },
      { hour: 3, type: 'breast', detail: '10 min R' },
      { hour: 14.5, type: 'pumping', detail: '100 ml' },
    ],
    diapers: [
      { hour: 7, type: 'wet' },
      { hour: 9.5, type: 'dirty' },
      { hour: 11, type: 'wet' },
      { hour: 14, type: 'dirty' },
      { hour: 16.5, type: 'wet' },
      { hour: 19, type: 'wet' },
      { hour: 22, type: 'dirty' },
      { hour: 2, type: 'wet' },
    ],
  },
  {
    label: 'Thu',
    sleep: [
      { startHour: 19.5, endHour: 6, type: 'night' },
      { startHour: 9.5, endHour: 10.5, type: 'nap' },
      { startHour: 13.5, endHour: 14.5, type: 'nap' },
    ],
    feeds: [
      { hour: 6.5, type: 'breast', detail: '12 min R' },
      { hour: 8.5, type: 'bottle', detail: '120 ml' },
      { hour: 11, type: 'breast', detail: '15 min L' },
      { hour: 15, type: 'bottle', detail: '100 ml' },
      { hour: 17, type: 'breast', detail: '10 min R' },
      { hour: 19, type: 'bottle', detail: '130 ml' },
      { hour: 23.5, type: 'breast', detail: '8 min L' },
      { hour: 3.5, type: 'breast', detail: '10 min R' },
      { hour: 10.0, type: 'pumping', detail: '85 ml' },
    ],
    diapers: [
      { hour: 6, type: 'wet' },
      { hour: 8, type: 'dirty' },
      { hour: 10, type: 'wet' },
      { hour: 13, type: 'wet' },
      { hour: 15, type: 'wet' },
      { hour: 18, type: 'dirty' },
      { hour: 21, type: 'wet' },
      { hour: 1, type: 'wet' },
    ],
  },
  {
    label: 'Fri',
    sleep: [
      { startHour: 19, endHour: 6.5, type: 'night' },
      { startHour: 9, endHour: 10.5, type: 'nap' },
      { startHour: 13, endHour: 15, type: 'nap' },
      { startHour: 16.5, endHour: 17, type: 'nap' },
    ],
    feeds: [
      { hour: 7, type: 'breast', detail: '14 min L' },
      { hour: 10.75, type: 'bottle', detail: '110 ml' },
      { hour: 12.5, type: 'breast', detail: '12 min R' },
      { hour: 15.5, type: 'bottle', detail: '100 ml' },
      { hour: 17.5, type: 'breast', detail: '10 min L' },
      { hour: 18.75, type: 'bottle', detail: '120 ml' },
      { hour: 22, type: 'breast', detail: '8 min R' },
      { hour: 15.0, type: 'pumping', detail: '110 ml' },
    ],
    diapers: [
      { hour: 7, type: 'wet' },
      { hour: 9.5, type: 'dirty' },
      { hour: 11, type: 'wet' },
      { hour: 13.5, type: 'wet' },
      { hour: 15, type: 'dirty' },
      { hour: 17, type: 'wet' },
      { hour: 19.5, type: 'wet' },
      { hour: 22, type: 'dirty' },
      { hour: 2, type: 'wet' },
      { hour: 4.5, type: 'wet' },
    ],
  },
  {
    label: 'Sat',
    sleep: [
      { startHour: 19.5, endHour: 6, type: 'night' },
      { startHour: 9.5, endHour: 10.25, type: 'nap' },
      { startHour: 13, endHour: 14.5, type: 'nap' },
    ],
    feeds: [
      { hour: 6.5, type: 'breast', detail: '15 min R' },
      { hour: 8.5, type: 'bottle', detail: '120 ml' },
      { hour: 11, type: 'breast', detail: '12 min L' },
      { hour: 14.75, type: 'bottle', detail: '100 ml' },
      { hour: 17, type: 'breast', detail: '10 min R' },
      { hour: 19, type: 'bottle', detail: '130 ml' },
      { hour: 23, type: 'breast', detail: '8 min L' },
      { hour: 3, type: 'breast', detail: '10 min R' },
    ],
    diapers: [
      { hour: 7, type: 'wet' },
      { hour: 9, type: 'dirty' },
      { hour: 11, type: 'wet' },
      { hour: 14, type: 'wet' },
      { hour: 17, type: 'dirty' },
      { hour: 20, type: 'wet' },
      { hour: 23, type: 'wet' },
      { hour: 3.5, type: 'wet' },
    ],
  },
  {
    label: 'Sun',
    sleep: [
      { startHour: 19, endHour: 6, type: 'night' },
      { startHour: 9, endHour: 10.5, type: 'nap' },
      { startHour: 13, endHour: 14.75, type: 'nap' },
      { startHour: 16.5, endHour: 17.25, type: 'nap' },
    ],
    feeds: [
      { hour: 6.5, type: 'breast', detail: '14 min L' },
      { hour: 8.5, type: 'bottle', detail: '110 ml' },
      { hour: 11, type: 'breast', detail: '12 min R' },
      { hour: 15, type: 'bottle', detail: '100 ml' },
      { hour: 17.5, type: 'breast', detail: '10 min L' },
      { hour: 19, type: 'bottle', detail: '120 ml' },
      { hour: 22.5, type: 'breast', detail: '8 min R' },
      { hour: 3, type: 'breast', detail: '10 min L' },
    ],
    diapers: [
      { hour: 6.5, type: 'wet' },
      { hour: 9, type: 'dirty' },
      { hour: 11.5, type: 'wet' },
      { hour: 14, type: 'wet' },
      { hour: 16, type: 'dirty' },
      { hour: 18.5, type: 'wet' },
      { hour: 21, type: 'wet' },
      { hour: 0.5, type: 'wet' },
      { hour: 4, type: 'dirty' },
    ],
  },
];

// Derived aggregates for metrics
const WEEKLY_SLEEP_AGG = WEEKLY_PATTERN_DATA.map((d) => {
  let nightHrs = 0;
  let napHrs = 0;
  let napCount = 0;
  d.sleep.forEach((s) => {
    let startW = s.startHour < 6 ? s.startHour + 24 : s.startHour;
    let endW = s.endHour < 6 ? s.endHour + 24 : s.endHour;
    if (endW <= startW) endW += 24;
    const dur = endW - startW;
    if (s.type === 'night') nightHrs += dur;
    else { napHrs += dur; napCount++; }
  });
  return { day: d.label, totalHrs: nightHrs + napHrs, nightHrs, napHrs, napCount };
});

const WEEKLY_SLEEP_TREND: TrendDay[] = WEEKLY_SLEEP_AGG.map((d) => ({
  label: d.day,
  totalHours: d.totalHrs,
}));

const WEEKLY_FEEDS_AGG = WEEKLY_PATTERN_DATA.map((d) => {
  const breast = d.feeds.filter((f) => f.type === 'breast').length;
  const bottle = d.feeds.filter((f) => f.type === 'bottle').length;
  return { day: d.label, breast, bottle, total: breast + bottle };
});


// Derived per-tab feed data for segmented chart
const WEEKLY_NURSING_BARS: BarDay[] = WEEKLY_PATTERN_DATA.map((d) => {
  let totalMin = 0;
  d.feeds.forEach((f) => {
    if (f.type !== 'breast' || !f.detail) return;
    const num = parseInt(f.detail, 10);
    if (!isNaN(num)) totalMin += num;
  });
  return { label: d.label, segments: [{ value: totalMin, color: '#F2B89C' }] };
});

const WEEKLY_BOTTLE_BARS: BarDay[] = WEEKLY_PATTERN_DATA.map((d) => {
  let totalMl = 0;
  d.feeds.forEach((f) => {
    if (f.type !== 'bottle' || !f.detail) return;
    const num = parseInt(f.detail, 10);
    if (!isNaN(num)) totalMl += num;
  });
  return { label: d.label, segments: [{ value: totalMl, color: '#D4874E' }] };
});

const WEEKLY_PUMPING_BARS: BarDay[] = WEEKLY_PATTERN_DATA.map((d) => {
  let totalMl = 0;
  d.feeds.forEach((f) => {
    if (f.type !== 'pumping' || !f.detail) return;
    const num = parseInt(f.detail, 10);
    if (!isNaN(num)) totalMl += num;
  });
  return { label: d.label, segments: [{ value: totalMl, color: '#A78BBA' }] };
});

const FEED_TAB_CONFIG = {
  nursing: {
    data: WEEKLY_NURSING_BARS,
    yUnit: 'min',
    color: '#F2B89C',
    stats: [
      { label: 'AVG NURSING', value: `${Math.round(WEEKLY_NURSING_BARS.reduce((s, d) => s + d.segments[0].value, 0) / 7)} min/day`, color: '#F2B89C' },
      { label: 'SESSIONS', value: `${WEEKLY_PATTERN_DATA.reduce((s, d) => s + d.feeds.filter(f => f.type === 'breast').length, 0)}`, color: undefined },
    ],
  },
  bottle: {
    data: WEEKLY_BOTTLE_BARS,
    yUnit: 'ml',
    color: '#D4874E',
    stats: [
      { label: 'AVG BOTTLE', value: `${Math.round(WEEKLY_BOTTLE_BARS.reduce((s, d) => s + d.segments[0].value, 0) / 7)} ml/day`, color: '#D4874E' },
      { label: 'SESSIONS', value: `${WEEKLY_PATTERN_DATA.reduce((s, d) => s + d.feeds.filter(f => f.type === 'bottle').length, 0)}`, color: undefined },
    ],
  },
  pumping: {
    data: WEEKLY_PUMPING_BARS,
    yUnit: 'ml',
    color: '#A78BBA',
    stats: [
      { label: 'AVG YIELD', value: `${Math.round(WEEKLY_PUMPING_BARS.reduce((s, d) => s + d.segments[0].value, 0) / 7)} ml/day`, color: '#A78BBA' },
      { label: 'SESSIONS', value: `${WEEKLY_PATTERN_DATA.reduce((s, d) => s + d.feeds.filter(f => f.type === 'pumping').length, 0)}`, color: undefined },
    ],
  },
} as const;

type FeedTab = keyof typeof FEED_TAB_CONFIG;
const FEED_TABS: { key: FeedTab; label: string; color: string }[] = [
  { key: 'nursing', label: 'Nursing', color: '#F2B89C' },
  { key: 'bottle', label: 'Bottle', color: '#D4874E' },
  { key: 'pumping', label: 'Pumping', color: '#A78BBA' },
];

const WEEKLY_DIAPERS_AGG = WEEKLY_PATTERN_DATA.map((d) => {
  const wet = d.diapers.filter((dp) => dp.type === 'wet').length;
  const dirty = d.diapers.filter((dp) => dp.type === 'dirty').length;
  return { day: d.label, wet, dirty, total: wet + dirty };
});

// ── Data Grid Cell ──

function DataCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={calStyles.dataCell}>
      <Text style={calStyles.dataCellLabel}>{label}</Text>
      <Text style={[calStyles.dataCellValue, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

// ── Feeds Tabbed Card ──

function FeedsTabbedCard() {
  const [activeTab, setActiveTab] = useState<FeedTab>('nursing');
  const config = FEED_TAB_CONFIG[activeTab];

  const handleTabPress = (tab: FeedTab) => {
    if (tab === activeTab) return;
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  return (
    <View style={calStyles.premiumCard}>
      <View style={calStyles.cardTitleRow}>
        <Feather name="droplet" size={16} color={config.color} />
        <Text style={calStyles.cardTitleText}>Feeds Trend</Text>
      </View>

      {/* Segmented tabs */}
      <View style={calStyles.feedTabBar}>
        {FEED_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[
                calStyles.feedTab,
                isActive && [calStyles.feedTabActive, { backgroundColor: tab.color + '20' }],
              ]}
              onPress={() => handleTabPress(tab.key)}
            >
              <View style={[calStyles.feedTabDot, { backgroundColor: isActive ? tab.color : colors.neutral[300] }]} />
              <Text style={[
                calStyles.feedTabLabel,
                isActive && { color: tab.color, fontWeight: typography.fontWeight.bold },
              ]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Dynamic chart */}
      <GroundedBarChart data={config.data} yUnit={config.yUnit} />

      {/* Dynamic stats */}
      <View style={calStyles.dataGridDivider} />
      <View style={calStyles.dataGrid}>
        {config.stats.map((stat) => (
          <DataCell key={stat.label} label={stat.label} value={stat.value} color={stat.color} />
        ))}
      </View>
    </View>
  );
}

// ── Weekly View (Huckleberry-style unified grid) ──

function WeeklyView() {
  // ── Aggregated analytics ──
  const totalSleepWeek = WEEKLY_SLEEP_AGG.reduce((s, d) => s + d.totalHrs, 0);
  const totalNightWeek = WEEKLY_SLEEP_AGG.reduce((s, d) => s + d.nightHrs, 0);
  const totalNapHrsWeek = WEEKLY_SLEEP_AGG.reduce((s, d) => s + d.napHrs, 0);
  const totalNapCountWeek = WEEKLY_SLEEP_AGG.reduce((s, d) => s + d.napCount, 0);
  const avgSleepTotal = totalSleepWeek / 7;
  const avgNight = totalNightWeek / 7;
  const avgNapHrs = totalNapHrsWeek / 7;
  const avgNapCount = (totalNapCountWeek / 7).toFixed(1);
  const avgFeeds = (WEEKLY_FEEDS_AGG.reduce((s, d) => s + d.total, 0) / 7).toFixed(1);
  const avgDiapers = Math.round(WEEKLY_DIAPERS_AGG.reduce((s, d) => s + d.total, 0) / 7);

  const fmtHM = (hrs: number) => {
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <View style={calStyles.weeklyContainer}>
      {/* ── Lumina Insight Card (TOP — the "So what?") ── */}
      <View style={calStyles.luminaInsightCard}>
        <View style={calStyles.luminaInsightHeader}>
          <View style={calStyles.luminaInsightIcon}>
            <Feather name="message-circle" size={16} color={colors.primary[600]} />
          </View>
          <Text style={calStyles.luminaInsightTitle}>Lumina's Patterns</Text>
        </View>
        <View style={calStyles.luminaInsightBody}>
          <View style={calStyles.insightBullet}>
            <View style={[calStyles.insightBulletDot, { backgroundColor: NIGHT_COLOR }]} />
            <Text style={calStyles.insightBulletText}>
              Sleep has been consistent — averaging {fmtHM(avgSleepTotal)} with steady night stretches.
            </Text>
          </View>
          <View style={calStyles.insightBullet}>
            <View style={[calStyles.insightBulletDot, { backgroundColor: EVENT_TYPES.feed.color }]} />
            <Text style={calStyles.insightBulletText}>
              Wednesday had the most feeds ({Math.max(...WEEKLY_FEEDS_AGG.map(d => d.total))}). Consider whether a growth spurt is happening.
            </Text>
          </View>
          <View style={calStyles.insightBullet}>
            <View style={[calStyles.insightBulletDot, { backgroundColor: colors.primary[500] }]} />
            <Text style={calStyles.insightBulletText}>
              Diaper output looks healthy and regular — good hydration signs.
            </Text>
          </View>
        </View>
      </View>

      {/* ── Unified Pattern Grid (Huckleberry-style) ── */}
      <View style={calStyles.premiumCard}>
        <View style={calStyles.cardTitleRow}>
          <Feather name="grid" size={16} color={colors.primary[600]} />
          <Text style={calStyles.cardTitleText}>Weekly Pattern</Text>
        </View>
        <Text style={calStyles.heroSubtitle}>Sleep, feeds & diapers at a glance</Text>

        <WeeklyPatternGrid data={WEEKLY_PATTERN_DATA} />
      </View>

      {/* ── Quick Stats Row ── */}
      <View style={calStyles.quickStatsRow}>
        <View style={[calStyles.quickStatCard, { borderLeftColor: NIGHT_COLOR }]}>
          <Text style={calStyles.quickStatValue}>{fmtHM(avgSleepTotal)}</Text>
          <Text style={calStyles.quickStatLabel}>Avg Sleep</Text>
        </View>
        <View style={[calStyles.quickStatCard, { borderLeftColor: EVENT_TYPES.feed.color }]}>
          <Text style={calStyles.quickStatValue}>{avgFeeds}</Text>
          <Text style={calStyles.quickStatLabel}>Avg Feeds</Text>
        </View>
        <View style={[calStyles.quickStatCard, { borderLeftColor: WET_COLOR }]}>
          <Text style={calStyles.quickStatValue}>{avgDiapers}</Text>
          <Text style={calStyles.quickStatLabel}>Avg Diapers</Text>
        </View>
      </View>

      {/* ── Lumina's Analysis ── */}
      <View style={calStyles.luminaAnalysisCard}>
        <View style={calStyles.luminaAnalysisHeader}>
          <View style={calStyles.luminaAnalysisIcon}>
            <Feather name="star" size={14} color={NIGHT_COLOR} />
          </View>
          <Text style={calStyles.luminaAnalysisTitle}>Lumina's Analysis</Text>
        </View>
        <Text style={calStyles.luminaAnalysisBody}>
          Ece's pattern is beautifully consistent. Night sleep clusters between 7–8 PM to 5:30–6:30 AM with feeds naturally filling the wake windows. Her naps are well-spaced through the day and diaper output confirms good hydration. A bedtime routine around 7:15 PM is forming — this rhythm leads to longer stretches over the coming weeks.
        </Text>
      </View>

      {/* ── Sleep Trend (Line — shows if baby is sleeping enough) ── */}
      <View style={calStyles.premiumCard}>
        <View style={calStyles.cardTitleRow}>
          <Feather name="trending-up" size={16} color={NIGHT_COLOR} />
          <Text style={calStyles.cardTitleText}>Sleep Trend</Text>
        </View>
        <Text style={calStyles.heroSubtitle}>Is baby sleeping enough?</Text>

        <SleepTrendLine
          data={WEEKLY_SLEEP_TREND}
          healthyMin={14}
          healthyMax={17}
          rangeLabel="Recommended: 14–17h (0–3 months)"
        />

        <View style={calStyles.dataGridDivider} />
        <View style={calStyles.dataGrid}>
          <DataCell label="NIGHT AVG" value={fmtHM(avgNight)} color={NIGHT_COLOR} />
          <DataCell label="NAP AVG" value={fmtHM(avgNapHrs)} color={NAP_COLOR} />
          <DataCell label="NAPS / DAY" value={avgNapCount} />
          <DataCell label="CONSISTENCY" value="Good" color={colors.primary[500]} />
        </View>
      </View>

      {/* ── Feeds Breakdown (Tabbed) ── */}
      <FeedsTabbedCard />

      {/* ── Diapers Breakdown ── */}
      <View style={calStyles.premiumCard}>
        <View style={calStyles.cardTitleRow}>
          <MaterialCommunityIcons name="baby-face-outline" size={18} color={WET_COLOR} />
          <Text style={calStyles.cardTitleText}>Diapers Breakdown</Text>
        </View>
        <Text style={calStyles.heroMetric}>{avgDiapers}</Text>
        <Text style={calStyles.heroSubtitle}>Avg Changes / Day</Text>

        <GroundedBarChart
          data={WEEKLY_DIAPERS_AGG.map((d) => ({
            label: d.day,
            segments: [
              { value: d.wet, color: WET_COLOR },
              { value: d.dirty, color: DIRTY_COLOR },
            ],
          }))}
          legend={[
            { label: 'Wet', color: WET_COLOR },
            { label: 'Dirty', color: DIRTY_COLOR },
          ]}
        />
      </View>
    </View>
  );
}

// ── Monthly dummy data ──

const MONTHLY_SLEEP = [
  { week: 'Week 1', avgHrs: 14.3 },
  { week: 'Week 2', avgHrs: 14.6 },
  { week: 'Week 3', avgHrs: 15.1 },
  { week: 'Week 4', avgHrs: 14.8 },
];

const MONTHLY_FEEDS_TREND = [
  { week: 'Week 1', avgBreast: 5.1, avgBottle: 3.1, avgFormulaMl: 265, avgBreastMin: 68 },
  { week: 'Week 2', avgBreast: 4.8, avgBottle: 3.0, avgFormulaMl: 255, avgBreastMin: 62 },
  { week: 'Week 3', avgBreast: 4.5, avgBottle: 3.0, avgFormulaMl: 270, avgBreastMin: 58 },
  { week: 'Week 4', avgBreast: 4.2, avgBottle: 2.9, avgFormulaMl: 280, avgBreastMin: 54 },
];

const MONTHLY_GROWTH = {
  startWeight: 4.2,
  endWeight: 4.8,
  startLength: 53,
  endLength: 55.5,
  startHead: 36.5,
  endHead: 37.8,
};

// Calendar grid: 1 = low activity, 2 = normal, 3 = busy day
const CALENDAR_GRID: (number | null)[][] = [
  [null, null, null, null, null, 2, 3],  // row 1 (starts Sat)
  [2, 3, 2, 2, 1, 3, 2],
  [3, 2, 2, 3, 2, 2, 1],
  [2, 2, 3, 2, 2, 3, 2],
  [3, 2, 1, null, null, null, null],     // row 5 (ends Tue)
];
const CAL_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CAL_COLORS: Record<number, string> = {
  1: colors.primary[100],
  2: colors.primary[300],
  3: colors.primary[500],
};

// Sample events per day for detail panel
type DayEvent = { time: string; type: keyof typeof EVENT_TYPES; detail: string };
const MONTHLY_DAY_EVENTS: Record<number, DayEvent[]> = {
  1: [
    { time: '6:30 AM', type: 'feed', detail: 'Breastfeed — 15 min L' },
    { time: '9:00 AM', type: 'sleep', detail: 'Morning nap — 1h 15m' },
    { time: '9:00 AM', type: 'pumping', detail: 'Pumped — 90 ml' },
    { time: '11:00 AM', type: 'feed', detail: 'Bottle — 120 ml' },
    { time: '2:00 PM', type: 'diaper', detail: 'Wet diaper' },
    { time: '5:00 PM', type: 'feed', detail: 'Breastfeed — 10 min R' },
  ],
  2: [
    { time: '7:00 AM', type: 'feed', detail: 'Breastfeed — 12 min R' },
    { time: '8:15 AM', type: 'diaper', detail: 'Dirty diaper' },
    { time: '10:00 AM', type: 'sleep', detail: 'Nap — 1h 30m' },
    { time: '12:00 PM', type: 'feed', detail: 'Bottle — 100 ml' },
    { time: '2:30 PM', type: 'pumping', detail: 'Pumped — 110 ml' },
  ],
  3: [
    { time: '6:00 AM', type: 'feed', detail: 'Breastfeed — 14 min L' },
    { time: '7:30 AM', type: 'diaper', detail: 'Wet diaper' },
    { time: '9:30 AM', type: 'sleep', detail: 'Morning nap — 1h' },
    { time: '11:30 AM', type: 'feed', detail: 'Bottle — 130 ml' },
    { time: '1:00 PM', type: 'diaper', detail: 'Dirty diaper' },
    { time: '3:00 PM', type: 'sleep', detail: 'Afternoon nap — 1h 15m' },
    { time: '5:00 PM', type: 'feed', detail: 'Breastfeed — 10 min R' },
    { time: '7:00 PM', type: 'feed', detail: 'Bottle — 120 ml' },
  ],
  4: [
    { time: '6:45 AM', type: 'feed', detail: 'Bottle — 110 ml' },
    { time: '10:00 AM', type: 'sleep', detail: 'Nap — 45 min' },
    { time: '12:00 PM', type: 'feed', detail: 'Breastfeed — 12 min L' },
  ],
  5: [
    { time: '7:00 AM', type: 'feed', detail: 'Breastfeed — 15 min R' },
    { time: '9:00 AM', type: 'pumping', detail: 'Pumped — 85 ml' },
    { time: '10:30 AM', type: 'sleep', detail: 'Nap — 1h 20m' },
    { time: '1:00 PM', type: 'feed', detail: 'Bottle — 100 ml' },
    { time: '3:00 PM', type: 'diaper', detail: 'Wet diaper' },
    { time: '5:30 PM', type: 'feed', detail: 'Breastfeed — 10 min L' },
  ],
  6: [
    { time: '6:30 AM', type: 'feed', detail: 'Bottle — 120 ml' },
    { time: '9:00 AM', type: 'sleep', detail: 'Morning nap — 1h 30m' },
    { time: '11:00 AM', type: 'feed', detail: 'Breastfeed — 12 min R' },
    { time: '2:00 PM', type: 'pumping', detail: 'Pumped — 100 ml' },
    { time: '5:00 PM', type: 'feed', detail: 'Bottle — 110 ml' },
    { time: '7:30 PM', type: 'sleep', detail: 'Bedtime' },
  ],
  7: [
    { time: '7:00 AM', type: 'feed', detail: 'Breastfeed — 14 min L' },
    { time: '8:00 AM', type: 'diaper', detail: 'Dirty diaper' },
    { time: '10:00 AM', type: 'sleep', detail: 'Nap — 1h' },
  ],
  8: [
    { time: '6:00 AM', type: 'feed', detail: 'Bottle — 130 ml' },
    { time: '9:30 AM', type: 'sleep', detail: 'Morning nap — 1h 15m' },
    { time: '12:00 PM', type: 'feed', detail: 'Breastfeed — 12 min R' },
    { time: '2:00 PM', type: 'diaper', detail: 'Wet diaper' },
    { time: '4:30 PM', type: 'feed', detail: 'Bottle — 100 ml' },
    { time: '7:00 PM', type: 'sleep', detail: 'Bedtime' },
  ],
  9: [
    { time: '7:00 AM', type: 'feed', detail: 'Breastfeed — 10 min L' },
    { time: '9:00 AM', type: 'pumping', detail: 'Pumped — 95 ml' },
    { time: '10:00 AM', type: 'sleep', detail: 'Nap — 1h 10m' },
    { time: '1:00 PM', type: 'feed', detail: 'Bottle — 120 ml' },
    { time: '3:30 PM', type: 'sleep', detail: 'Afternoon nap — 1h' },
  ],
  10: [
    { time: '6:30 AM', type: 'feed', detail: 'Bottle — 110 ml' },
    { time: '8:00 AM', type: 'diaper', detail: 'Dirty diaper' },
    { time: '9:30 AM', type: 'sleep', detail: 'Nap — 1h 30m' },
    { time: '12:00 PM', type: 'feed', detail: 'Breastfeed — 15 min R' },
    { time: '2:30 PM', type: 'pumping', detail: 'Pumped — 105 ml' },
    { time: '5:00 PM', type: 'feed', detail: 'Bottle — 100 ml' },
    { time: '7:30 PM', type: 'sleep', detail: 'Bedtime' },
  ],
  11: [
    { time: '7:00 AM', type: 'feed', detail: 'Breastfeed — 12 min L' },
    { time: '10:00 AM', type: 'sleep', detail: 'Nap — 1h' },
    { time: '1:00 PM', type: 'feed', detail: 'Bottle — 120 ml' },
  ],
  12: [
    { time: '6:30 AM', type: 'feed', detail: 'Breastfeed — 14 min R' },
    { time: '9:00 AM', type: 'sleep', detail: 'Morning nap — 1h 15m' },
    { time: '11:00 AM', type: 'feed', detail: 'Bottle — 100 ml' },
    { time: '2:00 PM', type: 'diaper', detail: 'Wet diaper' },
    { time: '3:00 PM', type: 'pumping', detail: 'Pumped — 90 ml' },
    { time: '5:00 PM', type: 'feed', detail: 'Breastfeed — 10 min L' },
    { time: '7:00 PM', type: 'feed', detail: 'Bottle — 130 ml' },
    { time: '7:30 PM', type: 'sleep', detail: 'Bedtime' },
  ],
  13: [
    { time: '7:00 AM', type: 'feed', detail: 'Breastfeed — 12 min L' },
    { time: '9:00 AM', type: 'diaper', detail: 'Dirty diaper' },
    { time: '10:00 AM', type: 'sleep', detail: 'Nap — 1h 20m' },
    { time: '12:30 PM', type: 'feed', detail: 'Bottle — 110 ml' },
    { time: '3:00 PM', type: 'sleep', detail: 'Afternoon nap — 1h' },
  ],
};

// ── Monthly View ──

function MonthlyView() {
  const weightGain = (MONTHLY_GROWTH.endWeight - MONTHLY_GROWTH.startWeight).toFixed(1);
  const lengthGain = (MONTHLY_GROWTH.endLength - MONTHLY_GROWTH.startLength).toFixed(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const growthChartData = useGrowthChartData();

  const handleDayPress = (day: number) => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDay((prev) => (prev === day ? null : day));
  };

  const selectedEvents = selectedDay ? (MONTHLY_DAY_EVENTS[selectedDay] ?? []) : [];

  return (
    <View style={calStyles.weeklyContainer}>
      {/* Month summary cards */}
      <View style={calStyles.summaryRow}>
        <View style={[calStyles.summaryCard, { backgroundColor: EVENT_TYPES.sleep.bg }]}>
          <Feather name="moon" size={16} color={EVENT_TYPES.sleep.color} />
          <Text style={calStyles.summaryValue}>14.7h</Text>
          <Text style={calStyles.summaryLabel}>avg sleep</Text>
        </View>
        <View style={[calStyles.summaryCard, { backgroundColor: EVENT_TYPES.feed.bg }]}>
          <Feather name="droplet" size={16} color={EVENT_TYPES.feed.color} />
          <Text style={calStyles.summaryValue}>7.7</Text>
          <Text style={calStyles.summaryLabel}>avg feeds/day</Text>
        </View>
        <View style={[calStyles.summaryCard, { backgroundColor: EVENT_TYPES.growth.bg }]}>
          <Feather name="trending-up" size={16} color={EVENT_TYPES.growth.color} />
          <Text style={calStyles.summaryValue}>+{weightGain}kg</Text>
          <Text style={calStyles.summaryLabel}>weight gain</Text>
        </View>
      </View>

      {/* Activity calendar heatmap */}
      <View style={calStyles.chartCard}>
        <View style={calStyles.chartHeader}>
          <Feather name="calendar" size={14} color={colors.primary[500]} />
          <Text style={calStyles.chartTitle}>Activity</Text>
          <Text style={calStyles.chartUnit}>March 2026</Text>
        </View>
        {/* Day headers */}
        <View style={calStyles.calRow}>
          {CAL_HEADERS.map((d, i) => (
            <View key={i} style={calStyles.calCell}>
              <Text style={calStyles.calHeaderText}>{d}</Text>
            </View>
          ))}
        </View>
        {/* Calendar grid */}
        {CALENDAR_GRID.map((row, ri) => (
          <View key={ri} style={calStyles.calRow}>
            {row.map((val, ci) => {
              const dayNum = ri * 7 + ci - 4; // offset for starting day
              const isValid = val != null && dayNum > 0 && dayNum <= 31;
              const isSelected = selectedDay === dayNum;
              return (
                <View key={ci} style={calStyles.calCell}>
                  {isValid ? (
                    <Pressable
                      onPress={() => handleDayPress(dayNum)}
                      style={[
                        calStyles.calDot,
                        { backgroundColor: CAL_COLORS[val!] },
                        isSelected && calStyles.calDotSelected,
                      ]}
                    >
                      <Text style={[
                        calStyles.calDayText,
                        val! >= 3 && { color: '#FFF' },
                        isSelected && calStyles.calDayTextSelected,
                      ]}>
                        {dayNum}
                      </Text>
                    </Pressable>
                  ) : val != null ? (
                    <View style={[calStyles.calDot, { backgroundColor: CAL_COLORS[val] }]}>
                      <Text style={calStyles.calDayText} />
                    </View>
                  ) : (
                    <View style={calStyles.calEmpty} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
        <View style={calStyles.chartLegend}>
          <Text style={calStyles.legendText}>Less</Text>
          {[1, 2, 3].map((v) => (
            <View key={v} style={[calStyles.calLegendDot, { backgroundColor: CAL_COLORS[v] }]} />
          ))}
          <Text style={calStyles.legendText}>More</Text>
        </View>

        {/* ── Day Detail Panel ── */}
        {selectedDay !== null && (
          <View style={calStyles.dayDetailPanel}>
            <View style={calStyles.dayDetailHeader}>
              <Text style={calStyles.dayDetailTitle}>March {selectedDay}</Text>
              <Pressable onPress={() => { Haptics.selectionAsync(); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setSelectedDay(null); }}>
                <Feather name="x" size={16} color={colors.textTertiary} />
              </Pressable>
            </View>
            {selectedEvents.length > 0 ? (
              selectedEvents.map((evt, i) => {
                const evtType = EVENT_TYPES[evt.type];
                return (
                  <View key={i} style={calStyles.dayDetailRow}>
                    <Text style={calStyles.dayDetailTime}>{evt.time}</Text>
                    <View style={[calStyles.dayDetailDot, { backgroundColor: evtType?.color ?? colors.textTertiary }]} />
                    <Text style={calStyles.dayDetailText}>{evt.detail}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={calStyles.dayDetailEmpty}>No activity recorded for this day</Text>
            )}
          </View>
        )}
      </View>

      {/* Sleep trend (premium — grounded chart) */}
      <View style={calStyles.premiumCard}>
        <View style={calStyles.cardTitleRow}>
          <Feather name="moon" size={16} color={NIGHT_COLOR} />
          <Text style={calStyles.cardTitleText}>Sleep Trend</Text>
        </View>
        <Text style={calStyles.heroMetric}>
          {(MONTHLY_SLEEP.reduce((s, d) => s + d.avgHrs, 0) / 4).toFixed(1)}h
        </Text>
        <Text style={calStyles.heroSubtitle}>Monthly Avg / Night</Text>

        <GroundedBarChart
          data={MONTHLY_SLEEP.map((d) => ({
            label: d.week.replace('Week ', 'W'),
            segments: [{ value: d.avgHrs, color: NIGHT_COLOR }],
          }))}
          yUnit="h"
        />

        <View style={calStyles.dataGridDivider} />
        <View style={calStyles.dataGrid}>
          <DataCell label="BEST WEEK" value={`${Math.max(...MONTHLY_SLEEP.map(d => d.avgHrs)).toFixed(1)}h`} color={NIGHT_COLOR} />
          <DataCell label="MONTHLY AVG" value={`${(MONTHLY_SLEEP.reduce((s, d) => s + d.avgHrs, 0) / 4).toFixed(1)}h`} />
        </View>
      </View>

      {/* ── Lumina's Analysis — Monthly Sleep ── */}
      <View style={calStyles.luminaAnalysisCard}>
        <View style={calStyles.luminaAnalysisHeader}>
          <View style={calStyles.luminaAnalysisIcon}>
            <Feather name="star" size={14} color={NIGHT_COLOR} />
          </View>
          <Text style={calStyles.luminaAnalysisTitle}>Lumina's Analysis</Text>
        </View>
        <Text style={calStyles.luminaAnalysisBody}>
          Sleep improved steadily through the month — Week 3 was the best at {Math.max(...MONTHLY_SLEEP.map(d => d.avgHrs)).toFixed(1)}h average. Night stretches are getting longer, which means Ece's circadian rhythm is maturing right on schedule. Keep the consistent bedtime routine going!
        </Text>
      </View>

      {/* Feeds trend (premium — grounded chart) */}
      <View style={calStyles.premiumCard}>
        <View style={calStyles.cardTitleRow}>
          <Feather name="droplet" size={16} color={EVENT_TYPES.feed.color} />
          <Text style={calStyles.cardTitleText}>Feeds Trend</Text>
        </View>
        <Text style={calStyles.heroMetric}>
          {(MONTHLY_FEEDS_TREND.reduce((s, d) => s + d.avgBreast + d.avgBottle, 0) / 4).toFixed(1)}
        </Text>
        <Text style={calStyles.heroSubtitle}>Avg Sessions / Day</Text>

        <GroundedBarChart
          data={MONTHLY_FEEDS_TREND.map((d) => ({
            label: d.week.replace('Week ', 'W'),
            segments: [
              { value: d.avgBreast, color: BREAST_COLOR },
              { value: d.avgBottle, color: FORMULA_COLOR },
            ],
          }))}
          legend={[
            { label: 'Breast', color: BREAST_COLOR },
            { label: 'Formula', color: FORMULA_COLOR },
          ]}
        />

        <View style={calStyles.dataGridDivider} />
        <View style={calStyles.dataGrid}>
          <DataCell label="AVG NURSING" value={`${Math.round(MONTHLY_FEEDS_TREND.reduce((s, d) => s + d.avgBreastMin, 0) / 4)}m/day`} color={BREAST_COLOR} />
          <DataCell label="AVG FORMULA" value={`${Math.round(MONTHLY_FEEDS_TREND.reduce((s, d) => s + d.avgFormulaMl, 0) / 4)}ml/day`} color={FORMULA_COLOR} />
        </View>
      </View>

      {/* ── Lumina's Analysis — Monthly Feeds ── */}
      <View style={calStyles.luminaAnalysisFeedCard}>
        <View style={calStyles.luminaAnalysisHeader}>
          <View style={calStyles.luminaAnalysisFeedIcon}>
            <Feather name="star" size={14} color={EVENT_TYPES.feed.color} />
          </View>
          <Text style={[calStyles.luminaAnalysisTitle, { color: '#8B5E3C' }]}>Lumina's Analysis</Text>
        </View>
        <Text style={calStyles.luminaAnalysisBody}>
          Feeds gradually decreased from {(MONTHLY_FEEDS_TREND[0].avgBreast + MONTHLY_FEEDS_TREND[0].avgBottle).toFixed(1)} to {(MONTHLY_FEEDS_TREND[3].avgBreast + MONTHLY_FEEDS_TREND[3].avgBottle).toFixed(1)} sessions/day — this is perfectly normal as Ece grows and takes more per feed. Nursing time is also becoming more efficient, a great sign of a strong latch.
        </Text>
      </View>

      {/* Growth card */}
      <View style={calStyles.chartCard}>
        <View style={calStyles.chartHeader}>
          <Feather name="trending-up" size={14} color={EVENT_TYPES.growth.color} />
          <Text style={calStyles.chartTitle}>Growth</Text>
          <Text style={calStyles.chartUnit}>this month</Text>
        </View>
        <View style={calStyles.growthGrid}>
          <View style={calStyles.growthItem}>
            <Text style={calStyles.growthLabel}>Weight</Text>
            <Text style={calStyles.growthValue}>
              {MONTHLY_GROWTH.startWeight} → {MONTHLY_GROWTH.endWeight} kg
            </Text>
            <Text style={[calStyles.growthDelta, { color: EVENT_TYPES.growth.color }]}>
              +{weightGain} kg
            </Text>
          </View>
          <View style={calStyles.growthDivider} />
          <View style={calStyles.growthItem}>
            <Text style={calStyles.growthLabel}>Length</Text>
            <Text style={calStyles.growthValue}>
              {MONTHLY_GROWTH.startLength} → {MONTHLY_GROWTH.endLength} cm
            </Text>
            <Text style={[calStyles.growthDelta, { color: EVENT_TYPES.growth.color }]}>
              +{lengthGain} cm
            </Text>
          </View>
          <View style={calStyles.growthDivider} />
          <View style={calStyles.growthItem}>
            <Text style={calStyles.growthLabel}>Head</Text>
            <Text style={calStyles.growthValue}>
              {MONTHLY_GROWTH.startHead} → {MONTHLY_GROWTH.endHead} cm
            </Text>
            <Text style={[calStyles.growthDelta, { color: EVENT_TYPES.growth.color }]}>
              +{(MONTHLY_GROWTH.endHead - MONTHLY_GROWTH.startHead).toFixed(1)} cm
            </Text>
          </View>
        </View>
      </View>

      {/* Growth Chart or Empty State */}
      {growthChartData.hasData ? (
        <GrowthChartCard />
      ) : (
        <View style={calStyles.chartCard}>
          <View style={calStyles.chartHeader}>
            <Feather name="bar-chart-2" size={14} color={EVENT_TYPES.growth.color} />
            <Text style={calStyles.chartTitle}>Growth Chart</Text>
          </View>
          {/* Mini faux chart illustration */}
          <View style={calStyles.growthEmptyChart}>
            {/* Soft grid lines */}
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[calStyles.growthEmptyGridLine, { bottom: `${i * 25 + 12}%` as const }]} />
            ))}
            {/* Percentile band */}
            <View style={calStyles.growthEmptyBand} />
            {/* Rising curve with connected segments */}
            {[
              { left: 12, bottom: 18, w: 28, angle: 22 },
              { left: 30, bottom: 32, w: 26, angle: 18 },
              { left: 50, bottom: 44, w: 24, angle: 12 },
              { left: 68, bottom: 52, w: 18, angle: 6 },
            ].map((seg, i) => (
              <View
                key={`seg-${i}`}
                style={[
                  calStyles.growthEmptyCurveSegment,
                  {
                    left: `${seg.left}%` as const,
                    bottom: `${seg.bottom}%` as const,
                    width: seg.w,
                    transform: [{ rotate: `${-seg.angle}deg` }],
                  },
                ]}
              />
            ))}
            {/* Data point dots along the curve */}
            {[
              { left: '12%' as const, bottom: '18%' as const, size: 7 },
              { left: '30%' as const, bottom: '32%' as const, size: 8 },
              { left: '50%' as const, bottom: '44%' as const, size: 9 },
              { left: '68%' as const, bottom: '52%' as const, size: 9 },
              { left: '82%' as const, bottom: '56%' as const, size: 10 },
            ].map((dot, i) => (
              <View
                key={`dot-${i}`}
                style={[
                  calStyles.growthEmptyDot,
                  {
                    left: dot.left,
                    bottom: dot.bottom,
                    width: dot.size,
                    height: dot.size,
                    borderRadius: dot.size / 2,
                    opacity: 0.25 + i * 0.15,
                  },
                ]}
              />
            ))}
            {/* Ruler icon centered */}
            <View style={calStyles.growthEmptyIconWrap}>
              <Feather name="trending-up" size={22} color={colors.primary[300]} />
            </View>
          </View>
          <Text style={calStyles.growthEmptyTitle}>No chart data yet</Text>
          <Text style={calStyles.growthEmptyBody}>
            Log at least 2 measurements to see the growth curve with WHO percentiles.
          </Text>
        </View>
      )}

      {/* Monthly Insights */}
      <View style={calStyles.insightsCard}>
        <View style={calStyles.insightsHeader}>
          <Feather name="zap" size={14} color={colors.primary[500]} />
          <Text style={calStyles.insightsTitle}>Month in review</Text>
        </View>
        <View style={calStyles.insightRow}>
          <View style={[calStyles.insightDot, { backgroundColor: EVENT_TYPES.sleep.color }]} />
          <Text style={calStyles.insightText}>
            Sleep improved by Week 3 — night stretches got longer. Great progress!
          </Text>
        </View>
        <View style={calStyles.insightRow}>
          <View style={[calStyles.insightDot, { backgroundColor: EVENT_TYPES.feed.color }]} />
          <Text style={calStyles.insightText}>
            Feeds gradually decreased from 8.2 to 7.1/day — normal as baby grows and takes more per feed.
          </Text>
        </View>
        <View style={calStyles.insightRow}>
          <View style={[calStyles.insightDot, { backgroundColor: EVENT_TYPES.growth.color }]} />
          <Text style={calStyles.insightText}>
            Gained {weightGain} kg and {lengthGain} cm — tracking well along the growth curve.
          </Text>
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// Main component — Journal Screen
// ══════════════════════════════════════════════════════════════

export default function JournalScreen() {
  const {
    isPregnant,
    gestationalWeek,
    parentName,
    babyName,
    totalFeedsToday,
    totalWetToday,
    totalDirtyToday,
    lastFedAgo,
    lastSleepAgo,
    sleepSummary,
    babyAge,
  } = useDashboardData();

  const [viewMode, setViewMode] = useState<ViewMode>('daily');

  const displayName = babyName || 'Baby';
  const ageDisplay = babyAge?.display ?? '';
  const sleepHours = sleepSummary?.total_sleep_hours ?? null;

  const healthSignals = useMemo(
    () => buildHealthSignals(totalFeedsToday, totalWetToday, totalDirtyToday, lastFedAgo, lastSleepAgo, sleepHours),
    [totalFeedsToday, totalWetToday, totalDirtyToday, lastFedAgo, lastSleepAgo, sleepHours],
  );

  return (
    <SafeAreaView style={healthStyles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={healthStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {isPregnant ? (
          <PregnancyDailyView
            week={gestationalWeek}
            parentName={parentName || 'mama'}
          />
        ) : (
          <>
            {/* ── Segment Tabs ── */}
            <View style={calStyles.segmentRow}>
              {SEGMENTS.map((seg) => (
                <Pressable
                  key={seg.key}
                  style={[calStyles.segment, viewMode === seg.key && calStyles.segmentActive]}
                  onPress={() => setViewMode(seg.key)}
                >
                  <Text
                    style={[calStyles.segmentText, viewMode === seg.key && calStyles.segmentTextActive]}
                  >
                    {seg.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* ── Date label ── */}
            <View style={calStyles.dateRow}>
              <Feather name="calendar" size={14} color={colors.textTertiary} />
              <Text style={calStyles.dateLabel}>
                {viewMode === 'daily'
                  ? 'Today'
                  : viewMode === 'weekly'
                  ? 'Mar 3 – Mar 9'
                  : 'March 2026'}
              </Text>
            </View>

            {/* ── Timeline / Charts Content ── */}
            {viewMode === 'daily' ? (
              SAMPLE_EVENTS.map((event, index) => {
                const type = EVENT_TYPES[event.type];
                const isLast = index === SAMPLE_EVENTS.length - 1;
                return (
                  <View key={event.id} style={calStyles.timelineRow}>
                    <Text style={calStyles.timelineTime}>{event.time}</Text>
                    <View style={calStyles.timelineDotCol}>
                      <View style={[calStyles.timelineDot, { backgroundColor: type.color }]} />
                      {!isLast && <View style={calStyles.timelineLine} />}
                    </View>
                    <View style={[calStyles.timelineCard, { backgroundColor: type.bg }]}>
                      <View style={calStyles.timelineCardHeader}>
                        <Feather name={type.icon} size={14} color={type.color} />
                        <Text style={[calStyles.timelineCardLabel, { color: type.color }]}>
                          {type.label}
                        </Text>
                      </View>
                      <Text style={calStyles.timelineCardDetail}>{event.detail}</Text>
                    </View>
                  </View>
                );
              })
            ) : viewMode === 'weekly' ? (
              <WeeklyView />
            ) : (
              <MonthlyView />
            )}

            {/* ── Health Check Card ── */}
            <View style={healthStyles.healthCard}>
              <View style={healthStyles.healthHeader}>
                <View style={healthStyles.healthIconWrap}>
                  <Feather name="activity" size={18} color={UI.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={healthStyles.healthTitle}>{displayName}'s Health Check</Text>
                  {ageDisplay ? (
                    <Text style={healthStyles.healthAge}>{ageDisplay}</Text>
                  ) : null}
                </View>
              </View>

              {healthSignals.length > 0 ? (
                <View style={healthStyles.healthSignals}>
                  {healthSignals.map((signal) => (
                    <View key={signal.label} style={healthStyles.signalRow}>
                      <View style={[healthStyles.signalIcon, { backgroundColor: signal.bg }]}>
                        <Feather name={signal.icon} size={14} color={signal.tint} />
                      </View>
                      <View style={healthStyles.signalText}>
                        <Text style={healthStyles.signalLabel}>{signal.label}</Text>
                        <Text style={healthStyles.signalDetail}>{signal.detail}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={healthStyles.healthEmpty}>
                  Log feeds, sleep, and diapers to see {displayName}'s daily health summary here.
                </Text>
              )}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════
// Styles — Health Check section
// ══════════════════════════════════════════════════════════════

const healthStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // ── Health Card ──
  healthCard: {
    backgroundColor: UI.card,
    borderRadius: 28,
    padding: 20,
    marginTop: 20,
    marginBottom: 28,
    ...SOFT_SHADOW,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  healthIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UI.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: UI.text,
  },
  healthAge: {
    fontSize: 13,
    fontWeight: '400',
    color: UI.textMuted,
    marginTop: 1,
  },
  healthSignals: {
    gap: 12,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalText: {
    flex: 1,
  },
  signalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: UI.text,
  },
  signalDetail: {
    fontSize: 13,
    fontWeight: '400',
    color: UI.textSecondary,
    lineHeight: 18,
    marginTop: 1,
  },
  healthEmpty: {
    fontSize: 14,
    fontWeight: '400',
    color: UI.textSecondary,
    lineHeight: 20,
  },
  pregCardBody: {
    fontSize: 14,
    fontWeight: '400',
    color: UI.textSecondary,
    lineHeight: 21,
    marginTop: 4,
  },

  // ── Section labels ──
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: UI.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // ── Smart Feed (pregnancy wellness) ──
  smartFeedSection: {
    gap: 0,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E4DF',
    gap: 14,
  },
  suggestionLeft: {
    paddingTop: 2,
  },
  suggestionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
    gap: 4,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: UI.text,
  },
  suggestionSnippet: {
    fontSize: 14,
    fontWeight: '400',
    color: UI.textSecondary,
    lineHeight: 20,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: UI.accent,
    marginTop: 4,
  },
});

// ══════════════════════════════════════════════════════════════
// Styles — Calendar / Timeline section
// ══════════════════════════════════════════════════════════════

const calStyles = StyleSheet.create({
  // Segmented Control
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    padding: 3,
    marginBottom: spacing.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  segmentText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },

  // Date
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.base,
  },
  dateLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },

  // Daily Timeline
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 72 },
  timelineTime: {
    width: 64,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    paddingTop: spacing.sm,
    textAlign: 'right',
    marginRight: spacing.md,
  },
  timelineDotCol: { alignItems: 'center', width: 20, marginRight: spacing.md },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: spacing.sm },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.neutral[200], marginTop: spacing.xs },
  timelineCard: { flex: 1, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
  timelineCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  timelineCardLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timelineCardDetail: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },

  // ── Weekly View ──
  weeklyContainer: { gap: spacing.lg },

  // ── Lumina Insight Card (premium, top of weekly) ──
  luminaInsightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.lg,
    shadowColor: '#8E72A4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  luminaInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  luminaInsightIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  luminaInsightTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  luminaInsightBody: {
    gap: spacing.md,
  },
  insightBullet: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  insightBulletDot: {
    width: 6, height: 6, borderRadius: 3,
    marginTop: 6,
  },
  insightBulletText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },

  // ── Lumina's Analysis Card (AI interpretation between charts) ──
  luminaAnalysisCard: {
    backgroundColor: '#EEF0F7',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D8DCE8',
  },
  luminaAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  luminaAnalysisIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D8DCE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  luminaAnalysisTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A5899',
    letterSpacing: 0.2,
  },
  luminaAnalysisBody: {
    fontSize: 14,
    color: '#3A3D52',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  luminaAnalysisFeedCard: {
    backgroundColor: '#FDF2E9',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0DCC8',
  },
  luminaAnalysisFeedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0DCC8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Premium Card (Apple Health / Oura style) ──
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitleText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  heroMetric: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textTertiary,
    marginBottom: 20,
  },

  // ── Legend (used by calendar heatmap) ──
  chartLegend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: 14,
    justifyContent: 'center',
  },
  legendText: { fontSize: 12, fontWeight: '500', color: colors.textTertiary },

  // ── Feed Tabs ──
  feedTabBar: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    padding: 3,
    marginBottom: spacing.md,
    gap: 3,
  },
  feedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
  },
  feedTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  feedTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  feedTabLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
  },

  // ── Data Grid ──
  dataGridDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral[200],
    marginTop: 18,
    marginBottom: 16,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dataCell: {
    width: '50%',
    paddingVertical: 8,
  },
  dataCellLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 3,
  },
  dataCellValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // ── Quick Stats Row ──
  quickStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Monthly views ──
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  chartUnit: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },

  // Insights card (monthly view)
  insightsCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 24,
    padding: spacing.lg,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  insightsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  insightRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  insightDot: {
    width: 6, height: 6, borderRadius: 3,
    marginTop: 5,
  },
  insightText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },

  // ── Monthly: Calendar grid ──
  calRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 3,
  },
  calHeaderText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  calDot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  calDayText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  calEmpty: {
    width: 32, height: 32,
  },
  calLegendDot: {
    width: 12, height: 12, borderRadius: 3,
  },
  calDotSelected: {
    borderWidth: 2.5,
    borderColor: colors.primary[700],
    transform: [{ scale: 1.15 }],
  },
  calDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
  },

  // ── Monthly: Day Detail Panel ──
  dayDetailPanel: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  dayDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayDetailTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  dayDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: spacing.md,
  },
  dayDetailTime: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    width: 68,
  },
  dayDetailDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayDetailText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  dayDetailEmpty: {
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing['2xl'],
  },

  // ── Monthly: Growth ──
  growthGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  growthItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  growthLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  growthValue: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  growthDelta: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  growthDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: 4,
  },

  // Growth Chart Empty State
  growthEmptyChart: {
    height: 120,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  growthEmptyGridLine: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    height: 1,
    backgroundColor: colors.neutral[200],
    opacity: 0.5,
  },
  growthEmptyBand: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: '25%',
    bottom: '25%',
    backgroundColor: colors.primary[100],
    opacity: 0.3,
    borderRadius: 8,
  },
  growthEmptyCurveSegment: {
    position: 'absolute',
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.primary[300],
    opacity: 0.35,
  },
  growthEmptyDot: {
    position: 'absolute',
    backgroundColor: colors.primary[400],
    borderWidth: 1.5,
    borderColor: colors.primary[200],
  },
  growthEmptyIconWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  growthEmptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  growthEmptyBody: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.5,
  },
});

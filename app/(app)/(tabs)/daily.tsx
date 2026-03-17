// ============================================================
// Lumina — Daily Intelligence Dashboard
// Personalized AI hub: health check → smart feed
// Clean editorial layout, no category tabs
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
import { Feather } from '@expo/vector-icons';
import { ChatSheet } from '../../../src/modules/insights/components/ChatSheet';
import { KeyboardDoneBar } from '../../../src/shared/components/KeyboardDoneBar';
import { VisualGuide } from '../../../src/modules/insights/components/VisualGuide';
import { DevelopmentalNudgeCard, CATEGORY_CONFIG } from '../../../src/modules/insights/components/DevelopmentalNudgeCard';
import { CardIllustrationMap } from '../../../src/shared/components/CardIllustrations';
import { ClayIcon } from '../../../src/shared/components/ClayIcons';
import { useNurseSaysData } from '../../../src/modules/insights/hooks/useNurseSaysData';
import { useExpertInsights } from '../../../src/modules/insights/hooks/useExpertInsights';
import { useDashboardData } from '../../../src/modules/dashboard/hooks/useDashboardData';
import { useInsightDismissStore } from '../../../src/stores/insightDismissStore';
import type { InsightCardData, InsightTag, VisualGuide as VisualGuideData } from '../../../src/modules/insights/types';

// ── Nudge category → InsightTag mapping ──────────────────────
const CATEGORY_TO_TAG: Record<string, InsightTag> = {
  sleep: 'sleep_alert',
  feeding: 'feeding_insight',
  health: 'health_pattern',
  growth: 'growth_note',
  milestone: 'milestone_watch',
};

// ── Design tokens ────────────────────────────────────────────
const UI = {
  bg: '#F7F4F0',
  card: '#FFFFFF',
  text: '#3D3D3D',
  textSecondary: '#5C5C5C',   // body text — readable on cream
  textMuted: '#8A8A8A',       // labels, captions only
  textLight: '#B0AAA2',
  accent: '#B199CE',
  accentLight: '#F0EBF5',
  warmLight: '#FEF4E8',
  warmTint: '#C4943A',
  blushLight: '#FDF0F0',
  blushTint: '#C47A7A',
};

const SOFT_SHADOW = {
  shadowColor: '#B0A090',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 14,
  elevation: 4,
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
      icon: 'coffee',
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

// ── Smart suggestions ────────────────────────────────────────

interface SmartSuggestion {
  id: string;
  title: string;
  snippet: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  tint: string;
  visualGuide?: VisualGuideData;
}

function generateSmartSuggestions(
  ageDays: number | null,
  totalFeeds: number,
  sleepHours: number | null,
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  const weeks = ageDays ? Math.floor(ageDays / 7) : 0;

  // Age-based suggestions
  if (weeks <= 2) {
    suggestions.push({
      id: 'colostrum',
      title: 'Early feeding patterns',
      snippet: 'Newborns feed 8-12 times a day. Cluster feeding in the evening is completely normal and helps establish your supply.',
      icon: 'coffee',
      tint: '#A08B6E',
      visualGuide: {
        type: 'step_by_step',
        media_url: 'https://placeholder.lumina.app/guides/early-feeding',
        action_text: 'Early feeding basics',
        steps: [
          { step: 1, instruction: 'Watch for feeding cues: rooting, lip smacking, hand-to-mouth', icon: 'eye' },
          { step: 2, instruction: 'Feed on demand — don\'t wait for crying', icon: 'clock' },
          { step: 3, instruction: 'Track wet diapers: 6+ per day by day 4 means adequate intake', icon: 'check-circle' },
        ],
      },
    });
    suggestions.push({
      id: 'newborn-sleep',
      title: 'Newborn sleep basics',
      snippet: 'Expect 14-17 hours of sleep in short bursts. Day-night confusion is normal and typically resolves by 6-8 weeks.',
      icon: 'moon',
      tint: '#A78BBA',
    });
  } else if (weeks <= 6) {
    suggestions.push({
      id: 'growth-spurt',
      title: 'Growth spurt window',
      snippet: 'Around 3-6 weeks, babies often have their first major growth spurt. Increased fussiness and feeding are normal signs.',
      icon: 'trending-up',
      tint: '#A78BBA',
    });
  } else if (weeks <= 12) {
    suggestions.push({
      id: 'social-smile',
      title: 'Social milestones emerging',
      snippet: 'Between 6-12 weeks, watch for your baby\'s first social smile — a real response to your face, not just a reflex.',
      icon: 'smile',
      tint: '#9B7DB8',
    });
  } else if (weeks <= 20) {
    suggestions.push({
      id: 'routine',
      title: 'Building a flexible routine',
      snippet: 'Around 3-4 months, babies start showing predictable patterns. Follow their cues rather than the clock.',
      icon: 'clock',
      tint: '#A08B6E',
    });
  }

  // Trend-based suggestions
  if (sleepHours !== null && sleepHours < 3) {
    suggestions.push({
      id: 'low-sleep',
      title: 'Managing wake windows',
      snippet: 'Short on sleep today? Watch for drowsy cues — yawning, eye rubbing, looking away. Catching the window early makes settling easier.',
      icon: 'eye',
      tint: UI.warmTint,
      visualGuide: {
        type: 'step_by_step',
        media_url: 'https://placeholder.lumina.app/guides/wake-windows',
        action_text: 'Spotting drowsy cues',
        steps: [
          { step: 1, instruction: 'Watch for yawning, eye rubbing, or looking away', icon: 'eye' },
          { step: 2, instruction: 'Start wind-down routine immediately when cues appear', icon: 'moon' },
          { step: 3, instruction: 'Dim lights, reduce stimulation, gentle rocking', icon: 'sun' },
        ],
      },
    });
  }

  if (totalFeeds >= 10) {
    suggestions.push({
      id: 'cluster-feed',
      title: 'Cluster feeding is normal',
      snippet: 'High feeding frequency often signals a growth spurt or comfort nursing. Both are healthy and help regulate supply.',
      icon: 'repeat',
      tint: '#A08B6E',
    });
  }

  // Always include a wellness tip
  suggestions.push({
    id: 'parent-care',
    title: 'A moment for you',
    snippet: 'Parental wellbeing matters. Even 5 minutes of quiet breathing or a warm drink can help reset your nervous system.',
    icon: 'heart',
    tint: '#C47A7A',
  });

  return suggestions;
}

// ── Suggestion Card (expandable) ─────────────────────────────

function SuggestionCard({
  suggestion,
  onAskAI,
}: {
  suggestion: SmartSuggestion;
  onAskAI: (suggestion: SmartSuggestion) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  return (
    <View style={styles.suggestionCard}>
      <View style={styles.suggestionLeft}>
        <View style={styles.suggestionIconWrap}>
          {suggestion.icon === 'coffee' || suggestion.icon === 'repeat' ? (
            <CardIllustrationMap.feeding size={44} />
          ) : suggestion.icon === 'moon' || suggestion.icon === 'eye' || suggestion.icon === 'clock' ? (
            <CardIllustrationMap.sleep size={44} />
          ) : suggestion.icon === 'heart' ? (
            <CardIllustrationMap.health size={44} />
          ) : suggestion.icon === 'trending-up' ? (
            <CardIllustrationMap.growth size={44} />
          ) : suggestion.icon === 'smile' ? (
            <CardIllustrationMap.activity size={44} />
          ) : (
            <Feather name={suggestion.icon} size={18} color={suggestion.tint} />
          )}
        </View>
      </View>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>

        {/* Snippet text — truncated or full */}
        <Text
          style={styles.suggestionSnippet}
          numberOfLines={expanded ? undefined : 2}
        >
          {suggestion.snippet}
        </Text>

        {/* Read more / Show less toggle */}
        <Pressable onPress={toggleExpand} hitSlop={6}>
          <Text style={styles.readMoreText}>
            {expanded ? 'Show less' : 'Read more'}
          </Text>
        </Pressable>

        {/* Expanded: Visual guide + Ask Lumina button */}
        {expanded && (
          <>
            {suggestion.visualGuide && (
              <View style={styles.expandedVisualGuide}>
                <VisualGuide guide={suggestion.visualGuide} />
              </View>
            )}

            <Pressable
              style={styles.askAIButton}
              onPress={() => onAskAI(suggestion)}
              hitSlop={4}
            >
              <Feather name="message-circle" size={14} color="#FFFFFF" />
              <Text style={styles.askAIText}>Ask Lumina about this</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

// ── Daily Note Card (expandable) ─────────────────────────────

function DailyNoteCard({
  card,
  onAskAI,
}: {
  card: InsightCardData;
  onAskAI: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  return (
    <View style={styles.dailyNote}>
      <View style={styles.dailyNoteHeader}>
        <View style={styles.dailyNoteIcon}>
          <ClayIcon name="sun-dry" size={36} />
        </View>
        <Text style={styles.dailyNoteTitle}>{card.title}</Text>
      </View>

      <Pressable onPress={toggleExpand}>
        <Text
          style={styles.dailyNoteBody}
          numberOfLines={expanded ? undefined : 2}
        >
          {card.body}
        </Text>
        <Text style={styles.readMoreText}>
          {expanded ? 'Show less' : 'Read more'}
        </Text>
      </Pressable>

      {expanded && (
        <Pressable
          style={styles.askAIButton}
          onPress={onAskAI}
          hitSlop={4}
        >
          <Feather name="message-circle" size={14} color="#FFFFFF" />
          <Text style={styles.askAIText}>Ask Lumina about this</Text>
        </Pressable>
      )}
    </View>
  );
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
    tipIcon: 'coffee',
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
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily</Text>
        <Text style={styles.headerSubtitle}>
          Week {week} · {trimester} trimester
        </Text>
      </View>

      {/* ── Baby This Week Card ── */}
      <View style={styles.healthCard}>
        <View style={styles.healthHeader}>
          <View style={[styles.healthIconWrap, { backgroundColor: '#FEF4E8' }]}>
            <Feather name="heart" size={18} color="#E8945A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.healthTitle}>Baby This Week</Text>
            <Text style={styles.healthAge}>Size of a {weekInfo.babySize.toLowerCase()}</Text>
          </View>
        </View>
        <Text style={styles.pregCardBody}>{weekInfo.babyDev}</Text>
      </View>

      {/* ── Your Body Card ── */}
      <View style={styles.healthCard}>
        <View style={styles.healthHeader}>
          <View style={[styles.healthIconWrap, { backgroundColor: UI.blushLight }]}>
            <Feather name="user" size={18} color={UI.blushTint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.healthTitle}>Your Body</Text>
          </View>
        </View>
        <Text style={styles.pregCardBody}>{weekInfo.momBody}</Text>
      </View>

      {/* ── Weekly Tip Highlight ── */}
      <View style={[styles.healthCard, { backgroundColor: '#FDFAF5' }]}>
        <View style={styles.healthHeader}>
          <View style={[styles.healthIconWrap, { backgroundColor: '#FEF4E8' }]}>
            <Feather name={weekInfo.tipIcon} size={18} color={UI.warmTint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.healthTitle}>Tip of the Week</Text>
          </View>
        </View>
        <Text style={styles.pregCardBody}>{weekInfo.tip}</Text>
      </View>

      {/* ── Wellness Checklist ── */}
      <View style={styles.smartFeedSection}>
        <Text style={styles.sectionLabel}>DAILY WELLNESS</Text>
        {wellnessTips.map((tip) => {
          const isExpanded = expandedTips[tip.id] ?? false;
          return (
            <Pressable
              key={tip.id}
              style={styles.suggestionCard}
              onPress={() => toggleTip(tip.id)}
            >
              <View style={styles.suggestionLeft}>
                <View style={styles.suggestionIconWrap}>
                  <Feather name={tip.icon} size={18} color={tip.tint} />
                </View>
              </View>
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionTitle}>{tip.title}</Text>
                <Text
                  style={styles.suggestionSnippet}
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {tip.body}
                </Text>
                {!isExpanded && (
                  <Text style={styles.readMoreText}>Read more</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

// ── Main component ───────────────────────────────────────────

export default function DailyScreen() {
  const { referenceCards, dailyNurseCard, babyName, babyAgeDays, feedingMethod } = useNurseSaysData();
  const { nudges, stageLabel } = useExpertInsights();
  const dismiss = useInsightDismissStore((s) => s.dismiss);
  const {
    isPregnant,
    gestationalWeek,
    parentName,
    totalFeedsToday,
    totalWetToday,
    totalDirtyToday,
    lastFedAgo,
    lastSleepAgo,
    sleepSummary,
    babyAge,
  } = useDashboardData();

  const [chatInsight, setChatInsight] = useState<InsightCardData | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>(undefined);

  const handleOpenChat = useCallback((insight?: InsightCardData | null, initialMsg?: string) => {
    setChatInsight(insight ?? null);
    setChatInitialMessage(initialMsg);
    setShowChat(true);
  }, []);

  const displayName = babyName || 'Baby';
  const ageDisplay = babyAge?.display ?? '';
  const sleepHours = sleepSummary?.total_sleep_hours ?? null;

  const healthSignals = useMemo(
    () => buildHealthSignals(totalFeedsToday, totalWetToday, totalDirtyToday, lastFedAgo, lastSleepAgo, sleepHours),
    [totalFeedsToday, totalWetToday, totalDirtyToday, lastFedAgo, lastSleepAgo, sleepHours],
  );

  const smartSuggestions = useMemo(
    () => generateSmartSuggestions(babyAgeDays, totalFeedsToday, sleepHours),
    [babyAgeDays, totalFeedsToday, sleepHours],
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Daily</Text>
              <Text style={styles.headerSubtitle}>
                Personalized guidance for {displayName}
              </Text>
            </View>

            {/* ── Health Check Card ── */}
            <View style={styles.healthCard}>
              <View style={styles.healthHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.healthTitle}>{displayName}'s Health Check</Text>
                  {ageDisplay ? (
                    <Text style={styles.healthAge}>{ageDisplay}</Text>
                  ) : null}
                </View>
              </View>

              {healthSignals.length > 0 ? (
                <View style={styles.healthSignals}>
                  {healthSignals.map((signal) => (
                    <View key={signal.label} style={styles.signalRow}>
                      <View style={[styles.signalIcon, { backgroundColor: signal.bg }]}>
                        {signal.icon === 'moon' && CardIllustrationMap.sleep ? (
                          <CardIllustrationMap.sleep size={44} />
                        ) : signal.icon === 'coffee' && CardIllustrationMap.feeding ? (
                          <CardIllustrationMap.feeding size={44} />
                        ) : signal.icon === 'droplet' && CardIllustrationMap.diaper ? (
                          <CardIllustrationMap.diaper size={44} />
                        ) : (
                          <Feather name={signal.icon} size={14} color={signal.tint} />
                        )}
                      </View>
                      <View style={styles.signalText}>
                        <Text style={styles.signalLabel}>{signal.label}</Text>
                        <Text style={styles.signalDetail}>{signal.detail}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.healthEmpty}>
                  Log feeds, sleep, and diapers to see {displayName}'s daily health summary here.
                </Text>
              )}
            </View>

            {/* ── Developmental Nudges ── */}
            {nudges.length > 0 && (
              <View style={styles.nudgeSection}>
                {nudges.map((nudge) => (
                  <DevelopmentalNudgeCard
                    key={nudge.slug}
                    insight={nudge}
                    stageLabel={stageLabel}
                    onDismiss={(slug) => dismiss(`nudge-${slug}`)}
                    onAskAI={(n) => handleOpenChat({
                      id: n.slug,
                      contentHash: `nudge-${n.slug}`,
                      tag: CATEGORY_TO_TAG[n.category] ?? 'general',
                      tagLabel: CATEGORY_CONFIG[n.category]?.label ?? 'Insight',
                      tagIcon: CATEGORY_CONFIG[n.category]?.icon ?? 'book-open',
                      hook: `Source: ${n.source}`,
                      title: n.title,
                      body: n.body,
                      priority: 'medium',
                      createdAt: Date.now(),
                      actionItems: n.action_items ?? undefined,
                    })}
                  />
                ))}
              </View>
            )}

            {/* ── Daily Note ── */}
            {dailyNurseCard && (
              <DailyNoteCard
                card={dailyNurseCard}
                onAskAI={() => handleOpenChat(dailyNurseCard)}
              />
            )}

            {/* ── Smart Feed ── */}
            <View style={styles.smartFeedSection}>
              <Text style={styles.sectionLabel}>SUGGESTED FOR YOU</Text>
              {smartSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAskAI={(s) =>
                    handleOpenChat({
                      id: s.id,
                      contentHash: `suggestion-${s.id}`,
                      tag: 'general',
                      tagLabel: 'Lumina',
                      tagIcon: s.icon as string,
                      hook: '',
                      title: s.title,
                      body: s.snippet,
                      priority: 'low',
                      createdAt: Date.now(),
                      visualGuide: s.visualGuide,
                    })
                  }
                />
              ))}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <ChatSheet
        visible={showChat}
        onClose={() => {
          setShowChat(false);
          setChatInitialMessage(undefined);
        }}
        insight={chatInsight}
        babyName={babyName}
        babyAgeDays={babyAgeDays}
        feedingMethod={feedingMethod}
        initialMessage={chatInitialMessage}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // ── Header ──
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2A26',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: UI.textSecondary,
    marginTop: 4,
  },

  // ── Health Card ──
  healthCard: {
    backgroundColor: UI.card,
    borderRadius: 22,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
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
    borderRadius: 22,
    backgroundColor: UI.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D2A26',
  },
  healthAge: {
    fontSize: 13,
    fontWeight: '400',
    color: '#A08060',
    marginTop: 1,
  },
  healthSignals: {
    gap: 12,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  signalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalText: {
    flex: 1,
  },
  signalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D2A26',
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

  // ── Nudge section ──
  nudgeSection: {
    marginBottom: 12,
  },

  // ── Section labels ──
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A8A8A',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // ── Daily note ──
  dailyNote: {
    backgroundColor: UI.card,
    borderRadius: 22,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...SOFT_SHADOW,
  },
  dailyNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  dailyNoteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyNoteTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2A26',
  },
  dailyNoteBody: {
    fontSize: 14,
    fontWeight: '400',
    color: UI.textSecondary,
    lineHeight: 20,
  },

  // ── Smart Feed ──
  smartFeedSection: {
    gap: 0,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    marginBottom: 12,
    backgroundColor: UI.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    gap: 14,
    ...SOFT_SHADOW,
  },
  suggestionLeft: {
    paddingTop: 2,
  },
  suggestionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
    gap: 4,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2A26',
  },
  suggestionSnippet: {
    fontSize: 14,
    fontWeight: '400',
    color: UI.textSecondary,
    lineHeight: 20,
  },

  // ── Expandable card extras ──
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C9A8E',
    marginTop: 4,
  },
  expandedVisualGuide: {
    marginTop: 12,
  },
  askAIButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 12,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#7C9A8E',
    borderRadius: 22,
  },
  askAIText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

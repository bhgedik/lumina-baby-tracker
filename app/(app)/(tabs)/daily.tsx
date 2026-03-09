// ============================================================
// Sprouty — Daily Intelligence Dashboard
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
  accent: '#8BA88E',
  accentLight: '#EDF3EE',
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
      tint: sleepGood ? '#6B8E6F' : UI.warmTint,
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
      tint: totalFeeds >= 6 ? '#6B8E6F' : UI.warmTint,
      bg: totalFeeds >= 6 ? UI.accentLight : UI.warmLight,
    });
  }

  // Diaper signal
  if (totalWet + totalDirty > 0) {
    signals.push({
      icon: 'droplet',
      label: 'Diapers',
      detail: `${totalWet} wet, ${totalDirty} dirty today`,
      tint: '#6B8E6F',
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
        media_url: 'https://placeholder.sprouty.app/guides/early-feeding',
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
      tint: '#6B8E6F',
    });
  } else if (weeks <= 6) {
    suggestions.push({
      id: 'growth-spurt',
      title: 'Growth spurt window',
      snippet: 'Around 3-6 weeks, babies often have their first major growth spurt. Increased fussiness and feeding are normal signs.',
      icon: 'trending-up',
      tint: '#6B8E6F',
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
        media_url: 'https://placeholder.sprouty.app/guides/wake-windows',
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
        <View style={[styles.suggestionIconWrap, { backgroundColor: suggestion.tint + '15' }]}>
          <Feather name={suggestion.icon} size={18} color={suggestion.tint} />
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
              <Feather name="message-circle" size={14} color={UI.accent} />
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
          <Feather name="sun" size={16} color={UI.warmTint} />
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
          <Feather name="message-circle" size={14} color={UI.accent} />
          <Text style={styles.askAIText}>Ask Lumina about this</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Main component ───────────────────────────────────────────

export default function DailyScreen() {
  const { referenceCards, dailyNurseCard, babyName, babyAgeDays, feedingMethod } = useNurseSaysData();
  const { nudges, stageLabel } = useExpertInsights();
  const dismiss = useInsightDismissStore((s) => s.dismiss);
  const {
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
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
            <View style={styles.healthIconWrap}>
              <Feather name="activity" size={18} color={UI.accent} />
            </View>
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
                    <Feather name={signal.icon} size={14} color={signal.tint} />
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
    fontWeight: '600',
    color: UI.text,
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
    borderRadius: 28,
    padding: 20,
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

  // ── Nudge section ──
  nudgeSection: {
    marginBottom: 12,
  },

  // ── Section labels ──
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: UI.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // ── Daily note ──
  dailyNote: {
    backgroundColor: UI.card,
    borderRadius: 28,
    padding: 16,
    marginBottom: 28,
    ...SOFT_SHADOW,
  },
  dailyNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  dailyNoteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UI.warmLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyNoteTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: UI.text,
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

  // ── Expandable card extras ──
  readMoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: UI.accent,
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
    backgroundColor: UI.accentLight,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: UI.accent + '30',
  },
  askAIText: {
    fontSize: 13,
    fontWeight: '500',
    color: UI.accent,
  },
});

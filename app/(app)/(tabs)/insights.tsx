// ============================================================
// Sprouty — Insights Screen (Magazine-Style Feed)
// Pregnancy: Weekly development, body changes, tips
// Postpartum: AI recommendations, charts, insight cards
// Tapping any card navigates to full article reader
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { InsightCard } from '../../../src/modules/insights/components/InsightCard';
import { CompactInsightCard } from '../../../src/modules/insights/components/CompactInsightCard';
import { FilterChips } from '../../../src/modules/insights/components/FilterChips';
import { SectionHeader } from '../../../src/modules/insights/components/SectionHeader';
import { ChatSheet } from '../../../src/modules/insights/components/ChatSheet';
import { GrowthPercentileChart } from '../../../src/modules/dashboard/components/GrowthPercentileChart';
import { NutritionChart } from '../../../src/modules/insights/components/NutritionChart';
import { StackedSleepChart } from '../../../src/modules/insights/components/StackedSleepChart';
import { useInsightsData } from '../../../src/modules/insights/hooks/useInsightsData';
import { useInsightsChartData } from '../../../src/modules/insights/hooks/useInsightsChartData';
import { useSeedData } from '../../../src/data/useSeedData';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { useDiaperStore } from '../../../src/stores/diaperStore';
import { useFeedingStore } from '../../../src/stores/feedingStore';
import { useInsightDismissStore } from '../../../src/stores/insightDismissStore';
import { generateUUID } from '../../../src/stores/createSyncedStore';
import { InsightToast } from '../../../src/shared/components/InsightToast';
import { FILTER_OPTIONS } from '../../../src/modules/insights/types';
import { VisualGuide } from '../../../src/modules/insights/components/VisualGuide';
import type { InsightCardData, QuickAction, FilterCategory, VisualGuide as VisualGuideData } from '../../../src/modules/insights/types';
import type { FeedingLog } from '../../../src/modules/feeding/types';
import { useDashboardData } from '../../../src/modules/dashboard/hooks/useDashboardData';
import { DAILY_PREP_CARDS, WEEKLY_DEVELOPMENT, BODY_CHANGES_BY_TRIMESTER } from '../../../src/modules/pregnancy/data/prepContent';

// ── Design tokens ────────────────────────────────────────────
const UI = {
  bg: '#F7F4F0',
  text: '#3D3D3D',
  textSecondary: '#5C5C5C',
  textMuted: '#8A8A8A',
  accent: '#8BA88E',
  card: '#FFFFFF',
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const BODY_CARD_WIDTH = SCREEN_WIDTH * 0.6;

const SOFT_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
};

// ── Magazine Card ────────────────────────────────────────────
// Shared card component for both pregnancy and postpartum feeds

interface MagazineCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label?: string;
  title: string;
  summary: string;
  accentColor: string;
  onPress: () => void;
}

function MagazineCard({ icon, iconColor, iconBg, label, title, summary, accentColor, onPress }: MagazineCardProps) {
  const [truncated, setTruncated] = useState(false);

  return (
    <Pressable style={[styles.magCard, SOFT_SHADOW]} onPress={onPress}>
      <View style={[styles.magAccent, { backgroundColor: accentColor }]} />
      <View style={styles.magContent}>
        <View style={styles.magTopRow}>
          <View style={[styles.magIconWrap, { backgroundColor: iconBg }]}>
            <Feather name={icon as any} size={18} color={iconColor} />
          </View>
          {label && (
            <Text style={[styles.magLabel, { color: accentColor }]}>{label}</Text>
          )}
        </View>
        <Text style={styles.magTitle}>{title}</Text>
        <Text
          style={styles.magSummary}
          numberOfLines={3}
          onTextLayout={(e) => setTruncated(e.nativeEvent.lines.length > 3)}
        >
          {summary}
        </Text>
        {truncated && (
          <View style={styles.magCta}>
            <Text style={[styles.magCtaText, { color: accentColor }]}>Read more</Text>
            <Feather name="arrow-right" size={14} color={accentColor} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ── AI Recommendations Engine ────────────────────────────────

interface Recommendation {
  id: string;
  icon: string;
  title: string;
  body: string;
  color: string;
  visualGuide?: VisualGuideData;
}

function generateRecommendations(
  babyName: string | null,
  babyAgeDays: number | null,
): Recommendation[] {
  const name = babyName || 'your baby';
  const ageDays = babyAgeDays ?? 0;
  const ageWeeks = Math.floor(ageDays / 7);
  const ageMonths = Math.floor(ageDays / 30.44);

  const recs: Recommendation[] = [];

  // Newborn (0–4 weeks)
  if (ageWeeks <= 4) {
    recs.push({
      id: 'contrast-cards',
      icon: 'eye',
      title: `Contrast card activity for ${name}`,
      body: `At ${ageWeeks} week${ageWeeks !== 1 ? 's' : ''}, ${name}'s vision is developing rapidly. High-contrast black & white cards held 8-12 inches away stimulate visual development. Try 2-3 minutes during alert periods.`,
      color: colors.primary[500],
      visualGuide: {
        type: 'video_link',
        media_url: 'https://placeholder.sprouty.app/videos/contrast-cards',
        action_text: 'Watch: Contrast card activity demo',
        thumbnail_icon: 'play-circle',
        duration_label: '2:00',
      },
    });
    recs.push({
      id: 'tummy-time',
      icon: 'activity',
      title: 'Start tummy time early',
      body: `Short tummy time sessions (1-2 minutes) on your chest count! This builds neck and core strength. Aim for 3-5 times per day during awake periods.`,
      color: colors.secondary[500],
      visualGuide: {
        type: 'step_by_step',
        media_url: 'https://placeholder.sprouty.app/guides/tummy-time',
        action_text: 'Tummy time technique',
        steps: [
          { step: 1, instruction: 'Place baby tummy-down on your chest or a firm surface', icon: 'user' },
          { step: 2, instruction: 'Get face-to-face — talk, sing, or use a toy at eye level', icon: 'smile' },
          { step: 3, instruction: 'Start with 1-2 minutes, build up gradually each day', icon: 'clock' },
        ],
      },
    });
  }

  // 1–3 months
  if (ageMonths >= 1 && ageMonths <= 3) {
    recs.push({
      id: 'social-smile',
      icon: 'smile',
      title: `Watch for ${name}'s social smile`,
      body: `Around 6-8 weeks, babies begin social smiling. Face-to-face interaction, singing, and talking help strengthen the bond. Mirror play is great at this age!`,
      color: colors.primary[500],
    });
    recs.push({
      id: 'sleep-routine',
      icon: 'moon',
      title: 'Building sleep associations',
      body: `Start introducing a simple bedtime routine: dim lights, quiet feeding, and a sleep sack. ${name}'s circadian rhythm is developing — consistency now pays off later.`,
      color: '#6B7DB3',
    });
  }

  // 3–6 months
  if (ageMonths >= 3 && ageMonths <= 6) {
    recs.push({
      id: 'reaching',
      icon: 'target',
      title: 'Encourage reaching & grasping',
      body: `${name} is ready for age-appropriate toys that encourage reaching. Soft rattles and crinkle toys help develop hand-eye coordination and fine motor skills.`,
      color: colors.primary[500],
    });
  }

  // 4–6 months
  if (ageMonths >= 4 && ageMonths <= 6) {
    recs.push({
      id: 'solids-readiness',
      icon: 'coffee',
      title: 'Signs of solid food readiness',
      body: `Watch for: sitting with support, interest in your food, loss of tongue-thrust reflex, and good head control. Most babies are ready between 4-6 months.`,
      color: colors.secondary[500],
    });
  }

  // Fallback for all ages
  if (recs.length === 0) {
    recs.push({
      id: 'general',
      icon: 'heart',
      title: `Personalized tips for ${name}`,
      body: `Log more data — feeds, sleep, diapers, and growth — to unlock personalized activity recommendations tailored to ${name}'s developmental stage.`,
      color: colors.primary[500],
    });
  }

  return recs;
}

// ── Main component ───────────────────────────────────────────

function getTrimester(week: number): 1 | 2 | 3 {
  if (week <= 13) return 1;
  if (week <= 27) return 2;
  return 3;
}

export default function InsightsScreen() {
  const router = useRouter();
  const { grouped, babyName, babyAgeDays, feedingMethod } = useInsightsData();
  const chartData = useInsightsChartData();
  const { isPregnant, gestationalInfo } = useDashboardData();
  useSeedData();

  const dismiss = useInsightDismissStore((s) => s.dismiss);
  const [chatInsight, setChatInsight] = useState<InsightCardData | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [filter, setFilter] = useState<FilterCategory>('all');

  const handleDiscuss = useCallback((insight: InsightCardData) => {
    setChatInsight(insight);
    setShowChat(true);
  }, []);

  const handleCloseChat = useCallback(() => {
    setShowChat(false);
  }, []);

  const handleDismiss = useCallback((contentHash: string) => {
    dismiss(contentHash);
  }, [dismiss]);

  const handleQuickAction = useCallback((action: QuickAction) => {
    const baby = useBabyStore.getState().getActiveBaby();
    if (!baby) return;
    const session = useAuthStore.getState().session;
    const loggedBy = session?.user?.id ?? '';

    if (action.type === 'log_diaper') {
      useDiaperStore.getState().quickLog(baby.id, baby.family_id, loggedBy, 'wet');
      setToastMsg('Wet diaper logged!');
      setShowToast(true);
    } else if (action.type === 'log_feed') {
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
        notes: null,
        baby_response: null,
        photo_url: null,
        created_at: now,
        updated_at: now,
      };
      useFeedingStore.getState().addItem(log);
      setToastMsg('Feed logged!');
      setShowToast(true);
    } else if (action.type === 'log_sleep') {
      router.push('/(app)/log/sleep');
    }
  }, [feedingMethod, router]);

  // Memoized filter application
  const { urgent, patterns, positive } = useMemo(() => {
    const apply = (cards: InsightCardData[]) => {
      if (filter === 'all') return cards;
      const opt = FILTER_OPTIONS.find((o) => o.key === filter);
      if (!opt || opt.tags.length === 0) return cards;
      return cards.filter((c) => opt.tags.includes(c.tag));
    };
    return {
      urgent: apply(grouped.urgent),
      patterns: apply(grouped.patterns),
      positive: apply(grouped.positive),
    };
  }, [filter, grouped]);

  const totalCards = urgent.length + patterns.length + positive.length;

  // AI Recommendations
  const recommendations = useMemo(
    () => generateRecommendations(babyName, babyAgeDays),
    [babyName, babyAgeDays],
  );

  // Navigate to article reader
  const openArticle = useCallback((params: {
    id: string;
    title: string;
    body: string;
    label?: string;
    icon?: string;
    accentColor?: string;
  }) => {
    router.push({
      pathname: '/(app)/article/[id]',
      params: {
        id: params.id,
        title: params.title,
        body: params.body,
        label: params.label ?? '',
        icon: params.icon ?? '',
        accentColor: params.accentColor ?? '',
      },
    });
  }, [router]);

  // ── Pregnancy mode ──
  if (isPregnant && gestationalInfo) {
    const week = gestationalInfo.week;
    const trimester = getTrimester(week);
    const devData = WEEKLY_DEVELOPMENT[week] ?? WEEKLY_DEVELOPMENT[40];
    const bodyChanges = BODY_CHANGES_BY_TRIMESTER[trimester];

    // Get tips around current week
    const relevantTips = DAILY_PREP_CARDS.filter(
      (t) => t.week >= week - 2 && t.week <= week + 2,
    ).slice(0, 4);

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO WEEK CARD ── */}
          <Pressable
            style={[styles.heroCard, SOFT_SHADOW]}
            onPress={() => openArticle({
              id: `dev-week-${week}`,
              title: `Baby's Development — Week ${week}`,
              body: devData.fullArticle,
              label: `Week ${week}`,
              icon: 'heart',
              accentColor: colors.secondary[500],
            })}
          >
            <View style={styles.heroLabelRow}>
              <View style={styles.heroPill}>
                <Feather name="heart" size={12} color={colors.secondary[600]} />
                <Text style={styles.heroPillText}>WEEK {week}</Text>
              </View>
              <Text style={styles.heroTrimester}>Trimester {trimester}</Text>
            </View>
            <Text style={styles.heroTitle}>Baby This Week</Text>
            <Text style={styles.heroBody}>{devData.summary}</Text>
            <View style={styles.heroFooter}>
              <Text style={styles.heroReadMore}>Read more</Text>
              <Feather name="arrow-right" size={14} color={colors.secondary[500]} />
            </View>
          </Pressable>

          {/* ── YOUR BODY — Horizontal Carousel ── */}
          <View style={styles.preSectionHeader}>
            <Feather name="activity" size={16} color={colors.primary[600]} />
            <Text style={styles.preSectionTitle}>Your Body This Trimester</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            decelerationRate="fast"
            snapToInterval={BODY_CARD_WIDTH + spacing.md}
          >
            {bodyChanges.map((change, i) => (
              <View
                key={i}
                style={[styles.bodyCard, SOFT_SHADOW]}
              >
                <View style={styles.bodyCardIcon}>
                  <Feather name="info" size={16} color={colors.primary[600]} />
                </View>
                <Text style={styles.bodyCardText}>{change}</Text>
              </View>
            ))}
          </ScrollView>

          {/* ── TIPS FOR YOU — Call-out Cards ── */}
          {relevantTips.length > 0 && (
            <>
              <View style={styles.preSectionHeader}>
                <Feather name="sun" size={16} color="#C4873E" />
                <Text style={styles.preSectionTitle}>Tips for You</Text>
              </View>

              {relevantTips.map((tip) => (
                <Pressable
                  key={tip.week}
                  style={[styles.tipCallout, SOFT_SHADOW]}
                  onPress={() => openArticle({
                    id: `tip-week-${tip.week}`,
                    title: tip.title,
                    body: tip.body,
                    label: `Week ${tip.week}`,
                    icon: 'sun',
                    accentColor: '#C4873E',
                  })}
                >
                  <View style={styles.tipCalloutAccent} />
                  <View style={styles.tipCalloutContent}>
                    <Text style={styles.tipCalloutLabel}>WEEK {tip.week}</Text>
                    <Text style={styles.tipCalloutTitle}>{tip.title}</Text>
                    <Text style={styles.tipCalloutBody} numberOfLines={2}>{tip.body}</Text>
                    <View style={styles.tipCalloutCta}>
                      <Text style={styles.tipCalloutCtaText}>Read more</Text>
                      <Feather name="arrow-right" size={13} color="#C4873E" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Postpartum mode ──
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Feather name="bar-chart-2" size={18} color={colors.textInverse} />
            </View>
            <View>
              <Text style={styles.title}>Insights</Text>
              <Text style={styles.subtitle}>Your baby's analytics dashboard</Text>
            </View>
          </View>
        </View>

        {/* ── AI Recommendations (magazine cards) ── */}
        <View style={styles.sectionHeader}>
          <Feather name="zap" size={15} color={UI.accent} />
          <Text style={styles.sectionTitle}>Personalized Insights & Activities</Text>
        </View>

        {recommendations.map((rec) => (
          <MagazineCard
            key={rec.id}
            icon={rec.icon}
            iconColor={rec.color}
            iconBg={rec.color + '15'}
            title={rec.title}
            summary={rec.body}
            accentColor={rec.color}
            onPress={() => openArticle({
              id: rec.id,
              title: rec.title,
              body: rec.body,
              icon: rec.icon,
              accentColor: rec.color,
            })}
          />
        ))}

        {/* ── CHART 1: Growth Percentile ── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Feather name="trending-up" size={16} color={UI.accent} />
            <Text style={styles.chartTitle}>Growth Percentile</Text>
          </View>
          <GrowthPercentileChart
            data={chartData.growth}
            hasData={chartData.hasGrowthData}
          />
        </View>

        {/* ── CHART 2: Nutrition / Milk Intake ── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Feather name="coffee" size={16} color={UI.accent} />
            <Text style={styles.chartTitle}>Daily Milk Intake</Text>
          </View>
          <NutritionChart
            data={chartData.nutrition}
            hasData={chartData.hasNutritionData}
            hasEstimated={chartData.hasEstimatedNutrition}
          />
        </View>

        {/* ── CHART 3: Sleep (24h Stacked) ── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Feather name="moon" size={16} color={UI.accent} />
            <Text style={styles.chartTitle}>Sleep (This Week)</Text>
          </View>
          <StackedSleepChart
            data={chartData.sleep}
            hasData={chartData.hasSleepData}
          />
        </View>

        {/* ── Insight Cards (from existing engine) ── */}
        <View style={styles.insightsSection}>
          <FilterChips selected={filter} onSelect={setFilter} />

          {totalCards === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="sunrise" size={40} color={colors.neutral[300]} />
              <Text style={styles.emptyTitle}>Insights are brewing</Text>
              <Text style={styles.emptyText}>
                Log more data to see personalized insights from Lumina.
              </Text>
            </View>
          ) : (
            <>
              {urgent.length > 0 && (
                <>
                  <SectionHeader
                    icon="alert-circle"
                    iconColor={colors.secondary[500]}
                    title="Needs Attention"
                    count={urgent.length}
                  />
                  {urgent.map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onDiscuss={handleDiscuss}
                      onQuickAction={handleQuickAction}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </>
              )}

              {patterns.length > 0 && (
                <>
                  <SectionHeader
                    icon="activity"
                    iconColor={colors.primary[500]}
                    title="Today's Patterns"
                    count={patterns.length}
                  />
                  {patterns.map((insight) => (
                    <CompactInsightCard
                      key={insight.id}
                      insight={insight}
                      onDiscuss={handleDiscuss}
                      onQuickAction={handleQuickAction}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </>
              )}

              {positive.length > 0 && (
                <>
                  <SectionHeader
                    icon="sun"
                    iconColor={colors.primary[400]}
                    title="Positive Notes"
                    count={positive.length}
                  />
                  {positive.map((insight) => (
                    <CompactInsightCard
                      key={insight.id}
                      insight={insight}
                      onDiscuss={handleDiscuss}
                      onQuickAction={handleQuickAction}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Chat Sheet */}
      <ChatSheet
        visible={showChat}
        onClose={handleCloseChat}
        insight={chatInsight}
        babyName={babyName}
        babyAgeDays={babyAgeDays}
        feedingMethod={feedingMethod}
      />

      {/* Quick action toast */}
      <InsightToast
        visible={showToast}
        title="Logged!"
        body={toastMsg}
        severity="info"
        onDismiss={() => setShowToast(false)}
        autoDismissMs={3000}
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.base,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: 1,
  },

  // ── Section headers (postpartum) ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: UI.text,
  },

  // ── Pregnancy Section Headers ──
  preSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
    marginBottom: spacing.base,
    paddingHorizontal: spacing.xs,
  },
  preSectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },

  // ── Hero Week Card ──
  heroCard: {
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.sm,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  heroPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary[700],
    letterSpacing: 0.8,
  },
  heroTrimester: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.secondary[400],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  heroBody: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-end',
    marginTop: spacing.lg,
  },
  heroReadMore: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.secondary[500],
  },

  // ── Body Carousel ──
  carouselContent: {
    paddingLeft: spacing.xs,
    paddingRight: spacing.base,
    paddingBottom: spacing.sm,
  },
  bodyCard: {
    width: BODY_CARD_WIDTH,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginRight: spacing.md,
    justifyContent: 'space-between',
    minHeight: 160,
  },
  bodyCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bodyCardText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    flex: 1,
  },
  bodyCardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    alignSelf: 'flex-end',
  },
  bodyCardCtaText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
  },

  // ── Tip Call-out Cards ──
  tipCallout: {
    flexDirection: 'row',
    backgroundColor: '#FFF9F3',
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  tipCalloutAccent: {
    width: 4,
    backgroundColor: '#E5A96D',
  },
  tipCalloutContent: {
    flex: 1,
    padding: spacing.lg,
  },
  tipCalloutLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#C4873E',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  tipCalloutTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tipCalloutBody: {
    fontSize: typography.fontSize.base,
    color: UI.textMuted,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  tipCalloutCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    alignSelf: 'flex-end',
  },
  tipCalloutCtaText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#C4873E',
  },

  // ── Magazine Cards ──
  magCard: {
    flexDirection: 'row',
    backgroundColor: UI.card,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  magAccent: {
    width: 4,
  },
  magContent: {
    flex: 1,
    padding: spacing.lg,
    paddingVertical: spacing.xl,
  },
  magTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  magIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  magLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  magTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: typography.fontSize.lg * typography.lineHeight.tight,
  },
  magSummary: {
    fontSize: typography.fontSize.base,
    color: UI.textMuted,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    marginBottom: spacing.md,
  },
  magCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-end',
  },
  magCtaText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },

  // ── Chart cards ──
  chartCard: {
    backgroundColor: UI.card,
    borderRadius: borderRadius['2xl'],
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    ...SOFT_SHADOW,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: UI.text,
    letterSpacing: 0.1,
  },

  // ── Insight cards section ──
  insightsSection: {
    marginTop: 8,
  },

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
});

// ============================================================
// Nodd — Insights Screen
// Grouped, categorized insight feed with pulse summary,
// filter chips, and differentiated card sizes
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { InsightCard } from '../../../src/modules/insights/components/InsightCard';
import { CompactInsightCard } from '../../../src/modules/insights/components/CompactInsightCard';
import { FilterChips } from '../../../src/modules/insights/components/FilterChips';
import { SectionHeader } from '../../../src/modules/insights/components/SectionHeader';
import { PulseCard } from '../../../src/modules/insights/components/PulseCard';
import { ChatSheet } from '../../../src/modules/insights/components/ChatSheet';
import { GrowthChartCard } from '../../../src/modules/growth/components/GrowthChartCard';
import { useInsightsData } from '../../../src/modules/insights/hooks/useInsightsData';
import { useGrowthSeedData } from '../../../src/modules/growth/hooks/useGrowthSeedData';
import { useSeedData } from '../../../src/data/useSeedData';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { useDiaperStore } from '../../../src/stores/diaperStore';
import { useFeedingStore } from '../../../src/stores/feedingStore';
import { useInsightDismissStore } from '../../../src/stores/insightDismissStore';
import { generateUUID } from '../../../src/stores/createSyncedStore';
import { InsightToast } from '../../../src/shared/components/InsightToast';
import { FILTER_OPTIONS } from '../../../src/modules/insights/types';
import type { InsightCardData, QuickAction, FilterCategory } from '../../../src/modules/insights/types';
import type { FeedingLog } from '../../../src/modules/feeding/types';

export default function InsightsScreen() {
  const router = useRouter();
  const { grouped, babyName, babyAgeDays, feedingMethod, growthLogs, baby } = useInsightsData();
  useGrowthSeedData();
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

  // Memoized filter application (per architect review I5)
  const { urgent, wellness, patterns, positive } = useMemo(() => {
    const apply = (cards: InsightCardData[]) => {
      if (filter === 'all') return cards;
      const opt = FILTER_OPTIONS.find((o) => o.key === filter);
      if (!opt || opt.tags.length === 0) return cards;
      return cards.filter((c) => opt.tags.includes(c.tag));
    };
    return {
      urgent: apply(grouped.urgent),
      wellness: apply(grouped.wellness),
      patterns: apply(grouped.patterns),
      positive: apply(grouped.positive),
    };
  }, [filter, grouped]);

  const totalCards = urgent.length + wellness.length + patterns.length + positive.length;
  const allCardsCount = grouped.urgent.length + grouped.wellness.length + grouped.patterns.length + grouped.positive.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.nurseIcon}>
              <Feather name="zap" size={18} color={colors.textInverse} />
            </View>
            <View>
              <Text style={styles.title}>Insights</Text>
              <Text style={styles.subtitle}>Your AI Nurse is watching over you</Text>
            </View>
          </View>
        </View>

        {/* Filter Chips */}
        <FilterChips selected={filter} onSelect={setFilter} />

        {/* Pulse — daily snapshot */}
        <View style={{ marginBottom: spacing.lg }}>
          <PulseCard pulse={grouped.pulse} />
        </View>

        {totalCards === 0 ? (
          /* No matching insights for current filter */
          <View style={styles.emptyState}>
            <Feather name={allCardsCount === 0 ? 'sunrise' : 'filter'} size={48} color={colors.neutral[300]} />
            <Text style={styles.emptyTitle}>
              {allCardsCount === 0 ? 'Insights are brewing' : 'No matching insights'}
            </Text>
            <Text style={styles.emptyText}>
              {allCardsCount === 0
                ? 'Start logging feeds, diapers, and sleep to receive personalized insights from your AI Nurse. The more data she has, the smarter her advice becomes.'
                : 'Try selecting a different category or tap "All" to see everything.'}
            </Text>
          </View>
        ) : (
          <>
            {/* Needs Attention — full cards */}
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

            {/* Your Wellness — full cards, separate section */}
            {wellness.length > 0 && (
              <>
                <SectionHeader
                  icon="heart"
                  iconColor="#E53935"
                  title="Your Wellness"
                  count={wellness.length}
                />
                {wellness.map((insight) => (
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

            {/* Today's Patterns — compact cards */}
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

            {/* Growth Tracker */}
            {growthLogs.length >= 2 && baby && (
              <>
                <SectionHeader
                  icon="trending-up"
                  iconColor={colors.success}
                  title="Growth Tracker"
                  count={growthLogs.length}
                />
                <GrowthChartCard />
              </>
            )}



          </>
        )}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nurseIcon: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
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

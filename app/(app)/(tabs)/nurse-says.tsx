// ============================================================
// Nodd — Nurse Says Tab
// Dedicated space for veteran nurse reference knowledge
// Daily nurse insight + filterable reference handbook
// ============================================================

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { InsightCard } from '../../../src/modules/insights/components/InsightCard';
import { CompactInsightCard } from '../../../src/modules/insights/components/CompactInsightCard';
import { FilterChips } from '../../../src/modules/insights/components/FilterChips';
import { SectionHeader } from '../../../src/modules/insights/components/SectionHeader';
import { ChatSheet } from '../../../src/modules/insights/components/ChatSheet';
import { useNurseSaysData } from '../../../src/modules/insights/hooks/useNurseSaysData';
import { useInsightDismissStore } from '../../../src/stores/insightDismissStore';
import type { InsightCardData, InsightTag } from '../../../src/modules/insights/types';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

type NurseFilterCategory = 'all' | 'feeding' | 'sleep' | 'health' | 'routine' | 'checkups';

const NURSE_FILTER_OPTIONS: { key: NurseFilterCategory; label: string; tags: InsightTag[] }[] = [
  { key: 'all', label: 'All', tags: [] },
  { key: 'feeding', label: 'Feeding', tags: ['feeding_insight'] },
  { key: 'sleep', label: 'Sleep', tags: ['sleep_alert'] },
  { key: 'health', label: 'Health', tags: ['health_pattern'] },
  { key: 'routine', label: 'Routine', tags: ['general'] },
  { key: 'checkups', label: 'Checkups', tags: ['health_pattern'] },
];

export default function NurseSaysScreen() {
  const { referenceCards, dailyNurseCard, babyName, babyAgeDays, feedingMethod } = useNurseSaysData();
  const dismiss = useInsightDismissStore((s) => s.dismiss);
  const [chatInsight, setChatInsight] = useState<InsightCardData | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [filter, setFilter] = useState<NurseFilterCategory>('all');

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

  // Apply filter to reference cards
  const filteredCards = filter === 'all'
    ? referenceCards
    : referenceCards.filter((c) => {
        const opt = NURSE_FILTER_OPTIONS.find((o) => o.key === filter);
        if (!opt || opt.tags.length === 0) return true;
        return opt.tags.includes(c.tag);
      });

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
              <Feather name="book-open" size={18} color={colors.textInverse} />
            </View>
            <View>
              <Text style={styles.title}>Nurse Says</Text>
              <Text style={styles.subtitle}>Expert knowledge at your fingertips</Text>
            </View>
          </View>
        </View>

        {/* Daily Nurse Insight — featured card */}
        {dailyNurseCard && (
          <>
            <SectionHeader
              icon="sun"
              iconColor={colors.secondary[500]}
              title="Today's Note"
              count={1}
            />
            <InsightCard
              insight={dailyNurseCard}
              onDiscuss={handleDiscuss}
              onDismiss={handleDismiss}
            />
          </>
        )}

        {/* Filter Chips */}
        <FilterChips
          selected={filter}
          onSelect={setFilter as (category: any) => void}
          options={NURSE_FILTER_OPTIONS}
        />

        {/* Reference Cards */}
        {filteredCards.length > 0 ? (
          <>
            <SectionHeader
              icon="book-open"
              iconColor={colors.primary[700]}
              title="Nurse's Handbook"
              count={filteredCards.length}
            />
            {filteredCards.map((insight) => (
              <CompactInsightCard
                key={insight.id}
                insight={insight}
                onDiscuss={handleDiscuss}
                onDismiss={handleDismiss}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="book-open" size={48} color={colors.neutral[300]} />
            <Text style={styles.emptyTitle}>No matching references</Text>
            <Text style={styles.emptyText}>
              Try selecting a different category or tap "All" to see everything.
            </Text>
          </View>
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

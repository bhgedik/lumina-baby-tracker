// ============================================================
// Lumina — Prep Checklist Tab (Pregnancy Mode)
// Premium category-first dashboard with AI-powered task detail
// ============================================================

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { ComponentProps } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated as RNAnimated,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { BottomSheet } from '../../../src/shared/components/BottomSheet';
import { usePrepChecklistStore } from '../../../src/stores/prepChecklistStore';
import { useDashboardData } from '../../../src/modules/dashboard/hooks/useDashboardData';
import { MAIN_CATEGORIES } from '../../../src/modules/pregnancy/data/prepContent';
import type { PrepSuggestion } from '../../../src/modules/pregnancy/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type IconName = ComponentProps<typeof Feather>['name'];

// Category metadata — icon, accent color, background tint, tagline
const CATEGORY_META: Record<string, { icon: IconName; color: string; bg: string; tagline: string }> = {
  'Safety':              { icon: 'shield',    color: '#2E7D32', bg: '#E8F5E9', tagline: 'Making your home a safe haven' },
  'Hospital Bag':        { icon: 'briefcase', color: colors.secondary[600], bg: colors.secondary[50], tagline: 'Everything you need, packed and ready' },
  'Diaper Station':      { icon: 'layers',    color: '#F57F17', bg: '#FFF8E1', tagline: 'Your command center for changes' },
  'Feeding Prep':        { icon: 'coffee',    color: '#5E35B1', bg: '#EDE7F6', tagline: 'Ready for every feed, day and night' },
  'Bath Time':           { icon: 'droplet',   color: '#0288D1', bg: '#E1F5FE', tagline: 'Gentle care for delicate skin' },
  'Postpartum Recovery': { icon: 'heart',     color: colors.secondary[500], bg: colors.secondary[50], tagline: 'Because your healing matters too' },
};
const DEFAULT_META = { icon: 'star' as IconName, color: colors.primary[600], bg: colors.primary[50], tagline: '' };

// ============================================================
// Main Screen
// ============================================================

export default function ChecklistScreen() {
  const { babyName, gestationalWeek, experienceLevel, feedingMethod } = useDashboardData();
  const {
    items, checkedIds, dismissedIds,
    isLoading, isSurpriseLoading, hasLoadedAI,
    loadAISuggestions, loadSurprise, toggleChecked, dismissItem,
  } = usePrepChecklistStore();

  // Load AI suggestions once
  useEffect(() => {
    if (!hasLoadedAI && gestationalWeek > 0) {
      loadAISuggestions({
        gestational_week: gestationalWeek,
        baby_name: babyName ?? undefined,
        experience_level: experienceLevel,
        feeding_method: feedingMethod,
      });
    }
  }, [hasLoadedAI, gestationalWeek, babyName, experienceLevel, feedingMethod, loadAISuggestions]);

  const safeItems = items ?? [];
  const safeCheckedIds = checkedIds ?? [];
  const safeDismissedIds = dismissedIds ?? [];

  // Navigation state — null = category dashboard, string = task list drill-down
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<PrepSuggestion | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Per-category: unchecked items, checked items, totals
  const categoryData = useMemo(() => {
    const data: Record<string, { unchecked: PrepSuggestion[]; checked: PrepSuggestion[]; total: number; completed: number }> = {};
    for (const cat of MAIN_CATEGORIES) {
      const catItems = safeItems.filter((i) => i.category === cat && !safeDismissedIds.includes(i.id));
      const checked = catItems.filter((i) => safeCheckedIds.includes(i.id));
      const unchecked = catItems.filter((i) => !safeCheckedIds.includes(i.id));
      data[cat] = { unchecked, checked, total: catItems.length, completed: checked.length };
    }
    return data;
  }, [safeItems, safeCheckedIds, safeDismissedIds]);

  // Overall progress across all categories
  const overallProgress = useMemo(() => {
    let total = 0, completed = 0;
    for (const cat of MAIN_CATEGORIES) {
      const d = categoryData[cat];
      if (d) { total += d.total; completed += d.completed; }
    }
    return { total, completed };
  }, [categoryData]);

  // Proactively load more when unchecked pool runs low
  const surpriseParams = useMemo(() => ({
    gestational_week: gestationalWeek,
    baby_name: babyName ?? undefined,
    experience_level: experienceLevel,
    feeding_method: feedingMethod,
  }), [gestationalWeek, babyName, experienceLevel, feedingMethod]);

  useEffect(() => {
    const totalUnchecked = Object.values(categoryData).reduce((sum, d) => sum + d.unchecked.length, 0);
    if (totalUnchecked < 6 && !isLoading && !isSurpriseLoading && safeItems.length > 0) {
      loadSurprise(surpriseParams);
    }
  }, [categoryData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const openCategory = useCallback((cat: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCategory(cat);
    setShowCompleted(false);
  }, []);

  const goBack = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCategory(null);
  }, []);

  const handleQuickCheck = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleChecked(id);
  }, [toggleChecked]);

  const handleComplete = useCallback((item: PrepSuggestion) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleChecked(item.id);
    setSelectedTask(null);
  }, [toggleChecked]);

  const handleDismiss = useCallback((item: PrepSuggestion) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    dismissItem(item.id);
    setSelectedTask(null);
  }, [dismissItem]);

  // ─── LEVEL 2: Task List (category drill-down) ─────────────
  if (activeCategory) {
    const meta = CATEGORY_META[activeCategory] ?? DEFAULT_META;
    const data = categoryData[activeCategory] ?? { unchecked: [], checked: [], total: 0, completed: 0 };

    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back navigation */}
          <Pressable style={styles.backRow} onPress={goBack} accessibilityLabel="Back to all categories">
            <Feather name="chevron-left" size={20} color={colors.textSecondary} />
            <Text style={styles.backText}>All Categories</Text>
          </Pressable>

          {/* Category header */}
          <View style={styles.catHeader}>
            <View style={[styles.catHeaderIcon, { backgroundColor: meta.bg }]}>
              <Feather name={meta.icon} size={24} color={meta.color} />
            </View>
            <View style={styles.catHeaderInfo}>
              <Text style={styles.catHeaderTitle}>{activeCategory}</Text>
              <Text style={styles.catHeaderCount}>
                {data.completed} of {data.total} completed
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.catProgressWrap}>
            <ProgressPill
              progress={data.completed / Math.max(1, data.total)}
              fillColor={meta.color}
              size="md"
            />
          </View>

          {/* Unchecked tasks */}
          {data.unchecked.length > 0 ? (
            <View style={styles.taskList}>
              {data.unchecked.map((item, index) => (
                <TaskCard
                  key={item.id}
                  item={item}
                  index={index}
                  accentColor={meta.color}
                  onPress={() => setSelectedTask(item)}
                  onQuickCheck={() => handleQuickCheck(item.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: meta.bg }]}>
                <Feather name="check-circle" size={28} color={meta.color} />
              </View>
              <Text style={styles.emptyTitle}>All done!</Text>
              <Text style={styles.emptySub}>
                {"You\u2019ve completed every task in " + activeCategory + "."}
              </Text>
            </View>
          )}

          {/* Completed (collapsible) */}
          {data.checked.length > 0 && (
            <View style={styles.completedSection}>
              <Pressable
                style={styles.completedToggle}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setShowCompleted(!showCompleted);
                }}
              >
                <Text style={styles.completedToggleText}>
                  Completed ({data.checked.length})
                </Text>
                <Feather
                  name={showCompleted ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textTertiary}
                />
              </Pressable>

              {showCompleted && data.checked.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.completedRow}
                  onPress={() => setSelectedTask(item)}
                >
                  <View style={styles.completedCheck}>
                    <Feather name="check" size={12} color={colors.textInverse} />
                  </View>
                  <Text style={styles.completedRowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Feather name="chevron-right" size={14} color={colors.neutral[300]} />
                </Pressable>
              ))}
            </View>
          )}

          {(isLoading || isSurpriseLoading) && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary[400]} />
              <Text style={styles.loadingText}>Discovering more tasks...</Text>
            </View>
          )}
        </ScrollView>

        {/* AI Consultation Detail */}
        <DetailSheet
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={handleComplete}
          onDismiss={handleDismiss}
        />
      </SafeAreaView>
    );
  }

  // ─── LEVEL 1: Category Dashboard ──────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your Prep Journey</Text>
        <Text style={styles.subtitle}>Expert guidance for every step</Text>

        {/* Overall progress card */}
        {overallProgress.total > 0 && (
          <View style={[styles.overallCard, shadows.sm]}>
            <View style={styles.overallTop}>
              <Text style={styles.overallLabel}>Overall Progress</Text>
              <Text style={styles.overallCount}>
                {overallProgress.completed}/{overallProgress.total}
              </Text>
            </View>
            <ProgressPill
              progress={overallProgress.completed / Math.max(1, overallProgress.total)}
              size="lg"
            />
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Setting up your prep plan...</Text>
          </View>
        )}

        {/* Category cards */}
        <View style={styles.catGrid}>
          {MAIN_CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat] ?? DEFAULT_META;
            const data = categoryData[cat] ?? { total: 0, completed: 0 };
            const isComplete = data.total > 0 && data.completed === data.total;

            return (
              <Pressable
                key={cat}
                style={[styles.catCard, shadows.sm]}
                onPress={() => openCategory(cat)}
                accessibilityRole="button"
                accessibilityLabel={`${cat}: ${data.completed} of ${data.total} completed`}
              >
                <View style={styles.catCardTop}>
                  <View style={[styles.catCardIcon, { backgroundColor: meta.bg }]}>
                    <Feather name={meta.icon} size={20} color={meta.color} />
                  </View>
                  {isComplete ? (
                    <View style={styles.catCardDone}>
                      <Feather name="check" size={12} color={colors.textInverse} />
                    </View>
                  ) : (
                    <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                  )}
                </View>

                <Text style={styles.catCardName}>{cat}</Text>
                <Text style={styles.catCardTagline} numberOfLines={1}>{meta.tagline}</Text>

                <View style={styles.catCardBottom}>
                  <View style={styles.catCardBarWrap}>
                    <ProgressPill
                      progress={data.completed / Math.max(1, data.total)}
                      fillColor={meta.color}
                      size="sm"
                    />
                  </View>
                  <Text style={[styles.catCardCount, { color: meta.color }]}>
                    {data.completed}/{data.total}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {isSurpriseLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary[300]} />
            <Text style={styles.loadingText}>Loading more tasks...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// Task Card — within category task list
// Circle = quick-check · Card body = open AI detail
// ============================================================

function TaskCard({
  item,
  index,
  accentColor,
  onPress,
  onQuickCheck,
}: {
  item: PrepSuggestion;
  index: number;
  accentColor: string;
  onPress: () => void;
  onQuickCheck: () => void;
}) {
  const opacity = useRef(new RNAnimated.Value(0)).current;
  const translateY = useRef(new RNAnimated.Value(10)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(10);
    RNAnimated.parallel([
      RNAnimated.timing(opacity, {
        toValue: 1,
        duration: 250,
        delay: index * 40,
        useNativeDriver: true,
      }),
      RNAnimated.timing(translateY, {
        toValue: 0,
        duration: 250,
        delay: index * 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <RNAnimated.View style={{ opacity, transform: [{ translateY }] }}>
      <View style={[styles.taskCard, shadows.sm]}>
        {/* Quick-check circle */}
        <Pressable
          onPress={onQuickCheck}
          style={[styles.taskCheck, { borderColor: accentColor }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Mark "${item.title}" complete`}
        />

        {/* Card body — opens detail */}
        <Pressable style={styles.taskBody} onPress={onPress}>
          <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.taskAiRow}>
            <Text style={styles.taskSparkle}>✨</Text>
            <Text style={styles.taskAiLabel}>View expert insights</Text>
            <Feather name="chevron-right" size={14} color={colors.textTertiary} />
          </View>
        </Pressable>
      </View>
    </RNAnimated.View>
  );
}

// ============================================================
// Progress Pill — premium bar with depth and shine
// ============================================================

const PILL_TRACK_COLOR = '#EDE8E1'; // soft warm beige inset

function ProgressPill({
  progress,
  fillColor = colors.primary[500],
  size = 'md',
}: {
  progress: number;
  fillColor?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const height = size === 'lg' ? 14 : size === 'md' ? 12 : 10;
  const radius = height / 2;
  const pct = Math.max(0, Math.min(100, progress * 100));

  return (
    <View style={[pillStyles.track, { height, borderRadius: radius }]}>
      {pct > 0 && (
        <View
          style={[
            pillStyles.fill,
            { width: `${pct}%`, backgroundColor: fillColor, borderRadius: radius },
          ]}
        >
          {/* Glossy highlight on top half for liquid depth */}
          <View style={[pillStyles.highlight, { borderRadius: radius }]} />
        </View>
      )}
    </View>
  );
}

const pillStyles = StyleSheet.create({
  track: {
    backgroundColor: PILL_TRACK_COLOR,
    overflow: 'hidden',
    // Subtle inner-shadow illusion via border
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  fill: {
    height: '100%',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});

// ============================================================
// Detail Sheet — the "AI Consultation" experience
// ============================================================

function DetailSheet({
  task,
  onClose,
  onComplete,
  onDismiss,
}: {
  task: PrepSuggestion | null;
  onClose: () => void;
  onComplete: (t: PrepSuggestion) => void;
  onDismiss: (t: PrepSuggestion) => void;
}) {
  const meta = task ? (CATEGORY_META[task.category] ?? DEFAULT_META) : DEFAULT_META;
  const isChecked = usePrepChecklistStore((s) => task ? s.checkedIds.includes(task.id) : false);

  return (
    <BottomSheet visible={task !== null} onClose={onClose}>
      {task && (
        <ScrollView
          style={styles.detailScroll}
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Category pill + AI badge */}
          <View style={styles.detailBadges}>
            <View style={[styles.detailCatPill, { backgroundColor: meta.bg }]}>
              <Feather name={meta.icon} size={12} color={meta.color} />
              <Text style={[styles.detailCatLabel, { color: meta.color }]}>
                {task.category}
              </Text>
            </View>
            <View style={styles.detailAiBadge}>
              <Text style={styles.detailAiIcon}>✨</Text>
              <Text style={styles.detailAiText}>
                {task.source === 'ai' ? 'AI Generated' : 'Expert Curated'}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.detailTitle}>{task.title}</Text>

          {/* Lumina's Take */}
          <View style={styles.detailSection}>
            <View style={styles.detailSectionHead}>
              <View style={[styles.detailSectionDot, { backgroundColor: colors.secondary[50] }]}>
                <Feather name="heart" size={16} color={colors.secondary[500]} />
              </View>
              <Text style={styles.detailSectionLabel}>
                {"Lumina\u2019s Take"}
              </Text>
            </View>
            <Text style={styles.detailSectionBody}>
              {task.nurseInsight || task.body}
            </Text>
          </View>

          {/* Your Action Plan */}
          {task.actionSteps && task.actionSteps.length > 0 && (
            <View style={styles.detailSection}>
              <View style={styles.detailSectionHead}>
                <View style={[styles.detailSectionDot, { backgroundColor: colors.primary[50] }]}>
                  <Feather name="clipboard" size={16} color={colors.primary[600]} />
                </View>
                <Text style={styles.detailSectionLabel}>Your Action Plan</Text>
              </View>
              <View style={styles.actionList}>
                {task.actionSteps.map((step, i) => (
                  <View key={i} style={styles.actionRow}>
                    <View style={styles.actionNum}>
                      <Text style={styles.actionNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.actionStepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Complete / Undo button */}
          <Pressable
            style={[styles.detailCTA, isChecked && styles.detailCTAUndo]}
            onPress={() => onComplete(task)}
          >
            <Feather
              name={isChecked ? 'rotate-ccw' : 'check-circle'}
              size={20}
              color={isChecked ? colors.textSecondary : colors.textInverse}
            />
            <Text style={[styles.detailCTAText, isChecked && styles.detailCTAUndoText]}>
              {isChecked ? 'Undo Completion' : 'Mark as Completed'}
            </Text>
          </Pressable>

          {/* Dismiss link */}
          {!isChecked && (
            <Pressable style={styles.detailDismiss} onPress={() => onDismiss(task)}>
              <Text style={styles.detailDismissText}>Not relevant to me</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.xl, paddingBottom: 120 },

  // ─── Header ─────────────────────────────────────────────
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  // ─── Overall Progress Card ──────────────────────────────
  overallCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  overallTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  overallLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  overallCount: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },

  // ─── Category Grid (Level 1) ───────────────────────────
  catGrid: {
    gap: spacing.md,
  },
  catCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    gap: spacing.xs,
  },
  catCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  catCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catCardDone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  catCardName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  catCardTagline: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  catCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  catCardBarWrap: {
    flex: 1,
  },
  catCardCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    minWidth: 34,
    textAlign: 'right',
  },

  // ─── Category Drill-Down Header (Level 2) ──────────────
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  backText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  catHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catHeaderInfo: {
    flex: 1,
  },
  catHeaderTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  catHeaderCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  catProgressWrap: {
    marginBottom: spacing.xl,
  },

  // ─── Task List ────────────────────────────────────────
  taskList: {
    gap: spacing.md,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    gap: spacing.md,
  },
  taskCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
  },
  taskBody: {
    flex: 1,
    gap: spacing.xs,
  },
  taskTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  taskAiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  taskSparkle: { fontSize: 12 },
  taskAiLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontWeight: typography.fontWeight.medium,
  },

  // ─── Empty State ──────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ─── Completed Section ────────────────────────────────
  completedSection: {
    marginTop: spacing.xl,
  },
  completedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  completedToggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textTertiary,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
  },
  completedCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedRowTitle: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },

  // ─── Loading ──────────────────────────────────────────
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },

  // ─── Detail Sheet (Level 3) ───────────────────────────
  detailScroll: { maxHeight: 520 },
  detailContent: { paddingBottom: spacing.xl, gap: spacing.base },

  detailBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailCatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  detailCatLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  detailAiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.full,
  },
  detailAiIcon: { fontSize: 11 },
  detailAiText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },

  detailTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
  },

  detailSection: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    gap: spacing.md,
  },
  detailSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailSectionDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailSectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailSectionBody: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },

  actionList: { gap: spacing.md },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  actionNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  actionNumText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  actionStepText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },

  detailCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    ...shadows.md,
  },
  detailCTAUndo: {
    backgroundColor: colors.neutral[100],
    shadowOpacity: 0,
    elevation: 0,
  },
  detailCTAText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  detailCTAUndoText: {
    color: colors.textSecondary,
  },
  detailDismiss: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  detailDismissText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    fontWeight: typography.fontWeight.medium,
  },
});

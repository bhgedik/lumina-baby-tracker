// ============================================================
// Nodd — Prep Checklist Tab (Pregnancy Mode)
// Claymorphism design system
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
import { Image as RNImage } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../src/shared/constants/theme';

// 3D Clay category icons
const catIcons: Record<string, any> = {
  'Safety':              require('../../../assets/illustrations/checklist-safety.png'),
  'Hospital Bag':        require('../../../assets/illustrations/checklist-hospital.png'),
  'Diaper Station':      require('../../../assets/illustrations/checklist-diaper.png'),
  'Feeding Prep':        require('../../../assets/illustrations/checklist-feeding.png'),
  'Bath Time':           require('../../../assets/illustrations/checklist-bath.png'),
  'Postpartum Recovery': require('../../../assets/illustrations/checklist-recovery.png'),
};
import { BottomSheet } from '../../../src/shared/components/BottomSheet';
import { usePrepChecklistStore } from '../../../src/stores/prepChecklistStore';
import { useDashboardData } from '../../../src/modules/dashboard/hooks/useDashboardData';
import { MAIN_CATEGORIES } from '../../../src/modules/pregnancy/data/prepContent';
import type { PrepSuggestion } from '../../../src/modules/pregnancy/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type IconName = ComponentProps<typeof Feather>['name'];

// ─── Claymorphism Design Tokens ─────────────────────────────
const CLAY_BG = '#F7F4F0';

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

const CLAY_CARD = {
  backgroundColor: '#FFFFFF' as const,
  borderRadius: 24,
  ...CLAY_SHADOW,
  ...CLAY_INNER,
};

const CLAY_PRESSED = {
  transform: [{ scale: 0.98 }] as const,
  shadowOpacity: 0.04,
};

// Category metadata — icon, accent color, background tint, tagline
const CATEGORY_META: Record<string, { icon: IconName; color: string; bg: string; tagline: string }> = {
  'Safety':              { icon: 'shield',    color: '#A78BBA', bg: '#F3EDF7', tagline: 'Making your home a safe haven' },
  'Hospital Bag':        { icon: 'briefcase', color: '#A78BBA', bg: '#FEE8DC', tagline: 'Everything you need, packed and ready' },
  'Diaper Station':      { icon: 'layers',    color: '#A78BBA', bg: '#FFF3D6', tagline: 'Your command center for changes' },
  'Feeding Prep':        { icon: 'coffee',    color: '#A78BBA', bg: '#E8DDF3', tagline: 'Ready for every feed, day and night' },
  'Bath Time':           { icon: 'droplet',   color: '#A78BBA', bg: '#DCE8F8', tagline: 'Gentle care for delicate skin' },
  'Postpartum Recovery': { icon: 'heart',     color: '#A78BBA', bg: '#F8E0E6', tagline: 'Because your healing matters too' },
};
const DEFAULT_META = { icon: 'star' as IconName, color: '#A78BBA', bg: '#F3EDF7', tagline: '' };

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
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back navigation */}
          <Pressable
            style={({ pressed }) => [styles.backRow, pressed && { opacity: 0.7 }]}
            onPress={goBack}
            accessibilityLabel="Back to all categories"
          >
            <Feather name="chevron-left" size={20} color="#8A8A8A" />
            <Text style={styles.backText}>All Categories</Text>
          </Pressable>

          {/* Category header */}
          <View style={styles.catHeader}>
            <View style={[styles.catHeaderIcon, { backgroundColor: meta.bg }, CLAY_INNER]}>
              {catIcons[activeCategory] ? (
                <RNImage source={catIcons[activeCategory]} style={styles.catIconImg} resizeMode="contain" />
              ) : (
                <Feather name={meta.icon} size={24} color={meta.color} />
              )}
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
              <View style={[styles.emptyIcon, { backgroundColor: meta.bg }, CLAY_SHADOW, CLAY_INNER]}>
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
                <Text style={styles.sectionHeader}>
                  COMPLETED ({data.checked.length})
                </Text>
                <Feather
                  name={showCompleted ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#8E8A9F"
                />
              </Pressable>

              {showCompleted && data.checked.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.completedRow,
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => setSelectedTask(item)}
                >
                  <View style={styles.completedCheck}>
                    <Feather name="check" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={styles.completedRowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Feather name="chevron-right" size={14} color="#D1D1D1" />
                </Pressable>
              ))}
            </View>
          )}

          {(isLoading || isSurpriseLoading) && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#A78BBA" />
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your Prep Journey</Text>
        <Text style={styles.subtitle}>Expert guidance for every step</Text>

        {/* Overall progress card */}
        {overallProgress.total > 0 && (
          <View style={styles.overallCard}>
            <View style={styles.overallTop}>
              <Text style={styles.overallLabel}>OVERALL PROGRESS</Text>
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
            <ActivityIndicator size="small" color="#A78BBA" />
            <Text style={styles.loadingText}>Setting up your prep plan...</Text>
          </View>
        )}

        {/* Section header */}
        <Text style={styles.sectionHeader}>CATEGORIES</Text>

        {/* Category cards — row layout matching clay list items */}
        <View style={styles.catGrid}>
          {MAIN_CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat] ?? DEFAULT_META;
            const data = categoryData[cat] ?? { total: 0, completed: 0 };
            const isComplete = data.total > 0 && data.completed === data.total;
            const icon = catIcons[cat];

            return (
              <Pressable
                key={cat}
                style={({ pressed }) => [
                  styles.catCard,
                  pressed && styles.catCardPressed,
                ]}
                onPress={() => openCategory(cat)}
                accessibilityRole="button"
                accessibilityLabel={`${cat}: ${data.completed} of ${data.total} completed`}
              >
                <View style={styles.catCardRow}>
                  <View style={[styles.catCardIcon, { backgroundColor: meta.bg }]}>
                    {icon ? (
                      <RNImage source={icon} style={styles.catIconImg} resizeMode="contain" />
                    ) : (
                      <Feather name={meta.icon} size={22} color={meta.color} />
                    )}
                  </View>
                  <View style={styles.catCardContent}>
                    <Text style={styles.catCardName}>{cat}</Text>
                    <Text style={styles.catCardTagline} numberOfLines={1}>{meta.tagline}</Text>
                    <View style={styles.catCardBottom}>
                      <View style={styles.catCardBarWrap}>
                        <ProgressPill
                          progress={data.completed / Math.max(1, data.total)}
                          size="sm"
                        />
                      </View>
                      <Text style={styles.catCardCount}>
                        {data.completed}/{data.total}
                      </Text>
                    </View>
                  </View>
                  {isComplete ? (
                    <View style={styles.catCardDone}>
                      <Feather name="check" size={12} color="#FFFFFF" />
                    </View>
                  ) : (
                    <Feather name="chevron-right" size={20} color="#C5C0D0" />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {isSurpriseLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#A78BBA" />
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
      <View style={styles.taskCard}>
        {/* Quick-check circle */}
        <Pressable
          onPress={onQuickCheck}
          style={[styles.taskCheck, { borderColor: '#A78BBA' }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Mark "${item.title}" complete`}
        />

        {/* Card body — opens detail */}
        <Pressable
          style={({ pressed }) => [styles.taskBody, pressed && { opacity: 0.7 }]}
          onPress={onPress}
        >
          <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.taskAiRow}>
            <Text style={styles.taskSparkle}>✨</Text>
            <Text style={styles.taskAiLabel}>View expert insights</Text>
            <Feather name="chevron-right" size={14} color="#D1D1D1" />
          </View>
        </Pressable>
      </View>
    </RNAnimated.View>
  );
}

// ============================================================
// Progress Pill — clay-style bar with depth and shine
// ============================================================

const PILL_TRACK_COLOR = '#EDE8E1';

function ProgressPill({
  progress,
  fillColor = '#A78BBA',
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

          {/* Expert's Take */}
          <View style={styles.detailSection}>
            <View style={styles.detailSectionHead}>
              <View style={[styles.detailSectionDot, { backgroundColor: '#FFF0E6' }]}>
                <Feather name="heart" size={16} color="#D4845A" />
              </View>
              <Text style={styles.detailSectionLabel}>
                {"Expert\u2019s Take"}
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
                <View style={[styles.detailSectionDot, { backgroundColor: '#F3EDF7' }]}>
                  <Feather name="clipboard" size={16} color="#A78BBA" />
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
            style={({ pressed }) => [
              styles.detailCTA,
              isChecked && styles.detailCTAUndo,
              pressed && { transform: [{ scale: 0.98 }], shadowOpacity: 0.04 },
            ]}
            onPress={() => onComplete(task)}
          >
            <Feather
              name={isChecked ? 'rotate-ccw' : 'check-circle'}
              size={20}
              color={isChecked ? '#8A8A8A' : '#FFFFFF'}
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
// Styles — Claymorphism Design System
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CLAY_BG },
  scrollContent: { padding: 24, paddingBottom: 120 },

  // ─── Header ─────────────────────────────────────────────
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#3D3D3D',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8A8A8A',
    marginBottom: 24,
  },

  // ─── Section Headers ──────────────────────────────────────
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8A9F',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
    marginTop: 8,
  },

  // ─── Overall Progress Card ──────────────────────────────
  overallCard: {
    ...CLAY_CARD,
    padding: 20,
    marginBottom: 24,
  },
  overallTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overallLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8A9F',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  overallCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#A78BBA',
  },

  // ─── Category Grid (Level 1) — row layout ─────────────
  catGrid: {
    gap: 12,
  },
  catCard: {
    ...CLAY_CARD,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  catCardPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.04,
  },
  catCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  catCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    ...CLAY_INNER,
  },
  catIconImg: {
    width: 40,
    height: 40,
  },
  catCardContent: {
    flex: 1,
    gap: 2,
  },
  catCardDone: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#A78BBA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2A26',
  },
  catCardTagline: {
    fontSize: 13,
    color: '#8A8A8A',
  },
  catCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  catCardBarWrap: {
    flex: 1,
  },
  catCardCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A78BBA',
    minWidth: 34,
    textAlign: 'right',
  },

  // ─── Category Drill-Down Header (Level 2) ──────────────
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  backText: {
    fontSize: 14,
    color: '#8A8A8A',
    fontWeight: '600',
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2A26',
  },
  catHeaderCount: {
    fontSize: 13,
    color: '#8A8A8A',
    marginTop: 2,
  },
  catProgressWrap: {
    marginBottom: 24,
  },

  // ─── Task List ────────────────────────────────────────
  taskList: {
    gap: 14,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    ...CLAY_CARD,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  taskCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
  },
  taskBody: {
    flex: 1,
    gap: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2A26',
    lineHeight: 22,
  },
  taskAiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskSparkle: { fontSize: 12 },
  taskAiLabel: {
    fontSize: 13,
    color: '#8A8A8A',
    fontWeight: '500',
  },

  // ─── Empty State ──────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 14,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2A26',
  },
  emptySub: {
    fontSize: 16,
    color: '#8A8A8A',
    textAlign: 'center',
  },

  // ─── Completed Section ────────────────────────────────
  completedSection: {
    marginTop: 28,
  },
  completedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  completedCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#A78BBA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedRowTitle: {
    flex: 1,
    fontSize: 14,
    color: '#8A8A8A',
  },

  // ─── Loading ──────────────────────────────────────────
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#8A8A8A',
  },

  // ─── Detail Sheet (Level 3) ───────────────────────────
  detailScroll: { maxHeight: 520 },
  detailContent: { paddingBottom: 24, gap: 18 },

  detailBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailCatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  detailCatLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailAiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F7F4F0',
    borderRadius: 100,
  },
  detailAiIcon: { fontSize: 11 },
  detailAiText: {
    fontSize: 12,
    color: '#8A8A8A',
    fontWeight: '500',
  },

  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2A26',
    lineHeight: 28,
  },

  detailSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  detailSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailSectionDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8A9F',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  detailSectionBody: {
    fontSize: 16,
    color: '#8A8A8A',
    lineHeight: 24,
  },

  actionList: { gap: 14 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  actionNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#A78BBA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  actionNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionStepText: {
    flex: 1,
    fontSize: 16,
    color: '#8A8A8A',
    lineHeight: 24,
  },

  detailCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#A78BBA',
    borderRadius: 100,
    paddingVertical: 16,
    ...CLAY_SHADOW,
  },
  detailCTAUndo: {
    backgroundColor: '#F7F4F0',
    shadowOpacity: 0,
    elevation: 0,
    ...CLAY_INNER,
  },
  detailCTAText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailCTAUndoText: {
    color: '#8A8A8A',
  },
  detailDismiss: {
    alignSelf: 'center',
    paddingVertical: 10,
  },
  detailDismissText: {
    fontSize: 14,
    color: '#8A8A8A',
    fontWeight: '500',
  },
});

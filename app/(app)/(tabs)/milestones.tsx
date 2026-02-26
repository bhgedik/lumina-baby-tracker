// ============================================================
// Nodd — Milestones Screen
// "Pofidik" (soft/plush) gamified milestone timeline
// Anxiety-free: no "failed" states, no red, no stress
// Ultra-rounded cloud cards with bouncy micro-interactions
// ============================================================

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useMilestoneStore } from '../../../src/stores/milestoneStore';
import { useCorrectedAge } from '../../../src/modules/baby/hooks/useCorrectedAge';
import { MILESTONES, DOMAIN_ICONS, DOMAIN_LABELS } from '../../../src/modules/milestones/data/definitions';
import type { MilestoneDef } from '../../../src/modules/milestones/data/definitions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

// ── Mini SVG badge icons for celebrated milestones ──

function LeafBadge({ size = 20, color = '#8EBA9B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M8 1 Q13 4 14 8 Q13 12 8 15 Q3 12 2 8 Q3 4 8 1 Z"
        fill={color}
      />
      <Path d="M8 4 L8 12" stroke="rgba(255,255,255,0.5)" strokeWidth={0.8} strokeLinecap="round" />
    </Svg>
  );
}

function SparkleBadge({ size = 20, color = '#D4B96A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z"
        fill={color}
      />
    </Svg>
  );
}

// ── Confetti particle for celebrate effect ──

const CONFETTI_COLORS = ['#8EBA9B', '#B3D1BC', '#D4B96A', '#E8D19A', '#D4A088', '#F5E6D0'];

interface ConfettiPiece {
  x: number;
  y: number;
  color: string;
  size: number;
}

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: 14 }, () => ({
    x: (Math.random() - 0.5) * 180,
    y: -(40 + Math.random() * 100),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 5 + Math.random() * 6,
  }));
}

// ── Milestone card state ──

type CardState = 'future' | 'current' | 'celebrated';

function getCardState(
  milestone: MilestoneDef,
  effectiveAgeMonths: number,
  isCelebrated: boolean,
): CardState {
  if (isCelebrated) return 'celebrated';
  if (effectiveAgeMonths >= milestone.expectedStartMonth) return 'current';
  return 'future';
}

// ── Single Milestone Card ──

function MilestoneCard({
  milestone,
  state,
  isLast,
  onCelebrate,
}: {
  milestone: MilestoneDef;
  state: CardState;
  isLast: boolean;
  onCelebrate: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiPieces = useRef(generateConfetti()).current;
  const confettiAnims = useRef(confettiPieces.map(() => new Animated.Value(0))).current;

  // Gentle pulse for current cards
  useEffect(() => {
    if (state === 'current') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [state, glowAnim]);

  const toggleExpand = useCallback(() => {
    if (state === 'future') return;

    const toExpanded = !expanded;
    setExpanded(toExpanded);

    // Bouncy spring expand
    Animated.spring(expandAnim, {
      toValue: toExpanded ? 1 : 0,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start();

    // Scale bounce
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [expanded, state, expandAnim, scaleAnim]);

  const handleCelebrate = useCallback(() => {
    // Trigger confetti
    setShowConfetti(true);
    confettiAnims.forEach((a) => a.setValue(0));

    const anims = confettiAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 800 + Math.random() * 400,
        delay: i * 30,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    Animated.parallel(anims).start(() => {
      setShowConfetti(false);
    });

    // Bounce the card
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.03,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 180,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    onCelebrate(milestone.id);
  }, [milestone.id, onCelebrate, confettiAnims, scaleAnim]);

  const domainInfo = DOMAIN_ICONS[milestone.domain];
  const domainLabel = DOMAIN_LABELS[milestone.domain];

  // Animated height for expansion
  const maxHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  });
  const expandOpacity = expandAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });

  // Glow border for current cards
  const borderColor = state === 'current'
    ? glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.primary[200], colors.primary[400]],
      })
    : state === 'celebrated'
      ? colors.primary[300]
      : colors.neutral[100];

  const cardOpacity = state === 'future' ? 0.5 : 1;

  return (
    <View style={styles.cardRow}>
      {/* Timeline connector */}
      <View style={styles.timelineColumn}>
        <View
          style={[
            styles.timelineDot,
            state === 'current' && styles.timelineDotCurrent,
            state === 'celebrated' && styles.timelineDotCelebrated,
          ]}
        >
          {state === 'celebrated' && (
            <Feather name="check" size={10} color={colors.textInverse} />
          )}
        </View>
        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              state === 'celebrated' && styles.timelineLineCelebrated,
            ]}
          />
        )}
      </View>

      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          shadows.soft,
          { transform: [{ scale: scaleAnim }], opacity: cardOpacity },
        ]}
      >
        <Animated.View
          style={[
            styles.cardBorder,
            { borderColor: borderColor as any },
            state === 'current' && styles.cardBorderCurrent,
          ]}
        >
          <Pressable onPress={toggleExpand} disabled={state === 'future'}>
            {/* Card header */}
            <View style={styles.cardHeader}>
              {/* Domain icon */}
              <View style={[styles.domainBadge, { backgroundColor: domainInfo.bg }]}>
                {state === 'celebrated' ? (
                  <LeafBadge size={18} color={domainInfo.color} />
                ) : (
                  <Feather name={domainInfo.icon as any} size={16} color={domainInfo.color} />
                )}
              </View>

              <View style={styles.cardTitleWrap}>
                <Text style={[styles.cardTitle, state === 'future' && styles.cardTitleFuture]}>
                  {milestone.title}
                </Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.domainText}>{domainLabel}</Text>
                  <Text style={styles.ageRange}>
                    {milestone.expectedStartMonth}–{milestone.expectedEndMonth} mo
                  </Text>
                </View>
              </View>

              {/* State indicator */}
              {state === 'celebrated' && (
                <View style={styles.celebratedBadge}>
                  <SparkleBadge size={16} color="#D4B96A" />
                </View>
              )}
              {state === 'current' && (
                <Feather name="chevron-down" size={18} color={colors.primary[400]} />
              )}
              {state === 'future' && (
                <Feather name="lock" size={14} color={colors.neutral[300]} />
              )}
            </View>

            {/* Description preview */}
            {state !== 'future' && !expanded && (
              <Text style={styles.descriptionPreview} numberOfLines={2}>
                {milestone.description}
              </Text>
            )}
          </Pressable>

          {/* Expandable content */}
          <Animated.View style={[styles.expandable, { maxHeight, opacity: expandOpacity }]}>
            <View style={styles.expandContent}>
              {/* Full description */}
              <Text style={styles.descriptionFull}>{milestone.description}</Text>

              {/* Nurse tip */}
              <View style={styles.nurseTipCard}>
                <View style={styles.nurseTipHeader}>
                  <Feather name="heart" size={13} color={colors.primary[600]} />
                  <Text style={styles.nurseTipLabel}>Nurse's Tip</Text>
                </View>
                <Text style={styles.nurseTipText}>{milestone.nurseTip}</Text>
              </View>

              {/* Celebrate button (only for current, uncelebrated) */}
              {state === 'current' && (
                <Pressable
                  style={[styles.celebrateButton, shadows.sm]}
                  onPress={handleCelebrate}
                >
                  <Feather name="star" size={18} color={colors.textInverse} />
                  <Text style={styles.celebrateText}>We saw this!</Text>
                </Pressable>
              )}

              {/* Celebrated date */}
              {state === 'celebrated' && (
                <View style={styles.celebratedRow}>
                  <SparkleBadge size={16} color="#D4B96A" />
                  <Text style={styles.celebratedText}>Celebrated</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Confetti overlay */}
          {showConfetti && (
            <View style={styles.confettiContainer} pointerEvents="none">
              {confettiPieces.map((piece, i) => {
                const progress = confettiAnims[i];
                const translateX = progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, piece.x],
                });
                const translateY = progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, piece.y],
                });
                const opacity = progress.interpolate({
                  inputRange: [0, 0.2, 0.7, 1],
                  outputRange: [0, 1, 1, 0],
                });
                const scale = progress.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0, 1.2, 0.6],
                });

                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.confettiPiece,
                      {
                        backgroundColor: piece.color,
                        width: piece.size,
                        height: piece.size,
                        borderRadius: piece.size / 2,
                        transform: [{ translateX }, { translateY }, { scale }],
                        opacity,
                      },
                    ]}
                  />
                );
              })}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ── Main Screen ──

export default function MilestonesScreen() {
  const baby = useBabyStore((s) => s.getActiveBaby());
  const age = useCorrectedAge(baby);
  const { celebrated, celebrate, hydrate } = useMilestoneStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const effectiveAgeMonths = age?.effectiveAgeMonths ?? 0;

  // Filter and sort milestones: celebrated first, then current, then future
  const sortedMilestones = useMemo(() => {
    return [...MILESTONES].sort((a, b) => {
      const stateA = getCardState(a, effectiveAgeMonths, a.id in celebrated);
      const stateB = getCardState(b, effectiveAgeMonths, b.id in celebrated);

      const priority: Record<CardState, number> = { celebrated: 0, current: 1, future: 2 };
      if (priority[stateA] !== priority[stateB]) {
        return priority[stateA] - priority[stateB];
      }
      return a.expectedStartMonth - b.expectedStartMonth;
    });
  }, [effectiveAgeMonths, celebrated]);

  const handleCelebrate = useCallback((milestoneId: string) => {
    celebrate(milestoneId);
  }, [celebrate]);

  const celebratedCount = Object.keys(celebrated).length;

  const ageDisplay = age?.forDisplay?.primary ?? '';
  const isPreterm = age?.isPreterm ?? false;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Milestones</Text>
          {ageDisplay ? (
            <Text style={styles.ageLabel}>
              {ageDisplay}{isPreterm ? ' (corrected)' : ''}
            </Text>
          ) : null}
        </View>

        {/* Progress summary */}
        <View style={[styles.summaryCard, shadows.soft]}>
          <View style={styles.summaryIconWrap}>
            <Feather name="award" size={24} color={colors.primary[600]} />
          </View>
          <View style={styles.summaryTextWrap}>
            <Text style={styles.summaryTitle}>
              {celebratedCount === 0
                ? 'Your journey begins here'
                : `${celebratedCount} milestone${celebratedCount === 1 ? '' : 's'} celebrated`
              }
            </Text>
            <Text style={styles.summaryBody}>
              {celebratedCount === 0
                ? 'Tap any active milestone when you see it happen. No rush — every baby has their own pace.'
                : 'Every baby grows at their own beautiful pace. Keep going!'
              }
            </Text>
          </View>
        </View>

        {/* Milestone timeline */}
        <View style={styles.timelineSection}>
          {sortedMilestones.map((milestone, index) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              state={getCardState(milestone, effectiveAgeMonths, milestone.id in celebrated)}
              isLast={index === sortedMilestones.length - 1}
              onCelebrate={handleCelebrate}
            />
          ))}
        </View>

        {/* Footer encouragement */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Remember: developmental ranges are wide and normal.{'\n'}
            Your baby is exactly where they need to be.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
  },

  // Header
  header: {
    marginBottom: spacing.lg,
  },
  screenTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  ageLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },

  // Summary card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['3xl'],
    padding: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  summaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  summaryBody: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },

  // Timeline section
  timelineSection: {
    paddingLeft: spacing.xs,
  },

  // Card row (timeline dot + card)
  cardRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },

  // Timeline connector
  timelineColumn: {
    width: 28,
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.neutral[200],
    borderWidth: 2,
    borderColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotCurrent: {
    backgroundColor: colors.primary[400],
    borderColor: colors.primary[200],
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  timelineDotCelebrated: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[300],
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.neutral[200],
    marginTop: spacing.xs,
  },
  timelineLineCelebrated: {
    backgroundColor: colors.primary[300],
  },

  // Card
  card: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardBorder: {
    borderWidth: 2,
    borderColor: colors.neutral[100],
    borderRadius: borderRadius['3xl'],
    backgroundColor: colors.surface,
    padding: spacing.base,
    overflow: 'hidden',
  },
  cardBorderCurrent: {
    borderWidth: 2,
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  domainBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  cardTitleFuture: {
    color: colors.textTertiary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  domainText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontWeight: typography.fontWeight.medium,
  },
  ageRange: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  celebratedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Description
  descriptionPreview: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    marginTop: spacing.sm,
  },

  // Expandable content
  expandable: {
    overflow: 'hidden',
  },
  expandContent: {
    paddingTop: spacing.md,
  },
  descriptionFull: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    marginBottom: spacing.base,
  },

  // Nurse tip
  nurseTipCard: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  nurseTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  nurseTipLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  nurseTipText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },

  // Celebrate button
  celebrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  celebrateText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },

  // Celebrated row
  celebratedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  celebratedText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#8B6914',
  },

  // Confetti
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiPiece: {
    position: 'absolute',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  footerText: {
    fontFamily: SERIF_FONT,
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
});

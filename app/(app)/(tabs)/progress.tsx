// ============================================================
// Nodd — Progress Screen
// Weekly micro-milestone focus — newsletter-style, anxiety-free
// Shows only what matters THIS week with actionable observation
// prompts instead of a long timeline of locked future milestones
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
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useMilestoneStore } from '../../../src/stores/milestoneStore';
import { useCorrectedAge } from '../../../src/modules/baby/hooks/useCorrectedAge';
import { MILESTONES, DOMAIN_ICONS } from '../../../src/modules/milestones/data/definitions';
import type { MilestoneDef } from '../../../src/modules/milestones/data/definitions';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

// ── Mini SVG badge icons ──

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

// ── Confetti system ──

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

// ── MicroMilestoneCard ──

function MicroMilestoneCard({
  milestone,
  babyName,
  onCelebrate,
}: {
  milestone: MilestoneDef;
  babyName: string;
  onCelebrate: (id: string) => void;
}) {
  const [tipExpanded, setTipExpanded] = useState(false);
  const tipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [showConfetti, setShowConfetti] = useState(false);
  const confettiPieces = useRef(generateConfetti()).current;
  const confettiAnims = useRef(confettiPieces.map(() => new Animated.Value(0))).current;

  const domainInfo = DOMAIN_ICONS[milestone.domain];
  const prompt = milestone.observationPrompt.replace(/\{babyName\}/g, babyName);

  const toggleTip = useCallback(() => {
    const toExpanded = !tipExpanded;
    setTipExpanded(toExpanded);
    Animated.spring(tipAnim, {
      toValue: toExpanded ? 1 : 0,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [tipExpanded, tipAnim]);

  const handleCelebrate = useCallback(() => {
    setShowConfetti(true);
    confettiAnims.forEach((a) => a.setValue(0));
    Animated.parallel(
      confettiAnims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 800 + Math.random() * 400,
          delay: i * 30,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    ).start(() => setShowConfetti(false));
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.03, duration: 120, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 180, friction: 8, useNativeDriver: true }),
    ]).start();
    onCelebrate(milestone.id);
  }, [milestone.id, onCelebrate, confettiAnims, scaleAnim]);

  const tipMaxHeight = tipAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 300] });
  const tipOpacity = tipAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0, 1] });
  const tipChevronRotate = tipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <Animated.View style={[styles.microCard, shadows.soft, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.microCardBorder, { borderLeftColor: domainInfo.color }]}>
        {/* Header row: icon + title + celebrate circle */}
        <View style={styles.microCardHeader}>
          <View style={[styles.domainBadge, { backgroundColor: domainInfo.bg }]}>
            <Feather name={domainInfo.icon as any} size={16} color={domainInfo.color} />
          </View>
          <Text style={styles.microCardTitle}>{milestone.title}</Text>
          <Pressable onPress={handleCelebrate} hitSlop={8}>
            <View style={styles.celebrateCircle}>
              <View style={styles.celebrateCircleInner} />
            </View>
          </Pressable>
        </View>

        {/* Observation prompt */}
        <Text style={styles.observationPrompt}>{prompt}</Text>

        {/* Lumina's Tip — collapsible */}
        <Pressable onPress={toggleTip} style={styles.tipToggle}>
          <Feather name="heart" size={13} color={colors.primary[600]} />
          <Text style={styles.tipToggleLabel}>Lumina's Tip</Text>
          <Animated.View style={{ transform: [{ rotate: tipChevronRotate }] }}>
            <Feather name="chevron-down" size={14} color={colors.primary[400]} />
          </Animated.View>
        </Pressable>

        <Animated.View style={{ maxHeight: tipMaxHeight, opacity: tipOpacity, overflow: 'hidden' }}>
          <View style={styles.nurseTipCard}>
            <Text style={styles.nurseTipText}>{milestone.nurseTip}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Confetti overlay */}
      {showConfetti && (
        <View style={styles.confettiContainer} pointerEvents="none">
          {confettiPieces.map((piece, i) => {
            const progress = confettiAnims[i];
            return (
              <Animated.View
                key={i}
                style={[styles.confettiPiece, {
                  backgroundColor: piece.color,
                  width: piece.size,
                  height: piece.size,
                  borderRadius: piece.size / 2,
                  transform: [
                    { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.x] }) },
                    { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.y] }) },
                    { scale: progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1.2, 0.6] }) },
                  ],
                  opacity: progress.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 1, 1, 0] }),
                }]}
              />
            );
          })}
        </View>
      )}
    </Animated.View>
  );
}

// ── Past Celebrations Accordion ──

function PastCelebrations({
  milestones,
}: {
  milestones: MilestoneDef[];
}) {
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const chevronRotate = expandAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const contentMaxHeight = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, milestones.length * 52 + 16] });
  const contentOpacity = expandAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0, 1] });

  const toggle = useCallback(() => {
    const toExpanded = !expanded;
    setExpanded(toExpanded);
    Animated.spring(expandAnim, {
      toValue: toExpanded ? 1 : 0,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [expanded, expandAnim]);

  return (
    <View style={[styles.pastCard, shadows.soft]}>
      <Pressable onPress={toggle} style={styles.pastHeader}>
        <SparkleBadge size={16} color="#D4B96A" />
        <Text style={styles.pastHeaderText}>Past Celebrations ({milestones.length})</Text>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Feather name="chevron-down" size={18} color={colors.textTertiary} />
        </Animated.View>
      </Pressable>

      <Animated.View style={{ maxHeight: contentMaxHeight, opacity: contentOpacity, overflow: 'hidden' }}>
        <View style={styles.pastList}>
          {milestones.map((m) => (
            <View key={m.id} style={styles.pastRow}>
              <View style={styles.pastCheckWrap}>
                <Feather name="check" size={14} color={colors.primary[500]} />
              </View>
              <Text style={styles.pastRowTitle} numberOfLines={1}>{m.title}</Text>
              <Text style={styles.pastRowWeek}>Week {m.targetWeek}</Text>
              <SparkleBadge size={12} color="#D4B96A" />
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// ── Main Screen ──

export default function ProgressScreen() {
  const baby = useBabyStore((s) => s.getActiveBaby());
  const age = useCorrectedAge(baby);
  const { celebrated, celebrate, hydrate } = useMilestoneStore();
  useEffect(() => { hydrate(); }, [hydrate]);

  const babyName = baby?.name ?? 'your baby';
  const effectiveAgeWeeks = Math.floor((age?.effectiveAgeDays ?? 0) / 7);

  // This week's milestones: in range AND not celebrated
  const thisWeekMilestones = useMemo(() => {
    return MILESTONES.filter((m) => {
      const startWeek = Math.floor(m.expectedStartMonth * 4.33);
      const endWeek = Math.ceil(m.expectedEndMonth * 4.33);
      return effectiveAgeWeeks >= startWeek && effectiveAgeWeeks <= endWeek
        && !(m.id in celebrated);
    }).sort((a, b) => a.targetWeek - b.targetWeek);
  }, [effectiveAgeWeeks, celebrated]);

  // Past celebrations
  const celebratedMilestones = useMemo(() => {
    return MILESTONES
      .filter((m) => m.id in celebrated)
      .sort((a, b) => a.targetWeek - b.targetWeek);
  }, [celebrated]);

  const handleCelebrate = useCallback((milestoneId: string) => {
    celebrate(milestoneId);
  }, [celebrate]);

  const ageDisplay = age?.forDisplay?.primary ?? '';
  const isPreterm = age?.isPreterm ?? false;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Feather name="trending-up" size={18} color={colors.textInverse} />
            </View>
            <View>
              <Text style={styles.screenTitle}>Progress</Text>
              {ageDisplay ? <Text style={styles.ageLabel}>{ageDisplay}{isPreterm ? ' (corrected)' : ''}</Text> : null}
            </View>
          </View>
        </View>

        {/* Hero: Week X — What to Watch For */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Week {effectiveAgeWeeks}</Text>
          <Text style={styles.heroSubtitle}>What to Watch For</Text>
        </View>

        {/* This week's milestones or "all caught up" */}
        {thisWeekMilestones.length === 0 ? (
          <View style={[styles.caughtUpCard, shadows.soft]}>
            <LeafBadge size={28} color={colors.primary[400]} />
            <Text style={styles.caughtUpTitle}>All caught up!</Text>
            <Text style={styles.caughtUpBody}>
              No new milestones to watch for this week. Enjoy the moment — {babyName} is doing great.
            </Text>
          </View>
        ) : (
          <View style={styles.milestoneList}>
            {thisWeekMilestones.map((m) => (
              <MicroMilestoneCard
                key={m.id}
                milestone={m}
                babyName={babyName}
                onCelebrate={handleCelebrate}
              />
            ))}
          </View>
        )}

        {/* Past Celebrations */}
        {celebratedMilestones.length > 0 && (
          <PastCelebrations milestones={celebratedMilestones} />
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Remember: developmental ranges are wide and normal.{'\n'}Your baby is exactly where they need to be.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Layout ──
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.base, paddingTop: spacing.base },

  // ── Header ──
  header: { marginBottom: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary[500], justifyContent: 'center', alignItems: 'center', ...shadows.sm },
  screenTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  ageLabel: { fontSize: typography.fontSize.sm, color: colors.primary[600], fontWeight: typography.fontWeight.medium, marginTop: 1 },

  // ── Hero section ──
  heroSection: { marginBottom: spacing.lg },
  heroTitle: { fontFamily: SERIF_FONT, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  heroSubtitle: { fontSize: typography.fontSize.base, color: colors.textSecondary, marginTop: spacing.xs },

  // ── Caught up card ──
  caughtUpCard: { backgroundColor: colors.surface, borderRadius: borderRadius['2xl'], padding: spacing.xl, alignItems: 'center', marginBottom: spacing['2xl'], gap: spacing.sm },
  caughtUpTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
  caughtUpBody: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed },

  // ── Milestone list ──
  milestoneList: { gap: spacing.base, marginBottom: spacing['2xl'] },

  // ── MicroMilestoneCard ──
  microCard: { borderRadius: borderRadius['2xl'], backgroundColor: colors.surface, overflow: 'hidden' },
  microCardBorder: { borderLeftWidth: 4, borderLeftColor: colors.primary[400], padding: spacing.base },
  microCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  domainBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  microCardTitle: { flex: 1, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
  celebrateCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.primary[300], alignItems: 'center', justifyContent: 'center' },
  celebrateCircleInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary[100] },
  observationPrompt: { fontSize: typography.fontSize.sm, color: colors.textSecondary, lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed, marginTop: spacing.md, fontStyle: 'italic' },
  tipToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md, paddingVertical: spacing.xs },
  tipToggleLabel: { flex: 1, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.primary[700] },
  nurseTipCard: { backgroundColor: colors.primary[50], borderRadius: borderRadius.xl, padding: spacing.md, marginTop: spacing.sm },
  nurseTipText: { fontSize: typography.fontSize.sm, color: colors.primary[700], lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed },

  // ── Past Celebrations ──
  pastCard: { backgroundColor: colors.surface, borderRadius: borderRadius['2xl'], overflow: 'hidden', marginBottom: spacing['2xl'] },
  pastHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.base },
  pastHeaderText: { flex: 1, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
  pastList: { paddingHorizontal: spacing.base, paddingBottom: spacing.base },
  pastRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral[100] },
  pastCheckWrap: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  pastRowTitle: { flex: 1, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.textPrimary },
  pastRowWeek: { fontSize: typography.fontSize.xs, color: colors.textTertiary },

  // ── Confetti ──
  confettiContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  confettiPiece: { position: 'absolute' },

  // ── Footer ──
  footer: { alignItems: 'center', paddingVertical: spacing['2xl'], paddingHorizontal: spacing.xl },
  footerText: { fontFamily: SERIF_FONT, fontSize: typography.fontSize.sm, fontStyle: 'italic', color: colors.textTertiary, textAlign: 'center', lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed },
});

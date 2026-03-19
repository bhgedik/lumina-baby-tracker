// ============================================================
// Nodd — Progress Screen
// "Open the Box" — Lovevery-inspired developmental journey
// Each period is a sealed gift box that parents unwrap when
// baby reaches that age. Creates anticipation & joy, not anxiety.
// Sources: CDC 2022, WHO MGRS, AAP, Pathways.org, Harvard CCDC
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/shared/constants/theme';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useMilestoneStore } from '../../../src/stores/milestoneStore';
import { useCorrectedAge } from '../../../src/modules/baby/hooks/useCorrectedAge';
import {
  MILESTONES,
  PERIODS,
  DOMAIN_ICONS,
} from '../../../src/modules/milestones/data/definitions';
import type { MilestoneDef, DevelopmentalPeriod } from '../../../src/modules/milestones/data/definitions';

// ── Confetti (used for box opening + milestone celebration) ──

const CONFETTI_COLORS = ['#B199CE', '#D4C4E8', '#7C9A8E', '#A08060', '#F49770', '#EDE8E2'];

function generateConfetti(count = 20) {
  return Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 240,
    y: -(60 + Math.random() * 140),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 5 + Math.random() * 7,
  }));
}

// ── Helpers ──

type PeriodStatus = 'past' | 'current' | 'upcoming';

function getPeriodStatus(period: DevelopmentalPeriod, ageWeeks: number): PeriodStatus {
  if (ageWeeks >= period.endWeek) return 'past';
  if (ageWeeks >= period.startWeek) return 'current';
  return 'upcoming';
}

function getMilestonesForPeriod(period: DevelopmentalPeriod): MilestoneDef[] {
  return MILESTONES.filter((m) => {
    return m.targetWeek >= period.startWeek && m.targetWeek < period.endWeek;
  }).sort((a, b) => a.targetWeek - b.targetWeek);
}

function formatAchievedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Milestone Card (inside an opened box) ──

interface CelebratedEntry {
  achievedDate: string;
  notes: string | null;
}

function MilestoneCard({
  milestone,
  babyName,
  isCelebrated,
  celebratedEntry,
  onCelebrate,
  onUncelebrate,
}: {
  milestone: MilestoneDef;
  babyName: string;
  isCelebrated: boolean;
  celebratedEntry?: CelebratedEntry;
  onCelebrate: (id: string) => void;
  onUncelebrate: (id: string) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiPieces = useRef(generateConfetti(12)).current;
  const confettiAnims = useRef(confettiPieces.map(() => new Animated.Value(0))).current;

  const domainInfo = DOMAIN_ICONS[milestone.domain];
  const prompt = milestone.observationPrompt.replace(/\{babyName\}/g, babyName);

  const handleCelebrate = useCallback(() => {
    if (isCelebrated) {
      onUncelebrate(milestone.id);
      return;
    }
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
  }, [milestone.id, isCelebrated, onCelebrate, onUncelebrate, confettiAnims, scaleAnim]);

  return (
    <Animated.View
      style={[styles.milestoneCard, { transform: [{ scale: scaleAnim }] }]}
    >
      {/* Header: icon + title */}
      <View style={styles.cardHeader}>
        <View style={[styles.domainBadge, { backgroundColor: '#F7F4F0', borderWidth: 1, borderColor: '#EDE8E2' }]}>
          <Feather name={domainInfo.icon as any} size={16} color={domainInfo.color} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {milestone.title}
        </Text>
      </View>

      {/* Body text */}
      <Text style={styles.observationPrompt}>{prompt}</Text>

      {/* Lumina's Tip — inline, no heavy box */}
      <View style={styles.nurseTipRow}>
        <Text style={styles.nurseTipText}>
          <Text style={styles.nurseTipLabel}>{'✨ Lumina\u2019s Tip: '}</Text>
          {milestone.nurseTip}
        </Text>
      </View>

      {/* CTA */}
      {isCelebrated ? (
        <Pressable onPress={handleCelebrate} style={styles.achievedRow}>
          <Feather name="check-circle" size={16} color="#7C9A8E" />
          <Text style={styles.achievedText}>
            Noticed{celebratedEntry?.achievedDate
              ? ` on ${formatAchievedDate(celebratedEntry.achievedDate)}`
              : ''}
          </Text>
          <Text style={styles.undoText}>Undo</Text>
        </Pressable>
      ) : (
        <Pressable onPress={handleCelebrate} style={styles.celebrateButton}>
          <Feather name="check" size={14} color="#FFFFFF" />
          <Text style={styles.celebrateButtonText}>Mark as Achieved</Text>
        </Pressable>
      )}

      {/* Confetti burst */}
      {showConfetti && (
        <View style={styles.confettiContainer} pointerEvents="none">
          {confettiPieces.map((piece, i) => (
            <Animated.View
              key={i}
              style={[styles.confettiPiece, {
                backgroundColor: piece.color,
                width: piece.size,
                height: piece.size,
                borderRadius: piece.size / 2,
                transform: [
                  { translateX: confettiAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, piece.x] }) },
                  { translateY: confettiAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, piece.y] }) },
                  { scale: confettiAnims[i].interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1.2, 0.6] }) },
                ],
                opacity: confettiAnims[i].interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 1, 1, 0] }),
              }]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

// ── Sealed Chapter (future period — locked, minimal) ──

function SealedChapter({ period }: { period: DevelopmentalPeriod }) {
  return (
    <View style={styles.sealedChapter}>
      <View style={styles.sealedLeft}>
        <View style={styles.sealedNode} />
        <View style={styles.sealedLine} />
      </View>
      <View style={styles.sealedContent}>
        <Text style={styles.sealedTitle}>{period.title}</Text>
        <Text style={styles.sealedSubtitle}>{period.subtitle}</Text>
      </View>
      <Feather name="lock" size={14} color="#A08060" />
    </View>
  );
}

// ── Ready Chapter (current period, not yet opened — reveal CTA) ──

function ReadyChapter({
  period,
  milestoneCount,
  onOpen,
}: {
  period: DevelopmentalPeriod;
  milestoneCount: number;
  onOpen: () => void;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.01, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => { pulse.stop(); };
  }, [pulseAnim]);

  return (
    <View style={styles.readyChapter}>
      {/* Editorial header */}
      <Text style={styles.chapterTitle}>{period.title}</Text>
      <Text style={styles.chapterSubtitle}>{period.subtitle}</Text>

      {/* Reveal CTA card */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable onPress={onOpen} style={styles.readyCta}>
          <View style={styles.readyCtaIcon}>
            <Feather name="gift" size={22} color="#7C9A8E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.readyCtaText}>
              Discover {milestoneCount} new moments
            </Text>
            <Text style={styles.readyCtaHint}>Tap to reveal this chapter</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#A08060" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── Timeline Chapter (editorial timeline — no accordion boxes) ──

function TimelineChapter({
  period,
  status,
  milestones,
  celebrated,
  babyName,
  onCelebrate,
  onUncelebrate,
  justOpened,
}: {
  period: DevelopmentalPeriod;
  status: PeriodStatus;
  milestones: MilestoneDef[];
  celebrated: Record<string, CelebratedEntry>;
  babyName: string;
  onCelebrate: (id: string) => void;
  onUncelebrate: (id: string) => void;
  justOpened: boolean;
}) {
  const celebratedCount = milestones.filter((m) => m.id in celebrated).length;
  const isPast = status === 'past';

  // Reveal animation for cards when box is just opened
  const revealAnims = useRef(milestones.map(() => new Animated.Value(justOpened ? 0 : 1))).current;
  const [showBoxConfetti, setShowBoxConfetti] = useState(justOpened);
  const boxConfetti = useRef(generateConfetti(24)).current;
  const boxConfettiAnims = useRef(boxConfetti.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!justOpened) return;

    // Fire confetti
    boxConfettiAnims.forEach((a) => a.setValue(0));
    Animated.parallel(
      boxConfettiAnims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000 + Math.random() * 500,
          delay: i * 25,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    ).start(() => setShowBoxConfetti(false));

    // Stagger reveal cards
    Animated.stagger(
      80,
      revealAnims.map((anim) =>
        Animated.spring(anim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ),
    ).start();
  }, [justOpened, revealAnims, boxConfettiAnims]);

  return (
    <View style={styles.chapterContainer}>
      {/* ── Editorial Chapter Header ── */}
      <View style={styles.chapterHeader}>
        <Text style={styles.chapterTitle}>{period.title}</Text>
        <View style={styles.chapterMeta}>
          <Text style={styles.chapterSubtitle}>{period.subtitle}</Text>
          {celebratedCount > 0 && (
            <View style={styles.chapterBadge}>
              <Text style={styles.chapterBadgeText}>
                {celebratedCount}/{milestones.length}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Reassurance — current period only ── */}
      {!isPast && period.reassurance && (
        <Text style={styles.chapterReassurance}>{period.reassurance}</Text>
      )}

      {/* ── Timeline with milestone cards ── */}
      <View style={styles.timelineContainer}>
        {milestones.map((m, i) => {
          const anim = revealAnims[i] ?? new Animated.Value(1);
          const isCelebrated = m.id in celebrated;
          const isLast = i === milestones.length - 1;

          return (
            <Animated.View
              key={m.id}
              style={{
                opacity: anim,
                transform: [
                  { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
                  { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                ],
              }}
            >
              <View style={styles.timelineRow}>
                {/* Left: line + node */}
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineNode,
                    isCelebrated && styles.timelineNodeCelebrated,
                  ]}>
                    {isCelebrated && (
                      <Feather name="check" size={8} color="#FFFFFF" />
                    )}
                  </View>
                  {!isLast && <View style={styles.timelineLine} />}
                </View>

                {/* Right: milestone card */}
                <View style={styles.timelineCardWrapper}>
                  <MilestoneCard
                    milestone={m}
                    babyName={babyName}
                    isCelebrated={isCelebrated}
                    celebratedEntry={celebrated[m.id]}
                    onCelebrate={onCelebrate}
                    onUncelebrate={onUncelebrate}
                  />
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* Box-open confetti */}
      {showBoxConfetti && (
        <View style={styles.boxConfettiContainer} pointerEvents="none">
          {boxConfetti.map((piece, i) => (
            <Animated.View
              key={i}
              style={[styles.confettiPiece, {
                backgroundColor: piece.color,
                width: piece.size,
                height: piece.size,
                borderRadius: piece.size / 2,
                transform: [
                  { translateX: boxConfettiAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, piece.x] }) },
                  { translateY: boxConfettiAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, piece.y] }) },
                  { scale: boxConfettiAnims[i].interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1.4, 0.5] }) },
                ],
                opacity: boxConfettiAnims[i].interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
              }]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main Screen ──

export default function ProgressScreen() {
  const baby = useBabyStore((s) => s.getActiveBaby());
  const age = useCorrectedAge(baby);
  const { celebrated, openedBoxes, celebrate, uncelebrate, openBox, hydrate } = useMilestoneStore();
  useEffect(() => { hydrate(); }, [hydrate]);

  const babyName = baby?.name?.trim() || 'Baby';
  const effectiveAgeWeeks = Math.floor((age?.effectiveAgeDays ?? 0) / 7);
  const ageDisplay = age?.forDisplay?.primary ?? '';
  const isPreterm = age?.isPreterm ?? false;

  // Track which box was just opened this session (for animation)
  const [justOpenedId, setJustOpenedId] = useState<string | null>(null);

  const handleOpenBox = useCallback((periodId: string) => {
    openBox(periodId);
    setJustOpenedId(periodId);
    // Clear "just opened" flag after animations finish
    setTimeout(() => setJustOpenedId(null), 2000);
  }, [openBox]);

  const handleCelebrate = useCallback((milestoneId: string) => {
    celebrate(milestoneId);
  }, [celebrate]);

  const handleUncelebrate = useCallback((milestoneId: string) => {
    uncelebrate(milestoneId);
  }, [uncelebrate]);

  const totalCelebrated = useMemo(() => Object.keys(celebrated).length, [celebrated]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header — editorial style */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>{babyName}'s Milestones</Text>
          <View style={styles.headerMeta}>
            {ageDisplay ? (
              <Text style={styles.ageLabel}>{ageDisplay}{isPreterm ? ' (corrected)' : ''}</Text>
            ) : null}
            {totalCelebrated > 0 && (
              <Text style={styles.celebrationSummaryText}>
                {' · '}{totalCelebrated} moment{totalCelebrated !== 1 ? 's' : ''} noticed
              </Text>
            )}
          </View>
        </View>

        {/* Boxes */}
        {PERIODS.map((period) => {
          const status = getPeriodStatus(period, effectiveAgeWeeks);
          const milestones = getMilestonesForPeriod(period);
          const isOpened = period.id in openedBoxes;

          // Past periods are auto-opened
          const effectivelyOpened = status === 'past' || isOpened;

          if (status === 'upcoming') {
            return <SealedChapter key={period.id} period={period} />;
          }

          if (status === 'current' && !isOpened) {
            return (
              <ReadyChapter
                key={period.id}
                period={period}
                milestoneCount={milestones.length}
                onOpen={() => handleOpenBox(period.id)}
              />
            );
          }

          return (
            <TimelineChapter
              key={period.id}
              period={period}
              status={status}
              milestones={milestones}
              celebrated={celebrated}
              babyName={babyName}
              onCelebrate={handleCelebrate}
              onUncelebrate={handleUncelebrate}
              justOpened={justOpenedId === period.id}
            />
          );
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Every baby unfolds at their own pace.{'\n'}
            {babyName} is right on time.
          </Text>
          <Text style={styles.footerSource}>
            Based on CDC 2022, WHO, AAP & Pathways.org
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4F0' },
  scrollContent: { paddingHorizontal: spacing.base, paddingTop: spacing.base },

  // Header — editorial
  header: { marginBottom: spacing.xl, paddingTop: spacing.sm },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D2A26',
    letterSpacing: -0.5,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ageLabel: {
    fontSize: typography.fontSize.base,
    color: '#A08060',
    fontWeight: typography.fontWeight.medium,
  },
  celebrationSummaryText: {
    fontSize: typography.fontSize.base,
    color: '#7B5EA7',
    fontWeight: typography.fontWeight.medium,
  },

  // ── Editorial Chapter Header ──
  chapterContainer: {
    marginBottom: spacing.xl,
  },
  chapterHeader: {
    marginBottom: spacing.sm,
  },
  chapterTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2D2A26',
    letterSpacing: -0.3,
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  chapterSubtitle: {
    fontSize: typography.fontSize.base,
    color: '#A08060',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  chapterBadge: {
    backgroundColor: '#F7F4F0',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 22,
  },
  chapterBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: '#7B5EA7',
  },
  chapterReassurance: {
    fontSize: typography.fontSize.base,
    color: '#A08060',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    marginBottom: spacing.md,
  },

  // ── Timeline ──
  timelineContainer: {
    marginTop: spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeft: {
    width: 28,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#B199CE',
    marginTop: 22,
    zIndex: 1,
  },
  timelineNodeCelebrated: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7C9A8E',
    borderColor: '#7C9A8E',
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#EDE8E2',
    marginTop: -1,
  },
  timelineCardWrapper: {
    flex: 1,
    paddingBottom: spacing.base,
  },

  // ── Sealed Chapter (future, locked) ──
  sealedChapter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    opacity: 0.55,
    paddingVertical: spacing.sm,
  },
  sealedLeft: {
    width: 28,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  sealedNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F7F4F0',
    borderWidth: 2,
    borderColor: '#EDE8E2',
  },
  sealedLine: {
    width: 2,
    height: 24,
    backgroundColor: '#EDE8E2',
    marginTop: 4,
  },
  sealedContent: {
    flex: 1,
  },
  sealedTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: '#A08060',
  },
  sealedSubtitle: {
    fontSize: typography.fontSize.sm,
    color: '#A08060',
    marginTop: 2,
  },

  // ── Ready Chapter (current, not yet revealed) ──
  readyChapter: {
    marginBottom: spacing.xl,
  },
  readyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.md,
    shadowColor: '#B0A090',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  readyCtaIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F7F4F0',
    alignItems: 'center', justifyContent: 'center',
  },
  readyCtaText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#2D2A26',
  },
  readyCtaHint: {
    fontSize: typography.fontSize.sm,
    color: '#A08060',
    marginTop: 2,
  },

  // Milestone card — premium floating journal card
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#B0A090',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  domainBadge: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2A26',
  },
  observationPrompt: {
    fontSize: 15,
    color: '#5C5C5C',
    lineHeight: 22,
    marginTop: spacing.md,
  },

  // Lumina's Tip — inline, light
  nurseTipRow: {
    marginTop: spacing.md,
  },
  nurseTipLabel: {
    fontWeight: '700',
    color: '#7B5EA7',
  },
  nurseTipText: {
    fontSize: 14,
    color: '#A08060',
    lineHeight: 20,
  },

  // CTA — refined pill, left-aligned
  celebrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: spacing.lg,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#7C9A8E',
    borderRadius: 22,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  celebrateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  achievedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#E8F0ED',
    borderRadius: 22,
  },
  achievedText: {
    fontSize: 14,
    color: '#7C9A8E',
    fontWeight: '500',
  },
  undoText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '500',
    marginLeft: 4,
  },

  // Confetti (milestone-level)
  confettiContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  confettiPiece: { position: 'absolute' },

  // Confetti (box-level)
  boxConfettiContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    top: 0,
    overflow: 'visible',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.base,
    fontWeight: '400',
    color: '#A08060',
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  footerSource: {
    fontSize: typography.fontSize.sm,
    color: '#C0B8A8',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

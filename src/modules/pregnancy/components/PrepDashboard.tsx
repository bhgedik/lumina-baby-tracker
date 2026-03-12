// ============================================================
// Lumina — Prep Dashboard (Pregnancy Home View)
// Flo-inspired editorial layout: ring + baby size + rich tips
// Checklist has moved to its own dedicated tab
// ============================================================

import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import { DAILY_PREP_CARDS, BABY_SIZE_BY_WEEK } from '../data/prepContent';
import { ProgressRing } from './ProgressRing';
import { PregnancyInsightsGrid } from './PregnancyInsightsGrid';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

interface PrepDashboardProps {
  babyName: string;
  dueDate: string; // ISO YYYY-MM-DD
  gestationalInfo: {
    week: number;
    dayOfWeek: number;
    progress: number;
  };
  onBabyArrivedPress?: () => void;
  onJournal?: () => void;
  onAskLumina?: () => void;
}

export function PrepDashboard({ babyName, dueDate, gestationalInfo, onBabyArrivedPress, onJournal, onAskLumina }: PrepDashboardProps) {
  const { week, dayOfWeek, progress } = gestationalInfo;
  const weeksLeft = Math.max(0, 40 - week);

  // Find the starting index for tips — closest to current week
  const startTipIndex = useMemo(() => {
    const exactIdx = DAILY_PREP_CARDS.findIndex((c) => c.week === week);
    if (exactIdx >= 0) return exactIdx;
    let bestIdx = 0;
    let bestDiff = Math.abs(DAILY_PREP_CARDS[0].week - week);
    for (let i = 1; i < DAILY_PREP_CARDS.length; i++) {
      const diff = Math.abs(DAILY_PREP_CARDS[i].week - week);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    return bestIdx;
  }, [week]);

  const [tipOffset, setTipOffset] = useState(0);
  const currentTipIndex = DAILY_PREP_CARDS.length > 0
    ? (startTipIndex + tipOffset) % DAILY_PREP_CARDS.length
    : 0;
  const currentTip = DAILY_PREP_CARDS[currentTipIndex] ?? null;

  // Tip body: show truncated preview, expandable
  const [expanded, setExpanded] = useState(false);
  const bodyPreviewLength = 180;
  const tipBody = currentTip?.body ?? '';
  const isLong = tipBody.length > bodyPreviewLength;
  const displayBody = expanded || !isLong
    ? tipBody
    : tipBody.slice(0, bodyPreviewLength).trimEnd() + '...';

  const nextTip = () => {
    setTipOffset((prev) => prev + 1);
    setExpanded(false);
  };

  // Baby size for current week
  const babySize = BABY_SIZE_BY_WEEK[week] ?? null;

  return (
    <View style={styles.content}>
      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingText}>
          {babyName === 'your little one'
            ? 'Waiting for your little one...'
            : `Waiting for ${babyName}...`}
        </Text>
        <Text style={styles.countdownText}>
          {weeksLeft > 0 ? `${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} to go!` : 'Any day now!'}
        </Text>
      </View>

      {/* Progress Ring */}
      <ProgressRing
        week={week}
        dayOfWeek={dayOfWeek}
        progress={progress}
        babyName={babyName}
      />

      {/* "I Had My Baby!" button */}
      {onBabyArrivedPress && (
        <Pressable style={[styles.babyArrivedButton, shadows.soft]} onPress={onBabyArrivedPress}>
          <Feather name="heart" size={20} color={colors.textInverse} />
          <Text style={styles.babyArrivedText}>I Had My Baby!</Text>
        </Pressable>
      )}

      {/* Baby Size Card */}
      {babySize && (
        <View style={[styles.sizeCard, shadows.soft]}>
          <Text style={styles.sizeEmoji}>{babySize.emoji}</Text>
          <View style={styles.sizeTextGroup}>
            <Text style={styles.sizeHeadline}>
              Baby is the size of a {babySize.name}
            </Text>
            <Text style={styles.sizeLength}>{babySize.length}</Text>
          </View>
        </View>
      )}

      {/* Pregnancy Insights Grid */}
      {onJournal && onAskLumina && (
        <PregnancyInsightsGrid
          week={week}
          babyName={babyName}
          onJournal={onJournal}
          onAskLumina={onAskLumina}
        />
      )}

      {/* Section spacer */}
      <View style={styles.sectionSpacer} />

      {/* Tip Card — editorial style, expanded height */}
      {currentTip && (
      <View style={[styles.tipCard, shadows.soft]}>
        <View style={styles.tipAccent} />
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>{currentTip.title}</Text>
          <Text style={styles.tipBody}>{displayBody}</Text>

          {/* Learn more / collapse */}
          {isLong && (
            <Pressable
              style={styles.learnMoreButton}
              onPress={() => setExpanded(!expanded)}
              accessibilityLabel={expanded ? 'Show less' : 'Learn more'}
            >
              <Text style={styles.learnMoreText}>
                {expanded ? 'Show less' : 'Learn more'}
              </Text>
              <Feather
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.primary[600]}
              />
            </Pressable>
          )}

          {/* Next tip — no counter, infinite stream feel */}
          <Pressable
            style={styles.nextTipButton}
            onPress={nextTip}
            accessibilityLabel="Show me another tip"
          >
            <Text style={styles.nextTipText}>Show me another tip</Text>
            <Feather name="arrow-right" size={16} color={colors.primary[600]} />
          </Pressable>
        </View>
      </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.base,
    paddingBottom: 120,
  },

  // Greeting
  greetingSection: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  greetingText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  countdownText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // "I Had My Baby!" button
  babyArrivedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignSelf: 'center',
    marginTop: spacing.lg,
  },
  babyArrivedText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
    letterSpacing: 0.3,
  },

  // Baby size card
  sizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginTop: spacing.base,
    gap: spacing.base,
  },
  sizeEmoji: {
    fontSize: 48,
  },
  sizeTextGroup: {
    flex: 1,
  },
  sizeHeadline: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sizeLength: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  // Spacer
  sectionSpacer: {
    height: spacing.xl,
  },

  // Tip Card — editorial, tall
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    minHeight: 260,
  },
  tipAccent: {
    width: 4,
    backgroundColor: colors.secondary[300],
  },
  tipContent: {
    flex: 1,
    padding: spacing.lg,
  },
  tipTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tipBody: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    marginBottom: spacing.base,
  },

  // Learn more
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.base,
  },
  learnMoreText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },

  // Next tip
  nextTipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  nextTipText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
});

// ============================================================
// Lumina — Pregnancy Content Cards + Ask Lumina Banner
// Full-width cards matching the tip card aesthetic
// Accent bar | icon | title | body — unified visual language
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import { WEEKLY_DEVELOPMENT, BODY_CHANGES_BY_TRIMESTER } from '../data/prepContent';

interface PregnancyInsightsGridProps {
  week: number;
  babyName: string;
  onJournal: () => void;
  onAskLumina: () => void;
}

function getTrimester(week: number): 1 | 2 | 3 {
  if (week <= 13) return 1;
  if (week <= 27) return 2;
  return 3;
}

export function PregnancyInsightsGrid({ week, babyName, onJournal, onAskLumina }: PregnancyInsightsGridProps) {
  const devData = WEEKLY_DEVELOPMENT[week] ?? WEEKLY_DEVELOPMENT[40];
  const development = devData.summary;
  const trimester = getTrimester(week);
  const bodyChanges = BODY_CHANGES_BY_TRIMESTER[trimester];

  const bodyChange = useMemo(() => {
    return bodyChanges[week % bodyChanges.length];
  }, [week, bodyChanges]);

  return (
    <View style={styles.container}>
      {/* ── Ask Lumina Banner ── */}
      <Pressable style={[styles.luminaBanner, shadows.soft]} onPress={onAskLumina}>
        <View style={styles.luminaIcon}>
          <Feather name="message-circle" size={22} color={colors.primary[600]} />
        </View>
        <View style={styles.luminaTextGroup}>
          <Text style={styles.luminaTitle}>Ask Lumina</Text>
          <Text style={styles.luminaSubtitle}>Your AI pregnancy companion — ask anything</Text>
        </View>
        <Pressable
          style={styles.luminaMicButton}
          onPress={onAskLumina}
          hitSlop={12}
          accessibilityLabel="Voice input"
          accessibilityHint="Ask Lumina with your voice"
        >
          <Feather name="mic" size={18} color={colors.primary[600]} />
        </Pressable>
      </Pressable>

      {/* ── Baby This Week ── */}
      <View style={[styles.card, shadows.soft]}>
        <View style={[styles.accent, { backgroundColor: colors.secondary[300] }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.secondary[50] }]}>
              <Feather name="heart" size={16} color={colors.secondary[500]} />
            </View>
            <Text style={styles.cardLabel}>WEEK {week}</Text>
          </View>
          <Text style={styles.cardTitle}>Baby This Week</Text>
          <Text style={styles.cardBody}>{development}</Text>
        </View>
      </View>

      {/* ── Body Changes ── */}
      <View style={[styles.card, shadows.soft]}>
        <View style={[styles.accent, { backgroundColor: colors.primary[300] }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.primary[50] }]}>
              <Feather name="activity" size={16} color={colors.primary[600]} />
            </View>
            <Text style={styles.cardLabel}>TRIMESTER {trimester}</Text>
          </View>
          <Text style={styles.cardTitle}>Body Changes</Text>
          <Text style={styles.cardBody}>{bodyChange}</Text>
        </View>
      </View>

      {/* ── Daily Reflection ── */}
      <Pressable style={[styles.card, shadows.soft]} onPress={onJournal}>
        <View style={[styles.accent, { backgroundColor: colors.secondary[200] }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.secondary[50] }]}>
              <Feather name="heart" size={16} color={colors.secondary[400]} />
            </View>
          </View>
          <Text style={styles.cardTitle}>How is your heart today?</Text>
          <Text style={styles.cardBody}>
            Capture a quick thought or feeling about {babyName}
          </Text>
          <View style={styles.cardCta}>
            <Text style={styles.cardCtaText}>Write a note</Text>
            <Feather name="arrow-right" size={14} color={colors.primary[600]} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  // ── Ask Lumina Banner ──
  luminaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    gap: spacing.md,
  },
  luminaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  luminaTextGroup: {
    flex: 1,
  },
  luminaTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
    marginBottom: 2,
  },
  luminaSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
  },
  luminaMicButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Unified Content Cards (matches tip card) ──
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  cardBody: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  cardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  cardCtaText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
});

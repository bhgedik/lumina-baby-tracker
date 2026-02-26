// ============================================================
// Nodd — Compact Insight Card
// Smaller card for medium/low priority insights with
// tap-to-expand body, action items, and quick actions
// ============================================================

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import { TAG_COLORS } from '../constants';
import { RichBody } from './RichBody';
import type { InsightCardData, QuickAction } from '../types';

interface Props {
  insight: InsightCardData;
  onDiscuss: (insight: InsightCardData) => void;
  onQuickAction?: (action: QuickAction) => void;
  onDismiss?: (contentHash: string) => void;
}

export function CompactInsightCard({ insight, onDiscuss, onQuickAction, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false);
  const tagColor = TAG_COLORS[insight.tag] ?? TAG_COLORS.general;

  return (
    <Pressable style={styles.card} onPress={() => setExpanded((prev) => !prev)}>
      {/* Top row: tag pill + dismiss */}
      <View style={styles.topRow}>
        <View style={[styles.tagPill, { backgroundColor: tagColor.bg }]}>
          <Text style={[styles.tagText, { color: tagColor.text }]}>{insight.tagLabel}</Text>
        </View>
        <View style={{ flex: 1 }} />
        {onDismiss && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onDismiss(insight.contentHash);
            }}
            hitSlop={8}
            style={styles.dismissButton}
          >
            <Feather name="x" size={16} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{insight.title}</Text>

      {/* Body */}
      <RichBody text={insight.body} compact numberOfLines={expanded ? undefined : 2} />

      {/* Collapsed hint */}
      {!expanded && (
        <Text style={styles.readMore}>Tap to read more</Text>
      )}

      {/* Expanded content */}
      {expanded && (
        <>
          {/* Action items */}
          {insight.actionItems && insight.actionItems.length > 0 && (
            <View style={styles.actionItemsBox}>
              {insight.actionItems.map((item, index) => (
                <View key={index} style={styles.actionItemRow}>
                  <Feather name="check-circle" size={14} color={colors.primary[500]} style={styles.actionIcon} />
                  <Text style={styles.actionItemText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Quick action */}
          {insight.quickAction && onQuickAction && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onQuickAction(insight.quickAction!);
              }}
              style={styles.quickActionButton}
            >
              <Feather name={insight.quickAction.icon as any} size={16} color={colors.secondary[500]} />
              <Text style={styles.quickActionText}>{insight.quickAction.label}</Text>
            </Pressable>
          )}

          {/* Discuss CTA */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onDiscuss(insight);
            }}
            style={styles.discussButton}
          >
            <Feather name="message-circle" size={14} color={colors.primary[600]} style={styles.discussIcon} />
            <Text style={styles.discussText}>Discuss with your AI Nurse</Text>
          </Pressable>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tagPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dismissButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  readMore: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
    marginTop: spacing.xs,
  },
  actionItemsBox: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  actionIcon: {
    marginRight: spacing.sm,
    marginTop: 1,
  },
  actionItemText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.secondary[500],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  quickActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.secondary[600],
  },
  discussButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  discussIcon: {
    marginRight: spacing.xs,
  },
  discussText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
  },
});

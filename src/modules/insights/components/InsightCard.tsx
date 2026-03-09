// ============================================================
// Sprouty — Insight Card
// Premium smart card with context tag, rich body, and chat CTA
// Collapsible body + swipe-to-dismiss support
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, PanResponder } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import { TAG_COLORS, PRIORITY_ACCENT } from '../constants';
import { RichBody } from './RichBody';
import { VisualGuide } from './VisualGuide';
import type { InsightCardData, QuickAction } from '../types';

interface Props {
  insight: InsightCardData;
  onDiscuss: (insight: InsightCardData) => void;
  onQuickAction?: (action: QuickAction) => void;
  onDismiss?: (contentHash: string) => void;
}

// Safe: parent keys by insight.id, so this component remounts for new insights
export function InsightCard({ insight, onDiscuss, onQuickAction, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false);

  const tagColor = TAG_COLORS[insight.tag] ?? TAG_COLORS.general;
  const accentColor = PRIORITY_ACCENT[insight.priority] ?? colors.neutral[300];

  // ─── Swipe-to-dismiss ───

  const translateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_evt, gestureState) => {
        // Only allow left swipe (dx < 0)
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dx < -80 && onDismiss) {
          // Swipe past threshold — animate out and dismiss
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -400,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onDismiss(insight.contentHash);
          });
        } else {
          // Spring back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // ─── Collapsible body ───

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <Animated.View
      style={{ transform: [{ translateX }], opacity: cardOpacity }}
      {...panResponder.panHandlers}
    >
      <View style={[styles.card, shadows.md]}>
        {/* Priority accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        <View style={styles.cardContent}>
          {/* Context tag row with optional dismiss X */}
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: tagColor.bg }]}>
              <Feather name={insight.tagIcon as any} size={12} color={tagColor.icon} />
              <Text style={[styles.tagText, { color: tagColor.text }]}>{insight.tagLabel}</Text>
            </View>
            {onDismiss && (
              <Pressable
                onPress={() => onDismiss(insight.contentHash)}
                hitSlop={8}
                accessibilityLabel="Dismiss insight"
              >
                <Feather name="x" size={16} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>

          {/* Data source hook */}
          <Text style={styles.hookText}>{insight.hook}</Text>

          {/* Title */}
          <Text style={styles.title}>{insight.title}</Text>

          {/* Rich body with bold markers — collapsible */}
          <Pressable onPress={toggleExpand}>
            <RichBody text={insight.body} numberOfLines={expanded ? undefined : 3} />
            {!expanded && (
              <Text style={styles.readMore}>Read more</Text>
            )}
          </Pressable>

          {/* Visual guide — visible only when expanded */}
          {expanded && insight.visualGuide && (
            <View style={{ marginBottom: spacing.md }}>
              <VisualGuide guide={insight.visualGuide} />
            </View>
          )}

          {/* Action items — visible only when expanded */}
          {expanded && insight.actionItems && insight.actionItems.length > 0 && (
            <View style={styles.actionList}>
              {insight.actionItems.map((item, i) => (
                <View key={i} style={styles.actionItem}>
                  <View style={styles.actionBullet} />
                  <Text style={styles.actionText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Quick Action — visible only when expanded */}
          {expanded && insight.quickAction && onQuickAction && (
            <Pressable
              style={styles.quickActionButton}
              onPress={() => onQuickAction(insight.quickAction!)}
              accessibilityLabel={insight.quickAction.label}
            >
              <Feather name={insight.quickAction.icon as any} size={16} color={colors.secondary[600]} />
              <Text style={styles.quickActionText}>{insight.quickAction.label}</Text>
            </Pressable>
          )}

          {/* Discuss CTA — always visible */}
          <Pressable
            style={styles.discussButton}
            onPress={() => onDiscuss(insight)}
            accessibilityLabel={`Discuss: ${insight.title}`}
          >
            <Feather name="message-circle" size={16} color={colors.primary[600]} />
            <Text style={styles.discussText}>Discuss with Lumina</Text>
            <Feather name="chevron-right" size={16} color={colors.primary[400]} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing.base,
    flexDirection: 'row',
  },
  accentBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: spacing.base,
    paddingLeft: spacing.base,
  },
  // Tag row with dismiss X
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  // Context tag
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Hook
  hookText: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  // Title
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: typography.fontSize.md * typography.lineHeight.tight,
  },
  // Read more
  readMore: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[500],
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  // Action items
  actionList: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  actionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[500],
    marginTop: 6,
  },
  actionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary[800],
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  // Quick Action
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderStyle: 'dashed',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.secondary[600],
  },
  // Discuss CTA
  discussButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  discussText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
  },
});

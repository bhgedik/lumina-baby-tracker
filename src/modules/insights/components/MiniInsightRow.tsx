// ============================================================
// Nodd — Mini Insight Row
// Minimal positive reinforcement row with green check circle,
// title, and chevron for navigation
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants/theme';
import type { InsightCardData } from '../types';

interface Props {
  insight: InsightCardData;
  onPress: (insight: InsightCardData) => void;
}

export function MiniInsightRow({ insight, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={() => onPress(insight)}>
      {/* Green check circle */}
      <View style={styles.checkCircle}>
        <Feather name="check" size={12} color={colors.success} />
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>
        {insight.title}
      </Text>

      {/* Chevron */}
      <Feather name="chevron-right" size={14} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
});

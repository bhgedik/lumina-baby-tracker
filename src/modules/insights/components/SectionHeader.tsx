// ============================================================
// Nodd — Section Header
// Reusable section divider with icon, title, count badge,
// and optional collapse toggle
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants/theme';

interface Props {
  icon: string;
  iconColor: string;
  title: string;
  count: number;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function SectionHeader({
  icon,
  iconColor,
  title,
  count,
  collapsible = false,
  collapsed = false,
  onToggle,
}: Props) {
  const content = (
    <View style={styles.row}>
      <Feather name={icon as any} size={18} color={iconColor} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
      {collapsible && (
        <Feather
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={18}
          color={colors.textTertiary}
          style={styles.chevron}
        />
      )}
    </View>
  );

  if (collapsible && onToggle) {
    return (
      <Pressable onPress={onToggle} style={styles.container}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
});

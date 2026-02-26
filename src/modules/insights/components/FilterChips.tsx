// ============================================================
// Nodd — Filter Chips
// Horizontal scrollable category pills for filtering insights
// ============================================================

import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants/theme';
import { FILTER_OPTIONS } from '../types';
import type { FilterCategory } from '../types';

interface FilterOption {
  key: string;
  label: string;
  tags: string[];
}

interface Props {
  selected: string;
  onSelect: (category: any) => void;
  options?: FilterOption[];
}

export function FilterChips({ selected, onSelect, options }: Props) {
  const items = options ?? FILTER_OPTIONS;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {items.map((option) => {
        const isActive = selected === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
          >
            <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
    flexGrow: 0,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  chipActive: {
    backgroundColor: colors.primary[500],
  },
  chipInactive: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  chipText: {
    fontSize: typography.fontSize.sm,
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: typography.fontWeight.semibold,
  },
  chipTextInactive: {
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.regular,
  },
});

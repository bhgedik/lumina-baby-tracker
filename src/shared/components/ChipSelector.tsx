// ============================================================
// Sprout — Chip Selector
// Warm, squishy scrollable chips — 48px+ height
// ============================================================

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants/theme';

interface ChipOption {
  value: string;
  label: string;
}

interface Props {
  options: ChipOption[];
  selected: string | string[];
  onSelect: (value: string) => void;
  multiSelect?: boolean;
}

export function ChipSelector({ options, selected, onSelect, multiSelect = false }: Props) {
  const selectedSet = new Set(Array.isArray(selected) ? selected : [selected]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => {
        const isSelected = selectedSet.has(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <View style={[styles.chip, isSelected && styles.chipSelected]}>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  chipSelected: {
    backgroundColor: colors.secondary[50],
    borderColor: colors.secondary[400],
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.secondary[600],
    fontWeight: typography.fontWeight.semibold,
  },
});

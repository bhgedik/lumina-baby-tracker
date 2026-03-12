// ============================================================
// Lumina — Stool Color Picker
// Seven 56px color circles with medical warnings
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors as themeColors, typography, spacing, borderRadius } from '../../../shared/constants/theme';
import type { StoolColor } from '../../../shared/types/common';

const STOOL_COLORS: { value: StoolColor; hex: string; label: string }[] = [
  { value: 'yellow', hex: '#D4A017', label: 'Yellow' },
  { value: 'green', hex: '#4A7A3D', label: 'Green' },
  { value: 'brown', hex: '#6B4226', label: 'Brown' },
  { value: 'black', hex: '#1A1A1A', label: 'Black' },
  { value: 'red', hex: '#B22222', label: 'Red' },
  { value: 'white', hex: '#F0EDE8', label: 'White' },
  { value: 'orange', hex: '#D2691E', label: 'Orange' },
];

const WARNING_COLORS: StoolColor[] = ['red', 'black', 'white'];

interface Props {
  selected: StoolColor | null;
  onSelect: (color: StoolColor) => void;
}

export function StoolColorPicker({ selected, onSelect }: Props) {
  const showWarning = selected && WARNING_COLORS.includes(selected);

  return (
    <View>
      <View style={styles.row}>
        {STOOL_COLORS.map((color) => (
          <Pressable
            key={color.value}
            onPress={() => onSelect(color.value)}
            accessibilityRole="button"
            accessibilityLabel={`${color.label} stool color`}
          >
            <View
              style={[
                styles.circle,
                { backgroundColor: color.hex },
                selected === color.value && styles.circleSelected,
                color.value === 'white' && styles.circleWhite,
              ]}
            />
            <Text style={styles.label}>{color.label}</Text>
          </Pressable>
        ))}
      </View>
      {showWarning && (
        <View style={styles.warningBox}>
          <Feather name="alert-triangle" size={14} color={themeColors.emergency} style={styles.warningIcon} />
          <Text style={styles.warningText}>
            {selected === 'red' || selected === 'black'
              ? 'Red or black stools may warrant a call to your pediatrician'
              : 'White or clay-colored stools should be reported to your pediatrician'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  circleSelected: {
    borderColor: themeColors.primary[600],
    borderWidth: 3,
  },
  circleWhite: {
    borderColor: themeColors.neutral[300],
    borderWidth: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: themeColors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: themeColors.emergencyBackground,
    borderRadius: borderRadius.xl,
  },
  warningIcon: {
    marginRight: spacing.sm,
    marginTop: 1,
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: themeColors.emergency,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
});

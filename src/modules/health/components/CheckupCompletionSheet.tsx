// ============================================================
// Lumina — Checkup Completion Sheet
// Bottom sheet for capturing growth data during well-child checkups
// ============================================================

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { useAuthStore } from '../../../stores/authStore';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import type { CheckupTrackingItem } from '../types';

interface Props {
  item: CheckupTrackingItem | null;
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    weightGrams: number | null;
    heightCm: number | null;
    headCm: number | null;
    notes: string;
  }) => void;
}

// Unit conversions (same as app/(app)/log/growth.tsx)
const kgToGrams = (kg: number) => Math.round(kg * 1000);
const lbsToGrams = (lbs: number) => Math.round(lbs * 453.592);
const inToCm = (inches: number) => inches * 2.54;

export function CheckupCompletionSheet({ item, visible, onClose, onSave }: Props) {
  const family = useAuthStore((s) => s.family);
  const isMetric = family?.preferred_units !== 'imperial';

  const [weightInput, setWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [headInput, setHeadInput] = useState('');
  const [notes, setNotes] = useState('');

  // Reset inputs when sheet opens with a new item
  useEffect(() => {
    if (visible) {
      setWeightInput('');
      setHeightInput('');
      setHeadInput('');
      setNotes('');
    }
  }, [visible]);

  const weightUnit = isMetric ? 'kg' : 'lbs';
  const lengthUnit = isMetric ? 'cm' : 'in';

  const handleSave = () => {
    const weightNum = parseFloat(weightInput);
    const heightNum = parseFloat(heightInput);
    const headNum = parseFloat(headInput);

    const weightGrams = !isNaN(weightNum)
      ? (isMetric ? kgToGrams(weightNum) : lbsToGrams(weightNum))
      : null;
    const heightCm = !isNaN(heightNum)
      ? (isMetric ? heightNum : inToCm(heightNum))
      : null;
    const headCm = !isNaN(headNum)
      ? (isMetric ? headNum : inToCm(headNum))
      : null;

    onSave({ weightGrams, heightCm, headCm, notes: notes.trim() });
    onClose();
  };

  if (!item) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={`Log ${item.label} Checkup`}>
      {/* Weight */}
      <Text style={styles.label}>Weight ({weightUnit})</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={isMetric ? '3.5' : '7.7'}
          placeholderTextColor={colors.textTertiary}
          value={weightInput}
          onChangeText={setWeightInput}
          keyboardType="decimal-pad"
          maxLength={6}
        />
        <Text style={styles.unitText}>{weightUnit}</Text>
      </View>

      {/* Height */}
      <Text style={styles.label}>Height ({lengthUnit})</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={isMetric ? '50.5' : '19.9'}
          placeholderTextColor={colors.textTertiary}
          value={heightInput}
          onChangeText={setHeightInput}
          keyboardType="decimal-pad"
          maxLength={6}
        />
        <Text style={styles.unitText}>{lengthUnit}</Text>
      </View>

      {/* Head Circumference */}
      <Text style={styles.label}>Head Circumference ({lengthUnit})</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={isMetric ? '35.0' : '13.8'}
          placeholderTextColor={colors.textTertiary}
          value={headInput}
          onChangeText={setHeadInput}
          keyboardType="decimal-pad"
          maxLength={6}
        />
        <Text style={styles.unitText}>{lengthUnit}</Text>
      </View>

      {/* Notes */}
      <Text style={styles.label}>Doctor's Notes</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="Any notes or advice from the doctor..."
        placeholderTextColor={colors.textTertiary}
        value={notes}
        onChangeText={setNotes}
        multiline
        textAlignVertical="top"
        maxLength={500}
      />

      {/* Save */}
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Feather name="check" size={18} color="#FFF" />
        <Text style={styles.saveText}>Save Checkup & Update Growth</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.base,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  unitText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.sm,
  },
  notesInput: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    minHeight: 80,
    lineHeight: typography.fontSize.base * 1.5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    marginTop: spacing.xl,
    ...shadows.sm,
  },
  saveText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});

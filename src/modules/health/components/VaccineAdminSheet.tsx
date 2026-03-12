// ============================================================
// Lumina — Vaccine Administration Sheet
// Bottom sheet for recording a vaccine administration
// ============================================================

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import type { VaccineTrackingItem } from '../types';

interface Props {
  item: VaccineTrackingItem | null;
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    vaccineId: string;
    doseNumber: number;
    administeredDate: string;
  }) => void;
}

export function VaccineAdminSheet({ item, visible, onClose, onSave }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleSave = () => {
    if (!item) return;
    onSave({
      vaccineId: item.vaccineId,
      doseNumber: item.doseNumber,
      administeredDate: date,
    });
    onClose();
  };

  if (!item) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={`${item.vaccineName} — Dose ${item.doseNumber}`}>
      {/* Date */}
      <Text style={styles.label}>Date Administered</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Save */}
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Feather name="check" size={18} color="#FFF" />
        <Text style={styles.saveText}>Save Vaccination</Text>
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
  input: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
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

// ============================================================
// Sprout — Feeding Response Panel
// Baby response + optional notes
// ============================================================

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SegmentControl } from '../../../shared/components/SegmentControl';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants/theme';
import type { BabyResponse } from '../../../shared/types/common';

const RESPONSE_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'fussy', label: 'Fussy' },
  { value: 'refused', label: 'Refused' },
];

interface Props {
  response: BabyResponse | null;
  notes: string;
  onResponseChange: (response: BabyResponse) => void;
  onNotesChange: (notes: string) => void;
}

export function FeedingResponsePanel({ response, notes, onResponseChange, onNotesChange }: Props) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Baby's Response</Text>
      <SegmentControl
        options={RESPONSE_OPTIONS}
        selected={response ?? ''}
        onSelect={(v) => onResponseChange(v as BabyResponse)}
      />

      {!showNotes ? (
        <Pressable onPress={() => setShowNotes(true)} style={styles.notesToggle}>
          <Feather name="edit-3" size={15} color={colors.primary[500]} />
          <Text style={styles.notesToggleText}>Add notes</Text>
        </Pressable>
      ) : (
        <TextInput
          style={styles.notesInput}
          placeholder="Notes (optional)"
          placeholderTextColor={colors.textTertiary}
          value={notes}
          onChangeText={onNotesChange}
          autoFocus
          maxLength={300}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  notesToggleText: {
    fontSize: typography.fontSize.base,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
  notesInput: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.neutral[50],
  },
});

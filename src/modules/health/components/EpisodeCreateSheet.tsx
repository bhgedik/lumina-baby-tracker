// ============================================================
// Lumina — Episode Create Sheet
// Bottom sheet for starting a new illness episode
// Quick-pick illness type cards for fast episode creation
// ============================================================

import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';

type FeatherIcon = React.ComponentProps<typeof Feather>['name'];

interface QuickPick {
  key: string;
  label: string;
  icon: FeatherIcon;
  title: string;
  symptoms: string[];
}

const QUICK_PICKS: QuickPick[] = [
  {
    key: 'cold_flu',
    label: 'Cold / Flu',
    icon: 'thermometer',
    title: 'Cold / Flu',
    symptoms: ['fever', 'cough', 'runny_nose', 'congestion'],
  },
  {
    key: 'stomach_bug',
    label: 'Stomach Bug',
    icon: 'frown',
    title: 'Stomach Bug',
    symptoms: ['vomiting', 'diarrhea'],
  },
  {
    key: 'ear_infection',
    label: 'Ear Infection',
    icon: 'volume-x',
    title: 'Ear Infection',
    symptoms: ['ear_pulling', 'fussy', 'fever'],
  },
  {
    key: 'rash_skin',
    label: 'Rash / Skin',
    icon: 'alert-circle',
    title: 'Rash / Skin',
    symptoms: ['rash'],
  },
  {
    key: 'teething',
    label: 'Teething',
    icon: 'star',
    title: 'Teething',
    symptoms: ['fussy', 'poor_feeding'],
  },
  {
    key: 'other',
    label: 'Something Else',
    icon: 'edit-3',
    title: '',
    symptoms: [],
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    primarySymptoms: string[];
    notes: string;
  }) => void;
}

export function EpisodeCreateSheet({ visible, onClose, onSave }: Props) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const titleRef = useRef<TextInput>(null);

  const handlePickPreset = (pick: QuickPick) => {
    setSelectedPreset(pick.key);
    if (pick.key === 'other') {
      setTitle('');
      titleRef.current?.focus();
    } else {
      setTitle(pick.title);
    }
  };

  const handleSave = () => {
    const pick = QUICK_PICKS.find((p) => p.key === selectedPreset);
    onSave({
      title: title.trim() || 'Illness',
      primarySymptoms: pick?.symptoms ?? [],
      notes: notes.trim(),
    });
    resetState();
    onClose();
  };

  const resetState = () => {
    setSelectedPreset(null);
    setTitle('');
    setNotes('');
  };

  const canSave = selectedPreset !== null || title.trim().length > 0;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Start Illness Episode">
      {/* Quick-pick grid */}
      <View style={styles.grid}>
        {QUICK_PICKS.map((pick) => {
          const selected = selectedPreset === pick.key;
          return (
            <Pressable
              key={pick.key}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => handlePickPreset(pick)}
            >
              <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                <Feather
                  name={pick.icon}
                  size={20}
                  color={selected ? colors.primary[600] : colors.neutral[500]}
                />
              </View>
              <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
                {pick.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Title */}
      <Text style={styles.label}>Episode Title</Text>
      <TextInput
        ref={titleRef}
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Or type a name..."
        placeholderTextColor={colors.textTertiary}
      />

      {/* Notes */}
      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Any initial observations..."
        placeholderTextColor={colors.textTertiary}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Save */}
      <Pressable
        style={[styles.saveButton, !canSave && styles.saveDisabled]}
        onPress={handleSave}
        disabled={!canSave}
      >
        <Feather name="plus" size={18} color="#FFF" />
        <Text style={styles.saveText}>Start Episode</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.base,
    marginBottom: spacing.md,
  },
  card: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  cardSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: colors.primary[100],
  },
  cardLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  cardLabelSelected: {
    color: colors.primary[700],
  },
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
  textArea: {
    minHeight: 80,
    paddingTop: spacing.md,
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
  saveDisabled: {
    opacity: 0.4,
  },
  saveText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});

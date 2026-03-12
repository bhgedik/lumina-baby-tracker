// ============================================================
// Lumina — Doctor Visit Sheet
// Context-aware bottom sheet for logging doctor visits
// linked to active illness episodes
// ============================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import type { IllnessEpisode } from '../types';

interface Props {
  episode: IllnessEpisode | null;
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    doctorName: string;
    diagnosis: string;
    notes: string;
    questions: string[];
  }) => void;
}

// ── Symptom-to-question mapping ─────────────────────────────

const SYMPTOM_QUESTIONS: Record<string, string[]> = {
  fever: [
    'How long has the fever lasted and what was the highest reading?',
    'Should we be concerned if the fever returns after medication wears off?',
  ],
  cough: [
    'Is this cough something we should watch, or does it need treatment?',
    'How can we tell if it\u2019s moving to the chest?',
  ],
  vomiting: [
    'How do we know if dehydration is becoming a concern?',
    'When should we come back if the vomiting continues?',
  ],
  diarrhea: [
    'Should we adjust feeding or diet during this?',
    'At what point does this warrant a follow-up?',
  ],
  rash: [
    'Is this rash something that will resolve on its own?',
    'Are there signs we should watch for that mean it\u2019s spreading?',
  ],
  congestion: [
    'What\u2019s the best way to help with congestion at this age?',
    'When does congestion become a concern for breathing?',
  ],
  runny_nose: [
    'Is the color of the discharge something to watch?',
  ],
  ear_pulling: [
    'Could this be an ear infection, and does it need antibiotics?',
    'How can we manage the pain at home?',
  ],
  fussy: [
    'Is the fussiness likely pain-related or developmental?',
  ],
  poor_feeding: [
    'Should we be worried about weight loss with reduced feeding?',
    'Are there tricks to encourage feeding during illness?',
  ],
};

const GENERIC_QUESTIONS = [
  'What should we watch for over the next few days?',
  'When should we come back if things don\u2019t improve?',
];

export function DoctorVisitSheet({ episode, visible, onClose, onSave }: Props) {
  const [doctorName, setDoctorName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const notesInputRef = useRef<TextInput>(null);

  // Build suggested questions from episode symptoms
  const suggestedQuestions = useMemo(() => {
    if (!episode) return GENERIC_QUESTIONS;

    const collected: string[] = [];
    const seen = new Set<string>();

    for (const symptom of episode.primary_symptoms) {
      const key = symptom.toLowerCase().replace(/\s+/g, '_');
      const questions = SYMPTOM_QUESTIONS[key];
      if (questions) {
        for (const q of questions) {
          if (!seen.has(q)) {
            seen.add(q);
            collected.push(q);
          }
        }
      }
    }

    if (collected.length === 0) return GENERIC_QUESTIONS;
    return collected.slice(0, 3);
  }, [episode]);

  // Reset state when sheet opens
  useEffect(() => {
    if (visible) {
      setDoctorName('');
      setNotes('');
      // Pre-select all suggested questions
      setSelectedQuestions(new Set(suggestedQuestions.map((_, i) => i)));
    }
  }, [visible, suggestedQuestions]);

  const toggleQuestion = (index: number) => {
    setSelectedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleVoiceDictate = () => {
    // Focus the notes field — iOS keyboard has a built-in dictation button
    notesInputRef.current?.focus();
  };

  const handleSave = () => {
    const selectedQs = suggestedQuestions.filter((_, i) => selectedQuestions.has(i));
    onSave({
      doctorName: doctorName.trim(),
      diagnosis: '',
      notes: notes.trim(),
      questions: selectedQs,
    });
    onClose();
  };

  const canSave = notes.trim().length > 0;

  if (!episode) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Doctor Visit">
      {/* Contextual subtitle */}
      <Text style={styles.contextSubtitle}>Linked to: {episode.title}</Text>

      {/* Suggested Questions */}
      <View style={styles.questionsSection}>
        <View style={styles.questionsHeader}>
          <Feather name="help-circle" size={16} color={colors.primary[500]} />
          <Text style={styles.questionsHeaderText}>Questions to Ask</Text>
        </View>
        <View style={styles.questionChipRow}>
          {suggestedQuestions.map((q, i) => {
            const isSelected = selectedQuestions.has(i);
            return (
              <Pressable
                key={i}
                style={[styles.questionChip, isSelected && styles.questionChipSelected]}
                onPress={() => toggleQuestion(i)}
              >
                <Feather
                  name={isSelected ? 'check-circle' : 'circle'}
                  size={14}
                  color={isSelected ? colors.primary[600] : colors.neutral[400]}
                />
                <Text
                  style={[styles.questionChipText, isSelected && styles.questionChipTextSelected]}
                >
                  {q}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Doctor's Name */}
      <Text style={styles.label}>Doctor's Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Dr. Smith"
        placeholderTextColor={colors.textTertiary}
        value={doctorName}
        onChangeText={setDoctorName}
        maxLength={100}
      />

      {/* Voice Dictation — focuses notes field for keyboard dictation */}
      <Pressable style={styles.voiceRecordRow} onPress={handleVoiceDictate}>
        <View style={styles.voiceRecordButton}>
          <Feather name="mic" size={20} color={colors.primary[500]} />
        </View>
        <View>
          <Text style={styles.voiceRecordLabel}>Dictate Notes</Text>
          <Text style={styles.voiceRecordHint}>Tap to type or use keyboard mic</Text>
        </View>
      </Pressable>

      {/* Notes / Diagnosis */}
      <Text style={styles.label}>Notes / Diagnosis</Text>
      <TextInput
        ref={notesInputRef}
        style={styles.notesInput}
        placeholder="Notes from the visit, diagnosis, follow-up plan..."
        placeholderTextColor={colors.textTertiary}
        value={notes}
        onChangeText={setNotes}
        multiline
        textAlignVertical="top"
        maxLength={1000}
      />

      {/* Save Button */}
      <Pressable
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!canSave}
      >
        <Feather name="check" size={18} color="#FFF" />
        <Text style={styles.saveText}>Save Visit Details</Text>
      </Pressable>
    </BottomSheet>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  contextSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },

  // Questions section
  questionsSection: {
    marginBottom: spacing.md,
  },
  questionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  questionsHeaderText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  questionChipRow: {
    gap: spacing.xs,
  },
  questionChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  questionChipSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  questionChipText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  questionChipTextSelected: {
    color: colors.primary[700],
  },

  // Form inputs
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
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
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

  // Voice dictation
  voiceRecordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    padding: spacing.base,
  },
  voiceRecordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary[300],
  },
  voiceRecordLabel: {
    fontSize: typography.fontSize.base,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
  },
  voiceRecordHint: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[400],
    marginTop: 1,
  },

  // Save button
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});

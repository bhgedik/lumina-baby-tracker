// ============================================================
// Sprout — Diaper Details Sheet
// BottomSheet with AI scan, stool color, consistency, rash, notes
// ============================================================

import React, { useState } from 'react';
import { View, Text, Switch, TextInput, Pressable, Alert, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { StoolColorPicker } from './StoolColorPicker';
import { ChipSelector } from '../../../shared/components/ChipSelector';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import { isSupabaseConfigured } from '../../../data/supabase/client';
import { analyzePhoto } from '../services/diaperAnalysisService';
import type { StoolColor, StoolConsistency } from '../../../shared/types/common';

const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const CONSISTENCY_OPTIONS = [
  { value: 'liquid', label: 'Liquid' },
  { value: 'soft', label: 'Soft' },
  { value: 'formed', label: 'Formed' },
  { value: 'hard', label: 'Hard' },
  { value: 'mucousy', label: 'Mucousy' },
  { value: 'seedy', label: 'Seedy' },
];

// Label maps for AI result display
const COLOR_LABELS: Record<StoolColor, string> = {
  yellow: 'Mustard Yellow', green: 'Green', brown: 'Brown',
  black: 'Black', red: 'Red', white: 'White/Clay', orange: 'Orange',
};
const COLOR_SWATCHES: Record<StoolColor, string> = {
  yellow: '#D4A017', green: '#4A7A3D', brown: '#6B4226',
  black: '#1A1A1A', red: '#B22222', white: '#F0EDE8', orange: '#D2691E',
};
const CONSISTENCY_LABELS: Record<StoolConsistency, string> = {
  liquid: 'Liquid', soft: 'Soft', formed: 'Formed',
  hard: 'Hard', mucousy: 'Mucousy', seedy: 'Seedy',
};
const CONSISTENCY_ICONS: Record<StoolConsistency, keyof typeof Feather.glyphMap> = {
  liquid: 'droplet', soft: 'cloud', formed: 'square',
  hard: 'hexagon', mucousy: 'wind', seedy: 'more-horizontal',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (details: {
    stool_color: StoolColor | null;
    stool_consistency: StoolConsistency | null;
    has_rash: boolean;
    notes: string | null;
  }) => void;
}

export function DiaperDetailsSheet({ visible, onClose, onSave }: Props) {
  const [stoolColor, setStoolColor] = useState<StoolColor | null>(null);
  const [consistency, setConsistency] = useState<StoolConsistency | null>(null);
  const [hasRash, setHasRash] = useState(false);
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{ color: StoolColor; consistency: StoolConsistency } | null>(null);

  const handleSave = () => {
    onSave({
      stool_color: stoolColor,
      stool_consistency: consistency,
      has_rash: hasRash,
      notes: notes.trim() || null,
    });
    // Reset
    setStoolColor(null);
    setConsistency(null);
    setHasRash(false);
    setNotes('');
    setAiResult(null);
  };

  const handleScanWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Camera access is required to scan diaper contents.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.6,
    });

    if (result.canceled || !result.assets?.[0]?.base64) return;

    setIsAnalyzing(true);
    setAiResult(null);
    try {
      const analysis = await analyzePhoto(result.assets[0].base64);

      if (!analysis.safe && analysis.error === 'privacy') {
        Alert.alert(
          'Privacy Alert',
          'We cannot process this image. Please ensure only diaper contents are visible.',
        );
      } else if (analysis.safe) {
        if (analysis.stoolColor) setStoolColor(analysis.stoolColor);
        if (analysis.stoolConsistency) setConsistency(analysis.stoolConsistency);
        if (analysis.stoolColor && analysis.stoolConsistency) {
          setAiResult({ color: analysis.stoolColor, consistency: analysis.stoolConsistency });
        }
      } else if (analysis.error) {
        Alert.alert('Analysis Failed', 'Could not analyze the photo. Please select details manually.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Diaper Details">
      {/* AI Camera Scan */}
      {isSupabaseConfigured && (
        <Pressable style={styles.scanButton} onPress={handleScanWithCamera} disabled={isAnalyzing}>
          <Feather name="camera" size={18} color={colors.primary[500]} />
          <Text style={styles.scanButtonText}>Scan with Camera</Text>
        </Pressable>
      )}

      {/* Analyzing overlay */}
      {isAnalyzing && (
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.analyzingText}>Analyzing...</Text>
        </View>
      )}

      {/* AI Result Card */}
      {aiResult && !isAnalyzing && (
        <View style={[styles.aiResultCard, shadows.sm]}>
          <View style={styles.aiResultHeader}>
            <Feather name="zap" size={16} color={colors.primary[600]} />
            <Text style={styles.aiResultTitle}>Smart Analysis</Text>
          </View>

          <View style={styles.aiResultColumns}>
            {/* Color column */}
            <View style={styles.aiResultCol}>
              <Text style={styles.aiResultLabel}>Color</Text>
              <View style={styles.aiResultValueRow}>
                <View style={[styles.colorSwatch, { backgroundColor: COLOR_SWATCHES[aiResult.color] }]} />
                <Text style={styles.aiResultValue}>{COLOR_LABELS[aiResult.color]}</Text>
              </View>
            </View>

            <View style={styles.aiResultDivider} />

            {/* Consistency column */}
            <View style={styles.aiResultCol}>
              <Text style={styles.aiResultLabel}>Consistency</Text>
              <View style={styles.aiResultValueRow}>
                <Feather name={CONSISTENCY_ICONS[aiResult.consistency]} size={16} color={colors.primary[500]} />
                <Text style={styles.aiResultValue}>{CONSISTENCY_LABELS[aiResult.consistency]}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.aiReassurance}>
            Results pre-filled below — review and adjust if needed.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stool Color</Text>
        <StoolColorPicker selected={stoolColor} onSelect={setStoolColor} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Consistency</Text>
        <ChipSelector
          options={CONSISTENCY_OPTIONS}
          selected={consistency ?? ''}
          onSelect={(v) => setConsistency(v as StoolConsistency)}
        />
      </View>

      <View style={styles.rashRow}>
        <Text style={styles.sectionTitle}>Diaper Rash</Text>
        <Switch
          value={hasRash}
          onValueChange={setHasRash}
          trackColor={{ true: colors.primary[500], false: colors.neutral[200] }}
          thumbColor={colors.surface}
          style={styles.switch}
        />
      </View>

      <View style={styles.section}>
        <TextInput
          style={styles.notesInput}
          placeholder="Notes (optional)"
          placeholderTextColor={colors.textTertiary}
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={200}
        />
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave} accessibilityRole="button">
        <Text style={styles.saveButtonText}>Save Details</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary[300],
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
    backgroundColor: colors.primary[50],
  },
  scanButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[500],
  },
  analyzingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
  },
  analyzingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // ── AI Result Card ──
  aiResultCard: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.primary[200],
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  aiResultTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  aiResultColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  aiResultCol: {
    flex: 1,
  },
  aiResultDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.primary[200],
    marginHorizontal: spacing.md,
  },
  aiResultLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  aiResultValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  aiResultValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  aiReassurance: {
    fontSize: typography.fontSize.sm,
    fontFamily: SERIF_FONT,
    fontStyle: 'italic',
    color: colors.primary[600],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  rashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  switch: {
    height: 56,
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.neutral[50],
    minHeight: 56,
    textAlignVertical: 'top',
  },
  saveButton: {
    height: 56,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },
});

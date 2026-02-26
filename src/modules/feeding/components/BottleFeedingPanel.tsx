// ============================================================
// Sprout — Bottle Feeding Panel
// Warm, squishy amount slider + content type + temperature
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ChipSelector } from '../../../shared/components/ChipSelector';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import type { BottleContentType } from '../../../shared/types/common';

const CONTENT_OPTIONS = [
  { value: 'breast_milk', label: 'Breast Milk' },
  { value: 'formula', label: 'Formula' },
  { value: 'mixed', label: 'Mixed' },
];

const TEMP_OPTIONS = [
  { value: 'warm', label: 'Warm' },
  { value: 'room', label: 'Room' },
  { value: 'cold', label: 'Cold' },
];

interface Props {
  amount: number;
  content: BottleContentType | null;
  temperature: 'warm' | 'room' | 'cold' | null;
  onAmountChange: (amount: number) => void;
  onContentChange: (content: BottleContentType) => void;
  onTemperatureChange: (temp: 'warm' | 'room' | 'cold') => void;
}

export function BottleFeedingPanel({
  amount,
  content,
  temperature,
  onAmountChange,
  onContentChange,
  onTemperatureChange,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amount</Text>
        <View style={[styles.amountCard, shadows.sm]}>
          <Text style={styles.amountDisplay}>{amount} ml</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>0</Text>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  { width: `${(amount / 300) * 100}%` },
                ]}
              />
              <View style={styles.sliderTouchArea}>
                {Array.from({ length: 61 }, (_, i) => i * 5).map((val) => (
                  <View
                    key={val}
                    style={styles.sliderTick}
                    onTouchEnd={() => onAmountChange(val)}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.sliderLabel}>300</Text>
          </View>
          {/* Stepper buttons */}
          <View style={styles.stepperRow}>
            <StepperButton label="-25" onPress={() => onAmountChange(Math.max(0, amount - 25))} />
            <StepperButton label="-5" onPress={() => onAmountChange(Math.max(0, amount - 5))} />
            <StepperButton label="+5" onPress={() => onAmountChange(Math.min(300, amount + 5))} />
            <StepperButton label="+25" onPress={() => onAmountChange(Math.min(300, amount + 25))} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content</Text>
        <ChipSelector
          options={CONTENT_OPTIONS}
          selected={content ?? ''}
          onSelect={(v) => onContentChange(v as BottleContentType)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Temperature</Text>
        <ChipSelector
          options={TEMP_OPTIONS}
          selected={temperature ?? ''}
          onSelect={(v) => onTemperatureChange(v as 'warm' | 'room' | 'cold')}
        />
      </View>
    </View>
  );
}

function StepperButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.stepperButton} onPress={onPress} accessibilityRole="button">
      <Text style={styles.stepperText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.base,
  },
  amountDisplay: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary[500],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sliderLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    width: 28,
    textAlign: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 36,
    backgroundColor: colors.neutral[100],
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.secondary[200],
    borderRadius: 18,
  },
  sliderTouchArea: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  sliderTick: {
    flex: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stepperButton: {
    minWidth: 56,
    height: 44,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  stepperText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.secondary[500],
  },
});

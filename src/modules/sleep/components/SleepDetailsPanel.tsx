// ============================================================
// Lumina — Sleep Details Panel
// Method, location, room temp, quality, night wakings
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ChipSelector } from '../../../shared/components/ChipSelector';
import { RatingSelector } from '../../../shared/components/RatingSelector';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants/theme';
import type { SleepMethod, SleepLocation, SleepType, Rating } from '../../../shared/types/common';

const METHOD_OPTIONS = [
  { value: 'nursed', label: 'Nursed' },
  { value: 'rocked', label: 'Rocked' },
  { value: 'held', label: 'Held' },
  { value: 'self_soothed', label: 'Self-Soothed' },
  { value: 'patted', label: 'Patted' },
  { value: 'other', label: 'Other' },
];

const LOCATION_OPTIONS = [
  { value: 'crib', label: 'Crib' },
  { value: 'bassinet', label: 'Bassinet' },
  { value: 'cosleep', label: 'Cosleep' },
  { value: 'swing', label: 'Swing' },
  { value: 'carrier', label: 'Carrier' },
  { value: 'other', label: 'Other' },
];

interface Props {
  method: SleepMethod | null;
  location: SleepLocation | null;
  roomTemp: number;
  quality: Rating | null;
  nightWakings: number;
  sleepType: SleepType;
  onMethodChange: (m: SleepMethod) => void;
  onLocationChange: (l: SleepLocation) => void;
  onRoomTempChange: (t: number) => void;
  onQualityChange: (q: Rating) => void;
  onNightWakingsChange: (n: number) => void;
}

export function SleepDetailsPanel({
  method,
  location,
  roomTemp,
  quality,
  nightWakings,
  sleepType,
  onMethodChange,
  onLocationChange,
  onRoomTempChange,
  onQualityChange,
  onNightWakingsChange,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Method</Text>
        <ChipSelector
          options={METHOD_OPTIONS}
          selected={method ?? ''}
          onSelect={(v) => onMethodChange(v as SleepMethod)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <ChipSelector
          options={LOCATION_OPTIONS}
          selected={location ?? ''}
          onSelect={(v) => onLocationChange(v as SleepLocation)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Room Temperature</Text>
        <View style={styles.stepperRow}>
          <Pressable
            style={styles.stepperButton}
            onPress={() => onRoomTempChange(Math.max(15, roomTemp - 0.5))}
            accessibilityLabel="Decrease temperature"
          >
            <Feather name="minus" size={22} color={colors.primary[600]} />
          </Pressable>
          <Text style={styles.tempValue}>{roomTemp.toFixed(1)}°C</Text>
          <Pressable
            style={styles.stepperButton}
            onPress={() => onRoomTempChange(Math.min(30, roomTemp + 0.5))}
            accessibilityLabel="Increase temperature"
          >
            <Feather name="plus" size={22} color={colors.primary[600]} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quality</Text>
        <RatingSelector value={quality} onChange={onQualityChange} />
      </View>

      {sleepType === 'night' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Night Wakings</Text>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepperButton}
              onPress={() => onNightWakingsChange(Math.max(0, nightWakings - 1))}
              accessibilityLabel="Decrease night wakings"
            >
              <Feather name="minus" size={22} color={colors.primary[600]} />
            </Pressable>
            <Text style={styles.tempValue}>{nightWakings}</Text>
            <Pressable
              style={styles.stepperButton}
              onPress={() => onNightWakingsChange(Math.min(20, nightWakings + 1))}
              accessibilityLabel="Increase night wakings"
            >
              <Feather name="plus" size={22} color={colors.primary[600]} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
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
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  stepperButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  tempValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    minWidth: 72,
    textAlign: 'center',
  },
});

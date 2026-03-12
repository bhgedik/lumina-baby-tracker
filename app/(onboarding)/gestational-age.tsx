// ============================================================
// Lumina — Gestational Age (Step 3 of 4)
// Critical for corrected age calculations
// Skips preterm question if user is still pregnant
// ============================================================

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';
import { StepIndicator } from '../../src/shared/components/StepIndicator';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

export default function GestationalAgeScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const isPregnant = store.isPregnant;

  const [wasPreterm, setWasPreterm] = useState<boolean | null>(store.wasPreterm);
  const [weeks, setWeeks] = useState<number | null>(store.gestationalWeeks);

  const pregnantWeekOptions = Array.from({ length: 42 }, (_, i) => i + 1); // 1-42
  const pretermWeekOptions = Array.from({ length: 19 }, (_, i) => i + 22); // 22-40

  // If pregnant, gestational weeks question is about current pregnancy
  const canContinue = isPregnant
    ? weeks !== null
    : wasPreterm !== null && (!wasPreterm || weeks !== null);

  const handleContinue = () => {
    if (isPregnant) {
      store.setGestationalAge({
        wasPreterm: false,
        gestationalWeeks: weeks,
      });
    } else {
      store.setGestationalAge({
        wasPreterm: wasPreterm!,
        gestationalWeeks: wasPreterm ? weeks : null,
      });
    }
    router.push('/(onboarding)/preferences');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Back */}
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={22} color={colors.textSecondary} />
        </Pressable>

        {/* Progress */}
        <StepIndicator currentStep={3} />

        {isPregnant ? (
          <>
            <Text style={styles.title}>Current Pregnancy</Text>
            <Text style={styles.subtitle}>
              How far along are you? This helps us prepare the right content and milestones for when your baby arrives.
            </Text>

            <View style={styles.section}>
              <Text style={styles.label}>How many weeks along are you?</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={weeks}
                  onValueChange={(value) => setWeeks(value as number)}
                  style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select week..." value={null} color={colors.textTertiary} />
                  {pregnantWeekOptions.map((w) => (
                    <Picker.Item key={w} label={`Week ${w}`} value={w} />
                  ))}
                </Picker>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Gestational Age</Text>
            <Text style={styles.subtitle}>
              This is critical for accurate development tracking. Babies born early need corrected age calculations for milestones, sleep, and growth.
            </Text>

            {/* Preterm question */}
            <View style={styles.section}>
              <Text style={styles.label}>Was your baby born before 37 weeks?</Text>
              <View style={styles.optionGroup}>
                <Pressable
                  style={[styles.optionCard, shadows.sm, wasPreterm === true && styles.optionCardSelected]}
                  onPress={() => setWasPreterm(true)}
                >
                  <Feather
                    name="alert-circle"
                    size={20}
                    color={wasPreterm === true ? colors.secondary[600] : colors.textTertiary}
                  />
                  <Text style={[styles.optionLabel, wasPreterm === true && styles.optionLabelSelected]}>
                    Yes, born early
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.optionCard, shadows.sm, wasPreterm === false && styles.optionCardSelected]}
                  onPress={() => { setWasPreterm(false); setWeeks(null); }}
                >
                  <Feather
                    name="check-circle"
                    size={20}
                    color={wasPreterm === false ? colors.primary[600] : colors.textTertiary}
                  />
                  <Text style={[styles.optionLabel, wasPreterm === false && styles.optionLabelSelected]}>
                    No, full term
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Week picker */}
            {wasPreterm && (
              <View style={styles.section}>
                <Text style={styles.label}>At how many weeks was your baby born?</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={weeks}
                    onValueChange={(value) => setWeeks(value as number)}
                    style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
                    itemStyle={styles.pickerItem}
                  >
                    <Picker.Item label="Select week..." value={null} color={colors.textTertiary} />
                    {pretermWeekOptions.map((w) => (
                      <Picker.Item key={w} label={`Week ${w}`} value={w} />
                    ))}
                  </Picker>
                </View>

                {weeks !== null && weeks < 37 && (
                  <View style={[styles.infoBox, shadows.sm]}>
                    <View style={styles.infoHeader}>
                      <Feather name="info" size={16} color={colors.primary[600]} />
                      <Text style={styles.infoTitle}>Corrected Age Enabled</Text>
                    </View>
                    <Text style={styles.infoText}>
                      We'll adjust by {40 - weeks} weeks for all developmental milestones, sleep windows, and growth charts until 24 months corrected. Both ages will always be visible.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Continue */}
        <Pressable
          style={[styles.button, shadows.sm, !canContinue && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Continue</Text>
          <Feather name="arrow-right" size={18} color={colors.textInverse} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: 120 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  title: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.fontSize.base, color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: 22 },
  section: { marginBottom: spacing.xl },
  label: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.md },
  optionGroup: { flexDirection: 'row', gap: spacing.md },
  optionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
  },
  optionCardSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  optionLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.textSecondary },
  optionLabelSelected: { color: colors.primary[700] },
  pickerContainer: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.soft,
  },
  pickerIOS: {
    height: 200,
  },
  pickerAndroid: {
    height: 56,
    paddingHorizontal: spacing.md,
  },
  pickerItem: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  infoBox: {
    marginTop: spacing.base,
    backgroundColor: colors.primary[50],
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  infoTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.primary[700] },
  infoText: { fontSize: typography.fontSize.sm, color: colors.primary[800], lineHeight: 20 },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.textInverse, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
});

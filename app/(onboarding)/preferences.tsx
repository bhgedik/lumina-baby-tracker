// ============================================================
// Sprout — Preferences (Step 4 of 4)
// Final step — saves all data, navigates to main app
// ============================================================

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';
import { StepIndicator } from '../../src/shared/components/StepIndicator';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { fromISO } from '../../src/shared/utils/dateFormat';
import { useAuthStore } from '../../src/stores/authStore';
import { useBabyStore } from '../../src/stores/babyStore';
import { generateUUID } from '../../src/stores/createSyncedStore';
import type { Profile, Family, Baby } from '../../src/modules/baby/types';

export default function PreferencesScreen() {
  const router = useRouter();
  const onboarding = useOnboardingStore();
  const setProfile = useAuthStore((s) => s.setProfile);
  const setFamily = useAuthStore((s) => s.setFamily);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const addBaby = useBabyStore((s) => s.addBaby);
  const setActiveBaby = useBabyStore((s) => s.setActiveBaby);

  const [units, setUnits] = useState<'metric' | 'imperial'>(onboarding.preferredUnits);
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    if (saving) return;
    setSaving(true);

    onboarding.setPreferences({ preferredUnits: units });

    const now = new Date().toISOString();
    const familyId = generateUUID();
    const profileId = generateUUID();
    const babyId = generateUUID();

    // Create Family
    const family: Family = {
      id: familyId,
      name: `${onboarding.parentName}'s Family`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: 'en',
      preferred_units: units,
      emergency_contacts: [],
      created_at: now,
      updated_at: now,
    };

    // Create Profile
    const profile: Profile = {
      id: profileId,
      family_id: familyId,
      email: '',
      display_name: onboarding.parentName,
      role: 'primary',
      experience_level: onboarding.experienceLevel ?? 'first_time',
      delivery_method: null,
      avatar_url: null,
      notification_preferences: {
        feeding_reminders: true,
        milestone_alerts: true,
        ai_insights: true,
        wellness_checkins: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '07:00',
      },
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    };

    // Create Baby
    const isPreterm = !onboarding.isPregnant && onboarding.wasPreterm === true && onboarding.gestationalWeeks !== null && onboarding.gestationalWeeks < 37;
    const baby: Baby = {
      id: babyId,
      family_id: familyId,
      name: onboarding.babyName,
      date_of_birth: onboarding.isPregnant ? '' : onboarding.dateOfBirth,
      due_date: onboarding.isPregnant ? onboarding.dueDate : null,
      gestational_age_weeks: isPreterm ? onboarding.gestationalWeeks : (onboarding.isPregnant ? onboarding.gestationalWeeks : null),
      gestational_age_days: isPreterm && onboarding.gestationalWeeks ? onboarding.gestationalWeeks * 7 : 280,
      gender: onboarding.isPregnant ? 'other' : (onboarding.gender ?? 'other'),
      blood_type: null,
      birth_weight_grams: null,
      birth_length_cm: null,
      birth_head_circumference_cm: null,
      photo_url: null,
      notes: null,
      is_active: true,
      is_pregnant: onboarding.isPregnant,
      is_multiple: false,
      primary_feeding_method: onboarding.isPregnant ? 'mixed' : (onboarding.feedingMethod ?? 'mixed'),
      known_allergies: [],
      chronic_conditions: [],
      uses_adjusted_milestones: isPreterm,
      created_at: now,
      updated_at: now,
    };

    // Save to stores
    setFamily(family);
    setProfile(profile);
    addBaby(baby);
    setActiveBaby(babyId);
    completeOnboarding();
    onboarding.markCompleted();

    // Small delay for stores to persist, then navigate
    setTimeout(() => {
      router.replace('/(app)/(tabs)/home');
    }, 100);
  };

  const rawDate = onboarding.isPregnant ? onboarding.dueDate : onboarding.dateOfBirth;
  const displayDate = fromISO(rawDate, units === 'imperial');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Back */}
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={22} color={colors.textSecondary} />
        </Pressable>

        {/* Progress */}
        <StepIndicator currentStep={4} />

        <Text style={styles.title}>Almost There!</Text>
        <Text style={styles.subtitle}>Just one more preference, then you're all set.</Text>

        {/* Units */}
        <View style={styles.section}>
          <Text style={styles.label}>Measurement units</Text>
          <View style={styles.optionGroup}>
            <Pressable
              style={[styles.optionCard, shadows.sm, units === 'metric' && styles.optionCardSelected]}
              onPress={() => setUnits('metric')}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: units === 'metric' ? colors.primary[100] : colors.neutral[50] }]}>
                <Feather name="thermometer" size={20} color={units === 'metric' ? colors.primary[600] : colors.textTertiary} />
              </View>
              <Text style={[styles.optionLabel, units === 'metric' && styles.optionLabelSelected]}>Metric</Text>
              <Text style={styles.optionHint}>kg, cm, °C, ml</Text>
            </Pressable>
            <Pressable
              style={[styles.optionCard, shadows.sm, units === 'imperial' && styles.optionCardSelected]}
              onPress={() => setUnits('imperial')}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: units === 'imperial' ? colors.primary[100] : colors.neutral[50] }]}>
                <Feather name="thermometer" size={20} color={units === 'imperial' ? colors.primary[600] : colors.textTertiary} />
              </View>
              <Text style={[styles.optionLabel, units === 'imperial' && styles.optionLabelSelected]}>Imperial</Text>
              <Text style={styles.optionHint}>lb, in, °F, oz</Text>
            </Pressable>
          </View>
        </View>

        {/* Summary */}
        <View style={[styles.summaryCard, shadows.soft]}>
          <Text style={styles.summaryTitle}>Your Setup</Text>
          <View style={styles.summaryRow}>
            <Feather name="user" size={15} color={colors.primary[500]} />
            <Text style={styles.summaryText}>{onboarding.parentName || 'Parent'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Feather name="heart" size={15} color={colors.secondary[400]} />
            <Text style={styles.summaryText}>
              {onboarding.babyName || (onboarding.isPregnant ? 'Your little one' : 'Baby')} — {onboarding.isPregnant ? `due ${displayDate || '...'}` : `born ${displayDate || '...'}`}
            </Text>
          </View>
          {!onboarding.isPregnant && onboarding.wasPreterm && onboarding.gestationalWeeks && (
            <View style={styles.summaryRow}>
              <Feather name="info" size={15} color={colors.warning} />
              <Text style={styles.summaryText}>
                Born at {onboarding.gestationalWeeks} weeks — corrected age enabled
              </Text>
            </View>
          )}
          {onboarding.isPregnant && onboarding.gestationalWeeks && (
            <View style={styles.summaryRow}>
              <Feather name="info" size={15} color={colors.secondary[400]} />
              <Text style={styles.summaryText}>
                Currently {onboarding.gestationalWeeks} weeks pregnant
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Feather name="settings" size={15} color={colors.textTertiary} />
            <Text style={styles.summaryText}>
              {units === 'metric' ? 'Metric' : 'Imperial'} units
            </Text>
          </View>
        </View>

        {/* CTA */}
        <Pressable
          style={[styles.button, shadows.md]}
          onPress={handleComplete}
          disabled={saving}
          accessibilityRole="button"
        >
          {saving ? (
            <Text style={styles.buttonText}>Setting up...</Text>
          ) : (
            <>
              <Feather name="check-circle" size={20} color={colors.textInverse} />
              <Text style={styles.buttonText}>Start Using Sprout</Text>
            </>
          )}
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
  subtitle: { fontSize: typography.fontSize.base, color: colors.textSecondary, marginBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  label: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.md },
  optionGroup: { flexDirection: 'row', gap: spacing.md },
  optionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.base,
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionCardSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
  optionLabelSelected: { color: colors.primary[700] },
  optionHint: { fontSize: typography.fontSize.xs, color: colors.textTertiary },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonText: { color: colors.textInverse, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
});

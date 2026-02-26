// ============================================================
// Sprout — Baby Profile (Step 2 of 4)
// Collects baby name, DOB/due date, gender, feeding method
// Supports pregnancy mode + locale-aware date formatting
// ============================================================

import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, Switch, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';
import { StepIndicator } from '../../src/shared/components/StepIndicator';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { useDateFormat } from '../../src/shared/hooks/useDateFormat';
import type { Gender, PrimaryFeedingMethod } from '../../src/shared/types/common';

const FEEDING_OPTIONS: { value: PrimaryFeedingMethod; label: string; description: string }[] = [
  { value: 'breast_only', label: 'Breast', description: 'Breastfeeding only' },
  { value: 'formula_only', label: 'Formula', description: 'Formula only' },
  { value: 'mixed', label: 'Mixed', description: 'Both breast & formula' },
];

export default function BabyProfileScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { formatDateInput, toISO, fromISO, placeholder: DATE_PLACEHOLDER } = useDateFormat();

  const [name, setName] = useState(store.babyName);
  const [dateDisplay, setDateDisplay] = useState(() => fromISO(store.isPregnant ? store.dueDate : store.dateOfBirth));
  const [gender, setGender] = useState<Gender | null>(store.gender);
  const [feedingMethod, setFeedingMethod] = useState<PrimaryFeedingMethod | null>(store.feedingMethod);
  const [isPregnant, setIsPregnant] = useState(store.isPregnant);

  const dateIsValid = useMemo(() => {
    const iso = toISO(dateDisplay);
    if (!iso || iso.length !== 10) return false;
    const d = new Date(iso);
    return !isNaN(d.getTime());
  }, [dateDisplay, toISO]);

  const canContinue = isPregnant
    ? dateDisplay.length >= 10 && dateIsValid
    : name.trim().length > 0 && dateDisplay.length >= 10 && dateIsValid && gender !== null && feedingMethod !== null;

  const handleContinue = () => {
    const isoDate = toISO(dateDisplay);
    store.setBabyProfile({
      babyName: name.trim(),
      dateOfBirth: isPregnant ? '' : isoDate,
      gender: gender!,
      feedingMethod: feedingMethod!,
      isPregnant,
      dueDate: isPregnant ? isoDate : '',
    });
    router.push('/(onboarding)/gestational-age');
  };

  const handleDateChange = (text: string) => {
    setDateDisplay(formatDateInput(text));
  };

  const handleTogglePregnant = (value: boolean) => {
    setIsPregnant(value);
    setDateDisplay(''); // reset date when toggling
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
            <Feather name="chevron-left" size={22} color={colors.textSecondary} />
          </Pressable>

          {/* Progress */}
          <StepIndicator currentStep={2} />

          <Text style={styles.title}>Your Little One</Text>
          <Text style={styles.subtitle}>Tell us about your baby</Text>

          {/* Pregnancy toggle — first question */}
          <View style={styles.pregnancyToggle}>
            <View style={styles.pregnancyTextWrap}>
              <Feather name="heart" size={18} color={isPregnant ? colors.secondary[500] : colors.textTertiary} />
              <Text style={[styles.pregnancyLabel, isPregnant && { color: colors.secondary[600] }]}>
                I'm still pregnant
              </Text>
            </View>
            <Switch
              value={isPregnant}
              onValueChange={handleTogglePregnant}
              trackColor={{ false: colors.neutral[200], true: colors.secondary[300] }}
              thumbColor={isPregnant ? colors.secondary[500] : colors.neutral[50]}
            />
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.label}>{isPregnant ? 'Have you decided on a name yet?' : "Baby's name"}</Text>
            <TextInput
              style={styles.input}
              placeholder={isPregnant ? 'Optional — You can add this later' : "What's their name?"}
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoFocus
            />
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>{isPregnant ? 'Estimated due date' : 'Date of birth'}</Text>
            <View style={styles.inputWithIcon}>
              <Feather name="calendar" size={18} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.inputInner}
                placeholder={DATE_PLACEHOLDER}
                placeholderTextColor={colors.textTertiary}
                value={dateDisplay}
                onChangeText={handleDateChange}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* Gender — hidden when pregnant */}
          {!isPregnant && (
            <View style={styles.section}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderShortRow}>
                <Pressable
                  style={[styles.genderChip, gender === 'female' && styles.genderChipSelected]}
                  onPress={() => setGender('female')}
                >
                  <Feather
                    name="smile"
                    size={18}
                    color={gender === 'female' ? colors.primary[600] : colors.textTertiary}
                  />
                  <Text style={[styles.genderChipText, gender === 'female' && styles.genderChipTextSelected]}>
                    Girl
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.genderChip, gender === 'male' && styles.genderChipSelected]}
                  onPress={() => setGender('male')}
                >
                  <Feather
                    name="smile"
                    size={18}
                    color={gender === 'male' ? colors.primary[600] : colors.textTertiary}
                  />
                  <Text style={[styles.genderChipText, gender === 'male' && styles.genderChipTextSelected]}>
                    Boy
                  </Text>
                </Pressable>
              </View>
              <Pressable
                style={[styles.genderChipWide, gender === 'other' && styles.genderChipSelected]}
                onPress={() => setGender('other')}
              >
                <Feather
                  name="heart"
                  size={18}
                  color={gender === 'other' ? colors.primary[600] : colors.textTertiary}
                />
                <Text style={[styles.genderChipText, gender === 'other' && styles.genderChipTextSelected]}>
                  I don't want to specify
                </Text>
              </Pressable>
            </View>
          )}

          {/* Feeding method — hidden when pregnant */}
          {!isPregnant && (
            <View style={styles.section}>
              <Text style={styles.label}>Primary feeding method</Text>
              <View style={styles.feedingOptions}>
                {FEEDING_OPTIONS.map((f) => (
                  <Pressable
                    key={f.value}
                    style={[styles.feedingCard, shadows.sm, feedingMethod === f.value && styles.feedingCardSelected]}
                    onPress={() => setFeedingMethod(f.value)}
                  >
                    <Text style={[styles.feedingLabel, feedingMethod === f.value && styles.feedingLabelSelected]}>
                      {f.label}
                    </Text>
                    <Text style={styles.feedingDescription}>{f.description}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.hint}>We use this to show you relevant content only</Text>
            </View>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
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
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.base,
  },
  inputIcon: { marginRight: spacing.sm },
  inputInner: {
    flex: 1,
    paddingVertical: spacing.base,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  pregnancyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
  },
  pregnancyTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pregnancyLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  genderShortRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.surface,
  },
  genderChipWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.surface,
  },
  genderChipSelected: { borderColor: colors.primary[400], backgroundColor: colors.primary[50] },
  genderChipText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  genderChipTextSelected: { color: colors.primary[600], fontWeight: typography.fontWeight.semibold },
  feedingOptions: { gap: spacing.sm },
  feedingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
  },
  feedingCardSelected: {
    borderColor: colors.secondary[400],
    backgroundColor: colors.secondary[50],
  },
  feedingLabel: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary, marginBottom: 2 },
  feedingLabelSelected: { color: colors.secondary[600] },
  feedingDescription: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  hint: { fontSize: typography.fontSize.xs, color: colors.textTertiary, marginTop: spacing.sm },
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

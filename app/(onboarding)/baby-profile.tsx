// ============================================================
// Sprouty — Baby Profile (Quiz Step 1 of 3)
// Collects baby name, DOB/due date, gender, feeding method,
// and gestational age (absorbed from gestational-age screen)
// ============================================================

import { useState, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, Switch, KeyboardAvoidingView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';
import { QuizProgressBar } from '../../src/shared/components/QuizProgressBar';
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

  // Gestational age (absorbed from gestational-age.tsx)
  const [wasPreterm, setWasPreterm] = useState<boolean | null>(store.wasPreterm);
  const [gestationalWeeks, setGestationalWeeks] = useState<number | null>(store.gestationalWeeks);

  const pregnantWeekOptions = Array.from({ length: 42 }, (_, i) => i + 1); // 1-42
  const pretermWeekOptions = Array.from({ length: 19 }, (_, i) => i + 22); // 22-40

  const [nameFocused, setNameFocused] = useState(false);
  const nameFocusAnim = useRef(new Animated.Value(0)).current;
  const [dateFocused, setDateFocused] = useState(false);
  const dateFocusAnim = useRef(new Animated.Value(0)).current;

  const animateFocus = (anim: Animated.Value, focused: boolean) => {
    Animated.timing(anim, { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  };
  const nameBorderColor = nameFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neutral[100], colors.primary[400]],
  });
  const dateBorderColor = dateFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neutral[100], colors.primary[400]],
  });

  const dateIsValid = useMemo(() => {
    const iso = toISO(dateDisplay);
    if (!iso || iso.length !== 10) return false;
    const d = new Date(iso);
    return !isNaN(d.getTime());
  }, [dateDisplay, toISO]);

  const canContinue = isPregnant
    ? dateDisplay.length >= 10 && dateIsValid && gestationalWeeks !== null
    : name.trim().length > 0 && dateDisplay.length >= 10 && dateIsValid && wasPreterm !== null && (!wasPreterm || gestationalWeeks !== null);

  const handleContinue = () => {
    const isoDate = toISO(dateDisplay);
    store.setBabyProfile({
      babyName: name.trim(),
      dateOfBirth: isPregnant ? '' : isoDate,
      gender: gender ?? 'other',
      feedingMethod: feedingMethod ?? 'mixed',
      isPregnant,
      dueDate: isPregnant ? isoDate : '',
    });
    // Save gestational age data
    if (isPregnant) {
      store.setGestationalAge({ wasPreterm: false, gestationalWeeks });
    } else {
      store.setGestationalAge({ wasPreterm: wasPreterm!, gestationalWeeks: wasPreterm ? gestationalWeeks : null });
    }
    router.push('/(onboarding)/parent-profile');
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
          <QuizProgressBar currentStep={1} totalSteps={3} />

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
            <Animated.View
              style={[
                styles.softInput,
                { borderColor: nameBorderColor },
                nameFocused && styles.softInputFocused,
              ]}
            >
              <TextInput
                style={styles.softInputField}
                placeholder={isPregnant ? 'Optional — You can add this later' : "What's their name?"}
                placeholderTextColor={colors.neutral[300]}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoFocus
                onFocus={() => { setNameFocused(true); animateFocus(nameFocusAnim, true); }}
                onBlur={() => { setNameFocused(false); animateFocus(nameFocusAnim, false); }}
              />
            </Animated.View>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>{isPregnant ? 'Estimated due date' : 'Date of birth'}</Text>
            <Animated.View
              style={[
                styles.softInput,
                styles.softInputWithIcon,
                { borderColor: dateBorderColor },
                dateFocused && styles.softInputFocused,
              ]}
            >
              <Feather name="calendar" size={18} color={dateFocused ? colors.primary[500] : colors.neutral[300]} />
              <TextInput
                style={styles.softInputFieldInner}
                placeholder={DATE_PLACEHOLDER}
                placeholderTextColor={colors.neutral[300]}
                value={dateDisplay}
                onChangeText={handleDateChange}
                keyboardType="number-pad"
                maxLength={10}
                onFocus={() => { setDateFocused(true); animateFocus(dateFocusAnim, true); }}
                onBlur={() => { setDateFocused(false); animateFocus(dateFocusAnim, false); }}
              />
            </Animated.View>
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

          {/* Gestational age — pregnancy weeks or preterm question */}
          {isPregnant ? (
            <View style={styles.section}>
              <Text style={styles.label}>How many weeks along are you?</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={gestationalWeeks}
                  onValueChange={(value) => setGestationalWeeks(value as number)}
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
          ) : (
            <View style={styles.section}>
              <Text style={styles.label}>Was your baby born before 37 weeks?</Text>
              <View style={styles.pretermRow}>
                <Pressable
                  style={[styles.pretermCard, shadows.sm, wasPreterm === true && styles.pretermCardSelected]}
                  onPress={() => setWasPreterm(true)}
                >
                  <Feather name="alert-circle" size={20} color={wasPreterm === true ? colors.secondary[600] : colors.textTertiary} />
                  <Text style={[styles.pretermLabel, wasPreterm === true && styles.pretermLabelSelected]}>Yes, born early</Text>
                </Pressable>
                <Pressable
                  style={[styles.pretermCard, shadows.sm, wasPreterm === false && styles.pretermCardSelected]}
                  onPress={() => { setWasPreterm(false); setGestationalWeeks(null); }}
                >
                  <Feather name="check-circle" size={20} color={wasPreterm === false ? colors.primary[600] : colors.textTertiary} />
                  <Text style={[styles.pretermLabel, wasPreterm === false && styles.pretermLabelSelected]}>No, full term</Text>
                </Pressable>
              </View>

              {wasPreterm && (
                <>
                  <Text style={[styles.label, { marginTop: spacing.base }]}>At how many weeks was your baby born?</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={gestationalWeeks}
                      onValueChange={(value) => setGestationalWeeks(value as number)}
                      style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
                      itemStyle={styles.pickerItem}
                    >
                      <Picker.Item label="Select week..." value={null} color={colors.textTertiary} />
                      {pretermWeekOptions.map((w) => (
                        <Picker.Item key={w} label={`Week ${w}`} value={w} />
                      ))}
                    </Picker>
                  </View>
                  {gestationalWeeks !== null && gestationalWeeks < 37 && (
                    <View style={[styles.infoBox, shadows.sm]}>
                      <View style={styles.infoHeader}>
                        <Feather name="info" size={16} color={colors.primary[600]} />
                        <Text style={styles.infoTitle}>Corrected Age Enabled</Text>
                      </View>
                      <Text style={styles.infoText}>
                        We'll adjust by {40 - gestationalWeeks} weeks for all developmental milestones, sleep windows, and growth charts until 24 months corrected.
                      </Text>
                    </View>
                  )}
                </>
              )}
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
  softInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  softInputFocused: {
    shadowColor: colors.primary[500],
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  softInputField: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base + 2,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  softInputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  softInputFieldInner: {
    flex: 1,
    paddingVertical: spacing.base + 2,
    paddingLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
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
  pretermRow: { flexDirection: 'row', gap: spacing.md },
  pretermCard: {
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
  pretermCardSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  pretermLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.textSecondary },
  pretermLabelSelected: { color: colors.primary[700] },
  pickerContainer: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.soft,
  },
  pickerIOS: { height: 200 },
  pickerAndroid: { height: 56, paddingHorizontal: spacing.md },
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

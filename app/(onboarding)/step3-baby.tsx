// ============================================================
// Lumina — Step 3: The Baby
// Baby name (optional), gender, DOB, preterm question
// No feeding method — that comes later in-app
// ============================================================

import { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';
import { QuizProgressBar } from '../../src/shared/components/QuizProgressBar';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { useDateFormat } from '../../src/shared/hooks/useDateFormat';
import type { Gender } from '../../src/shared/types/common';

const pretermWeekOptions = Array.from({ length: 19 }, (_, i) => i + 22); // 22-40

export default function Step3BabyScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { formatDateInput, toISO, fromISO, placeholder: DATE_PLACEHOLDER } = useDateFormat();

  const [name, setName] = useState(store.babyName);
  const [gender, setGender] = useState<Gender | null>(store.gender);
  const [dateDisplay, setDateDisplay] = useState(() => fromISO(store.dateOfBirth));
  const [wasPreterm, setWasPreterm] = useState<boolean | null>(store.wasPreterm);
  const [gestationalWeeks, setGestationalWeeks] = useState<number | null>(store.gestationalWeeks);

  const [nameFocused, setNameFocused] = useState(false);
  const nameFocusAnim = useRef(new Animated.Value(0)).current;
  const nameBorderColor = nameFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neutral[100], colors.primary[400]],
  });

  const [dateFocused, setDateFocused] = useState(false);
  const dateFocusAnim = useRef(new Animated.Value(0)).current;
  const dateBorderColor = dateFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neutral[100], colors.primary[400]],
  });

  const dateIsValid = useMemo(() => {
    const iso = toISO(dateDisplay);
    if (!iso || iso.length !== 10) return false;
    return !isNaN(new Date(iso).getTime());
  }, [dateDisplay, toISO]);

  const canContinue =
    dateDisplay.length >= 10 &&
    dateIsValid &&
    wasPreterm !== null &&
    (!wasPreterm || gestationalWeeks !== null);

  const handleGenderPress = (g: Gender) => {
    Haptics.selectionAsync();
    setGender(g);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isoDate = toISO(dateDisplay);
    store.setBabyProfile({
      babyName: name.trim(),
      dateOfBirth: isoDate,
      gender: gender ?? 'other',
      feedingMethod: store.feedingMethod ?? 'mixed',
      isPregnant: false,
      dueDate: '',
    });
    store.setGestationalAge({
      wasPreterm: wasPreterm!,
      gestationalWeeks: wasPreterm ? gestationalWeeks : null,
    });
    router.push('/(onboarding)/step4-focus');
  };

  const animateFocus = (anim: Animated.Value, focused: boolean) => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable
            style={styles.backButton}
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
            accessibilityLabel="Go back"
          >
            <Feather name="chevron-left" size={22} color={colors.textSecondary} />
          </Pressable>

          {/* Progress */}
          <QuizProgressBar currentStep={3} totalSteps={4} />

          <Text style={styles.title}>Your Little One</Text>
          <Text style={styles.subtitle}>Tell us about your baby</Text>

          {/* Name (optional) */}
          <View style={styles.section}>
            <Text style={styles.label}>Baby's name</Text>
            <Animated.View
              style={[
                styles.inputWrap,
                { borderColor: nameBorderColor },
                nameFocused && styles.inputWrapFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Optional — you can add this later"
                placeholderTextColor={colors.neutral[300]}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoFocus
                onFocus={() => {
                  setNameFocused(true);
                  animateFocus(nameFocusAnim, true);
                }}
                onBlur={() => {
                  setNameFocused(false);
                  animateFocus(nameFocusAnim, false);
                }}
              />
            </Animated.View>
          </View>

          {/* Gender */}
          <View style={styles.section}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              <Pressable
                style={[styles.genderChip, gender === 'female' && styles.genderChipSelected]}
                onPress={() => handleGenderPress('female')}
              >
                <Feather
                  name="smile"
                  size={18}
                  color={gender === 'female' ? colors.primary[600] : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.genderChipText,
                    gender === 'female' && styles.genderChipTextSelected,
                  ]}
                >
                  Girl
                </Text>
              </Pressable>
              <Pressable
                style={[styles.genderChip, gender === 'male' && styles.genderChipSelected]}
                onPress={() => handleGenderPress('male')}
              >
                <Feather
                  name="smile"
                  size={18}
                  color={gender === 'male' ? colors.primary[600] : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.genderChipText,
                    gender === 'male' && styles.genderChipTextSelected,
                  ]}
                >
                  Boy
                </Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.genderChipWide, gender === 'other' && styles.genderChipSelected]}
              onPress={() => handleGenderPress('other')}
            >
              <Feather
                name="heart"
                size={18}
                color={gender === 'other' ? colors.primary[600] : colors.textTertiary}
              />
              <Text
                style={[
                  styles.genderChipText,
                  gender === 'other' && styles.genderChipTextSelected,
                ]}
              >
                I don't want to specify
              </Text>
            </Pressable>
          </View>

          {/* Date of birth */}
          <View style={styles.section}>
            <Text style={styles.label}>Date of birth</Text>
            <Animated.View
              style={[
                styles.inputWrap,
                styles.inputWithIcon,
                { borderColor: dateBorderColor },
                dateFocused && styles.inputWrapFocused,
              ]}
            >
              <Feather
                name="calendar"
                size={18}
                color={dateFocused ? colors.primary[500] : colors.neutral[300]}
              />
              <TextInput
                style={styles.inputInner}
                placeholder={DATE_PLACEHOLDER}
                placeholderTextColor={colors.neutral[300]}
                value={dateDisplay}
                onChangeText={(t) => setDateDisplay(formatDateInput(t))}
                keyboardType="number-pad"
                maxLength={10}
                onFocus={() => {
                  setDateFocused(true);
                  animateFocus(dateFocusAnim, true);
                }}
                onBlur={() => {
                  setDateFocused(false);
                  animateFocus(dateFocusAnim, false);
                }}
              />
            </Animated.View>
          </View>

          {/* Preterm question */}
          <View style={styles.section}>
            <Text style={styles.label}>Was your baby born before 37 weeks?</Text>
            <View style={styles.pretermRow}>
              <Pressable
                style={[
                  styles.pretermCard,
                  shadows.sm,
                  wasPreterm === true && styles.pretermCardSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setWasPreterm(true);
                }}
              >
                <Feather
                  name="alert-circle"
                  size={20}
                  color={wasPreterm === true ? colors.secondary[600] : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.pretermLabel,
                    wasPreterm === true && styles.pretermLabelSelected,
                  ]}
                >
                  Yes, born early
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.pretermCard,
                  shadows.sm,
                  wasPreterm === false && styles.pretermCardSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setWasPreterm(false);
                  setGestationalWeeks(null);
                }}
              >
                <Feather
                  name="check-circle"
                  size={20}
                  color={wasPreterm === false ? colors.primary[600] : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.pretermLabel,
                    wasPreterm === false && styles.pretermLabelSelected,
                  ]}
                >
                  No, full term
                </Text>
              </Pressable>
            </View>

            {wasPreterm && (
              <>
                <Text style={[styles.label, { marginTop: spacing.base }]}>
                  At how many weeks was your baby born?
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={gestationalWeeks}
                    onValueChange={(v) => {
                      Haptics.selectionAsync();
                      setGestationalWeeks(v as number);
                    }}
                    style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
                    itemStyle={styles.pickerItem}
                  >
                    <Picker.Item
                      label="Select week..."
                      value={null}
                      color={colors.textTertiary}
                    />
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
                      We'll adjust by {40 - gestationalWeeks} weeks for all developmental
                      milestones, sleep windows, and growth charts until 24 months corrected.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

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
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  section: { marginBottom: spacing.xl },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputWrap: {
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
  inputWrapFocused: {
    shadowColor: colors.primary[500],
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base + 2,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  inputInner: {
    flex: 1,
    paddingVertical: spacing.base + 2,
    paddingLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  genderRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
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
  genderChipSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  genderChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  genderChipTextSelected: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
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
  pretermLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
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
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[800],
    lineHeight: 20,
  },
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
  buttonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

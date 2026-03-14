// ============================================================
// Lumina — Step 1: The Parent
// "Let's start with you" — name + first child toggle
// ============================================================

import { useState, useRef } from 'react';
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
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';
import { QuizProgressBar } from '../../src/shared/components/QuizProgressBar';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

const OPTION_STYLES: Record<string, { bg: string; fg: string }> = {
  star: { bg: '#FFF3D6', fg: '#F5A623' },
  users: { bg: '#EDE7F6', fg: '#7C4DFF' },
};

export default function Step1ParentScreen() {
  const router = useRouter();
  const store = useOnboardingStore();

  const [parentName, setParentName] = useState(store.parentName);
  const [experienceLevel, setExperienceLevel] = useState<'first_time' | 'experienced' | null>(
    store.experienceLevel,
  );
  const [nameFocused, setNameFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const animatedBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neutral[100], colors.primary[400]],
  });

  const canContinue = parentName.trim().length > 0;

  const handleOptionPress = (level: 'first_time' | 'experienced') => {
    Haptics.selectionAsync();
    setExperienceLevel(level);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    store.setParentProfile({
      parentName: parentName.trim(),
      experienceLevel: experienceLevel ?? 'first_time',
    });
    router.push('/(onboarding)/step2-journey');
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
          <QuizProgressBar currentStep={1} totalSteps={4} />

          <Text style={styles.title}>Welcome to Lumina</Text>
          <Text style={styles.subtitle}>First, how should we address you?</Text>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.label}>What should we call you?</Text>
            <Animated.View
              style={[
                styles.inputWrap,
                { borderColor: animatedBorderColor },
                nameFocused && styles.inputWrapFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={colors.neutral[300]}
                value={parentName}
                onChangeText={setParentName}
                autoCapitalize="words"
                autoFocus
                onFocus={() => {
                  setNameFocused(true);
                  Animated.timing(focusAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: false,
                  }).start();
                }}
                onBlur={() => {
                  setNameFocused(false);
                  Animated.timing(focusAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                  }).start();
                }}
              />
            </Animated.View>
          </View>

          {/* Experience */}
          <View style={styles.section}>
            <Text style={styles.label}>Is this your first child?</Text>
            <View style={styles.optionGroup}>
              <Pressable
                style={[
                  styles.optionCard,
                  experienceLevel === 'first_time'
                    ? [styles.optionCardSelected, shadows.md]
                    : shadows.sm,
                ]}
                onPress={() => handleOptionPress('first_time')}
              >
                <View style={[styles.optionIconWrap, { backgroundColor: OPTION_STYLES.star.bg }]}>
                  <Feather name="star" size={20} color={OPTION_STYLES.star.fg} />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text
                    style={[
                      styles.optionLabel,
                      experienceLevel === 'first_time' && styles.optionLabelSelected,
                    ]}
                  >
                    Yes, first time!
                  </Text>
                  <Text style={styles.optionDescription}>We'll guide you through everything</Text>
                </View>
                {experienceLevel === 'first_time' && (
                  <Feather
                    name="check-circle"
                    size={20}
                    color={colors.primary[500]}
                    style={styles.optionCheck}
                  />
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.optionCard,
                  experienceLevel === 'experienced'
                    ? [styles.optionCardSelected, shadows.md]
                    : shadows.sm,
                ]}
                onPress={() => handleOptionPress('experienced')}
              >
                <View style={[styles.optionIconWrap, { backgroundColor: OPTION_STYLES.users.bg }]}>
                  <Feather name="users" size={20} color={OPTION_STYLES.users.fg} />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text
                    style={[
                      styles.optionLabel,
                      experienceLevel === 'experienced' && styles.optionLabelSelected,
                    ]}
                  >
                    Experienced parent
                  </Text>
                  <Text style={styles.optionDescription}>We'll skip the basics</Text>
                </View>
                {experienceLevel === 'experienced' && (
                  <Feather
                    name="check-circle"
                    size={20}
                    color={colors.primary[500]}
                    style={styles.optionCheck}
                  />
                )}
              </Pressable>
            </View>
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
  optionGroup: { gap: spacing.md },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.base,
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
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
    marginRight: spacing.md,
  },
  optionTextWrap: { flex: 1 },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  optionLabelSelected: { color: colors.primary[700] },
  optionDescription: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  optionCheck: { marginLeft: spacing.sm },
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

// ============================================================
// Sprout — Parent Profile (Step 1 of 4)
// Collects parent name, experience level
// ============================================================

import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';
import { StepIndicator } from '../../src/shared/components/StepIndicator';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

export default function ParentProfileScreen() {
  const router = useRouter();
  const store = useOnboardingStore();

  const [parentName, setParentName] = useState(store.parentName);
  const [experienceLevel, setExperienceLevel] = useState<'first_time' | 'experienced' | null>(store.experienceLevel);

  const canContinue = parentName.trim().length > 0 && experienceLevel !== null;

  const handleContinue = () => {
    store.setParentProfile({
      parentName: parentName.trim(),
      experienceLevel: experienceLevel!,
    });
    router.push('/(onboarding)/baby-profile');
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
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
            <Feather name="chevron-left" size={22} color={colors.textSecondary} />
          </Pressable>

          {/* Progress */}
          <StepIndicator currentStep={1} />

          <Text style={styles.title}>About You</Text>
          <Text style={styles.subtitle}>Let's start with a little about you</Text>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.label}>What should we call you?</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
              value={parentName}
              onChangeText={setParentName}
              autoCapitalize="words"
              autoFocus
            />
          </View>

          {/* Experience */}
          <View style={styles.section}>
            <Text style={styles.label}>Is this your first baby?</Text>
            <View style={styles.optionGroup}>
              <OptionCard
                icon="star"
                label="Yes, first time!"
                description="We'll guide you through everything"
                selected={experienceLevel === 'first_time'}
                onPress={() => setExperienceLevel('first_time')}
              />
              <OptionCard
                icon="users"
                label="Experienced parent"
                description="We'll skip the basics"
                selected={experienceLevel === 'experienced'}
                onPress={() => setExperienceLevel('experienced')}
              />
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

// Vibrant icon colors per option
const OPTION_ICON_COLORS: Record<string, { bg: string; fg: string }> = {
  star: { bg: '#FFF3D6', fg: '#F5A623' },
  users: { bg: '#EDE7F6', fg: '#7C4DFF' },
};

function OptionCard({
  icon,
  label,
  description,
  selected,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  const palette = OPTION_ICON_COLORS[icon] ?? { bg: colors.neutral[50], fg: colors.textTertiary };
  return (
    <Pressable
      style={[styles.optionCard, selected ? [styles.optionCardSelected, shadows.md] : shadows.sm]}
      onPress={onPress}
    >
      <View style={[styles.optionIconWrap, { backgroundColor: palette.bg }]}>
        <Feather name={icon} size={20} color={palette.fg} />
      </View>
      <View style={styles.optionTextWrap}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      {selected && (
        <Feather name="check-circle" size={20} color={colors.primary[500]} style={styles.optionCheck} />
      )}
    </Pressable>
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
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary, marginBottom: 2 },
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
  buttonText: { color: colors.textInverse, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
});

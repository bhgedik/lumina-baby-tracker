// ============================================================
// Lumina — Step 4: Primary Focus
// "What's your primary focus right now?"
// Updated options: Sleep, Feeds, Patterns, Reassurance
// ============================================================

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';
import { QuizProgressBar } from '../../src/shared/components/QuizProgressBar';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

type Challenge = 'sleep' | 'feeding' | 'fussy' | 'all';

const FOCUS_OPTIONS: {
  value: Challenge;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  iconColors: { bg: string; fg: string };
}[] = [
  {
    value: 'sleep',
    icon: 'moon',
    label: 'Sleep',
    description: 'Help them sleep longer and better',
    iconColors: { bg: '#E8E0F0', fg: '#7C4DFF' },
  },
  {
    value: 'feeding',
    icon: 'droplet',
    label: 'Feeding',
    description: 'Track feeds, find a rhythm',
    iconColors: { bg: '#FFF3D6', fg: '#F5A623' },
  },
  {
    value: 'fussy',
    icon: 'bar-chart-2',
    label: 'Patterns',
    description: 'Discover what works and when',
    iconColors: { bg: '#E0F0E8', fg: colors.primary[600] },
  },
  {
    value: 'all',
    icon: 'shield',
    label: 'Reassurance',
    description: "Just tell me everything's okay",
    iconColors: { bg: '#FDEAEA', fg: '#E57373' },
  },
];

export default function Step4FocusScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const parentName = store.parentName || 'there';
  const [selected, setSelected] = useState<Challenge | null>(store.currentChallenge);

  const canContinue = selected !== null;

  const handleSelect = (value: Challenge) => {
    Haptics.selectionAsync();
    setSelected(value);
  };

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    store.setCurrentChallenge({ currentChallenge: selected });
    router.push('/(onboarding)/analyzing');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
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
        <QuizProgressBar currentStep={4} totalSteps={4} />

        <Text style={styles.title}>Almost there, {parentName}!</Text>
        <Text style={styles.subtitle}>What's your primary focus right now?</Text>

        {/* Options */}
        <View style={styles.optionGroup}>
          {FOCUS_OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[
                  styles.optionCard,
                  isSelected ? [styles.optionCardSelected, shadows.md] : shadows.sm,
                ]}
                onPress={() => handleSelect(opt.value)}
              >
                <View style={[styles.optionIconWrap, { backgroundColor: opt.iconColors.bg }]}>
                  <Feather name={opt.icon} size={20} color={opt.iconColors.fg} />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionDescription}>{opt.description}</Text>
                </View>
                {isSelected && (
                  <Feather
                    name="check-circle"
                    size={20}
                    color={colors.primary[500]}
                    style={styles.optionCheck}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* CTA */}
        <Pressable
          style={[styles.button, shadows.sm, !canContinue && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Build My Plan</Text>
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
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  optionCheck: { marginLeft: spacing.sm },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

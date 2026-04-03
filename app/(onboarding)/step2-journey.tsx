// ============================================================
// Lumina — Step 2: The Journey
// "Where are you in your journey?" — Pregnant vs Baby is here
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

const pregnantWeekOptions = Array.from({ length: 42 }, (_, i) => i + 1);

export default function Step2JourneyScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { formatDateInput, toISO, fromISO, placeholder: DATE_PLACEHOLDER } = useDateFormat();

  const parentName = store.parentName || 'there';

  const [journey, setJourney] = useState<'pregnant' | 'born' | null>(
    store.isPregnant ? 'pregnant' : store.dateOfBirth ? 'born' : null,
  );
  const [dueDate, setDueDate] = useState(() => fromISO(store.dueDate));
  const [gestationalWeeks, setGestationalWeeks] = useState<number | null>(
    store.isPregnant ? store.gestationalWeeks : null,
  );

  const [dateFocused, setDateFocused] = useState(false);
  const dateFocusAnim = useRef(new Animated.Value(0)).current;
  const dateBorderColor = dateFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neutral[100], colors.primary[400]],
  });

  const dueDateValid = useMemo(() => {
    const iso = toISO(dueDate);
    if (!iso || iso.length !== 10) return false;
    return !isNaN(new Date(iso).getTime());
  }, [dueDate, toISO]);

  const canContinue =
    journey === 'born' ||
    (journey === 'pregnant' && dueDateValid && gestationalWeeks !== null);

  const handleJourneySelect = (option: 'pregnant' | 'born') => {
    Haptics.selectionAsync();
    setJourney(option);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (journey === 'pregnant') {
      store.setBabyProfile({
        babyName: store.babyName,
        dateOfBirth: '',
        gender: store.gender ?? 'other',
        feedingMethod: store.feedingMethod ?? 'mixed',
        isPregnant: true,
        dueDate: toISO(dueDate),
      });
      store.setGestationalAge({ wasPreterm: false, gestationalWeeks });
      // Skip baby details for pregnant — go straight to focus
      router.push('/(onboarding)/step4-focus');
    } else {
      store.setBabyProfile({
        ...store,
        babyName: store.babyName,
        dateOfBirth: store.dateOfBirth,
        gender: store.gender ?? 'other',
        feedingMethod: store.feedingMethod ?? 'mixed',
        isPregnant: false,
        dueDate: '',
      });
      router.push('/(onboarding)/step3-baby');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
        <QuizProgressBar currentStep={2} totalSteps={4} />

        <Text style={styles.title}>Your Journey</Text>
        <Text style={styles.subtitle}>Where are you right now, {parentName}?</Text>

        {/* Journey options */}
        <View style={styles.optionGroup}>
          <Pressable
            style={[
              styles.journeyCard,
              journey === 'pregnant' ? [styles.journeyCardSelected, shadows.md] : shadows.sm,
            ]}
            onPress={() => handleJourneySelect('pregnant')}
          >
            <View style={[styles.journeyIconWrap, { backgroundColor: '#FDEAEA' }]}>
              <Feather name="heart" size={24} color="#E57373" />
            </View>
            <Text
              style={[
                styles.journeyLabel,
                journey === 'pregnant' && styles.journeyLabelSelected,
              ]}
            >
              I'm pregnant
            </Text>
            <Text style={styles.journeyDesc}>Expecting our little one</Text>
            {journey === 'pregnant' && (
              <View style={styles.checkBadge}>
                <Feather name="check" size={14} color={colors.textInverse} />
              </View>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.journeyCard,
              journey === 'born' ? [styles.journeyCardSelected, shadows.md] : shadows.sm,
            ]}
            onPress={() => handleJourneySelect('born')}
          >
            <View style={[styles.journeyIconWrap, { backgroundColor: '#FFF3D6' }]}>
              <Feather name="sun" size={24} color="#F5A623" />
            </View>
            <Text
              style={[
                styles.journeyLabel,
                journey === 'born' && styles.journeyLabelSelected,
              ]}
            >
              My baby is here
            </Text>
            <Text style={styles.journeyDesc}>Already welcomed our baby</Text>
            {journey === 'born' && (
              <View style={styles.checkBadge}>
                <Feather name="check" size={14} color={colors.textInverse} />
              </View>
            )}
          </Pressable>
        </View>

        {/* Pregnant details */}
        {journey === 'pregnant' && (
          <Animated.View style={styles.pregnantDetails}>
            <View style={styles.section}>
              <Text style={styles.label}>Estimated due date</Text>
              <Animated.View
                style={[
                  styles.inputWrap,
                  { borderColor: dateBorderColor },
                  dateFocused && styles.inputWrapFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder={DATE_PLACEHOLDER}
                  placeholderTextColor={colors.neutral[300]}
                  value={dueDate}
                  onChangeText={(t) => setDueDate(formatDateInput(t))}
                  keyboardType="number-pad"
                  maxLength={10}
                  onFocus={() => {
                    setDateFocused(true);
                    Animated.timing(dateFocusAnim, {
                      toValue: 1,
                      duration: 200,
                      useNativeDriver: false,
                    }).start();
                  }}
                  onBlur={() => {
                    setDateFocused(false);
                    Animated.timing(dateFocusAnim, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: false,
                    }).start();
                  }}
                />
              </Animated.View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>How many weeks along are you?</Text>
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
                  <Picker.Item label="Select week..." value={null} color={colors.textTertiary} />
                  {pregnantWeekOptions.map((w) => (
                    <Picker.Item key={w} label={`Week ${w}`} value={w} />
                  ))}
                </Picker>
              </View>
            </View>
          </Animated.View>
        )}

      </ScrollView>

      {/* Sticky Continue button */}
      <View style={styles.stickyFooter}>
        <Pressable
          style={[styles.button, shadows.sm, !canContinue && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Continue</Text>
          <Feather name="arrow-right" size={18} color={colors.textInverse} />
        </Pressable>
      </View>
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
    marginBottom: spacing['2xl'],
  },
  optionGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  journeyCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    paddingVertical: spacing['2xl'],
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
  },
  journeyCardSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  journeyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  journeyLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  journeyLabelSelected: { color: colors.primary[700] },
  journeyDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pregnantDetails: {
    marginBottom: spacing.md,
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
  stickyFooter: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[100],
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
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

// ============================================================
// Lumina — Edit Baby Screen
// Pre-populated form for editing baby details
// ============================================================

import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { useBabyStore } from '../../../src/stores/babyStore';
import { formatDateInput, toISO, fromISO, DATE_PLACEHOLDER } from '../../../src/shared/utils/dateFormat';
import type { Gender, PrimaryFeedingMethod } from '../../../src/shared/types/common';

const FEEDING_OPTIONS: { value: PrimaryFeedingMethod; label: string; description: string }[] = [
  { value: 'breast_only', label: 'Breast', description: 'Breastfeeding only' },
  { value: 'formula_only', label: 'Formula', description: 'Formula only' },
  { value: 'mixed', label: 'Mixed', description: 'Both breast & formula' },
];

const PRETERM_WEEK_OPTIONS = Array.from({ length: 19 }, (_, i) => i + 22); // 22-40

export default function EditBabyScreen() {
  const router = useRouter();
  const { getActiveBaby, updateBaby } = useBabyStore();
  const baby = getActiveBaby();

  const [name, setName] = useState(baby?.name ?? '');
  const [dobDisplay, setDobDisplay] = useState(() =>
    fromISO(baby?.date_of_birth ?? ''),
  );
  const [dueDateDisplay, setDueDateDisplay] = useState(() =>
    fromISO(baby?.due_date ?? ''),
  );
  const [gender, setGender] = useState<Gender | null>(baby?.gender ?? null);
  const [feedingMethod, setFeedingMethod] = useState<PrimaryFeedingMethod | null>(
    baby?.primary_feeding_method ?? null,
  );
  const [gestationalWeeks, setGestationalWeeks] = useState<number | null>(
    baby?.gestational_age_weeks ?? null,
  );

  const isPreterm = gestationalWeeks !== null && gestationalWeeks < 37;

  const dobIsValid = useMemo(() => {
    const iso = toISO(dobDisplay);
    if (!iso || iso.length !== 10) return false;
    return !isNaN(new Date(iso).getTime());
  }, [dobDisplay]);

  const canSave =
    name.trim().length > 0 &&
    dobDisplay.length >= 10 &&
    dobIsValid &&
    gender !== null &&
    feedingMethod !== null;

  const handleSave = () => {
    if (!baby || !canSave) return;
    updateBaby(baby.id, {
      name: name.trim(),
      date_of_birth: toISO(dobDisplay),
      due_date: dueDateDisplay.length >= 10 ? toISO(dueDateDisplay) : null,
      gender: gender!,
      primary_feeding_method: feedingMethod!,
      gestational_age_weeks: gestationalWeeks,
      uses_adjusted_milestones: isPreterm,
    });
    router.back();
  };

  if (!baby) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No baby profile found</Text>
          <Pressable style={styles.backButtonInline} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
              <Feather name="chevron-left" size={22} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.title}>Edit Baby</Text>
            <View style={styles.backButton} />
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Baby's name</Text>
            <TextInput
              style={styles.input}
              placeholder="What's their name?"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Date of birth */}
          <View style={styles.section}>
            <Text style={styles.label}>Date of birth</Text>
            <View style={styles.inputWithIcon}>
              <Feather name="calendar" size={18} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.inputInner}
                placeholder={DATE_PLACEHOLDER}
                placeholderTextColor={colors.textTertiary}
                value={dobDisplay}
                onChangeText={(t) => setDobDisplay(formatDateInput(t))}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* Due date (optional) */}
          <View style={styles.section}>
            <Text style={styles.label}>Due date (optional)</Text>
            <View style={styles.inputWithIcon}>
              <Feather name="calendar" size={18} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.inputInner}
                placeholder={DATE_PLACEHOLDER}
                placeholderTextColor={colors.textTertiary}
                value={dueDateDisplay}
                onChangeText={(t) => setDueDateDisplay(formatDateInput(t))}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* Gender */}
          <View style={styles.section}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderShortRow}>
              <Pressable
                style={[styles.genderChip, gender === 'female' && styles.genderChipSelected]}
                onPress={() => setGender('female')}
              >
                <Feather name="smile" size={18} color={gender === 'female' ? colors.primary[600] : colors.textTertiary} />
                <Text style={[styles.genderChipText, gender === 'female' && styles.genderChipTextSelected]}>Girl</Text>
              </Pressable>
              <Pressable
                style={[styles.genderChip, gender === 'male' && styles.genderChipSelected]}
                onPress={() => setGender('male')}
              >
                <Feather name="smile" size={18} color={gender === 'male' ? colors.primary[600] : colors.textTertiary} />
                <Text style={[styles.genderChipText, gender === 'male' && styles.genderChipTextSelected]}>Boy</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.genderChipWide, gender === 'other' && styles.genderChipSelected]}
              onPress={() => setGender('other')}
            >
              <Feather name="heart" size={18} color={gender === 'other' ? colors.primary[600] : colors.textTertiary} />
              <Text style={[styles.genderChipText, gender === 'other' && styles.genderChipTextSelected]}>
                I don't want to specify
              </Text>
            </Pressable>
          </View>

          {/* Feeding method */}
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
          </View>

          {/* Gestational age */}
          <View style={styles.section}>
            <Text style={styles.label}>Gestational age at birth (if preterm)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={gestationalWeeks}
                onValueChange={(value) => setGestationalWeeks(value as number | null)}
                style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Full term (37+ weeks)" value={null} color={colors.textTertiary} />
                {PRETERM_WEEK_OPTIONS.map((w) => (
                  <Picker.Item key={w} label={`Week ${w}`} value={w} />
                ))}
              </Picker>
            </View>
            {isPreterm && (
              <View style={[styles.infoBox, shadows.sm]}>
                <View style={styles.infoHeader}>
                  <Feather name="info" size={16} color={colors.primary[600]} />
                  <Text style={styles.infoTitle}>Corrected Age Enabled</Text>
                </View>
                <Text style={styles.infoText}>
                  We'll adjust by {40 - gestationalWeeks!} weeks for developmental milestones, sleep windows, and growth charts until 24 months corrected.
                </Text>
              </View>
            )}
          </View>

          {/* Save */}
          <Pressable
            style={[styles.button, shadows.sm, !canSave && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
          >
            <Feather name="check" size={18} color={colors.textInverse} />
            <Text style={styles.buttonText}>Save Changes</Text>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: typography.fontSize.base, color: colors.textSecondary, marginBottom: spacing.base },
  backButtonInline: { paddingVertical: spacing.sm, paddingHorizontal: spacing.base },
  backButtonText: { color: colors.primary[500], fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
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

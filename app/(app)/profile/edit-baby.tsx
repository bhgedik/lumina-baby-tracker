// ============================================================
// Nodd — Edit Baby Screen (Claymorphism Design)
// Pre-populated form for editing baby details
// ============================================================

import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing } from '../../../src/shared/constants/theme';
import { useBabyStore } from '../../../src/stores/babyStore';
import { formatDateInput, toISO, fromISO, DATE_PLACEHOLDER } from '../../../src/shared/utils/dateFormat';
import type { Gender, PrimaryFeedingMethod } from '../../../src/shared/types/common';

// ── Claymorphism Tokens ──────────────────────────────────────
const CLAY_BG = '#F7F4F0';

const CLAY_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 6,
} as const;

const CLAY_INNER = {
  borderTopWidth: 2,
  borderLeftWidth: 1.5,
  borderTopColor: 'rgba(255,255,255,0.9)',
  borderLeftColor: 'rgba(255,255,255,0.6)',
  borderBottomWidth: 1.5,
  borderRightWidth: 1,
  borderBottomColor: 'rgba(0,0,0,0.04)',
  borderRightColor: 'rgba(0,0,0,0.02)',
} as const;

const CLAY_PRESSED_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.04,
  shadowRadius: 20,
  elevation: 3,
} as const;

// ── Data ─────────────────────────────────────────────────────
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
  const [savePressed, setSavePressed] = useState(false);

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
              <Feather name="chevron-left" size={22} color="#2D2A26" />
            </Pressable>
            <Text style={styles.title}>Edit Baby</Text>
            <View style={styles.backButton} />
          </View>

          {/* Name */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>BASIC INFO</Text>
            <Text style={styles.label}>Baby's name</Text>
            <TextInput
              style={styles.input}
              placeholder="What's their name?"
              placeholderTextColor="#8A8A8A"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Date of birth */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>BIRTH DETAILS</Text>
            <Text style={styles.label}>Date of birth</Text>
            <View style={styles.inputWithIcon}>
              <Feather name="calendar" size={18} color="#8A8A8A" style={styles.inputIcon} />
              <TextInput
                style={styles.inputInner}
                placeholder={DATE_PLACEHOLDER}
                placeholderTextColor="#8A8A8A"
                value={dobDisplay}
                onChangeText={(t) => setDobDisplay(formatDateInput(t))}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            {/* Due date (optional) */}
            <View style={styles.fieldGap}>
              <Text style={styles.label}>Due date</Text>
              <Text style={styles.description}>Optional — used for corrected age</Text>
              <View style={styles.inputWithIcon}>
                <Feather name="calendar" size={18} color="#8A8A8A" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder={DATE_PLACEHOLDER}
                  placeholderTextColor="#8A8A8A"
                  value={dueDateDisplay}
                  onChangeText={(t) => setDueDateDisplay(formatDateInput(t))}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          {/* Gender */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>GENDER</Text>
            <View style={styles.genderShortRow}>
              <Pressable
                style={[styles.genderChip, gender === 'female' && styles.genderChipSelected]}
                onPress={() => setGender('female')}
              >
                <Feather name="smile" size={18} color={gender === 'female' ? colors.primary[600] : '#8A8A8A'} />
                <Text style={[styles.genderChipText, gender === 'female' && styles.genderChipTextSelected]}>Girl</Text>
              </Pressable>
              <Pressable
                style={[styles.genderChip, gender === 'male' && styles.genderChipSelected]}
                onPress={() => setGender('male')}
              >
                <Feather name="smile" size={18} color={gender === 'male' ? colors.primary[600] : '#8A8A8A'} />
                <Text style={[styles.genderChipText, gender === 'male' && styles.genderChipTextSelected]}>Boy</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.genderChipWide, gender === 'other' && styles.genderChipSelected]}
              onPress={() => setGender('other')}
            >
              <Feather name="heart" size={18} color={gender === 'other' ? colors.primary[600] : '#8A8A8A'} />
              <Text style={[styles.genderChipText, gender === 'other' && styles.genderChipTextSelected]}>
                I don't want to specify
              </Text>
            </Pressable>
          </View>

          {/* Feeding method */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>FEEDING</Text>
            <Text style={styles.label}>Primary feeding method</Text>
            <View style={styles.feedingOptions}>
              {FEEDING_OPTIONS.map((f) => (
                <Pressable
                  key={f.value}
                  style={[styles.feedingCard, feedingMethod === f.value && styles.feedingCardSelected]}
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
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>GESTATIONAL AGE</Text>
            <Text style={styles.label}>Weeks at birth</Text>
            <Text style={styles.description}>Only set if born before 37 weeks</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={gestationalWeeks}
                onValueChange={(value) => setGestationalWeeks(value as number | null)}
                style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Full term (37+ weeks)" value={null} color="#8A8A8A" />
                {PRETERM_WEEK_OPTIONS.map((w) => (
                  <Picker.Item key={w} label={`Week ${w}`} value={w} />
                ))}
              </Picker>
            </View>
            {isPreterm && (
              <View style={styles.infoBox}>
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
            style={({ pressed }) => [
              styles.button,
              !canSave && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
          >
            <Feather name="check" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Save Changes</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CLAY_BG },
  flex: { flex: 1 },
  scrollView: { flex: 1, backgroundColor: CLAY_BG },
  content: { padding: 24, paddingTop: 8, paddingBottom: 120 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: '#8A8A8A', marginBottom: 16 },
  backButtonInline: { paddingVertical: 10, paddingHorizontal: 16 },
  backButtonText: { color: colors.primary[500], fontSize: 16, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2A26',
  },

  // Cards (clay containers)
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },

  // Section headers
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8A9F',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  // Labels & descriptions
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2A26',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#8A8A8A',
    marginBottom: 10,
  },

  fieldGap: {
    marginTop: 20,
  },

  // Inputs
  input: {
    backgroundColor: '#F7F4F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E2',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D2A26',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F4F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E2',
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 10 },
  inputInner: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D2A26',
  },

  // Gender chips
  genderShortRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: '#F7F4F0',
    borderWidth: 1,
    borderColor: '#EDE8E2',
  },
  genderChipWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: '#F7F4F0',
    borderWidth: 1,
    borderColor: '#EDE8E2',
  },
  genderChipSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  genderChipText: {
    fontSize: 14,
    color: '#8A8A8A',
    fontWeight: '600',
  },
  genderChipTextSelected: {
    color: colors.primary[600],
    fontWeight: '700',
  },

  // Feeding cards
  feedingOptions: { gap: 10 },
  feedingCard: {
    backgroundColor: '#F7F4F0',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE8E2',
  },
  feedingCardSelected: {
    backgroundColor: colors.secondary[50],
    borderColor: colors.secondary[400],
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  feedingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2A26',
    marginBottom: 2,
  },
  feedingLabelSelected: { color: colors.secondary[600] },
  feedingDescription: {
    fontSize: 13,
    color: '#8A8A8A',
  },

  // Picker
  pickerContainer: {
    backgroundColor: '#F7F4F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E2',
    overflow: 'hidden',
    marginTop: 4,
  },
  pickerIOS: { height: 200 },
  pickerAndroid: { height: 56, paddingHorizontal: 12 },
  pickerItem: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2D2A26',
  },

  // Info box (preterm)
  infoBox: {
    marginTop: 16,
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 16,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary[700],
  },
  infoText: {
    fontSize: 13,
    color: colors.primary[800],
    lineHeight: 20,
  },

  // Save button
  button: {
    flexDirection: 'row',
    backgroundColor: colors.secondary[500],
    borderRadius: 9999,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    ...CLAY_PRESSED_SHADOW,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

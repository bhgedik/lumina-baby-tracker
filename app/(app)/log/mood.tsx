// ============================================================
// Nodd — Wellness Logging Screen
// Tabbed: Mood / Symptoms
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { SegmentControl } from '../../../src/shared/components/SegmentControl';
import { MoodIconMap } from '../../../src/shared/components/MoodIcons';
import { useMotherMoodStore, MOOD_CONFIG, type MoodEmoji } from '../../../src/stores/motherMoodStore';
import { useMotherWellnessStore, type BodyArea, type SeverityLevel } from '../../../src/stores/motherWellnessStore';

const MOODS: MoodEmoji[] = ['radiant', 'good', 'okay', 'struggling', 'overwhelmed'];

const BODY_AREAS: { value: BodyArea; label: string }[] = [
  { value: 'head', label: 'Head' },
  { value: 'breast', label: 'Breast' },
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'pelvis', label: 'Pelvis' },
  { value: 'back', label: 'Back' },
  { value: 'perineum', label: 'Perineum' },
  { value: 'incision', label: 'Incision' },
  { value: 'legs', label: 'Legs' },
  { value: 'other', label: 'Other' },
];

const TABS = [
  { value: 'mood', label: 'Mood' },
  { value: 'symptoms', label: 'Symptoms' },
];

export default function MoodLogScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('mood');

  const headerLeft = useCallback(
    () => (
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ flexDirection: 'row', alignItems: 'center', marginLeft: Platform.OS === 'ios' ? -8 : 0 }}
      >
        <Feather name="chevron-left" size={26} color={colors.primary[600]} />
        <Text style={{ fontSize: 17, color: colors.primary[600], marginLeft: -2 }}>Home</Text>
      </Pressable>
    ),
    [router],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Log Wellness',
          headerTintColor: colors.primary[600],
          headerLeft,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.segmentWrapper}>
            <SegmentControl options={TABS} selected={activeTab} onSelect={setActiveTab} />
          </View>

          {activeTab === 'mood' && <MoodTab />}
          {activeTab === 'symptoms' && <SymptomsTab />}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Mood Tab ───

function isToday(timestamp: number): boolean {
  const d = new Date(timestamp);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function MoodTab() {
  const logMood = useMotherMoodStore((s) => s.logMood);
  const entries = useMotherMoodStore((s) => s.entries);
  const todaysMood = useMemo(() => {
    const todayEntries = entries.filter((e) => isToday(e.loggedAt));
    return todayEntries.length > 0 ? todayEntries[todayEntries.length - 1] : null;
  }, [entries]);
  const [selectedMood, setSelectedMood] = useState<MoodEmoji | null>(todaysMood?.mood ?? null);
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!selectedMood) return;
    logMood(selectedMood, notes || undefined);
    Alert.alert('Saved', 'Your mood has been logged.');
    setNotes('');
  };

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>How are you feeling today?</Text>
      {todaysMood && (
        <Text style={styles.existingNote}>
          Already logged: {MOOD_CONFIG[todaysMood.mood].label}
        </Text>
      )}
      <View style={styles.moodRow}>
        {MOODS.map((mood) => {
          const Icon = MoodIconMap[mood];
          const isSelected = selectedMood === mood;
          return (
            <Pressable
              key={mood}
              style={[styles.moodItem, isSelected && styles.moodItemSelected]}
              onPress={() => setSelectedMood(mood)}
              accessibilityLabel={MOOD_CONFIG[mood].label}
            >
              <Icon size={48} color={MOOD_CONFIG[mood].color} />
            </Pressable>
          );
        })}
      </View>
      <TextInput
        style={styles.textInput}
        placeholder="Add a note (optional)"
        placeholderTextColor={colors.textTertiary}
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      <Pressable
        style={[styles.saveButton, !selectedMood && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!selectedMood}
      >
        <Text style={styles.saveButtonText}>Save Mood</Text>
      </Pressable>
    </View>
  );
}

// ─── Symptoms Tab ───

function SymptomsTab() {
  const logSymptom = useMotherWellnessStore((s) => s.logSymptom);
  const allSymptoms = useMotherWellnessStore((s) => s.symptoms);
  const todaysSymptoms = useMemo(
    () => allSymptoms.filter((s) => isToday(s.loggedAt)),
    [allSymptoms],
  );
  const [bodyArea, setBodyArea] = useState<BodyArea | null>(null);
  const [symptomName, setSymptomName] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>(1);
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!bodyArea || !symptomName.trim()) return;
    logSymptom(bodyArea, symptomName.trim(), severity, notes || undefined);
    Alert.alert('Saved', 'Symptom logged.');
    setBodyArea(null);
    setSymptomName('');
    setSeverity(1);
    setNotes('');
  };

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Body Area</Text>
      <View style={styles.chipRow}>
        {BODY_AREAS.map((area) => (
          <Pressable
            key={area.value}
            style={[styles.chip, bodyArea === area.value && styles.chipSelected]}
            onPress={() => setBodyArea(area.value)}
          >
            <Text style={[styles.chipText, bodyArea === area.value && styles.chipTextSelected]}>
              {area.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Symptom</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g. Lower back pain, Headache"
        placeholderTextColor={colors.textTertiary}
        value={symptomName}
        onChangeText={setSymptomName}
      />

      <Text style={styles.sectionTitle}>Severity</Text>
      <View style={styles.severityRow}>
        {([1, 2, 3, 4, 5] as SeverityLevel[]).map((level) => (
          <Pressable
            key={level}
            style={[styles.severityDot, severity >= level && styles.severityDotActive]}
            onPress={() => setSeverity(level)}
          >
            <Text style={[styles.severityText, severity >= level && styles.severityTextActive]}>
              {level}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.textInput}
        placeholder="Notes (optional)"
        placeholderTextColor={colors.textTertiary}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Pressable
        style={[styles.saveButton, (!bodyArea || !symptomName.trim()) && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!bodyArea || !symptomName.trim()}
      >
        <Text style={styles.saveButtonText}>Log Symptom</Text>
      </Pressable>

      {/* Today's symptoms list */}
      {todaysSymptoms.length > 0 && (
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Today's Symptoms</Text>
          {todaysSymptoms.map((s) => (
            <View key={s.id} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Text style={styles.listItemTitle}>{s.symptom}</Text>
                <Text style={styles.listItemMeta}>{s.bodyArea} · Severity {s.severity}/5</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 100 },
  segmentWrapper: { marginBottom: spacing.xl },
  tabContent: { gap: spacing.md },

  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  existingNote: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontStyle: 'italic',
  },

  // Mood
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodItem: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodItemSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  chipSelected: {
    backgroundColor: colors.primary[500],
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  chipTextSelected: {
    color: colors.textInverse,
  },

  // Severity
  severityRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  severityDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityDotActive: {
    backgroundColor: colors.secondary[400],
  },
  severityText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textTertiary,
  },
  severityTextActive: {
    color: colors.textInverse,
  },

  // Inputs
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    minHeight: 48,
  },

  // Save button
  saveButton: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },

  // Symptom list
  listSection: {
    marginTop: spacing.lg,
  },
  listTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  listItemLeft: { flex: 1 },
  listItemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  listItemMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
});

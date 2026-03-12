// ============================================================
// Lumina — Health Log Screen
// Health Logger: Temperature, Symptoms, Medications, and Notes
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { ChipSelector } from '../../../src/shared/components/ChipSelector';
import { LuminaWhisper } from '../../../src/shared/components/LuminaWhisper';
import { KeyboardDoneBar, KEYBOARD_DONE_ID } from '../../../src/shared/components/KeyboardDoneBar';
import { useHealthStore } from '../../../src/stores/healthStore';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { generateUUID } from '../../../src/stores/createSyncedStore';
import type { TemperatureMethod, HealthLogType } from '../../../src/shared/types/common';
import type { HealthLog } from '../../../src/modules/health/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SYMPTOM_OPTIONS = [
  { value: 'fever', label: 'Fever' },
  { value: 'cough', label: 'Cough' },
  { value: 'runny_nose', label: 'Runny Nose' },
  { value: 'vomiting', label: 'Vomiting' },
  { value: 'diarrhea', label: 'Diarrhea' },
  { value: 'rash', label: 'Rash' },
  { value: 'fussy', label: 'Fussy/Irritable' },
  { value: 'poor_feeding', label: 'Poor Feeding' },
  { value: 'congestion', label: 'Congestion' },
  { value: 'eye_discharge', label: 'Eye Discharge' },
  { value: 'ear_pulling', label: 'Ear Pulling' },
  { value: 'lethargy', label: 'Lethargy' },
];

const METHOD_OPTIONS = [
  { value: 'rectal', label: 'Rectal' },
  { value: 'axillary', label: 'Underarm' },
  { value: 'ear', label: 'Ear' },
  { value: 'forehead', label: 'Forehead' },
];

type DoseUnit = 'mL' | 'mg';

// ── Health History Sample Data ──
interface HealthEntry {
  id: string;
  date: string;
  time: string;
  temperature: string | null;
  method: string | null;
  symptoms: string[];
  medName: string | null;
  medDose: string | null;
  notes: string | null;
}

const SAMPLE_HISTORY: HealthEntry[] = [
  {
    id: '1',
    date: 'Feb 21, 2026',
    time: '2:30 PM',
    temperature: '38.4°C',
    method: 'Rectal',
    symptoms: ['Fever', 'Fussy/Irritable', 'Ear Pulling'],
    medName: 'Acetaminophen',
    medDose: '2.5 mL',
    notes: null,
  },
  {
    id: '2',
    date: 'Feb 18, 2026',
    time: '9:15 AM',
    temperature: '37.1°C',
    method: 'Forehead',
    symptoms: ['Runny Nose', 'Congestion'],
    medName: null,
    medDose: null,
    notes: 'Day 3 of cold — seems to be improving',
  },
  {
    id: '3',
    date: 'Feb 15, 2026',
    time: '7:00 PM',
    temperature: '38.9°C',
    method: 'Rectal',
    symptoms: ['Fever', 'Runny Nose', 'Congestion', 'Poor Feeding'],
    medName: 'Acetaminophen',
    medDose: '2.5 mL',
    notes: null,
  },
  {
    id: '4',
    date: 'Feb 10, 2026',
    time: '11:00 AM',
    temperature: null,
    method: null,
    symptoms: ['Rash'],
    medName: null,
    medDose: null,
    notes: 'Small red bumps on cheeks — possibly from drool',
  },
  {
    id: '5',
    date: 'Feb 3, 2026',
    time: '4:45 PM',
    temperature: '37.2°C',
    method: 'Underarm',
    symptoms: ['Cough', 'Congestion'],
    medName: 'Saline drops',
    medDose: '2 drops each nostril',
    notes: 'Pediatrician said monitor for 48h',
  },
];

// ── History Entry Card ──
function HistoryCard({ entry }: { entry: HealthEntry }) {
  const isFever = entry.temperature && parseFloat(entry.temperature) >= 38.0;

  return (
    <View style={[hs.card, shadows.sm]}>
      {/* Date row */}
      <View style={hs.dateRow}>
        <Feather name="calendar" size={14} color={colors.textTertiary} />
        <Text style={hs.dateText}>{entry.date}</Text>
        <Text style={hs.timeText}>{entry.time}</Text>
      </View>

      {/* Temperature */}
      {entry.temperature && (
        <View style={hs.tempRow}>
          <Feather name="thermometer" size={15} color={isFever ? colors.error : colors.primary[500]} />
          <Text style={[hs.tempText, isFever && hs.tempFever]}>{entry.temperature}</Text>
          {entry.method && <Text style={hs.methodText}>({entry.method})</Text>}
          {isFever && (
            <View style={hs.feverPill}>
              <Text style={hs.feverPillText}>Fever</Text>
            </View>
          )}
        </View>
      )}

      {/* Symptom chips */}
      {entry.symptoms.length > 0 && (
        <View style={hs.chipRow}>
          {entry.symptoms.map((s) => (
            <View key={s} style={hs.chip}>
              <Text style={hs.chipText}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Medication */}
      {entry.medName && (
        <View style={hs.medRow}>
          <Feather name="package" size={13} color={colors.secondary[500]} />
          <Text style={hs.medText}>
            {entry.medName}{entry.medDose ? ` — ${entry.medDose}` : ''}
          </Text>
        </View>
      )}

      {/* Notes */}
      {entry.notes && (
        <Text style={hs.notes}>{entry.notes}</Text>
      )}
    </View>
  );
}

// ── History Bottom Sheet ──
function HistorySheet({ visible, onClose, logs }: { visible: boolean; onClose: () => void; logs: HealthLog[] }) {
  const storeEntries: HealthEntry[] = logs.map((log) => {
    const d = new Date(log.logged_at);
    return {
      id: log.id,
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      temperature: log.temperature_celsius != null ? `${log.temperature_celsius}°C` : null,
      method: log.temperature_method ? METHOD_OPTIONS.find((m) => m.value === log.temperature_method)?.label ?? log.temperature_method : null,
      symptoms: (log.symptoms ?? []).map((s) => SYMPTOM_OPTIONS.find((o) => o.value === s)?.label ?? s),
      medName: log.medication_name,
      medDose: log.medication_dose,
      notes: log.notes,
    };
  });
  const displayData = storeEntries.length > 0 ? storeEntries : SAMPLE_HISTORY;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={hs.container}>
        {/* Handle + Header */}
        <View style={hs.header}>
          <View style={hs.handle} />
          <View style={hs.headerRow}>
            <Text style={hs.title}>Health History</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={hs.subtitle}>Recent health entries for your baby</Text>
        </View>

        {/* Entry list */}
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HistoryCard entry={item} />}
          contentContainerStyle={hs.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={hs.emptyState}>
              <Feather name="clipboard" size={40} color={colors.neutral[300]} />
              <Text style={hs.emptyText}>No health entries yet</Text>
              <Text style={hs.emptyHint}>Your logged entries will appear here</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

// ── Main Screen ──
export default function HealthLogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ episodeId?: string; type?: string }>();
  const episodeId = params.episodeId ?? null;

  // Store
  const addHealthLog = useHealthStore((s) => s.addHealthLog);
  const healthLogs = useHealthStore((s) => s.healthLogs);
  const activeEpisodes = useHealthStore((s) => s.episodes).filter((e) => e.status === 'active');
  const baby = useBabyStore((s) => s.getActiveBaby());

  // Temperature
  const [tempValue, setTempValue] = useState('');
  const [tempMethod, setTempMethod] = useState<TemperatureMethod | null>(null);

  // Symptoms
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptoms, setCustomSymptoms] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSymptomDraft, setCustomSymptomDraft] = useState('');

  // Medication
  const [medName, setMedName] = useState('');
  const [medDoseAmount, setMedDoseAmount] = useState('');
  const [medDoseUnit, setMedDoseUnit] = useState<DoseUnit>('mL');

  // Notes
  const [notes, setNotes] = useState('');

  // Episode linking
  const [linkedEpisodeId, setLinkedEpisodeId] = useState<string | null>(episodeId);

  // History sheet
  const [showHistory, setShowHistory] = useState(false);

  // Toast
  const [showToast, setShowToast] = useState(false);

  // Real history from store
  const babyLogs = useMemo(() => {
    if (!baby) return [];
    return healthLogs
      .filter((l) => l.baby_id === baby.id)
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
      .slice(0, 20);
  }, [baby, healthLogs]);

  const handleSymptomToggle = (value: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const handleRemoveCustomSymptom = (symptom: string) => {
    setCustomSymptoms((prev) => prev.filter((s) => s !== symptom));
  };

  const handleAddCustomSymptom = () => {
    const trimmed = customSymptomDraft.trim();
    if (!trimmed || customSymptoms.includes(trimmed)) return;
    setCustomSymptoms((prev) => [...prev, trimmed]);
    setCustomSymptomDraft('');
    setShowCustomInput(false);
  };

  const toggleDoseUnit = () => {
    setMedDoseUnit((prev) => (prev === 'mL' ? 'mg' : 'mL'));
  };

  const handleSave = () => {
    if (!baby) {
      setShowToast(true);
      setTimeout(() => router.back(), 1500);
      return;
    }

    const session = useAuthStore.getState().session;
    const now = new Date().toISOString();
    const allSymptoms = [...selectedSymptoms, ...customSymptoms];

    // Determine log type
    let logType: HealthLogType = 'other';
    if (params.type === 'doctor_visit') logType = 'doctor_visit';
    else if (tempValue.trim()) logType = 'temperature';
    else if (allSymptoms.length > 0) logType = 'symptom';
    else if (medName.trim()) logType = 'medication';

    const log: HealthLog = {
      id: generateUUID(),
      baby_id: baby.id,
      family_id: baby.family_id,
      logged_by: session?.user?.id ?? '',
      logged_at: now,
      type: logType,
      temperature_celsius: tempValue.trim() ? parseFloat(tempValue) : null,
      temperature_method: tempMethod,
      medication_name: medName.trim() || null,
      medication_dose: medDoseAmount.trim() ? `${medDoseAmount} ${medDoseUnit}` : null,
      symptoms: allSymptoms.length > 0 ? allSymptoms : null,
      doctor_name: null,
      diagnosis: null,
      notes: notes.trim() || null,
      attachments: null,
      episode_id: linkedEpisodeId,
      created_at: now,
      updated_at: now,
    };

    addHealthLog(log);
    setShowToast(true);
    setTimeout(() => router.back(), 1500);
  };

  const tempNum = parseFloat(tempValue);
  const isFever = !isNaN(tempNum) && tempNum >= 38.0;

  // Custom back button — bulletproof fix for "(tabs)" label
  const headerLeft = useCallback(
    () => (
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
        <Feather name="chevron-left" size={26} color={colors.primary[600]} />
        <Text style={styles.backLabel}>Home</Text>
      </Pressable>
    ),
    [router],
  );

  // Header right button for history
  const headerRight = useCallback(
    () => (
      <Pressable
        onPress={() => setShowHistory(true)}
        hitSlop={12}
        style={styles.headerButton}
      >
        <Feather name="clock" size={22} color={colors.primary[600]} />
      </Pressable>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Log Health',
          headerTintColor: colors.primary[600],
          headerBackTitle: 'Home',
          headerLeft,
          headerRight,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* ── Section 1: Temperature ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="thermometer" size={18} color={colors.secondary[500]} />
            <Text style={styles.sectionTitle}>Temperature</Text>
          </View>

          <View style={styles.tempRow}>
            <View style={styles.tempInputWrap}>
              <TextInput
                style={[styles.tempInput, isFever && styles.tempInputFever]}
                placeholder="37.0"
                placeholderTextColor={colors.textTertiary}
                value={tempValue}
                onChangeText={setTempValue}
                keyboardType="decimal-pad"
                maxLength={5}
                inputAccessoryViewID={KEYBOARD_DONE_ID}
              />
              <Text style={styles.tempUnit}>°C</Text>
            </View>
            {isFever && (
              <View style={styles.feverBadge}>
                <Feather name="alert-triangle" size={12} color={colors.error} />
                <Text style={styles.feverText}>Fever</Text>
              </View>
            )}
          </View>

          <Text style={styles.methodLabel}>Method</Text>
          <ChipSelector
            options={METHOD_OPTIONS}
            selected={tempMethod ?? ''}
            onSelect={(v) => setTempMethod(v as TemperatureMethod)}
          />

          <View style={styles.nurseTip}>
            <Feather name="info" size={14} color={colors.primary[500]} />
            <Text style={styles.nurseTipText}>
              Rectal is the gold standard for babies under 3 months. Add 0.5°C if measuring underarm.
            </Text>
          </View>
        </View>

        {/* ── Section 2: Symptoms ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="activity" size={18} color={colors.secondary[500]} />
            <Text style={styles.sectionTitle}>Symptoms</Text>
          </View>

          <View style={styles.symptomGrid}>
            {SYMPTOM_OPTIONS.map((symptom) => {
              const isSelected = selectedSymptoms.includes(symptom.value);
              return (
                <Pressable
                  key={symptom.value}
                  style={[styles.symptomChip, isSelected && styles.symptomChipActive]}
                  onPress={() => handleSymptomToggle(symptom.value)}
                >
                  <Text style={[styles.symptomText, isSelected && styles.symptomTextActive]}>
                    {symptom.label}
                  </Text>
                </Pressable>
              );
            })}

            {customSymptoms.map((custom) => (
              <Pressable
                key={`custom-${custom}`}
                style={[styles.symptomChip, styles.symptomChipActive]}
                onPress={() => handleRemoveCustomSymptom(custom)}
              >
                <Text style={[styles.symptomText, styles.symptomTextActive]}>
                  {custom}
                </Text>
                <Feather name="x" size={12} color={colors.secondary[600]} style={{ marginLeft: 4 }} />
              </Pressable>
            ))}

            {!showCustomInput && (
              <Pressable
                style={[styles.symptomChip, styles.otherChip]}
                onPress={() => setShowCustomInput(true)}
              >
                <Feather name="plus" size={14} color={colors.primary[500]} />
                <Text style={styles.otherChipText}>Other</Text>
              </Pressable>
            )}
          </View>

          {showCustomInput && (
            <View style={styles.customSymptomRow}>
              <TextInput
                style={styles.customSymptomInput}
                placeholder="Describe symptom..."
                placeholderTextColor={colors.textTertiary}
                value={customSymptomDraft}
                onChangeText={setCustomSymptomDraft}
                autoFocus
                onSubmitEditing={handleAddCustomSymptom}
                returnKeyType="done"
                inputAccessoryViewID={KEYBOARD_DONE_ID}
              />
              <Pressable
                style={[
                  styles.customSymptomAdd,
                  !customSymptomDraft.trim() && styles.customSymptomAddDisabled,
                ]}
                onPress={handleAddCustomSymptom}
                disabled={!customSymptomDraft.trim()}
              >
                <Feather name="check" size={16} color={colors.textInverse} />
              </Pressable>
              <Pressable
                style={styles.customSymptomCancel}
                onPress={() => {
                  setShowCustomInput(false);
                  setCustomSymptomDraft('');
                }}
              >
                <Feather name="x" size={16} color={colors.textTertiary} />
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Section 3: Medication Given ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="package" size={18} color={colors.secondary[500]} />
            <Text style={styles.sectionTitle}>Medication Given</Text>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="Medication name (e.g., Acetaminophen)"
            placeholderTextColor={colors.textTertiary}
            value={medName}
            onChangeText={setMedName}
            inputAccessoryViewID={KEYBOARD_DONE_ID}
          />

          <View style={styles.doseRow}>
            <TextInput
              style={styles.doseInput}
              placeholder="Dose amount"
              placeholderTextColor={colors.textTertiary}
              value={medDoseAmount}
              onChangeText={setMedDoseAmount}
              keyboardType="decimal-pad"
              maxLength={8}
              inputAccessoryViewID={KEYBOARD_DONE_ID}
            />
            <Pressable style={styles.doseUnitToggle} onPress={toggleDoseUnit}>
              <Text style={styles.doseUnitText}>{medDoseUnit}</Text>
              <Feather name="repeat" size={12} color={colors.primary[500]} />
            </Pressable>
          </View>

          <View style={styles.nurseTip}>
            <Feather name="info" size={14} color={colors.primary[500]} />
            <Text style={styles.nurseTipText}>
              Tap the unit badge to switch between mL (liquid) and mg (tablets/suppositories).
            </Text>
          </View>
        </View>

        {/* ── Section 4: Notes ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="edit-3" size={18} color={colors.primary[500]} />
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>

          <TextInput
            style={styles.notesArea}
            placeholder="Add any notes, observations, or questions..."
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
            maxLength={1000}
            inputAccessoryViewID={KEYBOARD_DONE_ID}
          />
        </View>

        {/* Save Button */}
        <Pressable
          style={[styles.saveButton, shadows.sm]}
          onPress={handleSave}
        >
          <Feather name="check" size={20} color={colors.textInverse} />
          <Text style={styles.saveButtonText}>Save Health Log</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Episode link chip */}
      {linkedEpisodeId && (
        <View style={styles.episodeLinkBar}>
          <Feather name="link" size={14} color={colors.secondary[500]} />
          <Text style={styles.episodeLinkText}>
            Linked to: {activeEpisodes.find((e) => e.id === linkedEpisodeId)?.title ?? 'Episode'}
          </Text>
          <Pressable onPress={() => setLinkedEpisodeId(null)} hitSlop={8}>
            <Feather name="x" size={14} color={colors.textTertiary} />
          </Pressable>
        </View>
      )}

      {/* Episode picker — show if not already linked and there are active episodes */}
      {!linkedEpisodeId && activeEpisodes.length > 0 && (
        <View style={styles.episodePickerRow}>
          {activeEpisodes.slice(0, 3).map((ep) => (
            <Pressable
              key={ep.id}
              style={styles.episodePickerChip}
              onPress={() => setLinkedEpisodeId(ep.id)}
            >
              <Feather name="link" size={12} color={colors.secondary[500]} />
              <Text style={styles.episodePickerText}>{ep.title}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* History Bottom Sheet */}
      <HistorySheet visible={showHistory} onClose={() => setShowHistory(false)} logs={babyLogs} />

      <LuminaWhisper
        visible={showToast}
        message={'\u2728 Health entry saved.'}
        onDismiss={() => setShowToast(false)}
      />
      <KeyboardDoneBar />
    </View>
  );
}

// ── History Sheet Styles ──
const hs = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.surface,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.xl,
    paddingTop: spacing.base,
  },
  // Entry card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tempText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  tempFever: {
    color: colors.error,
  },
  methodText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  feverPill: {
    backgroundColor: colors.emergencyBackground,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  feverPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.secondary[600],
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  medText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  notes: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  emptyHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
});

// ── Main Screen Styles ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Platform.OS === 'ios' ? -spacing.sm : 0,
  },
  backLabel: {
    fontSize: typography.fontSize.md,
    color: colors.primary[600],
    marginLeft: -2,
  },
  headerButton: {
    padding: spacing.xs,
  },
  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  // Temperature
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  tempInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.base,
  },
  tempInput: {
    width: 80,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tempInputFever: {
    color: colors.error,
  },
  tempUnit: {
    fontSize: typography.fontSize.md,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
  },
  feverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.emergencyBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  feverText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },
  methodLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  nurseTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
  },
  nurseTipText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  // Symptoms
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  symptomChipActive: {
    backgroundColor: colors.secondary[50],
    borderColor: colors.secondary[400],
  },
  symptomText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  symptomTextActive: {
    color: colors.secondary[600],
    fontWeight: typography.fontWeight.semibold,
  },
  otherChip: {
    borderStyle: 'dashed' as any,
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
    gap: spacing.xs,
  },
  otherChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
  },
  customSymptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  customSymptomInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary[300],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  customSymptomAdd: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSymptomAddDisabled: {
    opacity: 0.4,
  },
  customSymptomCancel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Medication
  textInput: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  doseInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  doseUnitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[50],
    borderWidth: 1.5,
    borderColor: colors.primary[300],
    minWidth: 72,
    justifyContent: 'center',
  },
  doseUnitText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  notesArea: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    minHeight: 120,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  // Save
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },
  // Episode linking
  episodeLinkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  episodeLinkText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.secondary[600],
  },
  episodePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  episodePickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  episodePickerText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
});

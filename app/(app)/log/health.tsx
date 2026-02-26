// ============================================================
// Nodd — Health Log Screen
// The Doctor Visit Assistant: Temperature, Symptoms, Meds,
// AI-Powered Doctor Questions, AI Scribe, and Health History
// ============================================================

import React, { useState, useCallback } from 'react';
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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { ChipSelector } from '../../../src/shared/components/ChipSelector';
import { InsightToast } from '../../../src/shared/components/InsightToast';
import type { TemperatureMethod } from '../../../src/shared/types/common';

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

// ── AI Question Suggestion Logic ──
const SYMPTOM_QUESTION_MAP: Record<string, string[]> = {
  fever: [
    'At what temperature should I take her to the ER?',
    'How long can a fever safely last before I should worry?',
    'Is it safe to alternate Tylenol and Motrin?',
  ],
  cough: [
    'Could this cough indicate croup or something more serious?',
    'Should I use a humidifier at night?',
    'When does a cough warrant a chest X-ray?',
  ],
  runny_nose: [
    'How can I tell if this is allergies vs. a cold?',
    'At what point should I worry about a potential ear infection?',
    'Is it okay to use saline drops multiple times a day?',
  ],
  vomiting: [
    'How do I know if she is getting dehydrated?',
    'Should I withhold solids and just do fluids?',
    'When does vomiting become an ER situation?',
  ],
  diarrhea: [
    'Should I switch to a BRAT diet?',
    'How many wet diapers per day indicates adequate hydration?',
    'Could this be related to a food sensitivity or allergy?',
  ],
  rash: [
    'Is this rash something I should photograph to track changes?',
    'Could this be eczema, and if so what moisturizer do you recommend?',
    'Does this rash look like it could be an allergic reaction?',
  ],
  fussy: [
    'Could this fussiness be colic, and when does it typically resolve?',
    'Are there any red flags that would distinguish pain from normal fussiness?',
  ],
  poor_feeding: [
    'How many ounces/minutes per feed is considered adequate at this age?',
    'Should I be concerned about weight gain with reduced feeding?',
    'Could reflux be causing the poor feeding?',
  ],
  congestion: [
    'Is it safe to use a nasal aspirator multiple times a day?',
    'Should I elevate the crib mattress slightly?',
    'At what point does congestion become a breathing concern?',
  ],
  eye_discharge: [
    'Could this be a blocked tear duct vs. conjunctivitis?',
    'Do I need antibiotic drops or will warm compresses suffice?',
  ],
  ear_pulling: [
    'Does ear pulling always mean an ear infection?',
    'Should we get her ears checked today or wait a few days?',
    'Is there anything I can do at home to relieve ear discomfort?',
  ],
  lethargy: [
    'What level of sleepiness is normal vs. concerning?',
    'Should I try to wake her for feeds if she is unusually drowsy?',
    'Could this be related to dehydration?',
  ],
};

function generateAIQuestions(
  symptoms: string[],
  tempValue: string,
  customSymptoms: string[],
): string[] {
  const questions: string[] = [];

  const temp = parseFloat(tempValue);
  if (!isNaN(temp) && temp >= 38.0) {
    questions.push('At what temperature should I go to the emergency room?');
    if (temp >= 39.0) {
      questions.push('Should I give fever medication now, or let the fever do its job?');
    }
  }

  for (const symptom of symptoms) {
    const mapped = SYMPTOM_QUESTION_MAP[symptom];
    if (mapped) {
      questions.push(...mapped.slice(0, 2));
    }
  }

  if (symptoms.includes('fever') && symptoms.includes('ear_pulling')) {
    questions.push('Could the fever and ear pulling together indicate an ear infection?');
  }
  if (symptoms.includes('fever') && symptoms.includes('rash')) {
    questions.push('Could the fever and rash be related — like roseola?');
  }
  if (symptoms.includes('vomiting') && symptoms.includes('diarrhea')) {
    questions.push('With both vomiting and diarrhea, should I give an oral rehydration solution like Pedialyte?');
  }

  for (const custom of customSymptoms) {
    questions.push(`I've noticed "${custom}" — is this something to monitor or worry about?`);
  }

  const unique = [...new Set(questions)];
  return unique.slice(0, 6);
}

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

// AI scribe mockup summary
const SCRIBE_MOCKUP = {
  title: 'Doctor Visit Summary',
  date: 'Feb 23, 2026 — Dr. Chen, Pediatrics',
  sections: [
    {
      heading: 'Action Items',
      items: [
        'Continue current feeding schedule — gaining well',
        'Start vitamin D drops (400 IU daily)',
        'Schedule 2-month vaccines for next visit',
      ],
    },
    {
      heading: 'Medication Dosages',
      items: [
        'Acetaminophen: 2.5 mL if fever above 100.4°F (38°C)',
        'Vitamin D: 1 mL once daily with morning feed',
      ],
    },
    {
      heading: 'Reassuring Notes',
      items: [
        '"Her weight gain is excellent — 75th percentile"',
        '"The mild cradle cap is completely normal and will resolve on its own"',
        '"Her hip exam looks great — no concerns"',
      ],
    },
  ],
};

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
function HistorySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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
          data={SAMPLE_HISTORY}
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

  // Doctor questions
  const [doctorQuestions, setDoctorQuestions] = useState('');

  // AI question suggestions
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // AI Scribe
  const [showScribeMockup, setShowScribeMockup] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // History sheet
  const [showHistory, setShowHistory] = useState(false);

  // Toast
  const [showToast, setShowToast] = useState(false);

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

  const handleGenerateQuestions = useCallback(() => {
    const allSymptoms = [...selectedSymptoms];
    if (allSymptoms.length === 0 && customSymptoms.length === 0 && !tempValue.trim()) {
      Alert.alert(
        'Add Some Context',
        'Log a temperature or select symptoms first so the AI can suggest relevant questions.',
      );
      return;
    }

    setIsGeneratingQuestions(true);
    setTimeout(() => {
      const questions = generateAIQuestions(allSymptoms, tempValue, customSymptoms);
      setAiQuestions(questions);
      setIsGeneratingQuestions(false);
    }, 600);
  }, [selectedSymptoms, customSymptoms, tempValue]);

  const handleInsertQuestion = (question: string) => {
    setDoctorQuestions((prev) => {
      const prefix = prev.trim() ? prev.trim() + '\n' : '';
      return prefix + '- ' + question + '\n';
    });
  };

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => router.back(), 1500);
  };

  const handleRecordPress = () => {
    if (isRecording) {
      setIsRecording(false);
      setTimeout(() => setShowScribeMockup(true), 800);
    } else {
      Alert.alert(
        'Record Appointment',
        'Place your phone on the table during your doctor visit. The AI will listen, transcribe, and organize the key information for you.\n\nThis is a preview of an upcoming feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Recording', onPress: () => setIsRecording(true) },
        ]
      );
    }
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

        {/* ── Section 4: Questions for the Doctor ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="clipboard" size={18} color={colors.primary[500]} />
            <Text style={styles.sectionTitle}>Questions for the Doctor</Text>
          </View>
          <Text style={styles.sectionSub}>
            Jot down worries and questions before your appointment so you don't forget.
          </Text>

          <Pressable
            style={[styles.aiSuggestButton, shadows.sm]}
            onPress={handleGenerateQuestions}
            disabled={isGeneratingQuestions}
          >
            {isGeneratingQuestions ? (
              <ActivityIndicator size="small" color={colors.primary[600]} />
            ) : (
              <Feather name="zap" size={16} color={colors.primary[600]} />
            )}
            <Text style={styles.aiSuggestText}>
              {isGeneratingQuestions ? 'Thinking...' : 'Auto-Suggest Questions'}
            </Text>
          </Pressable>

          {aiQuestions.length > 0 && (
            <View style={styles.aiQuestionsCard}>
              <View style={styles.aiQuestionsHeader}>
                <Feather name="message-circle" size={14} color={colors.primary[600]} />
                <Text style={styles.aiQuestionsTitle}>Suggested Questions</Text>
              </View>
              <Text style={styles.aiQuestionsHint}>Tap a question to add it to your notes</Text>
              {aiQuestions.map((q, i) => (
                <Pressable
                  key={i}
                  style={styles.aiQuestionRow}
                  onPress={() => handleInsertQuestion(q)}
                >
                  <View style={styles.aiQuestionBullet}>
                    <Text style={styles.aiQuestionBulletText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.aiQuestionText}>{q}</Text>
                  <Feather name="plus-circle" size={16} color={colors.primary[400]} />
                </Pressable>
              ))}
              <View style={styles.aiQuestionsFooter}>
                <Feather name="lock" size={11} color={colors.textTertiary} />
                <Text style={styles.aiQuestionsFooterText}>
                  Based on your logged symptoms — always use your own judgement
                </Text>
              </View>
            </View>
          )}

          <TextInput
            style={styles.notesArea}
            placeholder={"- Why does she spit up after every feed?\n- Is her soft spot normal size?\n- When should we start solids?"}
            placeholderTextColor={colors.textTertiary}
            value={doctorQuestions}
            onChangeText={setDoctorQuestions}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
        </View>

        {/* ── Section 5: AI Doctor Visit Scribe ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="mic" size={18} color={colors.primary[500]} />
            <Text style={styles.sectionTitle}>Record Appointment</Text>
          </View>
          <Text style={styles.sectionSub}>
            Let the AI listen to your doctor's visit and organize the key takeaways for you.
          </Text>

          <Pressable
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={handleRecordPress}
          >
            <View style={[styles.recordDot, isRecording && styles.recordDotActive]} />
            <Text style={[styles.recordText, isRecording && styles.recordTextActive]}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </Pressable>

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingPulse} />
              <Text style={styles.recordingLabel}>Listening...</Text>
            </View>
          )}

          {showScribeMockup && (
            <View style={[styles.scribeCard, shadows.md]}>
              <View style={styles.scribeHeader}>
                <Feather name="zap" size={16} color={colors.primary[600]} />
                <Text style={styles.scribeTitle}>{SCRIBE_MOCKUP.title}</Text>
              </View>
              <Text style={styles.scribeDate}>{SCRIBE_MOCKUP.date}</Text>

              {SCRIBE_MOCKUP.sections.map((section, idx) => (
                <View key={idx} style={styles.scribeSection}>
                  <Text style={styles.scribeSectionTitle}>{section.heading}</Text>
                  {section.items.map((item, i) => (
                    <View key={i} style={styles.scribeItem}>
                      <View style={styles.scribeBullet} />
                      <Text style={styles.scribeItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ))}

              <View style={styles.scribeFooter}>
                <Feather name="lock" size={12} color={colors.textTertiary} />
                <Text style={styles.scribeFooterText}>
                  AI-generated summary — always verify with your doctor
                </Text>
              </View>
            </View>
          )}
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

      {/* History Bottom Sheet */}
      <HistorySheet visible={showHistory} onClose={() => setShowHistory(false)} />

      <InsightToast
        visible={showToast}
        title="Health Logged"
        body="Entry saved successfully."
        severity="info"
        onDismiss={() => setShowToast(false)}
        autoDismissMs={2000}
      />
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
  sectionSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
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
  // AI Suggest
  aiSuggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginBottom: spacing.base,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
  },
  aiSuggestText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  aiQuestionsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.base,
    marginBottom: spacing.base,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[400],
    ...shadows.sm,
  },
  aiQuestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  aiQuestionsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  aiQuestionsHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  aiQuestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  aiQuestionBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  aiQuestionBulletText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  aiQuestionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  aiQuestionsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  aiQuestionsFooterText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
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
  // Record button
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary[300],
    ...shadows.sm,
  },
  recordButtonActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  recordDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
  },
  recordDotActive: {
    backgroundColor: colors.textInverse,
  },
  recordText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  recordTextActive: {
    color: colors.textInverse,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  recordingPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  recordingLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontWeight: typography.fontWeight.medium,
  },
  scribeCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  scribeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  scribeTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scribeDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.lg,
  },
  scribeSection: {
    marginBottom: spacing.base,
  },
  scribeSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
    marginBottom: spacing.sm,
  },
  scribeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  scribeBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary[400],
    marginTop: 7,
  },
  scribeItemText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  scribeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  scribeFooterText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
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
});

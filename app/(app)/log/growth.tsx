// ============================================================
// Nodd — Growth Log Screen
// Educational card-based layout: Weight, Length, Head Circumference
// With Nurse's Tips teaching mothers how to measure at home
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
// SafeAreaView not needed — Stack header handles top safe area
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { InsightToast } from '../../../src/shared/components/InsightToast';
import { useGrowthStore } from '../../../src/stores/growthStore';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { generateUUID } from '../../../src/stores/createSyncedStore';
import type { GrowthLog } from '../../../src/modules/growth/types';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

// ── Unit Conversions ──
const kgToGrams = (kg: number) => Math.round(kg * 1000);
const lbsToGrams = (lbs: number) => Math.round(lbs * 453.592);
const inToCm = (inches: number) => inches * 2.54;

// ── Date Helpers ──
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatDateLabel(date: Date) {
  const today = new Date();
  if (isSameDay(date, today)) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Metric Card Data ──
interface MetricInfo {
  key: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
  metricPlaceholder: string;
  imperialPlaceholder: string;
  tipTitle: string;
  tipBody: string;
}

const METRICS: MetricInfo[] = [
  {
    key: 'weight',
    title: 'Weight',
    icon: 'trending-up',
    iconBg: colors.primary[50],
    iconColor: colors.primary[600],
    metricPlaceholder: '3.5',
    imperialPlaceholder: '7.7',
    tipTitle: "Nurse's Tip: How to weigh at home",
    tipBody: 'Weigh yourself holding your baby, then weigh yourself alone. Subtract the difference!\n\nFor best accuracy, weigh at the same time of day (before a feed works well) and in just a dry diaper.',
  },
  {
    key: 'length',
    title: 'Length',
    icon: 'maximize-2',
    iconBg: colors.secondary[50],
    iconColor: colors.secondary[500],
    metricPlaceholder: '50.5',
    imperialPlaceholder: '19.9',
    tipTitle: "Nurse's Tip: How to measure length",
    tipBody: 'Lay your baby flat on a firm surface. Gently stretch one leg straight and mark where the heel rests.\n\nMark the top of the head too, then measure between the two marks with a tape measure. Having a helper makes this much easier!',
  },
  {
    key: 'head',
    title: 'Head Circumference',
    icon: 'circle',
    iconBg: '#FFF3E0',
    iconColor: colors.warning,
    metricPlaceholder: '35.0',
    imperialPlaceholder: '13.8',
    tipTitle: "Nurse's Tip: How to measure the head",
    tipBody: 'Use a soft, flexible measuring tape. Wrap it snugly around the widest part of the head — just above the eyebrows and ears, around the back where it sticks out the most.\n\nTake 2–3 measurements and use the largest one. This is more accurate than you\'d think!',
  },
];

export default function GrowthLogScreen() {
  const router = useRouter();
  const baby = useBabyStore((s) => s.getActiveBaby());
  const profile = useAuthStore((s) => s.profile);
  const family = useAuthStore((s) => s.family);
  const { addItem } = useGrowthStore();

  const isMetric = family?.preferred_units !== 'imperial';

  // Date navigation
  const [measuredDate, setMeasuredDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Custom back button (bulletproof fix for "(tabs)" label)
  const headerLeft = useCallback(
    () => (
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
        <Feather name="chevron-left" size={26} color={colors.primary[600]} />
        <Text style={styles.backLabel}>Home</Text>
      </Pressable>
    ),
    [router],
  );

  // Inputs (in display units)
  const [weightInput, setWeightInput] = useState('');
  const [lengthInput, setLengthInput] = useState('');
  const [headInput, setHeadInput] = useState('');
  const [notes, setNotes] = useState('');

  // Tip expansion
  const [expandedTips, setExpandedTips] = useState<Record<string, boolean>>({});

  // Toast
  const [showToast, setShowToast] = useState(false);

  const toggleTip = (key: string) => {
    setExpandedTips((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const weightUnit = isMetric ? 'kg' : 'lbs';
  const lengthUnit = isMetric ? 'cm' : 'in';

  // Date navigation
  const goToPrevDay = () => {
    setMeasuredDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const goToNextDay = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMeasuredDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d > new Date() ? prev : d;
    });
  };

  const goToToday = () => setMeasuredDate(new Date());

  const isToday = isSameDay(measuredDate, new Date());

  // Date picker handler
  const onDatePickerChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate && selectedDate <= new Date()) {
      setMeasuredDate(selectedDate);
    }
  };

  const confirmIOSDate = () => setShowDatePicker(false);

  // Input map for each metric
  const inputMap: Record<string, { value: string; setter: (v: string) => void }> = {
    weight: { value: weightInput, setter: setWeightInput },
    length: { value: lengthInput, setter: setLengthInput },
    head: { value: headInput, setter: setHeadInput },
  };

  const canSave = weightInput.trim() !== '' || lengthInput.trim() !== '' || headInput.trim() !== '';

  const handleSave = () => {
    if (!baby) return;

    const now = new Date().toISOString();
    const familyId = profile?.family_id ?? baby.family_id;
    const loggedBy = profile?.id ?? '';

    const weightNum = parseFloat(weightInput);
    const lengthNum = parseFloat(lengthInput);
    const headNum = parseFloat(headInput);

    const weightGrams = !isNaN(weightNum)
      ? (isMetric ? kgToGrams(weightNum) : lbsToGrams(weightNum))
      : null;
    const heightCm = !isNaN(lengthNum)
      ? (isMetric ? lengthNum : inToCm(lengthNum))
      : null;
    const headCm = !isNaN(headNum)
      ? (isMetric ? headNum : inToCm(headNum))
      : null;

    const log: GrowthLog = {
      id: generateUUID(),
      baby_id: baby.id,
      family_id: familyId,
      logged_by: loggedBy,
      measured_at: measuredDate.toISOString(),
      weight_grams: weightGrams,
      height_cm: heightCm,
      head_circumference_cm: headCm,
      weight_percentile: null,
      height_percentile: null,
      head_percentile: null,
      chart_type: 'who',
      notes: notes.trim() || null,
      created_at: now,
      updated_at: now,
    };

    addItem(log);
    setShowToast(true);
    setTimeout(() => router.back(), 1500);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Log Growth',
          headerTintColor: colors.primary[600],
          headerLeft,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}
        <Text style={styles.introText}>
          Track your baby's growth between checkups.
        </Text>

        {/* ── Date Pill ── */}
        <View style={styles.datePillRow}>
          <Pressable onPress={goToPrevDay} style={styles.dateArrowButton} hitSlop={12}>
            <Feather name="chevron-left" size={18} color={colors.primary[500]} />
          </Pressable>
          <Pressable onPress={() => setShowDatePicker(true)} style={[styles.datePill, styles.datePillShadow]}>
            <View style={styles.datePillIcon}>
              <Feather name="calendar" size={14} color={colors.primary[600]} />
            </View>
            <Text style={styles.datePillLabel}>{formatDateLabel(measuredDate)}</Text>
            <Feather name="chevron-down" size={12} color={colors.primary[400]} />
          </Pressable>
          <Pressable
            onPress={goToNextDay}
            style={[styles.dateArrowButton, isToday && styles.dateArrowDisabled]}
            hitSlop={12}
            disabled={isToday}
          >
            <Feather name="chevron-right" size={18} color={isToday ? colors.neutral[300] : colors.primary[500]} />
          </Pressable>
        </View>

        {/* ── Date Picker (Android: inline, iOS: modal) ── */}
        {Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker
            value={measuredDate}
            mode="date"
            display="calendar"
            maximumDate={new Date()}
            onChange={onDatePickerChange}
          />
        )}
        {Platform.OS === 'ios' && (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <Pressable style={styles.pickerOverlay} onPress={() => setShowDatePicker(false)}>
              <Pressable style={styles.pickerSheet} onPress={() => {}}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Date</Text>
                  <Pressable onPress={confirmIOSDate} hitSlop={12}>
                    <Text style={styles.pickerDone}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={measuredDate}
                  mode="date"
                  display="inline"
                  maximumDate={new Date()}
                  onChange={onDatePickerChange}
                  style={styles.iosPicker}
                  themeVariant="light"
                />
              </Pressable>
            </Pressable>
          </Modal>
        )}

        {/* ── Metric Cards ── */}
        {METRICS.map((metric) => {
          const { value, setter } = inputMap[metric.key];
          const unit = metric.key === 'weight' ? weightUnit : lengthUnit;
          const unitLabel = metric.key === 'weight'
            ? (isMetric ? 'Kilograms (kg)' : 'Pounds (lbs)')
            : (isMetric ? 'Centimeters (cm)' : 'Inches (in)');
          const placeholder = isMetric ? metric.metricPlaceholder : metric.imperialPlaceholder;
          const isExpanded = expandedTips[metric.key] ?? false;

          return (
            <View key={metric.key} style={[styles.metricCard, shadows.sm]}>
              {/* Header */}
              <View style={styles.metricHeader}>
                <View style={[styles.metricIconWrap, { backgroundColor: metric.iconBg }]}>
                  <Feather name={metric.icon} size={18} color={metric.iconColor} />
                </View>
                <View style={styles.metricTitleWrap}>
                  <Text style={styles.metricTitle}>{metric.title}</Text>
                  <Text style={styles.metricSub}>{unitLabel}</Text>
                </View>
              </View>

              {/* Input */}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.metricInput}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textTertiary}
                  value={value}
                  onChangeText={setter}
                  keyboardType="decimal-pad"
                  maxLength={6}
                />
                <Text style={styles.unitText}>{unit}</Text>
              </View>

              {/* Nurse Tip Toggle */}
              <Pressable
                style={styles.tipToggle}
                onPress={() => toggleTip(metric.key)}
              >
                <Feather name="heart" size={14} color={colors.primary[500]} />
                <Text style={styles.tipToggleText}>{metric.tipTitle}</Text>
                <Feather
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.primary[400]}
                />
              </Pressable>

              {/* Nurse Tip Body */}
              {isExpanded && (
                <View style={styles.tipBody}>
                  <Text style={styles.tipText}>{metric.tipBody}</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* ── Notes ── */}
        <View style={styles.notesSection}>
          <View style={styles.noteHeader}>
            <Feather name="edit-3" size={16} color={colors.textTertiary} />
            <Text style={styles.noteLabel}>Notes</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder="Any observations? (e.g., measured at pediatrician visit)"
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

        {/* Save Button */}
        <Pressable
          style={[styles.saveButton, shadows.sm, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Feather name="check" size={20} color={colors.textInverse} />
          <Text style={styles.saveButtonText}>Save Measurements</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      <InsightToast
        visible={showToast}
        title="Growth Logged"
        body="Measurements saved successfully."
        severity="info"
        onDismiss={() => setShowToast(false)}
        autoDismissMs={2000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.base,
  },
  introText: {
    fontFamily: SERIF_FONT,
    fontSize: typography.fontSize.base,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },

  // ── Date Pill ──
  datePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  dateArrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  dateArrowDisabled: {
    opacity: 0.3,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  datePillShadow: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  datePillIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePillLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },

  // ── Metric Card ──
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.base,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTitleWrap: {
    flex: 1,
  },
  metricTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  metricSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // ── Input ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  metricInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  unitText: {
    fontSize: typography.fontSize.md,
    color: colors.textTertiary,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.sm,
  },

  // ── Nurse Tip ──
  tipToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tipToggleText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
  },
  tipBody: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  tipText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },

  // ── Notes ──
  notesSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  noteLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  notesInput: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    minHeight: 80,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },

  // ── Back Button ──
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

  // ── Date Picker Modal ──
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingBottom: spacing['2xl'],
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  pickerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  pickerDone: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
  },
  iosPicker: {
    height: 340,
  },

  // ── Save Button ──
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },
});

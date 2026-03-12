// ============================================================
// Lumina — Diaper Log Screen
// Flat single-screen: tap to log, tap log entry to edit inline.
// Zero modals, zero redirects.
// ============================================================

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, Pressable, Animated, ScrollView, Switch, TextInput,
  StyleSheet, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { timeAgo } from '../../../src/shared/utils/dateTime';
import { useDiaperStore } from '../../../src/stores/diaperStore';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { ChipSelector } from '../../../src/shared/components/ChipSelector';
import { InsightToast } from '../../../src/shared/components/InsightToast';
import { KeyboardDoneBar, KEYBOARD_DONE_ID } from '../../../src/shared/components/KeyboardDoneBar';
import { analyzePhoto } from '../../../src/modules/diaper/services/diaperAnalysisService';
import type { DiaperType, StoolConsistency } from '../../../src/shared/types/common';

const CONSISTENCY_OPTIONS = [
  { value: 'liquid', label: 'Liquid' },
  { value: 'soft', label: 'Soft' },
  { value: 'formed', label: 'Formed' },
  { value: 'hard', label: 'Hard' },
  { value: 'mucousy', label: 'Mucousy' },
  { value: 'seedy', label: 'Seedy' },
];

function isSameDay(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

const TYPE_CONFIG: Record<
  DiaperType,
  { icon: keyof typeof Feather.glyphMap; label: string; color: string }
> = {
  wet: { icon: 'droplet', label: 'Wet', color: colors.info },
  dirty: { icon: 'cloud', label: 'Dirty', color: colors.warning },
  both: { icon: 'layers', label: 'Both', color: colors.secondary[500] },
  dry: { icon: 'sun', label: 'Dry', color: '#C4943A' },
};

export default function DiaperLogScreen() {
  const router = useRouter();
  const baby = useBabyStore((s) => s.getActiveBaby());
  const profile = useAuthStore((s) => s.profile);
  const { quickLog, getSummaryToday, updateItem, items } = useDiaperStore();
  const summary = baby ? getSummaryToday(baby.id) : null;

  // Visual feedback
  const [loggedFeedback, setLoggedFeedback] = useState<DiaperType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState<{
    title: string; body: string; severity: 'info' | 'warning'; source: string;
  } | null>(null);

  // Inline detail editor
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [editConsistency, setEditConsistency] = useState<StoolConsistency | null>(null);
  const [editRash, setEditRash] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  const lastChangeText = summary?.last_change_at
    ? timeAgo(summary.last_change_at)
    : 'No changes today';

  const todayLogs = useMemo(() => {
    if (!baby) return [];
    return items
      .filter((i) => i.baby_id === baby.id && isSameDay(i.logged_at))
      .sort(
        (a, b) =>
          new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime(),
      )
      .slice(0, 10);
  }, [items, baby]);

  // ── Every button: instant log, zero modals ──
  const handleQuickLog = useCallback(
    (type: DiaperType) => {
      if (!baby) return;
      const familyId = profile?.family_id ?? baby.family_id;
      const loggedBy = profile?.id ?? '';
      quickLog(baby.id, familyId, loggedBy, type);
      setLoggedFeedback(type);
      setTimeout(() => setLoggedFeedback(null), 1500);
    },
    [baby, profile, quickLog],
  );

  // ── Camera: attach AI results to the most recent log ──
  const handleCameraScan = useCallback(async () => {
    if (todayLogs.length === 0) {
      Alert.alert(
        'Log First',
        'Tap a button above to log a diaper, then use the camera to add details.',
      );
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Needed',
        'Camera access is required to scan diaper contents.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.6,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;

    const targetLog = todayLogs[0];
    setIsAnalyzing(true);
    try {
      const analysis = await analyzePhoto(result.assets[0].base64);

      if (!analysis.safe && analysis.error === 'privacy') {
        Alert.alert(
          'Privacy Alert',
          'Please ensure only diaper contents are visible.',
        );
      } else if (analysis.safe) {
        updateItem(targetLog.id, {
          stool_consistency:
            analysis.stoolConsistency ?? targetLog.stool_consistency,
        });
      } else if (analysis.error) {
        Alert.alert(
          'Analysis Failed',
          'Could not analyze. Tap the log entry to add details manually.',
        );
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [todayLogs, updateItem]);

  // ── Tap log row: expand/collapse inline editor ──
  const handleToggleExpand = useCallback(
    (logId: string) => {
      if (expandedLogId === logId) {
        // Collapse → persist edits
        updateItem(logId, {
          stool_consistency: editConsistency,
          has_rash: editRash,
          notes: editNotes.trim() || null,
        });
        if (editRash) {
          setToast({
            title: 'Diaper Rash Care: Dry First',
            body: 'Before applying rash cream, ensure the skin is COMPLETELY DRY. Applying cream on damp skin traps moisture and worsens the rash.',
            severity: 'info',
            source: 'Dermatology Best Practices',
          });
        }
        setExpandedLogId(null);
        return;
      }
      // Expand → load current values
      const log = items.find((i) => i.id === logId);
      if (!log) return;
      setEditConsistency(log.stool_consistency);
      setEditRash(log.has_rash);
      setEditNotes(log.notes ?? '');
      setExpandedLogId(logId);
    },
    [expandedLogId, editConsistency, editRash, editNotes, items, updateItem],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Diaper Log',
          headerTintColor: colors.primary[600],
          headerLeft: () => null,
          headerRight: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={{ marginRight: Platform.OS === 'ios' ? 0 : 8 }}
            >
              <Feather name="x" size={24} color={colors.textSecondary} />
            </Pressable>
          ),
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {/* Last change */}
        <View style={[styles.lastChangePill, shadows.sm]}>
          <Feather name="clock" size={14} color={colors.textSecondary} />
          <Text style={styles.lastChange}>
            Last change: {lastChangeText}
          </Text>
        </View>

        {/* ── Quick-log buttons ── */}
        <View style={styles.buttonsContainer}>
          <View style={styles.circleRow}>
            <BigCircleButton
              label="WET"
              iconName="droplet"
              color={colors.info}
              onPress={() => handleQuickLog('wet')}
              showCheck={loggedFeedback === 'wet'}
            />
            <BigCircleButton
              label="DIRTY"
              iconName="cloud"
              color={colors.warning}
              onPress={() => handleQuickLog('dirty')}
              showCheck={loggedFeedback === 'dirty'}
            />
            {/* Small camera button — attaches to most recent log */}
            <Pressable
              style={[styles.cameraCircle, shadows.sm]}
              onPress={handleCameraScan}
              disabled={isAnalyzing}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Scan diaper with camera"
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color={colors.primary[500]} />
              ) : (
                <Feather name="camera" size={20} color={colors.primary[500]} />
              )}
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.bothButton,
              shadows.sm,
              loggedFeedback === 'both' && styles.bothButtonLogged,
            ]}
            onPress={() => handleQuickLog('both')}
            accessibilityRole="button"
            accessibilityLabel="Log both wet and dirty diaper"
          >
            {loggedFeedback === 'both' ? (
              <Feather name="check" size={24} color={colors.success} />
            ) : (
              <>
                <View style={styles.bothIconRow}>
                  <Feather name="droplet" size={20} color={colors.secondary[500]} />
                  <Feather name="cloud" size={20} color={colors.secondary[500]} />
                </View>
                <Text style={styles.bothLabel}>BOTH</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ── Today summary ── */}
        {summary && summary.total_changes > 0 && (
          <View style={[styles.todaySummary, shadows.soft]}>
            <Text style={styles.summaryTitle}>Today</Text>
            <View style={styles.summaryRow}>
              <SummaryStat label="Wet" value={summary.wet_count} />
              <SummaryStat label="Dirty" value={summary.dirty_count} />
              <SummaryStat label="Both" value={summary.both_count} />
              <SummaryStat label="Total" value={summary.total_changes} />
            </View>
          </View>
        )}

        {/* ── Recent logs — tap any row to expand inline detail editor ── */}
        {todayLogs.length > 0 && (
          <View style={[styles.recentCard, shadows.soft]}>
            <Text style={styles.recentTitle}>Recent Logs</Text>
            {todayLogs.map((log) => {
              const cfg = TYPE_CONFIG[log.type];
              const isExpanded = expandedLogId === log.id;
              const details: string[] = [];
              if (log.stool_consistency) details.push(log.stool_consistency);
              if (log.has_rash) details.push('rash');

              return (
                <View key={log.id}>
                  {/* Log row — tappable */}
                  <Pressable
                    style={[
                      styles.recentRow,
                      isExpanded && styles.recentRowExpanded,
                    ]}
                    onPress={() => handleToggleExpand(log.id)}
                  >
                    <View
                      style={[
                        styles.recentIcon,
                        { backgroundColor: cfg.color + '15' },
                      ]}
                    >
                      <Feather name={cfg.icon} size={16} color={cfg.color} />
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentLabel}>{cfg.label}</Text>
                      {details.length > 0 && (
                        <Text style={styles.recentDetails}>
                          {details.join(' \u00B7 ')}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.recentTime}>
                      {timeAgo(log.logged_at)}
                    </Text>
                    <Feather
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.textTertiary}
                    />
                  </Pressable>

                  {/* Inline detail editor */}
                  {isExpanded && (
                    <View style={styles.expandedEditor}>
                      <Text style={styles.editorLabel}>Consistency</Text>
                      <ChipSelector
                        options={CONSISTENCY_OPTIONS}
                        selected={editConsistency ?? ''}
                        onSelect={(v) =>
                          setEditConsistency(v as StoolConsistency)
                        }
                      />

                      <View style={styles.rashRow}>
                        <Text style={styles.editorLabel}>Diaper Rash</Text>
                        <Switch
                          value={editRash}
                          onValueChange={setEditRash}
                          trackColor={{
                            true: colors.primary[500],
                            false: colors.neutral[200],
                          }}
                          thumbColor={colors.surface}
                        />
                      </View>

                      <TextInput
                        style={styles.notesInput}
                        placeholder="Notes (optional)"
                        placeholderTextColor={colors.textTertiary}
                        value={editNotes}
                        onChangeText={setEditNotes}
                        multiline
                        maxLength={200}
                        inputAccessoryViewID={KEYBOARD_DONE_ID}
                      />

                      <Pressable
                        style={[styles.doneButton, shadows.sm]}
                        onPress={() => handleToggleExpand(log.id)}
                      >
                        <Feather
                          name="check"
                          size={18}
                          color={colors.textInverse}
                        />
                        <Text style={styles.doneButtonText}>Done</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {toast && (
        <InsightToast
          visible={!!toast}
          title={toast.title}
          body={toast.body}
          severity={toast.severity}
          source={toast.source}
          onDismiss={() => setToast(null)}
        />
      )}
      <KeyboardDoneBar />
    </View>
  );
}

// ── Big circle quick-log button with checkmark feedback ──
function BigCircleButton({
  label,
  iconName,
  color,
  onPress,
  showCheck,
}: {
  label: string;
  iconName: keyof typeof Feather.glyphMap;
  color: string;
  onPress: () => void;
  showCheck?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.92,
          useNativeDriver: true,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start()
      }
      accessibilityRole="button"
      accessibilityLabel={`Log ${label} diaper`}
    >
      <Animated.View
        style={[
          styles.bigCircle,
          shadows.md,
          {
            backgroundColor: showCheck ? colors.success + '12' : color + '12',
            borderColor: showCheck ? colors.success : color,
            transform: [{ scale }],
          },
        ]}
      >
        {showCheck ? (
          <Feather name="check" size={34} color={colors.success} />
        ) : (
          <>
            <Feather name={iconName} size={34} color={color} />
            <Text style={[styles.bigLabel, { color }]}>{label}</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 100, alignItems: 'center' },

  lastChangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    marginBottom: spacing['2xl'],
    marginTop: spacing.base,
  },
  lastChange: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  // Quick-log buttons
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xl,
  },
  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  bigCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bigLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  cameraCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.primary[300],
    borderStyle: 'dashed',
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  bothButton: {
    width: '100%',
    height: 80,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: colors.secondary[300],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  bothButtonLogged: {
    borderColor: colors.success,
    backgroundColor: colors.success + '08',
  },
  bothIconRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bothLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary[500],
  },

  // Today summary
  todaySummary: {
    marginTop: spacing.xl,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center' },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Recent logs
  recentCard: {
    marginTop: spacing.lg,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
  },
  recentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
  },
  recentRowExpanded: {
    backgroundColor: colors.neutral[50],
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: { flex: 1 },
  recentLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  recentDetails: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  recentTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginRight: spacing.xs,
  },

  // Inline detail editor
  expandedEditor: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[200],
  },
  editorLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  rashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  doneButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignSelf: 'flex-end',
  },
  doneButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },
});

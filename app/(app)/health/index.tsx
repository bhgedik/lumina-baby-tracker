// ============================================================
// Sprouty — Health Hub
// Two-Track System: Routine Care + Active Illness Episodes
// Premium squircle aesthetic, nurture-first, zero anxiety
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { SegmentControl } from '../../../src/shared/components/SegmentControl';
import { InsightToast } from '../../../src/shared/components/InsightToast';
import { VaccineCard } from '../../../src/modules/health/components/VaccineCard';
import { CheckupCard } from '../../../src/modules/health/components/CheckupCard';
import { VaccineAdminSheet } from '../../../src/modules/health/components/VaccineAdminSheet';
import { CheckupCompletionSheet } from '../../../src/modules/health/components/CheckupCompletionSheet';
import { EpisodeCreateSheet } from '../../../src/modules/health/components/EpisodeCreateSheet';
import { DoctorVisitSheet } from '../../../src/modules/health/components/DoctorVisitSheet';
import { useVaccineSchedule } from '../../../src/modules/health/hooks/useVaccineSchedule';
import { useCheckupSchedule } from '../../../src/modules/health/hooks/useCheckupSchedule';
import { useActiveEpisodes } from '../../../src/modules/health/hooks/useActiveEpisodes';
import { useHealthStore } from '../../../src/stores/healthStore';
import { useGrowthStore } from '../../../src/stores/growthStore';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { generateUUID } from '../../../src/stores/createSyncedStore';
import type { VaccineTrackingItem, CheckupTrackingItem, IllnessEpisode } from '../../../src/modules/health/types';

const SEGMENTS = [
  { value: 'routine', label: 'Routine Care' },
  { value: 'illness', label: 'Illness' },
];

// ── Soft shadow token ───────────────────────────────────────

const SOFT_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
};

export default function HealthHubScreen() {
  const router = useRouter();
  const [segment, setSegment] = useState('routine');

  // Routine care toggles
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Illness toggles
  const [showResolvedEpisodes, setShowResolvedEpisodes] = useState(false);

  // Sheets
  const [selectedVaccine, setSelectedVaccine] = useState<VaccineTrackingItem | null>(null);
  const [showVaccineSheet, setShowVaccineSheet] = useState(false);
  const [showEpisodeSheet, setShowEpisodeSheet] = useState(false);
  const [selectedCheckup, setSelectedCheckup] = useState<CheckupTrackingItem | null>(null);
  const [showCheckupSheet, setShowCheckupSheet] = useState(false);
  const [doctorVisitEpisode, setDoctorVisitEpisode] = useState<IllnessEpisode | null>(null);
  const [showDoctorVisitSheet, setShowDoctorVisitSheet] = useState(false);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Data — age-gated grouping
  const { dueNow: dueNowVaccines, future: futureVaccines, completed: completedVaccines } = useVaccineSchedule();
  const { dueNow: dueNowCheckups, future: futureCheckups, completed: completedCheckups } = useCheckupSchedule();
  const { active: activeEpisodes, resolved: resolvedEpisodes, getLogCount } = useActiveEpisodes();

  // Actions
  const addVaccination = useHealthStore((s) => s.addVaccination);
  const addHealthLog = useHealthStore((s) => s.addHealthLog);
  const addEpisode = useHealthStore((s) => s.addEpisode);
  const resolveEpisode = useHealthStore((s) => s.resolveEpisode);
  const addGrowthItem = useGrowthStore((s) => s.addItem);
  const baby = useBabyStore((s) => s.getActiveBaby());
  const babyName = baby?.name ?? 'Baby';

  // ── Unified routine care lists ──

  type RoutineItem =
    | { type: 'vaccine'; item: VaccineTrackingItem }
    | { type: 'checkup'; item: CheckupTrackingItem };

  const dueNowItems = useMemo((): RoutineItem[] => {
    const vaccines: RoutineItem[] = dueNowVaccines.map((item) => ({ type: 'vaccine', item }));
    const checkups: RoutineItem[] = dueNowCheckups.map((item) => ({ type: 'checkup', item }));
    return [...vaccines, ...checkups].sort((a, b) => {
      const dateA = a.item.scheduledDate;
      const dateB = b.item.scheduledDate;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  }, [dueNowVaccines, dueNowCheckups]);

  const upcomingItems = useMemo((): RoutineItem[] => {
    const vaccines: RoutineItem[] = futureVaccines.map((item) => ({ type: 'vaccine', item }));
    const checkups: RoutineItem[] = futureCheckups.map((item) => ({ type: 'checkup', item }));
    return [...vaccines, ...checkups].sort((a, b) => {
      const dateA = a.item.scheduledDate;
      const dateB = b.item.scheduledDate;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  }, [futureVaccines, futureCheckups]);

  const completedItems = useMemo((): RoutineItem[] => {
    const vaccines: RoutineItem[] = completedVaccines.map((item) => ({ type: 'vaccine', item }));
    const checkups: RoutineItem[] = completedCheckups.map((item) => ({ type: 'checkup', item }));
    return [...vaccines, ...checkups];
  }, [completedVaccines, completedCheckups]);

  // ── Handlers ──

  const handleMarkVaccineAdministered = useCallback((item: VaccineTrackingItem) => {
    setSelectedVaccine(item);
    setShowVaccineSheet(true);
  }, []);

  const handleSaveVaccination = useCallback((data: {
    vaccineId: string;
    doseNumber: number;
    administeredDate: string;
  }) => {
    if (!baby) return;
    const now = new Date().toISOString();
    addVaccination({
      id: generateUUID(),
      baby_id: baby.id,
      family_id: baby.family_id,
      vaccine_name: data.vaccineId,
      dose_number: data.doseNumber,
      scheduled_date: selectedVaccine?.scheduledDate ?? data.administeredDate,
      administered_date: data.administeredDate,
      administered_by: null,
      lot_number: null,
      side_effects: null,
      notes: null,
      created_at: now,
      updated_at: now,
    });
    setToastMsg('Vaccination recorded!');
    setShowToast(true);
  }, [baby, addVaccination, selectedVaccine]);

  const handleMarkCheckupCompleted = useCallback((item: CheckupTrackingItem) => {
    setSelectedCheckup(item);
    setShowCheckupSheet(true);
  }, []);

  const handleSaveCheckup = useCallback((data: {
    weightGrams: number | null;
    heightCm: number | null;
    headCm: number | null;
    notes: string;
  }) => {
    if (!baby || !selectedCheckup) return;
    const session = useAuthStore.getState().session;
    const profile = useAuthStore.getState().profile;
    const now = new Date().toISOString();
    const userId = session?.user?.id ?? '';

    // 1. Mark checkup completed via health log
    addHealthLog({
      id: generateUUID(),
      baby_id: baby.id,
      family_id: baby.family_id,
      logged_by: userId,
      logged_at: now,
      type: 'well_child_checkup',
      temperature_celsius: null,
      temperature_method: null,
      medication_name: null,
      medication_dose: null,
      symptoms: null,
      doctor_name: null,
      diagnosis: null,
      notes: data.notes || `${selectedCheckup.label} well-child checkup completed`,
      attachments: null,
      episode_id: null,
      created_at: now,
      updated_at: now,
    });

    // 2. Push growth measurement → real-time Growth chart update
    if (data.weightGrams !== null || data.heightCm !== null || data.headCm !== null) {
      addGrowthItem({
        id: generateUUID(),
        baby_id: baby.id,
        family_id: profile?.family_id ?? baby.family_id,
        logged_by: userId,
        measured_at: now,
        weight_grams: data.weightGrams,
        height_cm: data.heightCm,
        head_circumference_cm: data.headCm,
        weight_percentile: null,
        height_percentile: null,
        head_percentile: null,
        chart_type: 'who',
        notes: `${selectedCheckup.label} checkup measurement`,
        created_at: now,
        updated_at: now,
      });
    }

    setToastMsg(`${selectedCheckup.label} checkup recorded!`);
    setShowToast(true);
  }, [baby, selectedCheckup, addHealthLog, addGrowthItem]);

  const handleCreateEpisode = useCallback((data: {
    title: string;
    primarySymptoms: string[];
    notes: string;
  }) => {
    if (!baby) return;
    const session = useAuthStore.getState().session;
    const now = new Date().toISOString();
    addEpisode({
      id: generateUUID(),
      baby_id: baby.id,
      family_id: baby.family_id,
      created_by: session?.user?.id ?? '',
      title: data.title,
      started_at: now,
      resolved_at: null,
      status: 'active',
      primary_symptoms: data.primarySymptoms,
      diagnosis: null,
      notes: data.notes || null,
      created_at: now,
      updated_at: now,
    });
    setToastMsg('Episode started!');
    setShowToast(true);
  }, [baby, addEpisode]);

  const handleResolveEpisode = useCallback((episodeId: string) => {
    resolveEpisode(episodeId);
    setToastMsg('Episode resolved');
    setShowToast(true);
  }, [resolveEpisode]);

  const handleSaveDoctorVisit = useCallback((data: {
    doctorName: string;
    diagnosis: string;
    notes: string;
    questions: string[];
  }) => {
    if (!baby || !doctorVisitEpisode) return;
    const session = useAuthStore.getState().session;
    const now = new Date().toISOString();

    // Build notes: prepend selected questions if any
    let fullNotes = '';
    if (data.questions.length > 0) {
      fullNotes += 'Questions asked:\n' + data.questions.map(q => `\u2022 ${q}`).join('\n') + '\n\n';
    }
    if (data.notes) fullNotes += data.notes;

    addHealthLog({
      id: generateUUID(),
      baby_id: baby.id,
      family_id: baby.family_id,
      logged_by: session?.user?.id ?? '',
      logged_at: now,
      type: 'doctor_visit',
      temperature_celsius: null,
      temperature_method: null,
      medication_name: null,
      medication_dose: null,
      symptoms: null,
      doctor_name: data.doctorName || null,
      diagnosis: data.diagnosis || null,
      notes: fullNotes.trim() || null,
      attachments: null,
      episode_id: doctorVisitEpisode.id,
      created_at: now,
      updated_at: now,
    });

    setToastMsg('Doctor visit saved!');
    setShowToast(true);
  }, [baby, doctorVisitEpisode, addHealthLog]);

  // Custom back button
  const headerLeft = useCallback(
    () => (
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
        <Feather name="chevron-left" size={26} color={colors.primary[600]} />
        <Text style={styles.backLabel}>Home</Text>
      </Pressable>
    ),
    [router],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Health',
          headerTintColor: colors.primary[600],
          headerBackTitle: 'Home',
          headerLeft,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: {
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            color: colors.textPrimary,
          },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Segment Control */}
        <SegmentControl
          options={SEGMENTS}
          selected={segment}
          onSelect={setSegment}
        />

        {segment === 'routine' ? (
          <View style={styles.segmentContent}>
            {/* ── DUE NOW ── */}
            <SectionHeader
              icon="shield"
              iconBg={dueNowItems.length > 0 ? '#FFF3E0' : '#EDF3EE'}
              iconTint={dueNowItems.length > 0 ? '#BF5A00' : colors.primary[500]}
              title="Due Now"
              subtitle={dueNowItems.length > 0
                ? 'Needs attention'
                : 'All caught up'}
            />

            {dueNowItems.length === 0 ? (
              <CaughtUpCard
                icon="check-circle"
                title="All caught up!"
                subtitle={`${babyName} is right on track with vaccines and checkups.`}
                accentColor={colors.primary[500]}
              />
            ) : (
              dueNowItems.map((entry) =>
                entry.type === 'vaccine' ? (
                  <VaccineCard
                    key={`v-${entry.item.vaccineId}-${entry.item.doseNumber}`}
                    item={entry.item}
                    onMarkAdministered={handleMarkVaccineAdministered}
                  />
                ) : (
                  <CheckupCard
                    key={`c-${entry.item.checkupId}`}
                    item={entry.item}
                    onMarkCompleted={handleMarkCheckupCompleted}
                  />
                ),
              )
            )}

            {/* ── UPCOMING (collapsible) ── */}
            {upcomingItems.length > 0 && (
              <>
                <CollapsibleToggle
                  label="Upcoming"
                  icon="calendar"
                  iconTint={colors.neutral[400]}
                  expanded={showUpcoming}
                  onToggle={() => setShowUpcoming((p) => !p)}
                />
                {showUpcoming &&
                  upcomingItems.map((entry) =>
                    entry.type === 'vaccine' ? (
                      <VaccineCard
                        key={`v-${entry.item.vaccineId}-${entry.item.doseNumber}`}
                        item={entry.item}
                        onMarkAdministered={handleMarkVaccineAdministered}
                        dimmed
                      />
                    ) : (
                      <CheckupCard
                        key={`c-${entry.item.checkupId}`}
                        item={entry.item}
                        onMarkCompleted={handleMarkCheckupCompleted}
                        dimmed
                      />
                    ),
                  )}
              </>
            )}

            {/* ── COMPLETED (collapsible) ── */}
            {completedItems.length > 0 && (
              <>
                <CollapsibleToggle
                  label="Completed"
                  icon="check-circle"
                  iconTint={colors.primary[500]}
                  expanded={showCompleted}
                  onToggle={() => setShowCompleted((p) => !p)}
                />
                {showCompleted &&
                  completedItems.map((entry) =>
                    entry.type === 'vaccine' ? (
                      <VaccineCard
                        key={`v-${entry.item.vaccineId}-${entry.item.doseNumber}`}
                        item={entry.item}
                        onMarkAdministered={handleMarkVaccineAdministered}
                      />
                    ) : (
                      <CheckupCard
                        key={`c-${entry.item.checkupId}`}
                        item={entry.item}
                        onMarkCompleted={handleMarkCheckupCompleted}
                      />
                    ),
                  )}
              </>
            )}
          </View>
        ) : (
          /* ════════════════════════════════════════════════
             ILLNESS TRACK — Accordion Episode Cards
             ════════════════════════════════════════════════ */
          <View style={styles.segmentContent}>
            {activeEpisodes.length === 0 ? (
              <>
                {/* Healthy empty state */}
                <View style={styles.healthyHeroCard}>
                  <View style={styles.healthyIconWrap}>
                    <Feather name="heart" size={28} color={colors.primary[500]} />
                  </View>
                  <Text style={styles.healthyTitle}>{babyName} is feeling great!</Text>
                  <Text style={styles.healthySubtitle}>No illness episodes being tracked.</Text>
                  <Pressable
                    style={styles.inlineStartButton}
                    onPress={() => setShowEpisodeSheet(true)}
                  >
                    <Feather name="plus" size={16} color="#FFF" />
                    <Text style={styles.inlineStartText}>Start Episode</Text>
                  </Pressable>
                </View>

                {/* Nurse's Tip */}
                <View style={styles.nurseTipCard}>
                  <View style={styles.nurseTipHeader}>
                    <Feather name="heart" size={16} color={colors.primary[500]} />
                    <Text style={styles.nurseTipTitle}>When to track an episode</Text>
                  </View>
                  <Text style={styles.nurseTipBody}>
                    Track symptoms like fever, rashes, vomiting, or unusual fussiness. Logging helps you spot patterns and share accurate timelines with your pediatrician.
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* Section Header */}
                <SectionHeader
                  icon="activity"
                  iconBg="#FEF5F0"
                  iconTint={colors.secondary[500]}
                  title="Active Episodes"
                  subtitle="Currently being tracked"
                />

                {/* Active Episode Cards — always expanded */}
                {activeEpisodes.map((ep) => (
                  <ActiveEpisodeCard
                    key={ep.id}
                    episode={ep}
                    logCount={getLogCount(ep.id)}
                    onUpdateEpisode={() => router.push(`/(app)/log/health?episodeId=${ep.id}` as any)}
                    onLogVisit={() => {
                      setDoctorVisitEpisode(ep);
                      setShowDoctorVisitSheet(true);
                    }}
                    onViewTimeline={() => router.push(`/(app)/health/episode/${ep.id}` as any)}
                    onResolve={() => handleResolveEpisode(ep.id)}
                  />
                ))}

                {/* Start new episode button */}
                <Pressable
                  style={styles.startEpisodeButton}
                  onPress={() => setShowEpisodeSheet(true)}
                >
                  <Feather name="plus" size={18} color="#FFF" />
                  <Text style={styles.startEpisodeText}>Start Episode</Text>
                </Pressable>
              </>
            )}

            {/* Resolved Episodes (collapsible) */}
            {resolvedEpisodes.length > 0 && (
              <>
                <CollapsibleToggle
                  label="Resolved"
                  icon="check-circle"
                  iconTint={colors.primary[500]}
                  expanded={showResolvedEpisodes}
                  onToggle={() => setShowResolvedEpisodes((p) => !p)}
                />
                {showResolvedEpisodes &&
                  resolvedEpisodes.map((ep) => (
                    <Pressable
                      key={ep.id}
                      style={styles.resolvedCard}
                      onPress={() => router.push(`/(app)/health/episode/${ep.id}` as any)}
                    >
                      <View style={styles.resolvedIconWrap}>
                        <Feather name="check-circle" size={18} color={colors.primary[400]} />
                      </View>
                      <View style={styles.resolvedTextCol}>
                        <Text style={styles.resolvedTitle}>{ep.title}</Text>
                        <Text style={styles.resolvedDate}>
                          {formatDateRange(ep.started_at, ep.resolved_at)}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={colors.neutral[300]} />
                    </Pressable>
                  ))}
              </>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Sheets */}
      <VaccineAdminSheet
        item={selectedVaccine}
        visible={showVaccineSheet}
        onClose={() => setShowVaccineSheet(false)}
        onSave={handleSaveVaccination}
      />
      <CheckupCompletionSheet
        item={selectedCheckup}
        visible={showCheckupSheet}
        onClose={() => setShowCheckupSheet(false)}
        onSave={handleSaveCheckup}
      />
      <EpisodeCreateSheet
        visible={showEpisodeSheet}
        onClose={() => setShowEpisodeSheet(false)}
        onSave={handleCreateEpisode}
      />
      <DoctorVisitSheet
        episode={doctorVisitEpisode}
        visible={showDoctorVisitSheet}
        onClose={() => setShowDoctorVisitSheet(false)}
        onSave={handleSaveDoctorVisit}
      />

      {/* Toast */}
      <InsightToast
        visible={showToast}
        title="Saved!"
        body={toastMsg}
        severity="info"
        onDismiss={() => setShowToast(false)}
        autoDismissMs={3000}
      />
    </View>
  );
}

// ── Helper ──────────────────────────────────────────────────

function formatDateRange(started: string, resolved: string | null): string {
  const start = new Date(started);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (!resolved) return `${startStr} — ongoing`;
  const end = new Date(resolved);
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} — ${endStr}`;
}

// ── Active Episode Card ─────────────────────────────────────
// Always-expanded card for active illness episodes.
// Two action buttons: "Update Episode" (unified symptom/temp/meds)
// and "Doctor Visit" (secondary). Footer has timeline + resolve.

function ActiveEpisodeCard({
  episode,
  logCount,
  onUpdateEpisode,
  onLogVisit,
  onViewTimeline,
  onResolve,
}: {
  episode: IllnessEpisode;
  logCount: number;
  onUpdateEpisode: () => void;
  onLogVisit: () => void;
  onViewTimeline: () => void;
  onResolve: () => void;
}) {
  const startStr = new Date(episode.started_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.episodeCard, SOFT_SHADOW]}>
      {/* Header */}
      <View style={styles.episodeHeader}>
        <View style={styles.episodeDot} />
        <View style={styles.episodeTitleCol}>
          <Text style={styles.episodeTitle}>{episode.title}</Text>
          <Text style={styles.episodeMeta}>{startStr} — ongoing</Text>
        </View>
        {episode.primary_symptoms.length > 0 && (
          <View style={styles.episodeChipRow}>
            {episode.primary_symptoms.slice(0, 2).map((s) => (
              <View key={s} style={styles.episodeChip}>
                <Text style={styles.episodeChipText}>{s}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={styles.episodeDivider} />

      {/* Primary action: Update Episode */}
      <Pressable style={styles.primaryAction} onPress={onUpdateEpisode}>
        <View style={[styles.actionIcon, { backgroundColor: colors.secondary[50] }]}>
          <Feather name="edit-3" size={18} color={colors.secondary[500]} />
        </View>
        <Text style={styles.primaryActionLabel}>Update Episode</Text>
        <Feather name="chevron-right" size={16} color={colors.neutral[300]} />
      </Pressable>

      {/* Secondary action: Doctor Visit */}
      <Pressable style={styles.actionRow} onPress={onLogVisit}>
        <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
          <Feather name="clipboard" size={18} color="#6366F1" />
        </View>
        <Text style={styles.actionLabel}>Doctor Visit</Text>
        <Feather name="chevron-right" size={16} color={colors.neutral[300]} />
      </Pressable>

      {/* Footer: timeline link + resolve */}
      <View style={styles.episodeFooter}>
        <Pressable style={styles.timelineLink} onPress={onViewTimeline}>
          <Feather name="clock" size={14} color={colors.primary[500]} />
          <Text style={styles.timelineLinkText}>
            View Timeline{logCount > 0 ? ` (${logCount})` : ''}
          </Text>
        </Pressable>

        <Pressable style={styles.resolveLink} onPress={onResolve}>
          <Feather name="check-circle" size={14} color={colors.primary[500]} />
          <Text style={styles.resolveLinkText}>Resolve</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Section Header ──────────────────────────────────────────

function SectionHeader({
  icon,
  iconBg,
  iconTint,
  title,
  subtitle,
}: {
  icon: string;
  iconBg: string;
  iconTint: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={16} color={iconTint} />
      </View>
      <View style={styles.sectionTextCol}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

// ── Caught Up Card ──────────────────────────────────────────

function CaughtUpCard({
  icon,
  title,
  subtitle,
  accentColor,
}: {
  icon: string;
  title: string;
  subtitle: string;
  accentColor: string;
}) {
  return (
    <View style={styles.caughtUpCard}>
      <View style={styles.caughtUpIconWrap}>
        <Feather name={icon as any} size={28} color={accentColor} />
      </View>
      <Text style={styles.caughtUpTitle}>{title}</Text>
      <Text style={styles.caughtUpSubtitle}>{subtitle}</Text>
    </View>
  );
}

// ── Collapsible Toggle ──────────────────────────────────────

function CollapsibleToggle({
  label,
  icon,
  iconTint,
  expanded,
  onToggle,
}: {
  label: string;
  icon: string;
  iconTint: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable style={styles.toggleCard} onPress={onToggle}>
      <View style={[styles.toggleIconWrap, { backgroundColor: iconTint + '18' }]}>
        <Feather name={icon as any} size={14} color={iconTint} />
      </View>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Feather
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={16}
        color={colors.neutral[400]}
      />
    </Pressable>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
  },
  segmentContent: {
    marginTop: spacing.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  backLabel: {
    fontSize: typography.fontSize.md,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.base,
    gap: spacing.md,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTextCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: 1,
  },

  // ── Caught Up Card ──
  caughtUpCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    ...SOFT_SHADOW,
  },
  caughtUpIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  caughtUpTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  caughtUpSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Collapsible Toggle ──
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...SOFT_SHADOW,
  },
  toggleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },

  // ── Active Episode Card ──
  episodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary[400],
  },
  episodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  episodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary[400],
  },
  episodeTitleCol: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  episodeMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: 1,
  },
  episodeChipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  episodeChip: {
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  episodeChipText: {
    fontSize: 11,
    color: colors.secondary[600],
    fontWeight: typography.fontWeight.medium,
  },
  episodeDivider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: spacing.md,
  },

  // Primary action (prominent)
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  primaryActionLabel: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },

  // Secondary action row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },

  // Footer
  episodeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  timelineLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timelineLinkText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
  resolveLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resolveLinkText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },

  // ── Resolved episode cards ──
  resolvedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: spacing.base,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...SOFT_SHADOW,
  },
  resolvedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolvedTextCol: {
    flex: 1,
  },
  resolvedTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  resolvedDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: 1,
  },

  // ── Illness Segment ──
  startEpisodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    ...SOFT_SHADOW,
  },
  startEpisodeText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },

  // ── Healthy Hero Card ──
  healthyHeroCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    ...SOFT_SHADOW,
  },
  healthyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  healthyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  healthySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inlineStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    marginTop: 20,
    ...shadows.sm,
  },
  inlineStartText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },

  // ── Nurse's Tip ──
  nurseTipCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 20,
    padding: 20,
    marginTop: spacing.base,
  },
  nurseTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nurseTipTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  nurseTipBody: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    marginTop: spacing.sm,
  },
});

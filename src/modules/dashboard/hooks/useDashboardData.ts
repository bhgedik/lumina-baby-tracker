// ============================================================
// Sprout — Dashboard Data Hook
// Aggregates all store summaries for the dashboard
// Uses stable selectors to prevent unnecessary re-renders
// ============================================================

import { useMemo } from 'react';
import { useFeedingStore } from '../../../stores/feedingStore';
import { useSleepStore } from '../../../stores/sleepStore';
import { useDiaperStore } from '../../../stores/diaperStore';
import { useBabyStore } from '../../../stores/babyStore';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { useMotherMedsStore, type ActiveMed } from '../../../stores/motherMedsStore';
import { calculateCorrectedAge } from '../../baby/utils/correctedAge';
import { getNurseInsightForDay, formatInsightAge, type NurseInsight } from '../../../ai/dailyNurseInsights';
import { timeAgo } from '../../../shared/utils/dateTime';
import { resolvePetState, type PetDomain } from '../../../shared/utils/petState';
import type { PetState } from '../../../shared/components/PetIcons';
import { colors } from '../../../shared/constants/theme';
import type { FeedingSummary } from '../../feeding/types';
import type { SleepSummary } from '../../sleep/types';
import type { DiaperSummary } from '../../diaper/types';
import type { CorrectedAgeResult } from '../../baby/types';

interface GestationalInfo {
  week: number;
  dayOfWeek: number;
  progress: number; // 0–1
}

interface BabyAge {
  days: number;
  display: string;
}

interface DashboardData {
  greeting: string;
  parentName: string | null;
  babyName: string | null;
  isPregnant: boolean;
  dueDate: string | null;
  dateOfBirth: string | null;
  gestationalWeek: number;
  gestationalInfo: GestationalInfo;
  correctedAge: CorrectedAgeResult | null;
  babyAge: BabyAge | null;
  feedingSummary: FeedingSummary | null;
  sleepSummary: SleepSummary | null;
  diaperSummary: DiaperSummary | null;
  hasActiveFeedingTimer: boolean;
  hasActiveSleepTimer: boolean;
  experienceLevel: 'first_time' | 'experienced';
  feedingMethod: string;
  // New postpartum dashboard fields
  isMedHidden: boolean;
  nextMedDue: ActiveMed | null;
  activeMeds: ActiveMed[];
  lastFedAgo: string | null;
  totalFeedsToday: number;
  totalWetToday: number;
  totalDirtyToday: number;
  lastSleepAgo: string | null;
  nurseInsight: NurseInsight | null;
  nurseInsightAge: string | null;
  petStates: Record<PetDomain, { state: PetState; tintColor: string; iconColor: string }>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up?';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function computeBabyAge(dateOfBirth: string): BabyAge | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const birth = new Date(dateOfBirth);
  birth.setHours(0, 0, 0, 0);
  const diffMs = now.getTime() - birth.getTime();
  if (diffMs < 0) return null;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return { days, display: 'Born Today' };
  if (days === 1) return { days, display: 'Day 1' };
  if (days < 14) return { days, display: `Day ${days}` };
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return { days, display: `${weeks} Week${weeks > 1 ? 's' : ''} Old` };
  const months = Math.floor(days / 30.44);
  return { days, display: `${months} Month${months > 1 ? 's' : ''} Old` };
}

function computeGestationalInfo(dueDate: string | null): GestationalInfo {
  if (!dueDate) return { week: 0, dayOfWeek: 0, progress: 0 };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const totalGestDays = Math.max(0, 280 - daysLeft);
  const rawWeek = Math.floor(totalGestDays / 7);
  const week = Math.max(4, Math.min(42, rawWeek));
  // Use raw week for dayOfWeek so it stays 0-6; clamp when week is floored
  const dayOfWeek = Math.max(0, totalGestDays - rawWeek * 7);
  const progress = Math.min(1, totalGestDays / 280);
  return { week, dayOfWeek, progress };
}

export function useDashboardData(): DashboardData {
  // Select stable primitive/reference values — NOT method calls
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const onboardingParentName = useOnboardingStore((s) => s.parentName);
  const onboardingExperience = useOnboardingStore((s) => s.experienceLevel);
  const onboardingFeeding = useOnboardingStore((s) => s.feedingMethod);
  const feedingTimer = useFeedingStore((s) => s.activeTimer);
  const feedingItemCount = useFeedingStore((s) => s.items.length);
  const sleepTimer = useSleepStore((s) => s.activeTimer);
  const sleepItemCount = useSleepStore((s) => s.items.length);
  const diaperItemCount = useDiaperStore((s) => s.items.length);

  // Mother stores — subscribe to reactive state
  const activeMeds = useMotherMedsStore((s) => s.activeMeds);
  const isMedHidden = useMotherMedsStore((s) => s.isHidden);

  const baby = useMemo(() => {
    if (!activeBabyId) return babies[0] ?? null;
    return babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;
  }, [babies, activeBabyId]);

  const dueDate = baby?.due_date ?? null;

  const gestationalInfo = useMemo(() => computeGestationalInfo(dueDate), [dueDate]);

  // Compute summaries outside selectors using getState() (non-reactive, computed on demand)
  const feedingSummary = useMemo<FeedingSummary | null>(() => {
    if (!baby) return null;
    return useFeedingStore.getState().getSummaryToday(baby.id);
  }, [baby, feedingTimer, feedingItemCount]);

  const sleepSummary = useMemo<SleepSummary | null>(() => {
    if (!baby) return null;
    return useSleepStore.getState().getSummaryToday(baby.id);
  }, [baby, sleepTimer, sleepItemCount]);

  const diaperSummary = useMemo<DiaperSummary | null>(() => {
    if (!baby) return null;
    return useDiaperStore.getState().getSummaryToday(baby.id);
  }, [baby, diaperItemCount]);

  const correctedAge = useMemo(() => {
    return baby ? calculateCorrectedAge(baby) : null;
  }, [baby]);

  const dateOfBirth = (!baby?.is_pregnant && baby?.date_of_birth) ? baby.date_of_birth : null;

  const babyAge = useMemo<BabyAge | null>(() => {
    if (!dateOfBirth) return null;
    return computeBabyAge(dateOfBirth);
  }, [dateOfBirth]);

  // New postpartum dashboard computations
  const nextMedDue = useMemo(() => {
    return useMotherMedsStore.getState().getNextDue();
  }, [activeMeds]);

  const lastFedAgo = useMemo(() => {
    if (!feedingSummary?.last_feed_at) return null;
    return timeAgo(feedingSummary.last_feed_at);
  }, [feedingSummary]);

  const lastSleepAgo = useMemo(() => {
    if (!sleepSummary?.last_sleep_ended_at) return null;
    return timeAgo(sleepSummary.last_sleep_ended_at);
  }, [sleepSummary]);

  const nurseInsight = useMemo<NurseInsight | null>(() => {
    if (!babyAge) return null;
    return getNurseInsightForDay(babyAge.days);
  }, [babyAge]);

  const nurseInsightAge = useMemo<string | null>(() => {
    if (!babyAge) return null;
    return formatInsightAge(babyAge.days);
  }, [babyAge]);

  const petStates = useMemo<Record<PetDomain, { state: PetState; tintColor: string; iconColor: string }>>(() => ({
    feeding: resolvePetState('feeding', feedingSummary?.hours_since_last_feed ?? null, colors.secondary[400]),
    sleep: resolvePetState('sleep', sleepSummary?.minutes_since_last_wake != null ? sleepSummary.minutes_since_last_wake / 60 : null, colors.primary[400]),
    diaper: resolvePetState('diaper', diaperSummary?.hours_since_last_change ?? null, colors.warning),
  }), [feedingSummary, sleepSummary, diaperSummary]);

  return {
    greeting: getGreeting(),
    parentName: onboardingParentName || null,
    babyName: baby?.name ?? null,
    isPregnant: baby?.is_pregnant ?? false,
    dueDate,
    dateOfBirth,
    gestationalWeek: gestationalInfo.week,
    gestationalInfo,
    correctedAge,
    babyAge,
    feedingSummary,
    sleepSummary,
    diaperSummary,
    hasActiveFeedingTimer: !!feedingTimer,
    hasActiveSleepTimer: !!sleepTimer,
    experienceLevel: onboardingExperience ?? 'first_time',
    feedingMethod: onboardingFeeding ?? 'mixed',
    // New fields
    isMedHidden,
    nextMedDue,
    activeMeds,
    lastFedAgo,
    totalFeedsToday: feedingSummary?.total_feeds ?? 0,
    totalWetToday: diaperSummary?.wet_count ?? 0,
    totalDirtyToday: diaperSummary?.dirty_count ?? 0,
    lastSleepAgo,
    nurseInsight,
    nurseInsightAge,
    petStates,
  };
}

// ============================================================
// Lumina — Insights Chart Data Hook
// Aggregates store data for the analytics dashboard:
// Growth percentile, Nutrition/milk intake, Stacked sleep
// ============================================================

import { useMemo } from 'react';
import { useFeedingStore } from '../../../stores/feedingStore';
import { useSleepStore } from '../../../stores/sleepStore';
import { useGrowthStore } from '../../../stores/growthStore';
import { useBabyStore } from '../../../stores/babyStore';
import { calculatePercentile, resolveSex } from '../../growth/utils/percentileCalculation';
import type { FeedingLog } from '../../feeding/types';

// ── Types ────────────────────────────────────────────────────

export interface GrowthPoint {
  ageWeeks: number;
  percentile: number;
}

export interface NutritionDay {
  label: string;
  volumeMl: number;
  isEstimated: boolean; // true if any feed was estimated from minutes
}

export interface StackedSleepDay {
  label: string;
  napHours: number;
  nightHours: number;
}

export interface InsightsChartData {
  growth: GrowthPoint[];
  hasGrowthData: boolean;
  nutrition: NutritionDay[];
  hasNutritionData: boolean;
  hasEstimatedNutrition: boolean;
  sleep: StackedSleepDay[];
  hasSleepData: boolean;
}

// ── Helpers ──────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDayLabel(date: Date): string {
  return DAY_LABELS[date.getDay()];
}

function lastNDays(n: number): Date[] {
  const days: Date[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

/**
 * Estimate milk volume from breastfeeding duration.
 * Average flow rate ~15ml per minute (placeholder).
 * This is a rough clinical estimate used as a fallback.
 */
export function estimateVolumeFromMinutes(minutes: number): number {
  const ML_PER_MINUTE = 15;
  return Math.round(minutes * ML_PER_MINUTE);
}

/** Get the total volume (ml) for a single feeding log. */
function getFeedVolumeMl(feed: FeedingLog): { ml: number; estimated: boolean } {
  // Bottle feeds with explicit ml
  if (feed.bottle_amount_ml != null && feed.bottle_amount_ml > 0) {
    return { ml: feed.bottle_amount_ml, estimated: false };
  }

  // Breast feeds — estimate from duration
  if (feed.type === 'breast') {
    const leftSec = feed.left_duration_seconds ?? 0;
    const rightSec = feed.right_duration_seconds ?? 0;
    const totalMinutes = (leftSec + rightSec) / 60;

    // If we have duration data, estimate volume
    if (totalMinutes > 0) {
      return { ml: estimateVolumeFromMinutes(totalMinutes), estimated: true };
    }

    // If started_at and ended_at exist, compute duration
    if (feed.started_at && feed.ended_at) {
      const start = new Date(feed.started_at).getTime();
      const end = new Date(feed.ended_at).getTime();
      const mins = Math.max(0, (end - start) / 60000);
      if (mins > 0) {
        return { ml: estimateVolumeFromMinutes(mins), estimated: true };
      }
    }
  }

  return { ml: 0, estimated: false };
}

// ── Hook ─────────────────────────────────────────────────────

export function useInsightsChartData(): InsightsChartData {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);

  const feedingItems = useFeedingStore((s) => s.items);
  const sleepItems = useSleepStore((s) => s.items);
  const growthItems = useGrowthStore((s) => s.items);

  const baby = useMemo(() => {
    if (!activeBabyId) return babies[0] ?? null;
    return babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;
  }, [babies, activeBabyId]);

  const babyId = baby?.id ?? null;

  // ── Growth: percentile over time ──
  const growth = useMemo<GrowthPoint[]>(() => {
    if (!baby) return [];

    const babyItems = growthItems.filter((g) => g.baby_id === baby.id);
    if (babyItems.length === 0) return [];

    const sex = resolveSex(baby.gender);
    const dob = new Date(baby.date_of_birth);

    return babyItems
      .filter((g) => g.weight_grams != null)
      .map((g) => {
        const measuredAt = new Date(g.measured_at);
        const ageMs = measuredAt.getTime() - dob.getTime();
        const ageWeeks = Math.max(0, Math.round(ageMs / (7 * 24 * 60 * 60 * 1000)));
        const ageMonths = ageMs / (30.44 * 24 * 60 * 60 * 1000);

        const percentile = calculatePercentile(sex, 'weight', ageMonths, g.weight_grams!);

        return { ageWeeks, percentile: Math.round(percentile) };
      })
      .sort((a, b) => a.ageWeeks - b.ageWeeks);
  }, [growthItems, baby]);

  // ── Nutrition: last 7 days daily volume ──
  const { nutrition, hasEstimatedNutrition } = useMemo(() => {
    const days = lastNDays(7);
    const dayKeys = days.map((d) => startOfDay(d));

    const volumeByDay = new Map<string, number>();
    const estimatedByDay = new Map<string, boolean>();
    for (const key of dayKeys) {
      volumeByDay.set(key, 0);
      estimatedByDay.set(key, false);
    }

    let anyEstimated = false;

    for (const item of feedingItems) {
      if (babyId && item.baby_id !== babyId) continue;
      // Only count milk feeds (breast, bottle) — not solids
      if (item.type === 'solid' || item.type === 'snack') continue;

      const key = startOfDay(new Date(item.started_at));
      if (!volumeByDay.has(key)) continue;

      const { ml, estimated } = getFeedVolumeMl(item);
      volumeByDay.set(key, (volumeByDay.get(key) ?? 0) + ml);
      if (estimated) {
        estimatedByDay.set(key, true);
        anyEstimated = true;
      }
    }

    const result = days.map((d, i) => ({
      label: getDayLabel(d),
      volumeMl: Math.round(volumeByDay.get(dayKeys[i]) ?? 0),
      isEstimated: estimatedByDay.get(dayKeys[i]) ?? false,
    }));

    return { nutrition: result, hasEstimatedNutrition: anyEstimated };
  }, [feedingItems, babyId]);

  // ── Sleep: last 7 days stacked (nap + night) ──
  const sleep = useMemo<StackedSleepDay[]>(() => {
    const days = lastNDays(7);
    const dayKeys = days.map((d) => startOfDay(d));

    const napByDay = new Map<string, number>();
    const nightByDay = new Map<string, number>();
    for (const key of dayKeys) {
      napByDay.set(key, 0);
      nightByDay.set(key, 0);
    }

    for (const item of sleepItems) {
      if (babyId && item.baby_id !== babyId) continue;
      const key = startOfDay(new Date(item.started_at));
      const hours = (item.duration_minutes ?? 0) / 60;

      if (item.type === 'nap' && napByDay.has(key)) {
        napByDay.set(key, (napByDay.get(key) ?? 0) + hours);
      } else if (item.type === 'night' && nightByDay.has(key)) {
        nightByDay.set(key, (nightByDay.get(key) ?? 0) + hours);
      }
    }

    return days.map((d, i) => ({
      label: getDayLabel(d),
      napHours: Math.round((napByDay.get(dayKeys[i]) ?? 0) * 10) / 10,
      nightHours: Math.round((nightByDay.get(dayKeys[i]) ?? 0) * 10) / 10,
    }));
  }, [sleepItems, babyId]);

  const hasNutritionData = nutrition.some((d) => d.volumeMl > 0);
  const hasSleepData = sleep.some((d) => d.napHours > 0 || d.nightHours > 0);

  return {
    growth,
    hasGrowthData: growth.length > 0,
    nutrition,
    hasNutritionData,
    hasEstimatedNutrition,
    sleep,
    hasSleepData,
  };
}

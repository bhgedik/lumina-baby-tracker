// ============================================================
// Sprouty — Chart Data Hook
// Aggregates store data into chart-ready arrays for the carousel
// ============================================================

import { useMemo } from 'react';
import { useFeedingStore } from '../../../stores/feedingStore';
import { useDiaperStore } from '../../../stores/diaperStore';
import { useSleepStore } from '../../../stores/sleepStore';
import { useGrowthStore } from '../../../stores/growthStore';
import { useBabyStore } from '../../../stores/babyStore';
import { calculatePercentile, resolveSex } from '../../growth/utils/percentileCalculation';

// ── Types ────────────────────────────────────────────────────

export interface HabitsDay {
  label: string;
  feeds: number;
  diapers: number;
}

export interface SleepDay {
  label: string;
  hours: number;
}

export interface GrowthPoint {
  ageWeeks: number;
  percentile: number;
}

export interface ChartData {
  habits: HabitsDay[];
  sleep: SleepDay[];
  growth: GrowthPoint[];
  hasGrowthData: boolean;
}

// ── Helpers ──────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDayLabel(date: Date): string {
  return DAY_LABELS[date.getDay()];
}

/** Generate an array of Date objects for the last N days (most recent last). */
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

// ── Hook ─────────────────────────────────────────────────────

export function useChartData(): ChartData {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);

  const feedingItems = useFeedingStore((s) => s.items);
  const diaperItems = useDiaperStore((s) => s.items);
  const sleepItems = useSleepStore((s) => s.items);
  const growthItems = useGrowthStore((s) => s.items);

  const baby = useMemo(() => {
    if (!activeBabyId) return babies[0] ?? null;
    return babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;
  }, [babies, activeBabyId]);

  const babyId = baby?.id ?? null;

  // ── Habits: last 7 days ──
  const habits = useMemo<HabitsDay[]>(() => {
    const days = lastNDays(7);
    const dayKeys = days.map((d) => startOfDay(d));

    // Build feeding counts by day
    const feedsByDay = new Map<string, number>();
    for (const key of dayKeys) feedsByDay.set(key, 0);

    for (const item of feedingItems) {
      if (babyId && item.baby_id !== babyId) continue;
      const key = startOfDay(new Date(item.started_at));
      if (feedsByDay.has(key)) {
        feedsByDay.set(key, (feedsByDay.get(key) ?? 0) + 1);
      }
    }

    // Build diaper counts by day
    const diapersByDay = new Map<string, number>();
    for (const key of dayKeys) diapersByDay.set(key, 0);

    for (const item of diaperItems) {
      if (babyId && item.baby_id !== babyId) continue;
      const key = startOfDay(new Date(item.logged_at));
      if (diapersByDay.has(key)) {
        diapersByDay.set(key, (diapersByDay.get(key) ?? 0) + 1);
      }
    }

    return days.map((d, i) => ({
      label: getDayLabel(d),
      feeds: feedsByDay.get(dayKeys[i]) ?? 0,
      diapers: diapersByDay.get(dayKeys[i]) ?? 0,
    }));
  }, [feedingItems, diaperItems, babyId]);

  // ── Sleep: last 14 days (night sleep only) ──
  const sleep = useMemo<SleepDay[]>(() => {
    const days = lastNDays(14);
    const dayKeys = days.map((d) => startOfDay(d));

    const hoursByDay = new Map<string, number>();
    for (const key of dayKeys) hoursByDay.set(key, 0);

    for (const item of sleepItems) {
      if (babyId && item.baby_id !== babyId) continue;
      if (item.type !== 'night') continue;
      const key = startOfDay(new Date(item.started_at));
      if (hoursByDay.has(key)) {
        const hours = (item.duration_minutes ?? 0) / 60;
        hoursByDay.set(key, (hoursByDay.get(key) ?? 0) + hours);
      }
    }

    return days.map((d, i) => ({
      label: getDayLabel(d),
      hours: Math.round((hoursByDay.get(dayKeys[i]) ?? 0) * 10) / 10,
    }));
  }, [sleepItems, babyId]);

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

  return {
    habits,
    sleep,
    growth,
    hasGrowthData: growth.length > 0,
  };
}

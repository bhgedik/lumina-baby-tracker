// ============================================================
// Sprouty — Logging Pattern Builder
// Computes LoggingPattern from ALL stores for a given baby.
// Used by evaluateIntervention() to detect behavioral patterns.
// ============================================================

import { useFeedingStore } from '../../stores/feedingStore';
import { useSleepStore } from '../../stores/sleepStore';
import { useDiaperStore } from '../../stores/diaperStore';
import { useHealthStore } from '../../stores/healthStore';
import type { LoggingPattern } from '../interventionEngine';
import type { UUID } from '../../shared/types/common';

function getTimestamp(log: Record<string, unknown>): number {
  const ts = (log.started_at ?? log.logged_at ?? log.measured_at) as string;
  return new Date(ts).getTime();
}

export function buildLoggingPattern(babyId: UUID): LoggingPattern {
  const now = Date.now();
  const h24 = 24 * 3600000;
  const d7 = 7 * 24 * 3600000;

  // Merge all logs with timestamps
  const allLogs = [
    ...useFeedingStore.getState().items.filter((l) => l.baby_id === babyId),
    ...useSleepStore.getState().items.filter((l) => l.baby_id === babyId),
    ...useDiaperStore.getState().items.filter((l) => l.baby_id === babyId),
    ...useHealthStore.getState().getHealthLogsByBaby(babyId),
  ];

  const timestamps = allLogs
    .map((l) => getTimestamp(l as unknown as Record<string, unknown>))
    .filter((t) => !isNaN(t))
    .sort((a, b) => b - a);

  const logsLast24h = timestamps.filter((t) => now - t < h24).length;
  const logsLast7d = timestamps.filter((t) => now - t < d7).length;
  const avgDailyLogs7d = logsLast7d / 7;

  // Night logs (11 PM – 6 AM) in last 3 nights
  const threeNightsAgo = now - 3 * 24 * 3600000;
  const nightLogsLast3Nights = timestamps.filter((t) => {
    if (t < threeNightsAgo) return false;
    const hour = new Date(t).getHours();
    return hour >= 23 || hour < 6;
  }).length;

  // Longest gap between consecutive logs (last 7 days)
  const recentTimestamps = timestamps.filter((t) => now - t < d7);
  let longestGapHours = 0;
  for (let i = 0; i < recentTimestamps.length - 1; i++) {
    const gap = (recentTimestamps[i] - recentTimestamps[i + 1]) / 3600000;
    if (gap > longestGapHours) longestGapHours = gap;
  }

  const hasLogBurst = avgDailyLogs7d > 0 && logsLast24h > avgDailyLogs7d * 2;

  return {
    logsLast24h,
    logsLast7d,
    avgDailyLogs7d: Math.round(avgDailyLogs7d * 10) / 10,
    nightLogsLast3Nights,
    longestGapHours: Math.round(longestGapHours * 10) / 10,
    hasLogBurst,
  };
}

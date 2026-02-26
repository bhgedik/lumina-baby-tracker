// ============================================================
// Sprout — Intervention Engine
// Determines the AI intervention level based on log data patterns.
// Runs locally on the device — no API calls needed for rule evaluation.
// ============================================================

import type { InterventionLevel } from '../shared/types/common';
import type { FeedingSummary } from '../modules/feeding/types';
import type { SleepSummary } from '../modules/sleep/types';
import type { DiaperSummary } from '../modules/diaper/types';

export interface InterventionContext {
  correctedAgeMonths: number;
  correctedAgeDays: number;
  feedingSummary24h: FeedingSummary | null;
  sleepSummary24h: SleepSummary | null;
  diaperSummary24h: DiaperSummary | null;
  latestEpdsScore: number | null;
  loggingPattern: LoggingPattern;
  isPreterm: boolean;
}

export interface LoggingPattern {
  logsLast24h: number;
  logsLast7d: number;
  avgDailyLogs7d: number;
  nightLogsLast3Nights: number;
  longestGapHours: number;
  hasLogBurst: boolean;
}

export interface InterventionResult {
  level: InterventionLevel;
  triggers: string[];
  shouldCallAI: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Evaluate the current state and determine intervention level.
 * Returns the highest-priority intervention that matches.
 */
export function evaluateIntervention(
  ctx: InterventionContext
): InterventionResult {
  const triggers: string[] = [];
  let level: InterventionLevel = 'passive';
  let priority: InterventionResult['priority'] = 'low';

  // ─── REACTIVE CHECKS (highest priority) ───

  // Feeding gap check
  if (ctx.feedingSummary24h) {
    const maxGapHours = ctx.correctedAgeMonths < 3 ? 5 : 8;
    if (
      ctx.feedingSummary24h.hours_since_last_feed !== null &&
      ctx.feedingSummary24h.hours_since_last_feed > maxGapHours
    ) {
      triggers.push(`feeding_gap_${Math.round(ctx.feedingSummary24h.hours_since_last_feed)}h`);
      level = 'reactive';
      priority = 'high';
    }
  }

  // Wet diaper check
  if (ctx.diaperSummary24h) {
    const minWetDiapers = ctx.correctedAgeMonths < 1 ? 4 : 6;
    if (ctx.diaperSummary24h.wet_count < minWetDiapers) {
      triggers.push(`low_wet_diapers_${ctx.diaperSummary24h.wet_count}`);
      level = 'reactive';
      priority = 'high';
    }
  }

  // EPDS threshold
  if (ctx.latestEpdsScore !== null && ctx.latestEpdsScore >= 13) {
    triggers.push(`epds_score_${ctx.latestEpdsScore}`);
    level = 'reactive';
    priority = 'critical';
  }

  // ─── EMPATHIC CHECKS ───

  // Night logging exhaustion pattern
  if (ctx.loggingPattern.nightLogsLast3Nights > 6) {
    triggers.push('night_logging_exhaustion');
    if (level !== 'reactive') level = 'empathic';
    if (priority === 'low') priority = 'medium';
  }

  // Log burst detection (anxiety spiral)
  if (ctx.loggingPattern.hasLogBurst) {
    triggers.push('logging_burst_detected');
    if (level !== 'reactive') level = 'empathic';
    if (priority === 'low') priority = 'medium';
  }

  // Long gap then burst (overwhelm)
  if (
    ctx.loggingPattern.longestGapHours > 48 &&
    ctx.loggingPattern.logsLast24h > ctx.loggingPattern.avgDailyLogs7d * 2
  ) {
    triggers.push('gap_then_burst');
    if (level !== 'reactive') level = 'empathic';
    if (priority === 'low') priority = 'medium';
  }

  // ─── PROACTIVE CHECKS ───
  // (These are evaluated by scheduled tasks, not on every log)

  return {
    level,
    triggers,
    shouldCallAI: level !== 'passive',
    priority,
  };
}

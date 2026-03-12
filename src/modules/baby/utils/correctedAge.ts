// ============================================================
// Lumina — Corrected Age Calculation
//
// THE SINGLE MOST CRITICAL CALCULATION IN THE ENTIRE APP.
//
// Formula:
//   Corrected Age = Chronological Age - Prematurity Adjustment
//   Prematurity Adjustment = 40 weeks - Gestational Age at Birth
//
// RULES:
//   1. Use corrected age for ALL developmental assessments until 24 months
//   2. Use CHRONOLOGICAL age for vaccination schedules
//   3. Use Fenton charts for growth until 50 weeks post-menstrual age,
//      then switch to WHO charts using corrected age
//   4. Always display BOTH ages to parents when baby is preterm
//   5. After 24 months corrected, stop correcting (most preemies catch up)
// ============================================================

import type { Baby } from '../types';
import type { CorrectedAgeResult } from '../types';
import type { LifecycleStage } from '../../../shared/types/common';
import { APP_CONFIG } from '../../../shared/constants/config';

const { FULL_TERM_DAYS, PRETERM_THRESHOLD_WEEKS, CORRECTED_AGE_CUTOFF_DAYS } =
  APP_CONFIG.medical;

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000;
  return Math.floor((b.getTime() - a.getTime()) / msPerDay);
}

function daysToWeeks(days: number): number {
  return Math.floor(days / 7);
}

function daysToMonths(days: number): number {
  return Math.floor(days / 30.44); // average days per month
}

function formatAge(days: number): string {
  const months = daysToMonths(days);
  const remainingDays = days - Math.floor(months * 30.44);
  const weeks = Math.floor(remainingDays / 7);

  if (months === 0) {
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
    return `${daysToWeeks(days)} week${daysToWeeks(days) !== 1 ? 's' : ''}`;
  }
  if (weeks === 0) return `${months} month${months !== 1 ? 's' : ''}`;
  return `${months} month${months !== 1 ? 's' : ''}, ${weeks} week${weeks !== 1 ? 's' : ''}`;
}

function getLifecycleStage(effectiveAgeMonths: number): LifecycleStage {
  if (effectiveAgeMonths < 0) return 'prenatal';
  if (effectiveAgeMonths < 3) return 'fourth_trimester';
  if (effectiveAgeMonths < 6) return 'transition';
  if (effectiveAgeMonths < 12) return 'exploration';
  return 'toddler';
}

/**
 * Calculate corrected age for a baby.
 *
 * @param baby - The baby record
 * @param referenceDate - Date to calculate age at (defaults to now)
 * @returns CorrectedAgeResult with both ages and display helpers
 */
export function calculateCorrectedAge(
  baby: Pick<Baby, 'date_of_birth' | 'gestational_age_weeks' | 'gestational_age_days'>,
  referenceDate: Date = new Date()
): CorrectedAgeResult {
  const dob = new Date(baby.date_of_birth);
  const chronoDays = Math.max(0, daysBetween(dob, referenceDate));
  const chronoWeeks = daysToWeeks(chronoDays);
  const chronoMonths = daysToMonths(chronoDays);

  const isPreterm =
    baby.gestational_age_weeks !== null &&
    baby.gestational_age_weeks < PRETERM_THRESHOLD_WEEKS;

  if (!isPreterm) {
    const display = formatAge(chronoDays);
    return {
      chronological: {
        days: chronoDays,
        weeks: chronoWeeks,
        months: chronoMonths,
        display,
      },
      corrected: null,
      adjustmentDays: 0,
      adjustmentWeeks: 0,
      isPreterm: false,
      useCorrected: false,
      forDisplay: {
        primary: display,
        secondary: null,
        label: 'Age',
      },
      effectiveAgeMonths: chronoMonths,
      effectiveAgeDays: chronoDays,
    };
  }

  // Preterm calculation
  const gestTotalDays =
    (baby.gestational_age_weeks! * 7) + (baby.gestational_age_days ?? 0);
  const adjustmentDays = FULL_TERM_DAYS - gestTotalDays;
  const correctedDays = Math.max(0, chronoDays - adjustmentDays);
  const correctedWeeks = daysToWeeks(correctedDays);
  const correctedMonths = daysToMonths(correctedDays);
  const useCorrected = correctedDays < CORRECTED_AGE_CUTOFF_DAYS;

  const chronoDisplay = formatAge(chronoDays);
  const correctedDisplay = formatAge(correctedDays);

  return {
    chronological: {
      days: chronoDays,
      weeks: chronoWeeks,
      months: chronoMonths,
      display: chronoDisplay,
    },
    corrected: {
      days: correctedDays,
      weeks: correctedWeeks,
      months: correctedMonths,
      display: correctedDisplay,
    },
    adjustmentDays,
    adjustmentWeeks: daysToWeeks(adjustmentDays),
    isPreterm: true,
    useCorrected,
    forDisplay: useCorrected
      ? {
          primary: correctedDisplay,
          secondary: chronoDisplay,
          label: 'Corrected age',
        }
      : {
          primary: chronoDisplay,
          secondary: null,
          label: 'Age',
        },
    effectiveAgeMonths: useCorrected ? correctedMonths : chronoMonths,
    effectiveAgeDays: useCorrected ? correctedDays : chronoDays,
  };
}

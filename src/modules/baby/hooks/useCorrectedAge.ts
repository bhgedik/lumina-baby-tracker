import { useMemo } from 'react';
import { calculateCorrectedAge } from '../utils/correctedAge';
import type { Baby } from '../types';
import type { CorrectedAgeResult } from '../types';

/**
 * Hook to calculate and memoize corrected age for a baby.
 * Re-calculates when baby data or current date changes.
 *
 * Usage:
 *   const age = useCorrectedAge(baby);
 *   // age.effectiveAgeMonths — use for milestone/sleep/growth queries
 *   // age.forDisplay.primary — use for UI display
 *   // age.isPreterm — use for conditional UI
 */
export function useCorrectedAge(
  baby: Pick<Baby, 'date_of_birth' | 'gestational_age_weeks' | 'gestational_age_days'> | null
): CorrectedAgeResult | null {
  return useMemo(() => {
    if (!baby) return null;
    return calculateCorrectedAge(baby);
  }, [baby?.date_of_birth, baby?.gestational_age_weeks, baby?.gestational_age_days]);
}

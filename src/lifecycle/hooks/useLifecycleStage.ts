import { useMemo } from 'react';
import { getLifecycleStage } from '../lifecycleEngine';
import type { LifecycleStageConfig } from '../types';

/**
 * Hook to get the current lifecycle stage based on effective age.
 *
 * Usage:
 *   const age = useCorrectedAge(baby);
 *   const stage = useLifecycleStage(age?.effectiveAgeMonths ?? 0);
 *   // stage.label — "4th Trimester"
 *   // stage.focus_areas — current focus topics
 *   // stage.color — theme color for this stage
 */
export function useLifecycleStage(effectiveAgeMonths: number): LifecycleStageConfig {
  return useMemo(() => getLifecycleStage(effectiveAgeMonths), [effectiveAgeMonths]);
}

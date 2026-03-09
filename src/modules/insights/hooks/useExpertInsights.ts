// ============================================================
// Sprouty — Expert Insights Hook
// Fetches developmental nudges from Supabase filtered by
// the active baby's EFFECTIVE age (corrected for preterm),
// excluding dismissed nudges
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { useBabyStore } from '../../../stores/babyStore';
import { useInsightDismissStore } from '../../../stores/insightDismissStore';
import { calculateCorrectedAge } from '../../baby/utils/correctedAge';
import { getLifecycleStage } from '../../../lifecycle/lifecycleEngine';
import { fetchRelevantInsights, type ExpertInsight } from '../services/expertInsightsService';

export function useExpertInsights() {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const dismissedHashes = useInsightDismissStore((s) => s.dismissedHashes);

  const baby = activeBabyId
    ? babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null
    : babies[0] ?? null;

  // Use corrected age for preterm babies — critical product constraint
  const ageResult = useMemo(() => {
    if (!baby || baby.is_pregnant || !baby.date_of_birth) return null;
    return calculateCorrectedAge(baby);
  }, [baby]);

  const effectiveAgeDays = ageResult?.effectiveAgeDays ?? null;

  // Fetch from Supabase only when effective age changes (not on dismiss)
  const [allNudges, setAllNudges] = useState<ExpertInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (effectiveAgeDays === null) {
      setAllNudges([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetchRelevantInsights(effectiveAgeDays)
      .then((results) => {
        if (cancelled) return;
        setAllNudges(results);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [effectiveAgeDays]);

  // Filter dismissed nudges client-side (no re-fetch needed)
  const nudges = useMemo(
    () => allNudges.filter((i) => !(`nudge-${i.slug}` in dismissedHashes)),
    [allNudges, dismissedHashes],
  );

  // Lifecycle stage label based on effective age
  const stageLabel = ageResult
    ? getLifecycleStage(ageResult.effectiveAgeMonths).label
    : null;

  return { nudges, isLoading, stageLabel };
}

// ============================================================
// Lumina — Intervention Watch Hook
// Centralized hook that subscribes to ALL store item counts,
// evaluates the intervention engine on every change, and
// surfaces non-passive results via InsightToast state.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useFeedingStore } from '../../stores/feedingStore';
import { useSleepStore } from '../../stores/sleepStore';
import { useDiaperStore } from '../../stores/diaperStore';
import { useHealthStore } from '../../stores/healthStore';
import { useBabyStore } from '../../stores/babyStore';
import { useInsightDismissStore } from '../../stores/insightDismissStore';
import { evaluateIntervention } from '../interventionEngine';
import { buildLoggingPattern } from '../utils/buildLoggingPattern';
import { formatInterventionMessage } from '../utils/formatIntervention';
import { calculateCorrectedAge } from '../../modules/baby/utils/correctedAge';

export interface InterventionNudge {
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'urgent';
  triggerId: string;
}

export function useInterventionWatch(): {
  nudge: InterventionNudge | null;
  dismiss: () => void;
} {
  const [nudge, setNudge] = useState<InterventionNudge | null>(null);
  const lastTriggerId = useRef<string | null>(null);

  const baby = useBabyStore((s) => s.getActiveBaby());

  // Subscribe to item counts — triggers re-evaluation on any log add/remove
  const feedingCount = useFeedingStore((s) => s.items.length);
  const sleepCount = useSleepStore((s) => s.items.length);
  const diaperCount = useDiaperStore((s) => s.items.length);
  const healthCount = useHealthStore((s) => s.healthLogs.length);

  const isDismissed = useInsightDismissStore((s) => s.isDismissed);

  useEffect(() => {
    if (!baby || baby.is_pregnant) return;

    const age = calculateCorrectedAge(baby);
    const babyId = baby.id;

    // Get summaries from each store
    const feedingSummary = useFeedingStore.getState().getSummaryToday(babyId);
    const sleepSummary = useSleepStore.getState().getSummaryToday(babyId);
    const diaperSummary = useDiaperStore.getState().getSummaryToday(babyId);

    // Compute logging pattern across ALL stores
    const loggingPattern = buildLoggingPattern(babyId);

    const result = evaluateIntervention({
      correctedAgeMonths: age.effectiveAgeMonths,
      correctedAgeDays: age.effectiveAgeDays,
      feedingSummary24h: feedingSummary,
      sleepSummary24h: sleepSummary,
      diaperSummary24h: diaperSummary,
      latestEpdsScore: null, // EPDS screening not yet implemented in UI
      loggingPattern,
      isPreterm: age.isPreterm,
    });

    if (result.level === 'passive') {
      setNudge(null);
      return;
    }

    // Deduplicate: don't re-show same trigger set
    const triggerId = result.triggers.sort().join(',');
    if (triggerId === lastTriggerId.current) return;
    if (isDismissed(`intervention-${triggerId}`)) return;

    lastTriggerId.current = triggerId;
    const msg = formatInterventionMessage(result);
    setNudge({ ...msg, triggerId });
  }, [baby, feedingCount, sleepCount, diaperCount, healthCount, isDismissed]);

  const dismiss = () => {
    if (nudge) {
      useInsightDismissStore.getState().dismiss(`intervention-${nudge.triggerId}`);
    }
    setNudge(null);
    lastTriggerId.current = null;
  };

  return { nudge, dismiss };
}

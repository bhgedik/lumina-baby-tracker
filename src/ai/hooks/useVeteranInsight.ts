// ============================================================
// Lumina — Veteran Insight Hook
// Checks veteran rules after each log and surfaces first match
// ============================================================

import { useState, useCallback } from 'react';
import { matchVeteranRules } from '../veteranInsights';
import { evaluateVeteranCondition } from '../veteranMatcher';
import type { VeteranRule } from '../types';

interface VeteranInsightState {
  insight: {
    title: string;
    body: string;
    severity: 'info' | 'warning' | 'urgent';
    source: string;
  } | null;
  checkAfterLog: (
    logType: string,
    logData: Record<string, unknown>,
    correctedAgeDays: number
  ) => void;
  dismiss: () => void;
}

export function useVeteranInsight(): VeteranInsightState {
  const [insight, setInsight] = useState<VeteranInsightState['insight']>(null);

  const checkAfterLog = useCallback(
    (logType: string, logData: Record<string, unknown>, correctedAgeDays: number) => {
      // Get candidate rules by log_type and age_range
      const candidates = matchVeteranRules(logType, logData, correctedAgeDays);

      // Evaluate actual conditions for each candidate
      for (const rule of candidates) {
        if (evaluateVeteranCondition(rule, logData)) {
          setInsight({
            title: rule.insight.title,
            body: rule.insight.body,
            severity: rule.insight.severity,
            source: rule.insight.source,
          });
          return;
        }
      }
      // No match
    },
    []
  );

  const dismiss = useCallback(() => {
    setInsight(null);
  }, []);

  return { insight, checkAfterLog, dismiss };
}

// ============================================================
// Lumina — Intervention Message Formatter
// Maps trigger IDs from evaluateIntervention() to
// human-readable nurse nudge messages for InsightToast.
// ============================================================

import type { InterventionResult } from '../interventionEngine';

const TRIGGER_MESSAGES: Record<string, string> = {
  night_logging_exhaustion:
    "You've been up a lot these past nights. Your rest matters too \u2014 you're doing an amazing job.",
  logging_burst_detected:
    "Take a breath \u2014 you're tracking everything beautifully. It's okay to step back for a moment.",
  gap_then_burst:
    "It looks like things got busy after a quiet stretch. Remember: consistency matters more than perfection.",
};

function parseFeedingGap(trigger: string): string | null {
  const m = trigger.match(/^feeding_gap_(\d+)h$/);
  if (!m) return null;
  return `It's been ${m[1]} hours since the last feed. A gentle reminder to offer a feed when baby shows cues.`;
}

function parseWetDiapers(trigger: string): string | null {
  const m = trigger.match(/^low_wet_diapers_(\d+)$/);
  if (!m) return null;
  return `Only ${m[1]} wet diapers so far today. If this continues, consider offering more feeds and consult your pediatrician.`;
}

function parseEpds(trigger: string): string | null {
  const m = trigger.match(/^epds_score_(\d+)$/);
  if (!m) return null;
  return 'Your wellbeing matters. Consider reaching out to your healthcare provider or calling Postpartum Support International: 1-800-944-4773.';
}

export function formatInterventionMessage(result: InterventionResult): {
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'urgent';
} {
  const severity: 'info' | 'warning' | 'urgent' =
    result.priority === 'critical' ? 'urgent'
    : result.priority === 'high' ? 'warning'
    : 'info';

  const title =
    result.level === 'reactive' ? 'Nurse Alert'
    : result.level === 'empathic' ? 'A Gentle Nudge'
    : 'Insight';

  // Use first trigger for the message body
  const trigger = result.triggers[0] ?? '';
  const body =
    parseFeedingGap(trigger) ??
    parseWetDiapers(trigger) ??
    parseEpds(trigger) ??
    TRIGGER_MESSAGES[trigger] ??
    "Something needs your attention. Check your baby's recent activity.";

  return { title, body, severity };
}

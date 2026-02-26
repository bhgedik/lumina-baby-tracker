// ============================================================
// Sprout — Red Flag Interceptor
// HARDCODED SAFETY MODULE — No AI involvement.
// Runs SYNCHRONOUSLY before any AI call.
// If triggered, halts all standard advice and shows emergency state.
// ============================================================

import type { RedFlag } from './types';

export const RED_FLAGS: RedFlag[] = [
  {
    id: 'fever_under_3mo',
    condition: (log, baby) =>
      log.type === 'temperature' &&
      typeof log.temperature_celsius === 'number' &&
      log.temperature_celsius >= 38.3 &&
      baby.corrected_age_days < 90,
    message:
      'A fever of 38.3°C (101°F) or higher in a baby under 3 months is a MEDICAL EMERGENCY. Do NOT give fever reducers. Go to the Emergency Room immediately.',
    action: 'go_to_er',
    show_emergency_contacts: true,
  },
  {
    id: 'projectile_vomiting',
    condition: (log, baby) =>
      log.type === 'symptom' &&
      Array.isArray(log.symptoms) &&
      log.symptoms.includes('projectile_vomiting') &&
      baby.corrected_age_days < 180,
    message:
      'Projectile vomiting in an infant under 6 months may indicate pyloric stenosis or other serious conditions. Contact your pediatrician immediately or go to the ER.',
    action: 'call_pediatrician',
    show_emergency_contacts: true,
  },
  {
    id: 'lethargy',
    condition: (log, baby) =>
      log.type === 'symptom' &&
      Array.isArray(log.symptoms) &&
      log.symptoms.includes('lethargy') &&
      baby.corrected_age_days < 365,
    message:
      'A lethargic baby who is difficult to wake or unusually unresponsive needs immediate medical evaluation. This is NOT the same as being sleepy.',
    action: 'go_to_er',
    show_emergency_contacts: true,
  },
  {
    id: 'no_wet_diaper_12h_newborn',
    condition: (log, baby) =>
      log.type === 'dehydration_check' &&
      typeof log.hours_since_last_wet === 'number' &&
      log.hours_since_last_wet >= 12 &&
      baby.corrected_age_days < 30,
    message:
      'No wet diaper in 12+ hours for a newborn is a sign of severe dehydration. Contact your pediatrician immediately.',
    action: 'call_pediatrician',
    show_emergency_contacts: true,
  },
  {
    id: 'breathing_difficulty',
    condition: (log, baby) =>
      log.type === 'symptom' &&
      Array.isArray(log.symptoms) &&
      (log.symptoms.includes('breathing_difficulty') ||
        log.symptoms.includes('blue_lips') ||
        log.symptoms.includes('grunting')) &&
      baby.corrected_age_days < 365,
    message:
      'Signs of breathing difficulty (grunting, blue lips, chest retractions) require IMMEDIATE emergency care. Call 911 or go to the nearest ER.',
    action: 'call_911',
    show_emergency_contacts: true,
  },
  {
    id: 'epds_self_harm',
    condition: (log) =>
      log.type === 'epds' &&
      log.epds_responses != null &&
      typeof log.epds_responses === 'object' &&
      (log.epds_responses as Record<string, number>)['question_10'] >= 1,
    message:
      'You are not alone, and you deserve support. Please reach out to your healthcare provider or call:\n\n• Postpartum Support International: 1-800-944-4773\n• Crisis Text Line: Text HOME to 741741\n• National Suicide Prevention Lifeline: 988\n\nThese feelings are more common than you think, and help is available right now.',
    action: 'call_pediatrician',
    show_emergency_contacts: true,
  },
];

/**
 * Check a log entry against all red flags.
 * Returns the first matching RedFlag, or null if no flags triggered.
 * This MUST run before any AI processing.
 */
export function checkRedFlags(
  log: Record<string, unknown>,
  baby: Parameters<RedFlag['condition']>[1]
): RedFlag | null {
  for (const flag of RED_FLAGS) {
    try {
      if (flag.condition(log, baby)) {
        return flag;
      }
    } catch {
      // Safety: never let a rule error prevent other checks
      continue;
    }
  }
  return null;
}

// ============================================================
// Sprout — Veteran Matcher
// Client-side condition evaluator for VeteranRules
// Maps each rule ID to actual runtime field checks
// ============================================================

import type { VeteranRule } from './types';

export function evaluateVeteranCondition(
  rule: VeteranRule,
  logData: Record<string, unknown>
): boolean {
  switch (rule.id) {
    // ─── FEEDING ───
    case 'urate_crystals':
      return (
        logData.type === 'wet' &&
        (logData.stool_color === 'orange' || logData.stool_color === 'red')
      );

    case 'feeding_refusal_nasal':
      return (
        logData.baby_response === 'refused' &&
        (logData.type === 'breast' || logData.type === 'bottle')
      );

    // ─── BATHING & GROOMING ───
    case 'bath_hair_drying':
      return logData.category === 'bath';

    case 'newborn_nail_care': {
      const name = typeof logData.activity_name === 'string'
        ? logData.activity_name.toLowerCase()
        : '';
      return name.includes('nail') || name.includes('grooming');
    }

    // ─── MEDICATION ───
    case 'antipyretic_checkin': {
      const med = typeof logData.medication_name === 'string'
        ? logData.medication_name.toLowerCase()
        : '';
      return (
        med.includes('calpol') ||
        med.includes('paracetamol') ||
        med.includes('ibuprofen') ||
        med.includes('tylenol')
      );
    }

    case 'medication_syringe_rule':
      return logData.type === 'medication';

    // ─── SKIN CARE ───
    case 'diaper_rash_cream_rule':
      return logData.has_rash === true;

    // ─── SLEEP ───
    case 'tog_layering_advice':
      return logData.room_temperature !== undefined && logData.room_temperature !== null;

    // ─── HEALTH CHECKUPS (proactive — need scheduled_check log type) ───
    case 'eye_exam_year1':
    case 'eye_exam_year3':
    case 'hearing_test_newborn':
      // These are proactive rules triggered by scheduled checks, not log data
      return false;

    default:
      return false;
  }
}

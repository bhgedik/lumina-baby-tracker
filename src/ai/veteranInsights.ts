// ============================================================
// Lumina — Veteran Nurse Insights Engine
// Maps common log patterns to expert-level, non-obvious root causes.
// This is the "product moat" — the knowledge a veteran NICU nurse has.
// ============================================================

import type { VeteranRule } from './types';

export const VETERAN_RULES: VeteranRule[] = [
  // ─── FEEDING ───
  {
    id: 'urate_crystals',
    trigger: {
      log_type: 'diaper',
      condition: "stool_color IN ('orange', 'red') AND type = 'wet'",
      age_range: [0, 5],
    },
    insight: {
      title: 'Urate Crystals — Not Blood',
      body: 'Orange/pink stains in the diaper during the first 5 days are likely urate crystals, a sign of concentrated urine. This is common but may indicate the baby needs more frequent feeds. Track wet diapers closely — expect 6+ per day by day 4.',
      severity: 'warning',
      category: 'hydration',
      source: 'AAP Newborn Care Guidelines',
    },
  },
  {
    id: 'feeding_refusal_nasal',
    trigger: {
      log_type: 'feeding',
      condition: "baby_response = 'refused' AND type IN ('breast', 'bottle')",
      age_range: [0, 365],
    },
    insight: {
      title: "Check Baby's Nose Before Retrying",
      body: 'Babies are obligate nose breathers during feeding. A blocked nose makes nursing/bottle-feeding impossible. Use a nasal aspirator or saline drops BEFORE the next attempt. Do NOT just "try again later" without clearing the airway.',
      severity: 'info',
      category: 'feeding',
      source: 'Pediatric Nursing Best Practices',
      visual_guide: {
        type: 'step_by_step',
        media_url: 'https://placeholder.lumina.app/guides/nasal-aspirator',
        action_text: 'How to safely use a nasal aspirator',
        steps: [
          { step: 1, instruction: 'Lay baby on their back with head slightly tilted', icon: 'user' },
          { step: 2, instruction: 'Put 1-2 saline drops in each nostril, wait 30 sec', icon: 'droplet' },
          { step: 3, instruction: 'Place aspirator tip at nostril entrance — never deep inside', icon: 'alert-circle' },
          { step: 4, instruction: 'Gently suction one nostril at a time', icon: 'wind' },
          { step: 5, instruction: 'Wait 5 minutes, then retry feeding', icon: 'clock' },
        ],
      },
    },
  },

  // ─── BATHING & GROOMING ───
  {
    id: 'bath_hair_drying',
    trigger: {
      log_type: 'activity',
      condition: "category = 'bath'",
      age_range: [0, 365],
    },
    insight: {
      title: 'Safe Hair Drying: The Cotton Hat Method',
      body: 'Never use a hair dryer on an infant. After bath, pat head gently with a towel and place a 100% cotton hat. Replace with a dry hat after 10 minutes if needed. This prevents heat damage and startling.',
      severity: 'info',
      category: 'routine',
      source: 'NICU Discharge Best Practices',
      visual_guide: {
        type: 'step_by_step',
        media_url: 'https://placeholder.lumina.app/guides/cotton-hat-method',
        action_text: 'Cotton hat method after bath',
        steps: [
          { step: 1, instruction: 'Pat head gently with a soft towel — never rub', icon: 'droplet' },
          { step: 2, instruction: 'Place a dry 100% cotton hat on baby\'s head', icon: 'shield' },
          { step: 3, instruction: 'Check hat after 10 minutes — replace if damp', icon: 'clock' },
        ],
      },
    },
  },
  {
    id: 'newborn_nail_care',
    trigger: {
      log_type: 'activity',
      condition: "activity_name ILIKE '%nail%' OR activity_name ILIKE '%grooming%'",
      age_range: [0, 30],
    },
    insight: {
      title: 'No Nail Clippers in First Month',
      body: "Newborn nails are fused to the skin underneath. Using clippers risks cutting the nail bed. Instead, use a fine glass nail file or gently peel the nails after a bath when they're soft. Switch to baby nail clippers after 4-6 weeks.",
      severity: 'info',
      category: 'grooming',
      source: 'NICU Newborn Care Guidelines',
    },
  },

  // ─── MEDICATION MANAGEMENT ───
  {
    id: 'antipyretic_checkin',
    trigger: {
      log_type: 'health',
      condition: "medication_name ILIKE '%calpol%' OR medication_name ILIKE '%paracetamol%' OR medication_name ILIKE '%ibuprofen%' OR medication_name ILIKE '%tylenol%'",
      age_range: [0, 1095],
    },
    insight: {
      title: 'Fever Medicine Follow-Up (45 min)',
      body: 'A temperature drop to ~35°C after antipyretics is NORMAL — it happens due to sweating. Cover the legs with a thin blanket, keep the room at 20-22°C, and re-measure in 30 minutes. Do NOT give another dose for at least 4 hours (paracetamol) or 6 hours (ibuprofen).',
      severity: 'warning',
      category: 'medication',
      source: 'BNFc Paediatric Dosing Guidelines',
    },
    proactive_timer_minutes: 45,
  },
  {
    id: 'medication_syringe_rule',
    trigger: {
      log_type: 'health',
      condition: "type = 'medication'",
      age_range: [0, 730],
    },
    insight: {
      title: 'Medication Administration Tip',
      body: 'NEVER mix medicine into a milk bottle — the baby may not finish it and will receive an incomplete dose. Always use an oral syringe aimed at the inner cheek (not the back of the throat, which causes gagging).',
      severity: 'info',
      category: 'medication',
      source: 'Pediatric Nursing Administration Standards',
      visual_guide: {
        type: 'video_link',
        media_url: 'https://placeholder.lumina.app/videos/oral-syringe-technique',
        action_text: 'Watch: Oral syringe technique',
        thumbnail_icon: 'play-circle',
        duration_label: '1:30',
      },
    },
  },

  // ─── SKIN CARE ───
  {
    id: 'diaper_rash_cream_rule',
    trigger: {
      log_type: 'diaper',
      condition: 'has_rash = TRUE',
      age_range: [0, 1095],
    },
    insight: {
      title: 'Diaper Rash Care: Dry First',
      body: 'Before applying rash cream (Desitin, Sudocrem, etc.), ensure the skin is COMPLETELY DRY. Applying cream on damp skin traps moisture and worsens the rash. Pat dry gently or use a hairdryer on the COOL setting held 30cm away.',
      severity: 'info',
      category: 'skin_care',
      source: 'Dermatology Best Practices',
      visual_guide: {
        type: 'step_by_step',
        media_url: 'https://placeholder.lumina.app/guides/diaper-rash-dry-first',
        action_text: 'Dry-first diaper rash technique',
        steps: [
          { step: 1, instruction: 'Clean area with warm water and soft cloth', icon: 'droplet' },
          { step: 2, instruction: 'Pat completely dry — or air dry for 2-3 minutes', icon: 'wind' },
          { step: 3, instruction: 'Apply thin layer of barrier cream on dry skin only', icon: 'shield' },
        ],
      },
    },
  },

  // ─── SLEEP & ENVIRONMENT ───
  {
    id: 'tog_layering_advice',
    trigger: {
      log_type: 'sleep',
      condition: 'room_temperature IS NOT NULL',
      age_range: [0, 1095],
    },
    insight: {
      title: 'Sleep Layering Guide (TOG Scale)',
      body: 'Based on room temperature:\n• >27°C: Nappy only or single layer (0.2 TOG)\n• 25-27°C: Short-sleeve bodysuit (0.5 TOG)\n• 23-25°C: Long-sleeve bodysuit (1.0 TOG)\n• 21-23°C: Bodysuit + light sleep sack (1.0-1.5 TOG)\n• 18-21°C: Bodysuit + sleep sack (2.5 TOG)\n• <18°C: Long-sleeve bodysuit + warm sleep sack (3.5 TOG)\n\nTarget: 20-22°C, 40-60% humidity.',
      severity: 'info',
      category: 'sleep',
      source: 'The Lullaby Trust / Red Nose Safe Sleep',
      visual_guide: {
        type: 'illustration',
        media_url: 'https://placeholder.lumina.app/illustrations/tog-scale',
        action_text: 'TOG scale visual reference',
        thumbnail_icon: 'thermometer',
      },
    },
  },

  // ─── HEALTH CHECKUPS ───
  {
    id: 'eye_exam_year1',
    trigger: {
      log_type: 'scheduled_check',
      condition: 'corrected_age_months BETWEEN 11 AND 13 AND NOT EXISTS(eye_exam_logged)',
      age_range: [330, 395],
    },
    insight: {
      title: 'Schedule 1st-Year Eye Exam',
      body: 'The American Optometric Association recommends a comprehensive eye exam at 12 months. Early detection of strabismus (crossed eyes) and amblyopia (lazy eye) is critical — treatment success drops significantly after age 3.',
      severity: 'warning',
      category: 'checkup',
      source: 'AOA InfantSEE Program',
    },
  },
  {
    id: 'eye_exam_year3',
    trigger: {
      log_type: 'scheduled_check',
      condition: 'corrected_age_months BETWEEN 35 AND 37 AND NOT EXISTS(eye_exam_year3_logged)',
      age_range: [1050, 1125],
    },
    insight: {
      title: 'Schedule 3rd-Year Eye Exam',
      body: 'A comprehensive eye exam at age 3 is critical. This is the last window for effective amblyopia (lazy eye) treatment. After age 7, treatment success drops dramatically.',
      severity: 'warning',
      category: 'checkup',
      source: 'AOA Pediatric Eye Exam Guidelines',
    },
  },
  {
    id: 'hearing_test_newborn',
    trigger: {
      log_type: 'scheduled_check',
      condition: 'age_days < 30 AND NOT EXISTS(hearing_test_logged)',
      age_range: [0, 30],
    },
    insight: {
      title: 'Confirm Newborn Hearing Screening',
      body: "Ensure your baby's newborn hearing screening was completed before hospital discharge. If not, schedule it within the first month. Early detection of hearing loss is critical for language development.",
      severity: 'warning',
      category: 'checkup',
      source: 'AAP Universal Newborn Hearing Screening',
    },
  },
];

/**
 * Match veteran rules against a log entry.
 * Returns all matching rules (multiple can fire simultaneously).
 */
export function matchVeteranRules(
  logType: string,
  logData: Record<string, unknown>,
  correctedAgeDays: number
): VeteranRule[] {
  return VETERAN_RULES.filter((rule) => {
    if (rule.trigger.log_type !== logType) return false;
    if (rule.trigger.age_range) {
      const [min, max] = rule.trigger.age_range;
      if (correctedAgeDays < min || correctedAgeDays > max) return false;
    }
    // Note: The condition string is for documentation/reference.
    // Actual matching is done by the caller using log data fields.
    return true;
  });
}

// ─── PRE-BIRTH QUEST SYSTEM ───

export interface PrenatalQuest {
  id: string;
  title: string;
  body: string;
  category: 'preparation' | 'nursery' | 'equipment' | 'clothing' | 'health';
  priority: number;
}

export const PRENATAL_QUESTS: PrenatalQuest[] = [
  {
    id: 'remove_tags',
    title: 'Remove All Tags from Newborn Clothes',
    body: 'Cut off ALL tags from baby clothes, including printed wash-care tags. These scratch sensitive newborn skin. Check inside socks and hats too.',
    category: 'preparation',
    priority: 1,
  },
  {
    id: 'check_prints',
    title: 'Check Clothing for Plastic Prints',
    body: 'Avoid clothing with large plastic/rubber prints on the inner fabric. These prevent skin from breathing and cause overheating. Stick to 100% cotton without prints for the first 3 months.',
    category: 'preparation',
    priority: 2,
  },
  {
    id: 'room_thermometer',
    title: 'Set Up Room Thermometer & Hygrometer',
    body: 'Place a digital thermometer/hygrometer in the nursery. Target: 20-22°C (68-72°F) and 40-60% humidity. Critical for safe sleep — overheating is a SIDS risk factor.',
    category: 'nursery',
    priority: 3,
  },
  {
    id: 'baby_scale',
    title: 'Get a Baby Scale (Digital)',
    body: 'A home baby scale tracks feeding adequacy between pediatrician visits. Essential for breastfed babies in the first 2 weeks. Weigh before and after feeding to estimate intake.',
    category: 'equipment',
    priority: 4,
  },
  {
    id: 'rectal_thermometer',
    title: 'Get a Digital Thermometer (Rectal)',
    body: 'Rectal temperature is the gold standard for infants under 3 months. Ear and forehead thermometers are unreliable at this age. Get a dedicated flexible-tip digital rectal thermometer.',
    category: 'equipment',
    priority: 5,
  },
  {
    id: 'nasal_aspirator',
    title: 'Get a Nasal Aspirator',
    body: 'Babies are obligate nose breathers. A nasal aspirator (NoseFrida or bulb syringe) is essential for clearing congestion before feedings and sleep.',
    category: 'equipment',
    priority: 6,
  },
  {
    id: 'cotton_hats',
    title: 'Prepare Multiple 100% Cotton Hats',
    body: 'Stock 5-6 cotton hats for the first month. Used for: temperature regulation, safe hair drying after baths (replace wet hat with dry), and hospital discharge.',
    category: 'clothing',
    priority: 7,
  },
];

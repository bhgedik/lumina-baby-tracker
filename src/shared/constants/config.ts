// ============================================================
// Sprout — App Configuration Constants
// ============================================================

export const APP_CONFIG = {
  name: 'Sprout',
  version: '1.0.0',

  // Supabase — set actual values in .env.local
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },

  // Medical constants
  medical: {
    FULL_TERM_WEEKS: 40,
    FULL_TERM_DAYS: 280,
    PRETERM_THRESHOLD_WEEKS: 37,
    CORRECTED_AGE_CUTOFF_MONTHS: 24,
    CORRECTED_AGE_CUTOFF_DAYS: 730,
    FEVER_THRESHOLD_CELSIUS: 38.3,
    FEVER_INFANT_AGE_DAYS: 90,
    EPDS_CLINICAL_THRESHOLD: 13,
    DEHYDRATION_HOURS_NEWBORN: 12,
  },

  // Lifecycle stage boundaries (in corrected age months)
  lifecycle: {
    prenatal: { start: -Infinity, end: 0 },
    fourth_trimester: { start: 0, end: 3 },
    transition: { start: 3, end: 6 },
    exploration: { start: 6, end: 12 },
    toddler: { start: 12, end: Infinity },
  },

  // Timer defaults
  timers: {
    FEEDING_MAX_DURATION_MINUTES: 120,
    SLEEP_MAX_DURATION_HOURS: 14,
    ANTIPYRETIC_CHECKIN_MINUTES: 45,
  },

  // Notification channels
  notifications: {
    FEEDING_REMINDER: 'feeding_reminder',
    MILESTONE_ALERT: 'milestone_alert',
    AI_INSIGHT: 'ai_insight',
    WELLNESS_CHECKIN: 'wellness_checkin',
    RED_FLAG: 'red_flag',
    MEDICINE_CHECKIN: 'medicine_checkin',
  },
} as const;

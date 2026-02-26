import { UUID, ISO8601, Timestamps, Gender, PrimaryFeedingMethod } from '../../shared/types/common';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  is_medical: boolean;
}

export interface Family extends Timestamps {
  id: UUID;
  name: string;
  timezone: string;
  locale: string;
  preferred_units: 'metric' | 'imperial';
  emergency_contacts: EmergencyContact[];
}

export interface Profile extends Timestamps {
  id: UUID;
  family_id: UUID;
  email: string;
  display_name: string;
  role: 'primary' | 'partner' | 'caregiver';
  experience_level: 'first_time' | 'experienced';
  delivery_method: 'vaginal' | 'c_section' | null;
  avatar_url: string | null;
  notification_preferences: NotificationPreferences;
  onboarding_completed: boolean;
}

export interface NotificationPreferences {
  feeding_reminders: boolean;
  milestone_alerts: boolean;
  ai_insights: boolean;
  wellness_checkins: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export interface Baby extends Timestamps {
  id: UUID;
  family_id: UUID;
  name: string;
  date_of_birth: string;
  due_date: string | null;
  gestational_age_weeks: number | null;
  gestational_age_days: number;
  gender: Gender;
  blood_type: string | null;
  birth_weight_grams: number | null;
  birth_length_cm: number | null;
  birth_head_circumference_cm: number | null;
  photo_url: string | null;
  notes: string | null;
  is_active: boolean;
  is_pregnant: boolean;
  is_multiple: boolean;
  primary_feeding_method: PrimaryFeedingMethod;
  known_allergies: string[];
  chronic_conditions: string[];
  uses_adjusted_milestones: boolean;
}

export interface CorrectedAgeResult {
  chronological: {
    days: number;
    weeks: number;
    months: number;
    display: string;
  };
  corrected: {
    days: number;
    weeks: number;
    months: number;
    display: string;
  } | null;
  adjustmentDays: number;
  adjustmentWeeks: number;
  isPreterm: boolean;
  useCorrected: boolean;
  forDisplay: {
    primary: string;
    secondary: string | null;
    label: string;
  };
  effectiveAgeMonths: number;
  effectiveAgeDays: number;
}

// ============================================================
// Sprouty — Onboarding Data Flush Service
// Converts onboarding quiz data into Profile + Family + Baby
// Called after auth success to persist data to stores
// ============================================================

import { useOnboardingStore } from '../stores/onboardingStore';
import { useAuthStore } from '../stores/authStore';
import { useBabyStore } from '../stores/babyStore';
import { generateUUID } from '../stores/createSyncedStore';
import type { Profile, Family, Baby } from '../modules/baby/types';

interface FlushParams {
  userId: string;
  userEmail: string;
}

/**
 * Reads accumulated onboarding data from the local Zustand store
 * and creates Family, Profile, and Baby entities.
 *
 * This logic was extracted from preferences.tsx to be reusable
 * from the post-paywall auth screen.
 */
export async function flushOnboardingToStores({ userId, userEmail }: FlushParams): Promise<void> {
  const onboarding = useOnboardingStore.getState();
  const { setFamily, setProfile, completeOnboarding } = useAuthStore.getState();
  const { addBaby, setActiveBaby } = useBabyStore.getState();

  const now = new Date().toISOString();
  const familyId = generateUUID();
  const babyId = generateUUID();

  // Create Family
  const family: Family = {
    id: familyId,
    name: `${onboarding.parentName}'s Family`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: 'en',
    preferred_units: onboarding.preferredUnits,
    emergency_contacts: [],
    created_at: now,
    updated_at: now,
  };

  // Create Profile — uses auth userId as profile id
  const profile: Profile = {
    id: userId,
    family_id: familyId,
    email: userEmail,
    display_name: onboarding.parentName,
    role: 'primary',
    experience_level: onboarding.experienceLevel ?? 'first_time',
    delivery_method: null,
    avatar_url: null,
    notification_preferences: {
      feeding_reminders: true,
      milestone_alerts: true,
      ai_insights: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
    },
    onboarding_completed: true,
    created_at: now,
    updated_at: now,
  };

  // Create Baby — preserves critical corrected age logic
  const isPreterm =
    !onboarding.isPregnant &&
    onboarding.wasPreterm === true &&
    onboarding.gestationalWeeks !== null &&
    onboarding.gestationalWeeks < 37;

  const baby: Baby = {
    id: babyId,
    family_id: familyId,
    name: onboarding.babyName,
    date_of_birth: onboarding.isPregnant ? '' : onboarding.dateOfBirth,
    due_date: onboarding.isPregnant ? onboarding.dueDate : null,
    gestational_age_weeks: isPreterm
      ? onboarding.gestationalWeeks
      : onboarding.isPregnant
        ? onboarding.gestationalWeeks
        : null,
    gestational_age_days: 0,
    gender: onboarding.isPregnant ? 'other' : (onboarding.gender ?? 'other'),
    blood_type: null,
    birth_weight_grams: null,
    birth_length_cm: null,
    birth_head_circumference_cm: null,
    photo_url: null,
    notes: null,
    is_active: true,
    is_pregnant: onboarding.isPregnant,
    is_multiple: false,
    primary_feeding_method: onboarding.isPregnant
      ? 'mixed'
      : (onboarding.feedingMethod ?? 'mixed'),
    known_allergies: [],
    chronic_conditions: [],
    uses_adjusted_milestones: isPreterm,
    created_at: now,
    updated_at: now,
  };

  // Save to stores
  setFamily(family);
  setProfile(profile);
  addBaby(baby);
  setActiveBaby(babyId);
  completeOnboarding();
  onboarding.markCompleted();
}

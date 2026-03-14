// ============================================================
// Lumina — Core Shared Types
// ============================================================

export type UUID = string;
export type ISO8601 = string;

export interface Timestamps {
  created_at: ISO8601;
  updated_at: ISO8601;
}

// === Lifecycle Stages ===
export type LifecycleStage =
  | 'prenatal'
  | 'fourth_trimester'   // 0-3 months
  | 'transition'         // 3-6 months
  | 'exploration'        // 6-12 months
  | 'toddler';           // 12+ months

// === AI Intervention Levels ===
export type InterventionLevel = 'passive' | 'reactive' | 'proactive' | 'empathic';

// === Developmental Domains ===
export type DevelopmentalDomain =
  | 'motor_gross'
  | 'motor_fine'
  | 'cognitive'
  | 'language'
  | 'social_emotional'
  | 'sensory';

// === Content Types ===
export type ContentType = 'article' | 'activity' | 'product' | 'video' | 'checklist';

// === Preferred Units ===
export type PreferredUnits = 'metric' | 'imperial';

// === Experience Level ===
export type ExperienceLevel = 'first_time' | 'experienced';

// === Delivery Method ===
export type DeliveryMethod = 'vaginal' | 'c_section';

// === Baby Response ===
export type BabyResponse = 'good' | 'fussy' | 'refused';

// === Feeding Types ===
export type FeedingType = 'breast' | 'bottle' | 'solid' | 'snack';
export type BreastSide = 'left' | 'right' | 'both';
export type BottleContentType = 'breast_milk' | 'formula' | 'mixed' | 'water' | 'juice';
export type PrimaryFeedingMethod = 'breast_only' | 'formula_only' | 'mixed';
export type PumpingSide = 'left' | 'right' | 'both';

// === Sleep Types ===
export type SleepType = 'nap' | 'night';
export type SleepMethod = 'nursed' | 'rocked' | 'held' | 'stroller' | 'car' | 'self_soothed' | 'patted' | 'other';
export type SleepLocation = 'crib' | 'bassinet' | 'cosleep' | 'swing' | 'carrier' | 'stroller' | 'car_seat' | 'other';

// === Diaper Types ===
export type DiaperType = 'wet' | 'dirty' | 'both' | 'dry';
export type StoolColor = 'yellow' | 'green' | 'brown' | 'black' | 'red' | 'white' | 'orange';
export type StoolConsistency = 'liquid' | 'soft' | 'formed' | 'hard' | 'mucousy' | 'seedy';

// === Health Types ===
export type HealthLogType = 'temperature' | 'medication' | 'symptom' | 'doctor_visit' | 'er_visit' | 'well_child_checkup' | 'other';
export type TemperatureMethod = 'rectal' | 'axillary' | 'ear' | 'forehead';

// === Activity Types ===
export type ActivityCategory = 'tummy_time' | 'reading' | 'music' | 'sensory_play' | 'motor_play' | 'social_play' | 'outdoor' | 'bath' | 'other';
export type ActivityResponse = 'loved_it' | 'engaged' | 'neutral' | 'fussy' | 'cried';

// === Milestone Status ===
export type MilestoneStatus = 'not_started' | 'emerging' | 'achieved';

// === AI Insight Types ===
export type InsightCategory = 'feeding' | 'sleep' | 'growth' | 'milestone' | 'health' | 'general';
export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';
export type InsightStatus = 'active' | 'read' | 'dismissed' | 'acted_on';
export type InsightRating = 'helpful' | 'not_helpful';

// === Gender ===
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

// === Caregiver Role ===
export type CaregiverRole = 'primary' | 'partner' | 'caregiver';

// === Red Flag Action ===
export type RedFlagAction = 'call_911' | 'call_pediatrician' | 'go_to_er';

// === Rating Scale (1-5) ===
export type Rating = 1 | 2 | 3 | 4 | 5;

import { UUID, ISO8601, Timestamps, SleepType, SleepMethod, SleepLocation, Rating } from '../../shared/types/common';

export interface SleepLog extends Timestamps {
  id: UUID;
  baby_id: UUID;
  family_id: UUID;
  logged_by: UUID;
  type: SleepType;
  started_at: ISO8601;
  ended_at: ISO8601 | null;
  duration_minutes: number | null;
  method: SleepMethod | null;
  location: SleepLocation | null;
  quality: Rating | null;
  night_wakings: number | null;
  room_temperature_celsius: number | null;
  notes: string | null;
}

export interface WakeWindowConfig {
  age_months_start: number;
  age_months_end: number;
  min_minutes: number;
  max_minutes: number;
  naps_per_day: number;
}

export interface SleepSummary {
  total_sleep_hours: number;
  night_sleep_hours: number;
  nap_hours: number;
  nap_count: number;
  avg_night_wakings: number;
  last_sleep_ended_at: ISO8601 | null;
  minutes_since_last_wake: number | null;
}

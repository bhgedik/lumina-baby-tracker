import { UUID, ISO8601, Timestamps, HealthLogType, TemperatureMethod } from '../../shared/types/common';

// ── Health Log ──────────────────────────────────────────────

export interface HealthLog extends Timestamps {
  id: UUID;
  baby_id: UUID;
  family_id: UUID;
  logged_by: UUID;
  logged_at: ISO8601;
  type: HealthLogType;
  temperature_celsius: number | null;
  temperature_method: TemperatureMethod | null;
  medication_name: string | null;
  medication_dose: string | null;
  symptoms: string[] | null;
  doctor_name: string | null;
  diagnosis: string | null;
  notes: string | null;
  attachments: string[] | null;
  episode_id: UUID | null;
}

// ── Vaccination ─────────────────────────────────────────────

export interface Vaccination extends Timestamps {
  id: UUID;
  baby_id: UUID;
  family_id: UUID;
  vaccine_name: string;
  dose_number: number;
  scheduled_date: string;
  administered_date: string | null;
  administered_by: string | null;
  lot_number: string | null;
  side_effects: string | null;
  notes: string | null;
}

// ── Illness Episodes ────────────────────────────────────────

export type EpisodeStatus = 'active' | 'resolved';

export interface IllnessEpisode extends Timestamps {
  id: UUID;
  baby_id: UUID;
  family_id: UUID;
  created_by: UUID;
  title: string;
  started_at: ISO8601;
  resolved_at: ISO8601 | null;
  status: EpisodeStatus;
  primary_symptoms: string[];
  diagnosis: string | null;
  notes: string | null;
}

// ── Vaccine Schedule Definitions ────────────────────────────

export interface VaccineDose {
  doseNumber: number;
  ageMonths: number;
  minAgeMonths: number;
  maxAgeMonths: number;
}

export interface VaccineDefinition {
  id: string;
  name: string;
  shortName: string;
  doses: VaccineDose[];
}

// ── Well-Child Checkup Definitions ──────────────────────────

export interface WellChildCheckup {
  id: string;
  label: string;
  ageMonths: number;
  typicalScreenings: string[];
  vaccinesAtVisit: string[];
}

// ── Tracking Items (computed at runtime) ────────────────────

export type VaccineStatus = 'upcoming' | 'due' | 'overdue' | 'completed';

export interface VaccineTrackingItem {
  vaccineId: string;
  vaccineName: string;
  shortName: string;
  doseNumber: number;
  scheduledDate: string;
  status: VaccineStatus;
  ageMonths: number;
  administeredDate: string | null;
}

export interface CheckupTrackingItem {
  checkupId: string;
  label: string;
  ageMonths: number;
  scheduledDate: string;
  status: VaccineStatus;
  typicalScreenings: string[];
  vaccinesAtVisit: string[];
  completedDate: string | null;
}

// ── Health Summary ──────────────────────────────────────────

export interface HealthSummary {
  totalLogs: number;
  activeEpisodes: number;
  upcomingVaccines: number;
  overdueVaccines: number;
  lastLogAt: ISO8601 | null;
}

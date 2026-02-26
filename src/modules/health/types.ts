import { UUID, ISO8601, Timestamps, HealthLogType, TemperatureMethod } from '../../shared/types/common';

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
}

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

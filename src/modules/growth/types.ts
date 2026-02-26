import { UUID, ISO8601, Timestamps } from '../../shared/types/common';

export interface GrowthLog extends Timestamps {
  id: UUID;
  baby_id: UUID;
  family_id: UUID;
  logged_by: UUID;
  measured_at: ISO8601;
  weight_grams: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
  weight_percentile: number | null;
  height_percentile: number | null;
  head_percentile: number | null;
  chart_type: 'who' | 'fenton';
  notes: string | null;
}

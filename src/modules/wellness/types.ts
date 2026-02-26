import { UUID, ISO8601, Timestamps, WellnessLogType, Rating } from '../../shared/types/common';

export interface WellnessLog extends Timestamps {
  id: UUID;
  profile_id: UUID;
  family_id: UUID;
  logged_at: ISO8601;
  type: WellnessLogType;
  mood: Rating | null;
  energy: Rating | null;
  epds_score: number | null;
  epds_responses: Record<string, number> | null;
  sleep_quality: Rating | null;
  notes: string | null;
  is_private: boolean;
}

export interface EPDSQuestion {
  id: number;
  text: string;
  options: { value: number; label: string }[];
}

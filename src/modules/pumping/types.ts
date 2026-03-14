import type { UUID, ISO8601, Timestamps, PumpingSide } from '../../shared/types/common';

export interface PumpingLog extends Timestamps {
  id: UUID;
  baby_id: UUID;
  family_id: UUID;
  logged_by: UUID;
  started_at: ISO8601;
  ended_at: ISO8601 | null;
  duration_seconds: number | null;
  side: PumpingSide;
  left_volume_ml: number | null;
  right_volume_ml: number | null;
  total_volume_ml: number;
  notes: string | null;
}

export interface PumpingSummary {
  total_sessions: number;
  total_volume_ml: number;
  avg_volume_ml: number;
  last_pump_at: ISO8601 | null;
  hours_since_last_pump: number | null;
}

export interface PumpingTimer {
  pumpingId: UUID;
  side: PumpingSide;
  startedAt: number;
  pausedAt: number | null;
  accumulatedSeconds: number;
}

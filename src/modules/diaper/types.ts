import { UUID, ISO8601, Timestamps, DiaperType, StoolColor, StoolConsistency } from '../../shared/types/common';

export interface DiaperLog extends Timestamps {
  id: UUID;
  baby_id: UUID;
  family_id: UUID;
  logged_by: UUID;
  logged_at: ISO8601;
  type: DiaperType;
  stool_color: StoolColor | null;
  stool_consistency: StoolConsistency | null;
  has_rash: boolean;
  notes: string | null;
}

export interface DiaperSummary {
  total_changes: number;
  wet_count: number;
  dirty_count: number;
  both_count: number;
  dry_count: number;
  has_rash_today: boolean;
  last_change_at: ISO8601 | null;
  hours_since_last_change: number | null;
}

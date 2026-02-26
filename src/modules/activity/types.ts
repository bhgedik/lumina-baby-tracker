import { UUID, ISO8601, Timestamps, ActivityCategory, ActivityResponse, DevelopmentalDomain } from '../../shared/types/common';

export interface ActivityLog extends Timestamps {
  id: UUID;
  baby_id: UUID;
  family_id: UUID;
  logged_by: UUID;
  started_at: ISO8601;
  duration_minutes: number | null;
  category: ActivityCategory;
  activity_name: string;
  developmental_domains: DevelopmentalDomain[];
  baby_response: ActivityResponse;
  notes: string | null;
  linked_content_id: UUID | null;
}

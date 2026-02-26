import { UUID, Timestamps, DevelopmentalDomain, LifecycleStage, MilestoneStatus } from '../../shared/types/common';

export interface MilestoneDefinition {
  id: UUID;
  domain: DevelopmentalDomain;
  title: string;
  description: string;
  expected_age_months_start: number;
  expected_age_months_end: number;
  concern_if_not_by_months: number;
  lifecycle_stage: LifecycleStage;
  order_in_stage: number;
  tips: string[];
  content_trigger_ids: UUID[];
}

export interface MilestoneRecord extends Timestamps {
  id: UUID;
  baby_id: UUID;
  family_id: UUID;
  milestone_definition_id: UUID;
  status: MilestoneStatus;
  achieved_date: string | null;
  notes: string | null;
  evidence_urls: string[] | null;
  logged_by: UUID;
}

import { UUID, LifecycleStage, DevelopmentalDomain, ContentType, Timestamps } from '../shared/types/common';

export interface ContentItem extends Timestamps {
  id: UUID;
  type: ContentType;
  title: string;
  subtitle: string | null;
  body: string;
  thumbnail_url: string | null;
  target_lifecycle_stages: LifecycleStage[];
  target_age_months_start: number;
  target_age_months_end: number;
  developmental_domains: DevelopmentalDomain[];
  triggered_by_milestone_ids: UUID[];
  tags: string[];
  source: string | null;
  is_premium: boolean;
  sort_order: number;
}

export interface PrenatalQuest {
  id: string;
  title: string;
  body: string;
  category: string;
  is_completed: boolean;
}

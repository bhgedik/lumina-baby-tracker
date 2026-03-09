import { UUID, ISO8601, Timestamps, InterventionLevel, LifecycleStage, InsightCategory, InsightPriority, InsightStatus, InsightRating, RedFlagAction } from '../shared/types/common';
import type { Baby } from '../modules/baby/types';

export interface AIInsight extends Timestamps {
  id: UUID;
  baby_id: UUID | null;
  family_id: UUID;
  target_profile_id: UUID | null;
  intervention_level: InterventionLevel;
  lifecycle_stage: LifecycleStage;
  category: InsightCategory;
  title: string;
  body: string;
  action_items: string[] | null;
  source_data: Record<string, unknown>;
  confidence: number;
  priority: InsightPriority;
  status: InsightStatus;
  user_rating: InsightRating | null;
  user_feedback: string | null;
  expires_at: ISO8601 | null;
  triggered_by: string | null;
}

export interface VeteranRuleVisualGuide {
  type: 'video_link' | 'illustration' | 'step_by_step';
  media_url: string;
  action_text: string;
  thumbnail_icon?: string;
  steps?: { step: number; instruction: string; icon?: string }[];
  duration_label?: string;
}

export interface VeteranRule {
  id: string;
  trigger: {
    log_type: string;
    condition: string;
    age_range?: [number, number];
  };
  insight: {
    title: string;
    body: string;
    severity: 'info' | 'warning' | 'urgent';
    category: string;
    source: string;
    visual_guide?: VeteranRuleVisualGuide;
  };
  proactive_timer_minutes?: number;
}

export interface RedFlag {
  id: string;
  condition: (log: Record<string, unknown>, baby: Baby & { corrected_age_days: number }) => boolean;
  message: string;
  action: RedFlagAction;
  show_emergency_contacts: boolean;
}

export interface AIContext {
  baby: Baby;
  corrected_age_months: number;
  lifecycle_stage: LifecycleStage;
  recent_logs: {
    feedings: unknown[];
    sleep: unknown[];
    diapers: unknown[];
    health: unknown[];
  };
  active_milestones: unknown[];
  parent_experience_level: 'first_time' | 'experienced';
  primary_feeding_method: string;
  known_allergies: string[];
  chronic_conditions: string[];
}

export interface ContentItem extends Timestamps {
  id: UUID;
  type: 'article' | 'activity' | 'product' | 'video' | 'checklist';
  title: string;
  subtitle: string | null;
  body: string;
  thumbnail_url: string | null;
  target_lifecycle_stages: LifecycleStage[];
  target_age_months_start: number;
  target_age_months_end: number;
  developmental_domains: string[];
  triggered_by_milestone_ids: UUID[];
  tags: string[];
  source: string | null;
  is_premium: boolean;
  sort_order: number;
}

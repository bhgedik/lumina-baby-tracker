// ============================================================
// Nodd — Insights Module Types
// Smart card feed + conversational AI chat
// ============================================================

export type InsightTag =
  | 'health_pattern'
  | 'sleep_alert'
  | 'feeding_insight'
  | 'mothers_wellness'
  | 'diaper_pattern'
  | 'growth_note'
  | 'milestone_watch'
  | 'general';

export type QuickActionType = 'log_diaper' | 'log_feed' | 'log_sleep';

export interface QuickAction {
  type: QuickActionType;
  label: string;
  icon: string; // Feather icon name
}

export interface InsightCardData {
  id: string;
  tag: InsightTag;
  tagLabel: string;
  tagIcon: string; // Feather icon name
  hook: string; // "Based on..." data source explanation
  title: string;
  body: string; // Supports **bold** markers for rich text
  priority: 'low' | 'medium' | 'high';
  actionItems?: string[];
  quickAction?: QuickAction;
  createdAt: number; // Date.now() timestamp
  contentHash: string; // Derived from triggering data, used for dismiss tracking
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'nurse';
  text: string;
  timestamp: number;
}

// ─── Grouped Insights ───

export type DomainStatus = 'good' | 'attention' | 'no_data';

export interface PulseDomain {
  key: string;
  label: string;
  status: DomainStatus;
  icon: string; // Feather icon name
}

export interface PulseData {
  domains: PulseDomain[];
  summary: string;
  dayLabel: string;
}

export interface GroupedInsights {
  pulse: PulseData;
  urgent: InsightCardData[];
  wellness: InsightCardData[];
  patterns: InsightCardData[];
  positive: InsightCardData[];
}

export type InsightSection = 'urgent' | 'wellness' | 'patterns' | 'positive';

// Filter chip categories
export type FilterCategory = 'all' | 'feeding' | 'sleep' | 'diapers' | 'wellness' | 'growth';

export const FILTER_OPTIONS: { key: FilterCategory; label: string; tags: InsightTag[] }[] = [
  { key: 'all', label: 'All', tags: [] },
  { key: 'feeding', label: 'Feeding', tags: ['feeding_insight'] },
  { key: 'sleep', label: 'Sleep', tags: ['sleep_alert'] },
  { key: 'diapers', label: 'Diapers', tags: ['diaper_pattern'] },
  { key: 'wellness', label: 'My Wellness', tags: ['mothers_wellness'] },
  { key: 'growth', label: 'Growth', tags: ['growth_note', 'milestone_watch', 'general', 'health_pattern'] },
];

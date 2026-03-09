// ============================================================
// Sprouty — Expert Insights Service
// Queries developmental nudges from the expert_insights table
// Graceful offline fallback: returns empty array if Supabase
// is not configured
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../data/supabase/client';

export interface ExpertInsight {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string;
  trigger_age_min_days: number;
  trigger_age_max_days: number;
  trigger_condition: string | null;
  severity: string;
  source: string;
  action_items: string[] | null;
  visual_guide: Record<string, unknown> | null;
  is_active: boolean;
  display_order: number;
}

/**
 * Fetch expert insights relevant to the baby's current age.
 * Filters by `trigger_age_min_days <= ageDays <= trigger_age_max_days`
 * and `is_active = true`, ordered by `display_order`.
 */
export async function fetchRelevantInsights(ageDays: number): Promise<ExpertInsight[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('expert_insights')
    .select('*')
    .lte('trigger_age_min_days', ageDays)
    .gte('trigger_age_max_days', ageDays)
    .eq('is_active', true)
    .order('display_order');

  if (error || !data) return [];

  return data as ExpertInsight[];
}

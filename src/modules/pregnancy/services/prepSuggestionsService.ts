// ============================================================
// Lumina — Prep Suggestions Service
// Calls the Supabase Edge Function for AI-generated suggestions
// Falls back to local curated pool when offline
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../data/supabase/client';
import { SURPRISE_POOL } from '../data/prepContent';
import type { PrepSuggestion } from '../types';

interface FetchParams {
  gestational_week: number;
  dismissed_ids: string[];
  count: number;
  baby_name?: string;
  experience_level?: 'first_time' | 'experienced';
  feeding_method?: string;
}

/**
 * Extract the base pool ID from a possibly-timestamped ID.
 * 'sur-3-1708xxx-ab12' → 'sur-3', 'init-5' → 'init-5'
 * Handles legacy timestamped IDs from earlier app versions.
 */
function getBaseId(id: string): string {
  const match = id.match(/^((?:init|sur|ai)-\d+)/);
  return match ? match[1] : id;
}

/**
 * Pick `count` random items from the surprise pool, excluding
 * already-dismissed IDs, already-checked IDs, and already-present IDs.
 * Uses base-ID matching to catch legacy timestamped duplicates.
 * Returns items with their original pool IDs (no timestamps).
 */
function pickLocalSuggestions(
  count: number,
  dismissedIds: string[],
  existingIds: string[],
): PrepSuggestion[] {
  // Build exclusion set from base IDs to catch timestamped variants
  const excludedBaseIds = new Set([
    ...dismissedIds.map(getBaseId),
    ...existingIds.map(getBaseId),
  ]);
  const available = SURPRISE_POOL.filter((s) => !excludedBaseIds.has(s.id));

  // Shuffle (Fisher-Yates)
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Return with original stable IDs — each pool item is used once
  return shuffled.slice(0, count);
}

export async function fetchPrepSuggestions(
  params: FetchParams,
  existingIds: string[] = [],
): Promise<PrepSuggestion[]> {
  // Online path — call the Supabase Edge Function
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('prep-suggestions', {
        body: params,
      });

      if (!error && data) {
        const suggestions = (data as { suggestions: PrepSuggestion[] }).suggestions ?? [];
        if (suggestions.length > 0) return suggestions;
      }
    } catch {
      // Fall through to local fallback
    }
  }

  // Offline fallback — draw from the local surprise pool
  // Brief delay so the loading spinner is visible to the user
  await new Promise((r) => setTimeout(r, 600));
  return pickLocalSuggestions(params.count, params.dismissed_ids, existingIds);
}

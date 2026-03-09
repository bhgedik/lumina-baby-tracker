// ============================================================
// Sprouty — Activity Suggestions Service
// Calls ai-activity-suggestions edge function with timeout
// Falls back to static suggestions when offline
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../data/supabase/client';
import { getFallbackSuggestions } from '../data/fallbackSuggestions';

export interface BookSuggestion {
  title: string;
  reason: string;
}

export interface SensorySuggestion {
  name: string;
  reason: string;
  product?: string | null;
}

export interface MusicSuggestion {
  name: string;
  reason: string;
  product?: string | null;
}

export interface ActivitySuggestions {
  reading: BookSuggestion[];
  sensory: SensorySuggestion[];
  music: MusicSuggestion[];
}

interface FetchResult {
  suggestions: ActivitySuggestions;
  source: 'ai' | 'fallback';
}

const TIMEOUT_MS = 5000;

export async function fetchActivitySuggestions(
  ageMonths: number,
  correctedAgeMonths?: number,
  babyName?: string,
): Promise<FetchResult> {
  const fallback: FetchResult = {
    suggestions: getFallbackSuggestions(correctedAgeMonths ?? ageMonths),
    source: 'fallback',
  };

  if (!isSupabaseConfigured) {
    return fallback;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const { data, error } = await supabase.functions.invoke('ai-activity-suggestions', {
      body: {
        age_months: ageMonths,
        corrected_age_months: correctedAgeMonths,
        baby_name: babyName,
      },
    });

    clearTimeout(timeout);

    if (error || !data?.reading || !data?.sensory || !data?.music) {
      return fallback;
    }

    return { suggestions: data as ActivitySuggestions, source: 'ai' };
  } catch {
    return fallback;
  }
}

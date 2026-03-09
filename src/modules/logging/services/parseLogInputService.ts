// ============================================================
// Sprouty — Parse Log Input Service
// Client-side interface to the parse-log-input edge function
// Falls back gracefully when offline or Supabase not configured
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../data/supabase/client';
import type { ParsedLogAction } from '../types';

export type { ParsedLogAction };

interface ParseResult {
  parsed: ParsedLogAction | null;
  source: 'ai' | 'offline';
  error?: string;
}

export async function parseLogInput(
  text: string,
  feedingMethod?: string,
): Promise<ParseResult> {
  if (!isSupabaseConfigured) {
    return { parsed: null, source: 'offline', error: 'offline' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('parse-log-input', {
      body: {
        text,
        feeding_method: feedingMethod,
        current_datetime: new Date().toISOString(),
      },
    });

    if (error || !data?.action_type) {
      return { parsed: null, source: 'ai', error: error?.message ?? 'parse_failed' };
    }

    return { parsed: data as ParsedLogAction, source: 'ai' };
  } catch {
    return { parsed: null, source: 'offline', error: 'network' };
  }
}

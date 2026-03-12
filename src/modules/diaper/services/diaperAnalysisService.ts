// ============================================================
// Lumina — Diaper Analysis Service
// Calls the analyze-diaper edge function for AI photo analysis
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../data/supabase/client';
import type { StoolColor, StoolConsistency } from '../../../shared/types/common';

export interface AnalysisResult {
  safe: boolean;
  stoolColor?: StoolColor;
  stoolConsistency?: StoolConsistency;
  error?: string;
}

export async function analyzePhoto(base64: string): Promise<AnalysisResult> {
  if (!isSupabaseConfigured) {
    return { safe: false, error: 'offline' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('analyze-diaper', {
      body: { image: base64 },
    });

    if (error) {
      return { safe: false, error: error.message ?? 'network' };
    }

    if (!data) {
      return { safe: false, error: 'empty_response' };
    }

    return {
      safe: data.safe ?? false,
      stoolColor: data.stool_color as StoolColor | undefined,
      stoolConsistency: data.stool_consistency as StoolConsistency | undefined,
      error: data.error,
    };
  } catch {
    return { safe: false, error: 'network' };
  }
}

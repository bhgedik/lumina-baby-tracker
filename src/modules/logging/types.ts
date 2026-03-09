// ============================================================
// Sprouty — Logging Types
// Structured data format for AI-parsed natural language logs
// ============================================================

export interface ParsedLogAction {
  action_type: 'feeding' | 'sleep' | 'diaper' | 'health' | 'growth' | 'unknown';
  confidence: number;
  intent: 'log' | 'medical' | 'data_query';

  feeding?: {
    type: 'breast' | 'bottle';
    breast_side: 'left' | 'right' | 'both' | null;
    duration_minutes: number | null;
    amount_ml: number | null;
    bottle_content: 'breast_milk' | 'formula' | null;
  };

  sleep?: {
    type: 'nap' | 'night';
    event: 'start' | 'end' | 'completed';
    duration_minutes: number | null;
  };

  diaper?: {
    type: 'wet' | 'dirty' | 'both' | 'dry';
  };

  health?: {
    type: 'temperature' | 'medication' | 'symptom';
    temperature_celsius: number | null;
    medication_name: string | null;
    symptoms: string[] | null;
  };

  growth?: {
    weight_grams: number | null;
    height_cm: number | null;
    head_circumference_cm: number | null;
  };

  /** Human-readable toast text, e.g. "Breast feed, left side, 10 min" */
  summary: string;
}

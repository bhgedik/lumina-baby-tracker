// ============================================================
// Nodd — Pregnancy Module Types
// ============================================================

export interface PrepSuggestion {
  id: string;
  title: string;
  body: string;
  nurseInsight?: string;    // "The Veteran Nurse's Take" — WHY this matters
  actionSteps?: string[];   // "Your Action Plan" — 3-4 practical how-to steps
  category: string;
  source: 'ai' | 'static';
}

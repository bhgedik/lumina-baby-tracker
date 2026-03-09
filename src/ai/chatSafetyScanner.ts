// ============================================================
// Sprouty — Chat Safety Scanner
// Synchronous keyword matcher that runs BEFORE every chat send.
// Catches medical emergencies and crisis situations in text.
// Mirrors redFlagInterceptor.ts patterns for natural language.
// ============================================================

export interface SafetyScanResult {
  isRedFlag: boolean;
  message: string | null;
  showEmergencyContacts: boolean;
}

const EMERGENCY_PATTERNS: Array<{
  pattern: RegExp;
  message: string;
  showEmergencyContacts: boolean;
}> = [
  {
    // Breathing difficulty
    pattern: /\b(can'?t breathe|not breathing|blue lips|turning blue|grunting|choking|gasping)\b/i,
    message:
      'Signs of breathing difficulty require IMMEDIATE emergency care. Call 911 or go to the nearest ER right now.',
    showEmergencyContacts: true,
  },
  {
    // Self-harm / crisis (EPDS Q10 equivalent)
    pattern: /\b(hurt myself|kill myself|want to die|suicide|self[- ]harm|can'?t go on|ending it)\b/i,
    message:
      'You are not alone, and you deserve support right now.\n\nPostpartum Support International: 1-800-944-4773\nCrisis Text Line: Text HOME to 741741\n988 Suicide & Crisis Lifeline: 988\n\nThese feelings are more common than you think, and help is available.',
    showEmergencyContacts: true,
  },
  {
    // Unresponsive baby
    pattern: /\b(won'?t wake up|unresponsive|limp|lethargic|floppy|not responding)\b/i,
    message:
      'A baby who is difficult to wake or unusually unresponsive needs immediate medical evaluation. Call 911 or go to the ER immediately.',
    showEmergencyContacts: true,
  },
  {
    // Fever in young infant
    pattern: /\b(fever|temperature|burning up|really hot)\b.*\b(newborn|week old|weeks old|month old|under 3|baby)\b/i,
    message:
      'If your baby is under 3 months and has a fever of 38.3\u00B0C (101\u00B0F) or higher, this is a MEDICAL EMERGENCY. Do NOT give fever reducers. Go to the Emergency Room immediately.',
    showEmergencyContacts: true,
  },
];

export function scanMessageForSafety(text: string): SafetyScanResult {
  for (const entry of EMERGENCY_PATTERNS) {
    if (entry.pattern.test(text)) {
      return {
        isRedFlag: true,
        message: entry.message,
        showEmergencyContacts: entry.showEmergencyContacts,
      };
    }
  }

  return { isRedFlag: false, message: null, showEmergencyContacts: false };
}

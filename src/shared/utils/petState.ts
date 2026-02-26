// ============================================================
// Nodd — Pet State Resolver
// Maps elapsed hours since last log → pet expression + colors
// ============================================================

import type { PetState } from '../components/PetIcons';

export type PetDomain = 'feeding' | 'sleep' | 'diaper';

interface PetStateResult {
  state: PetState;
  tintColor: string;
  iconColor: string;
}

const THRESHOLDS: Record<PetDomain, { neutral: number; urgent: number }> = {
  feeding: { neutral: 2, urgent: 4 },
  sleep:   { neutral: 2, urgent: 3.5 },
  diaper:  { neutral: 2, urgent: 4 },
};

export function resolvePetState(
  domain: PetDomain,
  hoursSince: number | null,
  domainColor: string,
): PetStateResult {
  // No data yet → treat as neutral
  if (hoursSince == null) {
    return { state: 'neutral', tintColor: '#FFD54F20', iconColor: '#B8860B' };
  }

  const { neutral, urgent } = THRESHOLDS[domain];

  if (hoursSince < neutral) {
    return { state: 'happy', tintColor: domainColor + '15', iconColor: domainColor };
  }

  if (hoursSince < urgent) {
    return { state: 'neutral', tintColor: '#FFD54F20', iconColor: '#B8860B' };
  }

  return { state: 'urgent', tintColor: '#FF704325', iconColor: '#D32F2F' };
}

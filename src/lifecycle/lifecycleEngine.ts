// ============================================================
// Sprout — Lifecycle Stage Engine
// Determines the current developmental stage based on corrected age.
// Drives content targeting, AI prompt selection, and UI theming.
// ============================================================

import type { LifecycleStage } from '../shared/types/common';
import type { LifecycleStageConfig } from './types';
import { colors } from '../shared/constants/theme';

export const LIFECYCLE_STAGES: LifecycleStageConfig[] = [
  {
    stage: 'prenatal',
    label: 'Pre-natal',
    description: 'Birth preparation, hospital checklists, and prenatal education',
    age_months_start: -Infinity,
    age_months_end: 0,
    focus_areas: [
      'Birth preparation',
      'Hospital bag checklist',
      'Nursery setup',
      'Pre-Birth Quests',
      'Prenatal education',
    ],
    color: colors.secondary[300],
  },
  {
    stage: 'fourth_trimester',
    label: '4th Trimester',
    description: 'Survival, feeding establishment, and postpartum recovery (0-3 months)',
    age_months_start: 0,
    age_months_end: 3,
    focus_areas: [
      'Feeding establishment',
      'Safe sleep basics',
      'Postpartum recovery',
      'Emotional wellbeing (EPDS)',
      'Newborn care',
    ],
    color: colors.primary[300],
  },
  {
    stage: 'transition',
    label: 'The Transition',
    description: 'Sleep windows, routines, and growing interaction (3-6 months)',
    age_months_start: 3,
    age_months_end: 6,
    focus_areas: [
      'Sleep windows & circadian rhythm',
      'Routine building',
      'Tummy time progression',
      'Social development',
      'Sensory play introduction',
    ],
    color: colors.primary[400],
  },
  {
    stage: 'exploration',
    label: 'The Exploration',
    description: 'Solid foods, motor skills, and discovering the world (6-12 months)',
    age_months_start: 6,
    age_months_end: 12,
    focus_areas: [
      'Solid food introduction (BLW/traditional)',
      'Allergy tracking',
      'Motor development (crawling, standing)',
      'Sensory play',
      'Separation anxiety',
    ],
    color: colors.primary[500],
  },
  {
    stage: 'toddler',
    label: 'Toddlerhood',
    description: 'Language, boundaries, and growing independence (12+ months)',
    age_months_start: 12,
    age_months_end: Infinity,
    focus_areas: [
      'Language acquisition',
      'Boundaries & positive discipline',
      'Temperament analysis',
      'Play-based learning',
      'Potty training readiness',
    ],
    color: colors.primary[600],
  },
];

/**
 * Get the lifecycle stage for a given effective age in months.
 */
export function getLifecycleStage(effectiveAgeMonths: number): LifecycleStageConfig {
  const stage = LIFECYCLE_STAGES.find(
    (s) => effectiveAgeMonths >= s.age_months_start && effectiveAgeMonths < s.age_months_end
  );
  return stage ?? LIFECYCLE_STAGES[LIFECYCLE_STAGES.length - 1];
}

/**
 * Get the AI system prompt template name for a lifecycle stage.
 */
export function getPromptTemplateForStage(stage: LifecycleStage): string {
  const map: Record<LifecycleStage, string> = {
    prenatal: 'prenatal',
    fourth_trimester: 'fourthTrimester',
    transition: 'transition',
    exploration: 'exploration',
    toddler: 'toddler',
  };
  return map[stage];
}

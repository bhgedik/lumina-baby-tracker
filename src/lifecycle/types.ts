import { LifecycleStage } from '../shared/types/common';

export interface LifecycleStageConfig {
  stage: LifecycleStage;
  label: string;
  description: string;
  age_months_start: number;
  age_months_end: number;
  focus_areas: string[];
  color: string;
}

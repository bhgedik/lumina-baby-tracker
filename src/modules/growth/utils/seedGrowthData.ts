// ============================================================
// Sprouty — Seed Growth Data Generator
// Generates realistic monthly growth logs targeting 30–40th
// percentile with natural drift
// ============================================================

import { generateUUID } from '../../../stores/createSyncedStore';
import { valueAtPercentile, calculatePercentile, resolveSex } from './percentileCalculation';
import type { GrowthLog } from '../types';
import type { Baby } from '../../baby/types';
import type { GrowthMetric, Sex } from '../data/whoGrowthStandards';

/** Simple seeded pseudo-random for reproducible jitter */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function generateSeedGrowthData(baby: Baby): GrowthLog[] {
  const sex = resolveSex(baby.gender);
  const birthDate = new Date(baby.date_of_birth);
  const now = new Date();

  // Age in months (capped at 24 for WHO charts)
  const ageDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  const ageMonths = Math.min(Math.floor(ageDays / 30.44), 24);

  if (ageMonths < 0) return [];

  const random = seededRandom(baby.id.charCodeAt(0) * 1000 + baby.id.charCodeAt(1));
  const logs: GrowthLog[] = [];

  // Tracking percentiles with natural drift
  let weightPercentile = 33 + random() * 7; // Start 33–40
  let lengthPercentile = 33 + random() * 7;
  let headPercentile = 33 + random() * 7;

  for (let month = 0; month <= ageMonths; month++) {
    // Natural drift: ±2 points/month, clamped to 25–45
    if (month > 0) {
      weightPercentile = clampPercentile(weightPercentile + (random() - 0.5) * 4);
      lengthPercentile = clampPercentile(lengthPercentile + (random() - 0.5) * 4);
      headPercentile = clampPercentile(headPercentile + (random() - 0.5) * 4);
    }

    // Date: birthDate + month months, with 1–3 day jitter (except birth)
    const measDate = new Date(birthDate);
    measDate.setMonth(measDate.getMonth() + month);
    if (month > 0) {
      const jitterDays = Math.floor(random() * 3) + 1;
      measDate.setDate(measDate.getDate() + (random() > 0.5 ? jitterDays : -jitterDays));
    }

    // Don't generate future measurements
    if (measDate > now) break;

    // Compute values from percentiles
    let weightGrams = Math.round(valueAtPercentile(sex, 'weight', month, weightPercentile));
    let heightCm = Math.round(valueAtPercentile(sex, 'length', month, lengthPercentile) * 10) / 10;
    let headCm = Math.round(valueAtPercentile(sex, 'head', month, headPercentile) * 10) / 10;

    // Use actual birth measurements if available (month 0)
    if (month === 0) {
      if (baby.birth_weight_grams != null) {
        weightGrams = baby.birth_weight_grams;
        weightPercentile = calculatePercentile(sex, 'weight', 0, weightGrams);
      }
      if (baby.birth_length_cm != null) {
        heightCm = baby.birth_length_cm;
        lengthPercentile = calculatePercentile(sex, 'length', 0, heightCm);
      }
      if (baby.birth_head_circumference_cm != null) {
        headCm = baby.birth_head_circumference_cm;
        headPercentile = calculatePercentile(sex, 'head', 0, headCm);
      }
    }

    const iso = measDate.toISOString();

    logs.push({
      id: generateUUID(),
      baby_id: baby.id,
      family_id: baby.family_id,
      logged_by: 'seed-data',
      measured_at: iso,
      weight_grams: weightGrams,
      height_cm: heightCm,
      head_circumference_cm: headCm,
      weight_percentile: Math.round(weightPercentile),
      height_percentile: Math.round(lengthPercentile),
      head_percentile: Math.round(headPercentile),
      chart_type: 'who',
      notes: null,
      created_at: iso,
      updated_at: iso,
    });
  }

  return logs;
}

function clampPercentile(p: number): number {
  return Math.max(25, Math.min(45, p));
}

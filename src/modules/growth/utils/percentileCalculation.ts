// ============================================================
// Nodd — Percentile Calculation Utility
// Linear interpolation against WHO growth curves
// ============================================================

import { WHO_DATA } from '../data/whoGrowthStandards';
import type { GrowthMetric, Sex, PercentileCurvePoint } from '../data/whoGrowthStandards';

/** Resolve Baby.gender → Sex for chart lookup. 'other'|'prefer_not_to_say' default to female. */
export function resolveSex(gender: string): Sex {
  return gender === 'male' ? 'male' : 'female';
}

/** Linearly interpolate between two numbers */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Find the two bracketing curve points for a given age and interpolate */
function interpolateCurveAtAge(
  curve: PercentileCurvePoint[],
  ageMonths: number,
): PercentileCurvePoint {
  // Clamp to curve bounds
  if (ageMonths <= curve[0].ageMonths) return curve[0];
  if (ageMonths >= curve[curve.length - 1].ageMonths) return curve[curve.length - 1];

  // Find bracketing indices
  let lo = 0;
  for (let i = 1; i < curve.length; i++) {
    if (curve[i].ageMonths >= ageMonths) {
      lo = i - 1;
      break;
    }
  }
  const hi = lo + 1;
  const t = (ageMonths - curve[lo].ageMonths) / (curve[hi].ageMonths - curve[lo].ageMonths);

  return {
    ageMonths,
    p3: lerp(curve[lo].p3, curve[hi].p3, t),
    p15: lerp(curve[lo].p15, curve[hi].p15, t),
    p50: lerp(curve[lo].p50, curve[hi].p50, t),
    p85: lerp(curve[lo].p85, curve[hi].p85, t),
    p97: lerp(curve[lo].p97, curve[hi].p97, t),
  };
}

/** Percentile breakpoints for interpolation */
const PERCENTILE_KEYS = ['p3', 'p15', 'p50', 'p85', 'p97'] as const;
const PERCENTILE_VALUES = [3, 15, 50, 85, 97];

/**
 * Given a measurement, compute approximate percentile (0–100).
 * Uses linear interpolation between WHO percentile bands.
 */
export function calculatePercentile(
  sex: Sex,
  metric: GrowthMetric,
  ageMonths: number,
  value: number,
): number {
  const curve = WHO_DATA[sex][metric];
  const point = interpolateCurveAtAge(curve, ageMonths);

  // Below p3
  if (value <= point.p3) return Math.max(1, 3 * (value / point.p3));

  // Above p97
  if (value >= point.p97) return Math.min(99, 97 + 3 * ((value - point.p97) / point.p97) * 10);

  // Between percentile bands — interpolate
  for (let i = 0; i < PERCENTILE_KEYS.length - 1; i++) {
    const loVal = point[PERCENTILE_KEYS[i]];
    const hiVal = point[PERCENTILE_KEYS[i + 1]];
    if (value >= loVal && value <= hiVal) {
      const t = (value - loVal) / (hiVal - loVal);
      return lerp(PERCENTILE_VALUES[i], PERCENTILE_VALUES[i + 1], t);
    }
  }

  return 50; // fallback
}

/**
 * Given a target percentile (0–100), compute the measurement value.
 * Useful for seed data generation.
 */
export function valueAtPercentile(
  sex: Sex,
  metric: GrowthMetric,
  ageMonths: number,
  percentile: number,
): number {
  const curve = WHO_DATA[sex][metric];
  const point = interpolateCurveAtAge(curve, ageMonths);

  // Clamp to safe range
  const p = Math.max(1, Math.min(99, percentile));

  // Below p3
  if (p <= 3) {
    return point.p3 * (p / 3);
  }

  // Above p97
  if (p >= 97) {
    const extra = (p - 97) / 3;
    return point.p97 * (1 + extra * 0.1);
  }

  // Between percentile bands
  for (let i = 0; i < PERCENTILE_VALUES.length - 1; i++) {
    if (p >= PERCENTILE_VALUES[i] && p <= PERCENTILE_VALUES[i + 1]) {
      const t = (p - PERCENTILE_VALUES[i]) / (PERCENTILE_VALUES[i + 1] - PERCENTILE_VALUES[i]);
      return lerp(
        point[PERCENTILE_KEYS[i]],
        point[PERCENTILE_KEYS[i + 1]],
        t,
      );
    }
  }

  return point.p50; // fallback
}

/**
 * Get WHO curve data up to a given age (for chart rendering).
 * Returns all pre-computed points within range.
 */
export function getPercentileCurve(
  sex: Sex,
  metric: GrowthMetric,
  maxAgeMonths: number,
): PercentileCurvePoint[] {
  const curve = WHO_DATA[sex][metric];
  return curve.filter((p) => p.ageMonths <= maxAgeMonths);
}

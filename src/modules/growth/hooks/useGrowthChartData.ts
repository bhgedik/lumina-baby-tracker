// ============================================================
// Sprouty — Growth Chart Data Hook
// Prepares chart-ready data from growth store
// ============================================================

import { useMemo } from 'react';
import { useBabyStore } from '../../../stores/babyStore';
import { useGrowthStore } from '../../../stores/growthStore';
import { resolveSex, calculatePercentile } from '../utils/percentileCalculation';
import type { Sex } from '../data/whoGrowthStandards';

interface ChartPoint {
  ageMonths: number;
  value: number;
}

interface GrowthChartData {
  measurements: {
    weight: ChartPoint[];
    length: ChartPoint[];
    head: ChartPoint[];
  };
  sex: Sex;
  maxAgeMonths: number;
  latestPercentiles: { weight: number; length: number; head: number };
  latestValues: { weight: number | null; length: number | null; head: number | null };
  babyName: string;
  hasData: boolean;
}

export function useGrowthChartData(): GrowthChartData {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const growthItems = useGrowthStore((s) => s.items);

  return useMemo(() => {
    const baby = activeBabyId
      ? babies.find((b) => b.id === activeBabyId)
      : babies[0];

    const empty: GrowthChartData = {
      measurements: { weight: [], length: [], head: [] },
      sex: 'female',
      maxAgeMonths: 6,
      latestPercentiles: { weight: 0, length: 0, head: 0 },
      latestValues: { weight: null, length: null, head: null },
      babyName: '',
      hasData: false,
    };

    if (!baby) return empty;

    const sex = resolveSex(baby.gender);
    const birthDate = new Date(baby.date_of_birth);

    // Filter & sort logs for this baby
    const logs = growthItems
      .filter((item) => item.baby_id === baby.id)
      .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());

    if (logs.length === 0) return { ...empty, sex, babyName: baby.name };

    const weight: ChartPoint[] = [];
    const length: ChartPoint[] = [];
    const head: ChartPoint[] = [];

    for (const log of logs) {
      const measDate = new Date(log.measured_at);
      const ageDays = Math.floor((measDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      const ageMonths = Math.round((ageDays / 30.44) * 2) / 2; // Round to nearest half month

      if (log.weight_grams != null) {
        weight.push({ ageMonths, value: log.weight_grams });
      }
      if (log.height_cm != null) {
        length.push({ ageMonths, value: log.height_cm });
      }
      if (log.head_circumference_cm != null) {
        head.push({ ageMonths, value: log.head_circumference_cm });
      }
    }

    const lastLog = logs[logs.length - 1];
    const lastMeasDate = new Date(lastLog.measured_at);
    const lastAgeDays = Math.floor((lastMeasDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    // Round up to next whole month for chart range, minimum 2
    const maxAgeMonths = Math.max(2, Math.ceil(lastAgeDays / 30.44) + 1);

    // Compute percentiles dynamically — stored fields may be null for user-entered data
    const lastAgeMonths = Math.round((lastAgeDays / 30.44) * 2) / 2;
    const latestPercentiles = {
      weight: lastLog.weight_grams != null
        ? calculatePercentile(sex, 'weight', lastAgeMonths, lastLog.weight_grams)
        : 0,
      length: lastLog.height_cm != null
        ? calculatePercentile(sex, 'length', lastAgeMonths, lastLog.height_cm)
        : 0,
      head: lastLog.head_circumference_cm != null
        ? calculatePercentile(sex, 'head', lastAgeMonths, lastLog.head_circumference_cm)
        : 0,
    };

    return {
      measurements: { weight, length, head },
      sex,
      maxAgeMonths,
      latestPercentiles,
      latestValues: {
        weight: lastLog.weight_grams,
        length: lastLog.height_cm,
        head: lastLog.head_circumference_cm,
      },
      babyName: baby.name,
      hasData: logs.length >= 2,
    };
  }, [babies, activeBabyId, growthItems]);
}

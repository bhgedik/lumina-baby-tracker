// ============================================================
// Nodd — Growth Chart (SVG)
// Custom chart with WHO percentile bands + baby's data line
// Uses react-native-svg (already installed)
// ============================================================

import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import { colors } from '../../../shared/constants/theme';
import { getPercentileCurve } from '../utils/percentileCalculation';
import type { GrowthMetric, Sex, PercentileCurvePoint } from '../data/whoGrowthStandards';

interface GrowthChartProps {
  metric: GrowthMetric;
  sex: Sex;
  measurements: { ageMonths: number; value: number }[];
  maxAgeMonths: number;
  compact?: boolean;
}

const VIEWBOX_W = 320;
const VIEWBOX_H = 200;
const PAD = { top: 10, right: 35, bottom: 30, left: 40 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const BAND_FILL_OUTER = colors.primary[50];
const BAND_FILL_INNER = colors.primary[100];
const P50_COLOR = colors.primary[400];
const BOUND_COLOR = colors.neutral[300];
const DATA_COLOR = colors.secondary[500];

const METRIC_LABEL: Record<GrowthMetric, string> = {
  weight: 'g',
  length: 'cm',
  head: 'cm',
};

function formatValue(metric: GrowthMetric, value: number): string {
  if (metric === 'weight') {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}kg` : `${Math.round(value)}g`;
  }
  return `${value.toFixed(1)}`;
}

export function GrowthChart({ metric, sex, measurements, maxAgeMonths, compact = false }: GrowthChartProps) {
  const curveData = useMemo(
    () => getPercentileCurve(sex, metric, Math.max(maxAgeMonths, 2)),
    [sex, metric, maxAgeMonths],
  );

  // Compute Y range from WHO data
  const { minY, maxY, scaleX, scaleY } = useMemo(() => {
    const allValues = curveData.flatMap((p) => [p.p3, p.p97]);
    const measValues = measurements.map((m) => m.value);
    const allY = [...allValues, ...measValues];
    const yMin = Math.min(...allY) * 0.95;
    const yMax = Math.max(...allY) * 1.05;

    const effectiveMaxAge = Math.max(maxAgeMonths, 2);

    return {
      minY: yMin,
      maxY: yMax,
      scaleX: (age: number) => PAD.left + (age / effectiveMaxAge) * PLOT_W,
      scaleY: (val: number) => PAD.top + PLOT_H - ((val - yMin) / (yMax - yMin)) * PLOT_H,
    };
  }, [curveData, measurements, maxAgeMonths]);

  // Build percentile band paths
  const bandPaths = useMemo(() => {
    const buildAreaPath = (
      data: PercentileCurvePoint[],
      upperKey: keyof PercentileCurvePoint,
      lowerKey: keyof PercentileCurvePoint,
    ): string => {
      if (data.length === 0) return '';
      const upper = data.map((p) => `${scaleX(p.ageMonths)},${scaleY(p[upperKey] as number)}`);
      const lower = [...data].reverse().map((p) => `${scaleX(p.ageMonths)},${scaleY(p[lowerKey] as number)}`);
      return `M${upper.join('L')}L${lower.join('L')}Z`;
    };

    return {
      outerLow: buildAreaPath(curveData, 'p15', 'p3'),
      inner: buildAreaPath(curveData, 'p85', 'p15'),
      outerHigh: buildAreaPath(curveData, 'p97', 'p85'),
    };
  }, [curveData, scaleX, scaleY]);

  // Build percentile lines
  const buildLinePath = (data: PercentileCurvePoint[], key: keyof PercentileCurvePoint): string => {
    if (data.length === 0) return '';
    return data.map((p, i) => {
      const x = scaleX(p.ageMonths);
      const y = scaleY(p[key] as number);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join('');
  };

  // Build baby data line
  const sortedMeasurements = useMemo(
    () => [...measurements].sort((a, b) => a.ageMonths - b.ageMonths),
    [measurements],
  );

  const dataLinePath = useMemo(() => {
    if (sortedMeasurements.length < 2) return '';
    return sortedMeasurements.map((m, i) => {
      const x = scaleX(m.ageMonths);
      const y = scaleY(m.value);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join('');
  }, [sortedMeasurements, scaleX, scaleY]);

  // X-axis labels (months)
  const effectiveMaxAge = Math.max(maxAgeMonths, 2);
  const xTicks = useMemo(() => {
    const step = effectiveMaxAge <= 6 ? 1 : effectiveMaxAge <= 12 ? 2 : 3;
    const ticks: number[] = [];
    for (let i = 0; i <= effectiveMaxAge; i += step) ticks.push(i);
    return ticks;
  }, [effectiveMaxAge]);

  // Y-axis labels
  const yTicks = useMemo(() => {
    const range = maxY - minY;
    const rawStep = range / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;
    const ticks: number[] = [];
    const start = Math.ceil(minY / step) * step;
    for (let v = start; v <= maxY; v += step) ticks.push(v);
    return ticks;
  }, [minY, maxY]);

  // Right-edge percentile labels
  const lastPoint = curveData[curveData.length - 1];
  const pLabels = lastPoint ? [
    { label: 'P97', y: scaleY(lastPoint.p97) },
    { label: 'P85', y: scaleY(lastPoint.p85) },
    { label: 'P50', y: scaleY(lastPoint.p50) },
    { label: 'P15', y: scaleY(lastPoint.p15) },
    { label: 'P3', y: scaleY(lastPoint.p3) },
  ] : [];

  return (
    <View style={{ aspectRatio: VIEWBOX_W / VIEWBOX_H }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
        {/* Percentile bands */}
        <Path d={bandPaths.outerLow} fill={BAND_FILL_OUTER} opacity={0.5} />
        <Path d={bandPaths.inner} fill={BAND_FILL_INNER} opacity={0.4} />
        <Path d={bandPaths.outerHigh} fill={BAND_FILL_OUTER} opacity={0.5} />

        {/* Percentile lines */}
        <Path d={buildLinePath(curveData, 'p3')} stroke={BOUND_COLOR} strokeWidth={1} fill="none" />
        <Path d={buildLinePath(curveData, 'p97')} stroke={BOUND_COLOR} strokeWidth={1} fill="none" />
        <Path
          d={buildLinePath(curveData, 'p50')}
          stroke={P50_COLOR}
          strokeWidth={1.5}
          strokeDasharray="4,3"
          fill="none"
        />

        {/* Grid lines */}
        {xTicks.map((age) => (
          <Line
            key={`xg-${age}`}
            x1={scaleX(age)}
            y1={PAD.top}
            x2={scaleX(age)}
            y2={PAD.top + PLOT_H}
            stroke={colors.neutral[200]}
            strokeWidth={0.5}
          />
        ))}

        {/* Baby data line */}
        {dataLinePath && (
          <Path d={dataLinePath} stroke={DATA_COLOR} strokeWidth={2} fill="none" strokeLinejoin="round" />
        )}

        {/* Baby data dots */}
        {sortedMeasurements.map((m, i) => (
          <Circle
            key={`dot-${i}`}
            cx={scaleX(m.ageMonths)}
            cy={scaleY(m.value)}
            r={compact ? 3 : 4}
            fill={DATA_COLOR}
            stroke={colors.neutral[0]}
            strokeWidth={1.5}
          />
        ))}

        {/* X-axis labels */}
        {xTicks.map((age) => (
          <SvgText
            key={`xl-${age}`}
            x={scaleX(age)}
            y={VIEWBOX_H - 6}
            fontSize={compact ? 8 : 9}
            fill={colors.textTertiary}
            textAnchor="middle"
          >
            {age}m
          </SvgText>
        ))}

        {/* Y-axis labels */}
        {yTicks.map((val) => (
          <SvgText
            key={`yl-${val}`}
            x={PAD.left - 4}
            y={scaleY(val) + 3}
            fontSize={compact ? 7 : 8}
            fill={colors.textTertiary}
            textAnchor="end"
          >
            {metric === 'weight' && val >= 1000 ? `${(val / 1000).toFixed(1)}` : val.toFixed(1)}
          </SvgText>
        ))}

        {/* Y-axis unit label */}
        <SvgText
          x={4}
          y={PAD.top + 4}
          fontSize={7}
          fill={colors.textTertiary}
          textAnchor="start"
        >
          {metric === 'weight' ? 'kg' : METRIC_LABEL[metric]}
        </SvgText>

        {/* Right-edge percentile labels */}
        {!compact && pLabels.map((pl) => (
          <SvgText
            key={pl.label}
            x={VIEWBOX_W - 2}
            y={pl.y + 3}
            fontSize={7}
            fill={colors.primary[400]}
            textAnchor="end"
            fontWeight="500"
          >
            {pl.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

// ============================================================
// Lumina — Sleep Chart (14-day night sleep bar chart)
// Proper Y-axis, zero-baseline, proportional bar heights
// ============================================================

import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import type { SleepDay } from '../hooks/useChartData';

const VIEWBOX_W = 320;
const VIEWBOX_H = 180;
const PAD = { top: 12, right: 12, bottom: 28, left: 36 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const BAR_COLOR = '#B199CE';
const AXIS_COLOR = '#C8C2B8';
const GRID_COLOR = '#EAE6E0';
const LABEL_COLOR = '#8A8A8A';

interface SleepChartProps {
  data: SleepDay[];
}

export function SleepChart({ data }: SleepChartProps) {
  const { maxVal, scaleY, yTicks } = useMemo(() => {
    const allVals = data.map((d) => d.hours);
    const max = Math.max(1, ...allVals);
    // Round up to a nice number for the Y-axis ceiling
    const step = max <= 6 ? 2 : max <= 12 ? 3 : 5;
    const roundedMax = Math.ceil(max / step) * step;

    const ticks: number[] = [];
    for (let v = 0; v <= roundedMax; v += step) ticks.push(v);

    return {
      maxVal: roundedMax,
      scaleY: (val: number) => PAD.top + PLOT_H - (val / roundedMax) * PLOT_H,
      yTicks: ticks,
    };
  }, [data]);

  const baselineY = PAD.top + PLOT_H;
  const barWidth = (PLOT_W / data.length) * 0.55;

  return (
    <View style={{ aspectRatio: VIEWBOX_W / VIEWBOX_H }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
        {/* Dashed grid lines (skip 0 — that's the baseline) */}
        {yTicks.filter((v) => v > 0).map((val) => (
          <Line
            key={`grid-${val}`}
            x1={PAD.left}
            y1={scaleY(val)}
            x2={VIEWBOX_W - PAD.right}
            y2={scaleY(val)}
            stroke={GRID_COLOR}
            strokeWidth={0.5}
            strokeDasharray="4,3"
          />
        ))}

        {/* Baseline (x-axis at 0) — solid, prominent */}
        <Line
          x1={PAD.left}
          y1={baselineY}
          x2={VIEWBOX_W - PAD.right}
          y2={baselineY}
          stroke={AXIS_COLOR}
          strokeWidth={1}
        />

        {/* Y-axis line */}
        <Line
          x1={PAD.left}
          y1={PAD.top}
          x2={PAD.left}
          y2={baselineY}
          stroke={AXIS_COLOR}
          strokeWidth={0.5}
        />

        {/* Bars — grounded on baseline */}
        {data.map((day, i) => {
          const x = PAD.left + (i + 0.5) * (PLOT_W / data.length) - barWidth / 2;
          const barH = maxVal > 0 ? (day.hours / maxVal) * PLOT_H : 0;
          const opacity = day.hours > 0
            ? 0.45 + 0.5 * (day.hours / maxVal)
            : 0;

          return day.hours > 0 ? (
            <Rect
              key={i}
              x={x}
              y={baselineY - barH}
              width={barWidth}
              height={barH}
              rx={3}
              fill={BAR_COLOR}
              opacity={opacity}
            />
          ) : null;
        })}

        {/* X-axis labels (every 2nd day for 14 days) */}
        {data.map((day, i) => {
          if (data.length > 10 && i % 2 !== 0) return null;
          const x = PAD.left + (i + 0.5) * (PLOT_W / data.length);
          return (
            <SvgText
              key={`xl-${i}`}
              x={x}
              y={VIEWBOX_H - 6}
              fontSize={8}
              fill={LABEL_COLOR}
              textAnchor="middle"
            >
              {day.label}
            </SvgText>
          );
        })}

        {/* Y-axis labels */}
        {yTicks.map((val) => (
          <SvgText
            key={`yl-${val}`}
            x={PAD.left - 6}
            y={scaleY(val) + 3}
            fontSize={8}
            fill={LABEL_COLOR}
            textAnchor="end"
          >
            {val}h
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

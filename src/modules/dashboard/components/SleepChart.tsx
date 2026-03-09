// ============================================================
// Sprouty — Sleep Chart (14-day night sleep bar chart)
// Bar opacity scales with hours for a gradient effect
// ============================================================

import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import type { SleepDay } from '../hooks/useChartData';

const VIEWBOX_W = 320;
const VIEWBOX_H = 180;
const PAD = { top: 12, right: 16, bottom: 28, left: 32 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const BAR_COLOR = '#8BA88E';
const GRID_COLOR = '#E8E4DF';
const LABEL_COLOR = '#8A8A8A';

interface SleepChartProps {
  data: SleepDay[];
}

export function SleepChart({ data }: SleepChartProps) {
  const { maxVal, scaleY, yTicks } = useMemo(() => {
    const allVals = data.map((d) => d.hours);
    const max = Math.max(1, ...allVals);
    const roundedMax = Math.ceil(max); // round up to whole hour

    const ticks: number[] = [];
    const step = Math.max(1, Math.ceil(roundedMax / 4));
    for (let v = 0; v <= roundedMax; v += step) ticks.push(v);

    return {
      maxVal: roundedMax,
      scaleY: (val: number) => PAD.top + PLOT_H - (val / roundedMax) * PLOT_H,
      yTicks: ticks,
    };
  }, [data]);

  const barWidth = (PLOT_W / data.length) * 0.6;

  return (
    <View style={{ aspectRatio: VIEWBOX_W / VIEWBOX_H }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
        {/* Grid lines */}
        {yTicks.map((val) => (
          <Line
            key={`grid-${val}`}
            x1={PAD.left}
            y1={scaleY(val)}
            x2={VIEWBOX_W - PAD.right}
            y2={scaleY(val)}
            stroke={GRID_COLOR}
            strokeWidth={0.5}
          />
        ))}

        {/* Bars */}
        {data.map((day, i) => {
          const x = PAD.left + (i + 0.5) * (PLOT_W / data.length) - barWidth / 2;
          const barH = maxVal > 0 ? (day.hours / maxVal) * PLOT_H : 0;
          // Opacity scales from 0.4 (low hours) to 0.95 (max hours)
          const opacity = day.hours > 0
            ? 0.4 + 0.55 * (day.hours / maxVal)
            : 0;

          return day.hours > 0 ? (
            <Rect
              key={i}
              x={x}
              y={PAD.top + PLOT_H - barH}
              width={barWidth}
              height={barH}
              rx={3}
              fill={BAR_COLOR}
              opacity={opacity}
            />
          ) : null;
        })}

        {/* X-axis labels (show every 2nd day for 14 days) */}
        {data.map((day, i) => {
          if (i % 2 !== 0) return null;
          const x = PAD.left + (i + 0.5) * (PLOT_W / data.length);
          return (
            <SvgText
              key={`xl-${i}`}
              x={x}
              y={VIEWBOX_H - 8}
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

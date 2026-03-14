// ============================================================
// Lumina — Habits Chart (7-day grouped bar chart)
// Feeds (sage green) + Diapers (warm blush) per day
// Proper Y-axis, zero-baseline, proportional bar heights
// ============================================================

import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import type { HabitsDay } from '../hooks/useChartData';

const VIEWBOX_W = 320;
const VIEWBOX_H = 180;
const PAD = { top: 12, right: 12, bottom: 28, left: 32 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const FEED_COLOR = '#B199CE';
const DIAPER_COLOR = '#F2B89C';
const AXIS_COLOR = '#C8C2B8';
const GRID_COLOR = '#EAE6E0';
const LABEL_COLOR = '#8A8A8A';

interface HabitsChartProps {
  data: HabitsDay[];
}

export function HabitsChart({ data }: HabitsChartProps) {
  const { maxVal, scaleY, yTicks } = useMemo(() => {
    const allVals = data.flatMap((d) => [d.feeds, d.diapers]);
    const max = Math.max(1, ...allVals);
    // Round up to a nice even number
    const step = max <= 6 ? 2 : max <= 12 ? 3 : 4;
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
  const barGroupWidth = PLOT_W / data.length;
  const barWidth = barGroupWidth * 0.28;
  const barGap = barGroupWidth * 0.06;

  return (
    <View style={{ aspectRatio: VIEWBOX_W / VIEWBOX_H }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
        {/* Dashed grid lines (skip 0) */}
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

        {/* Baseline (x-axis at 0) */}
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

        {/* Grouped bars — grounded on baseline */}
        {data.map((day, i) => {
          const groupX = PAD.left + i * barGroupWidth + barGroupWidth / 2;
          const feedX = groupX - barWidth - barGap / 2;
          const diaperX = groupX + barGap / 2;

          const feedH = maxVal > 0 ? (day.feeds / maxVal) * PLOT_H : 0;
          const diaperH = maxVal > 0 ? (day.diapers / maxVal) * PLOT_H : 0;

          return (
            <React.Fragment key={i}>
              {day.feeds > 0 && (
                <Rect
                  x={feedX}
                  y={baselineY - feedH}
                  width={barWidth}
                  height={feedH}
                  rx={3}
                  fill={FEED_COLOR}
                  opacity={0.85}
                />
              )}
              {day.diapers > 0 && (
                <Rect
                  x={diaperX}
                  y={baselineY - diaperH}
                  width={barWidth}
                  height={diaperH}
                  rx={3}
                  fill={DIAPER_COLOR}
                  opacity={0.85}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* X-axis labels */}
        {data.map((day, i) => {
          const x = PAD.left + i * barGroupWidth + barGroupWidth / 2;
          return (
            <SvgText
              key={`xl-${i}`}
              x={x}
              y={VIEWBOX_H - 6}
              fontSize={9}
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
            {val}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

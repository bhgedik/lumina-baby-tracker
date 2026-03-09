// ============================================================
// Sprouty — Habits Chart (7-day grouped bar chart)
// Feeds (sage green) + Diapers (warm blush) per day
// ============================================================

import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import type { HabitsDay } from '../hooks/useChartData';

const VIEWBOX_W = 320;
const VIEWBOX_H = 180;
const PAD = { top: 12, right: 16, bottom: 28, left: 32 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const FEED_COLOR = '#8BA88E';
const DIAPER_COLOR = '#F17C4C';
const GRID_COLOR = '#E8E4DF';
const LABEL_COLOR = '#8A8A8A';

interface HabitsChartProps {
  data: HabitsDay[];
}

export function HabitsChart({ data }: HabitsChartProps) {
  const { maxVal, scaleY, yTicks } = useMemo(() => {
    const allVals = data.flatMap((d) => [d.feeds, d.diapers]);
    const max = Math.max(1, ...allVals);
    const roundedMax = Math.ceil(max / 2) * 2; // round up to even

    const ticks: number[] = [];
    const step = Math.max(1, Math.ceil(roundedMax / 4));
    for (let v = 0; v <= roundedMax; v += step) ticks.push(v);

    return {
      maxVal: roundedMax,
      scaleY: (val: number) => PAD.top + PLOT_H - (val / roundedMax) * PLOT_H,
      yTicks: ticks,
    };
  }, [data]);

  const barGroupWidth = PLOT_W / data.length;
  const barWidth = barGroupWidth * 0.28;
  const barGap = barGroupWidth * 0.06;

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
          const groupX = PAD.left + i * barGroupWidth + barGroupWidth / 2;
          const feedX = groupX - barWidth - barGap / 2;
          const diaperX = groupX + barGap / 2;

          const feedH = maxVal > 0 ? (day.feeds / maxVal) * PLOT_H : 0;
          const diaperH = maxVal > 0 ? (day.diapers / maxVal) * PLOT_H : 0;

          return (
            <React.Fragment key={i}>
              {/* Feed bar */}
              {day.feeds > 0 && (
                <Rect
                  x={feedX}
                  y={PAD.top + PLOT_H - feedH}
                  width={barWidth}
                  height={feedH}
                  rx={3}
                  fill={FEED_COLOR}
                  opacity={0.85}
                />
              )}
              {/* Diaper bar */}
              {day.diapers > 0 && (
                <Rect
                  x={diaperX}
                  y={PAD.top + PLOT_H - diaperH}
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
              y={VIEWBOX_H - 8}
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

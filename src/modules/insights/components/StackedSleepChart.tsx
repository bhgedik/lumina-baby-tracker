// ============================================================
// Lumina — Stacked Sleep Chart
// 7-day stacked bar chart: nap (lighter) + night (darker)
// Proper Y-axis, zero-baseline, proportional bar heights
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import type { StackedSleepDay } from '../hooks/useInsightsChartData';

const VIEWBOX_W = 320;
const VIEWBOX_H = 180;
const PAD = { top: 12, right: 12, bottom: 28, left: 36 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const NIGHT_COLOR = '#A78BBA';
const NAP_COLOR = '#B5CCB8';
const AXIS_COLOR = '#C8C2B8';
const GRID_COLOR = '#EAE6E0';
const LABEL_COLOR = '#8A8A8A';

interface StackedSleepChartProps {
  data: StackedSleepDay[];
  hasData: boolean;
}

export function StackedSleepChart({ data, hasData }: StackedSleepChartProps) {
  if (!hasData) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No sleep data yet</Text>
        <Text style={styles.placeholderSub}>Log sleep to see daily patterns</Text>
      </View>
    );
  }

  const { maxVal, scaleY, yTicks } = useMemo(() => {
    const allVals = data.map((d) => d.napHours + d.nightHours);
    const max = Math.max(1, ...allVals);
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
    <View>
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

          {/* Stacked bars — grounded on baseline */}
          {data.map((day, i) => {
            const x = PAD.left + (i + 0.5) * (PLOT_W / data.length) - barWidth / 2;
            const total = day.napHours + day.nightHours;
            if (total <= 0) return null;

            const nightH = (day.nightHours / maxVal) * PLOT_H;
            const napH = (day.napHours / maxVal) * PLOT_H;
            const totalH = nightH + napH;

            return (
              <React.Fragment key={i}>
                {/* Night sleep (bottom segment) */}
                {day.nightHours > 0 && (
                  <Rect
                    x={x}
                    y={baselineY - nightH}
                    width={barWidth}
                    height={nightH}
                    rx={day.napHours > 0 ? 0 : 3}
                    fill={NIGHT_COLOR}
                    opacity={0.9}
                  />
                )}
                {/* Nap (top segment, stacked above night) */}
                {day.napHours > 0 && (
                  <Rect
                    x={x}
                    y={baselineY - totalH}
                    width={barWidth}
                    height={napH}
                    rx={3}
                    fill={NAP_COLOR}
                    opacity={0.85}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* X-axis labels */}
          {data.map((day, i) => {
            const x = PAD.left + (i + 0.5) * (PLOT_W / data.length);
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
              {val}h
            </SvgText>
          ))}
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: NIGHT_COLOR }]} />
          <Text style={styles.legendLabel}>Night</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: NAP_COLOR }]} />
          <Text style={styles.legendLabel}>Naps</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    aspectRatio: 320 / 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8A8A8A',
  },
  placeholderSub: {
    fontSize: 12,
    color: '#8A8A8A',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '500',
  },
});

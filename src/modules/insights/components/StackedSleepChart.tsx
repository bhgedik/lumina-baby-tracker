// ============================================================
// Sprouty — Stacked Sleep Chart
// 7-day stacked bar chart: nap (lighter) + night (darker)
// Shows total 24h sleep per day
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import type { StackedSleepDay } from '../hooks/useInsightsChartData';

const VIEWBOX_W = 320;
const VIEWBOX_H = 180;
const PAD = { top: 12, right: 16, bottom: 28, left: 32 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const NIGHT_COLOR = '#6B8E6F';  // Darker sage
const NAP_COLOR = '#B5CCB8';    // Lighter sage
const GRID_COLOR = '#E8E4DF';
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

  const barWidth = (PLOT_W / data.length) * 0.55;

  return (
    <View>
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

          {/* Stacked bars */}
          {data.map((day, i) => {
            const x = PAD.left + (i + 0.5) * (PLOT_W / data.length) - barWidth / 2;
            const total = day.napHours + day.nightHours;
            if (total <= 0) return null;

            const totalH = (total / maxVal) * PLOT_H;
            const nightH = (day.nightHours / maxVal) * PLOT_H;
            const napH = (day.napHours / maxVal) * PLOT_H;

            const baseY = PAD.top + PLOT_H;

            return (
              <React.Fragment key={i}>
                {/* Night sleep (bottom) */}
                {day.nightHours > 0 && (
                  <Rect
                    x={x}
                    y={baseY - totalH}
                    width={barWidth}
                    height={nightH}
                    rx={day.napHours > 0 ? 0 : 3}
                    fill={NIGHT_COLOR}
                    opacity={0.9}
                  />
                )}
                {/* Nap (top) */}
                {day.napHours > 0 && (
                  <Rect
                    x={x}
                    y={baseY - napH}
                    width={barWidth}
                    height={napH}
                    rx={3}
                    fill={NAP_COLOR}
                    opacity={0.85}
                  />
                )}
                {/* Round top corners of bottom segment when no nap */}
                {day.nightHours > 0 && day.napHours <= 0 && (
                  <Rect
                    x={x}
                    y={baseY - nightH}
                    width={barWidth}
                    height={nightH}
                    rx={3}
                    fill={NIGHT_COLOR}
                    opacity={0.9}
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

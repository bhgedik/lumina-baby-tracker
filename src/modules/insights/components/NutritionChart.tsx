// ============================================================
// Lumina — Nutrition / Milk Intake Chart
// Bar chart showing daily volume (ml) — 7 days
// Estimated values from breastfeeding shown with disclaimer
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import type { NutritionDay } from '../hooks/useInsightsChartData';

const VIEWBOX_W = 320;
const VIEWBOX_H = 180;
const PAD = { top: 12, right: 16, bottom: 28, left: 40 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const BAR_COLOR = '#B199CE';
const BAR_ESTIMATED_COLOR = '#B5CCB8';
const GRID_COLOR = '#E8E4DF';
const LABEL_COLOR = '#8A8A8A';

interface NutritionChartProps {
  data: NutritionDay[];
  hasData: boolean;
  hasEstimated: boolean;
}

export function NutritionChart({ data, hasData, hasEstimated }: NutritionChartProps) {
  if (!hasData) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No feeding data yet</Text>
        <Text style={styles.placeholderSub}>Log feeds to see daily intake trends</Text>
      </View>
    );
  }

  const { maxVal, scaleY, yTicks } = useMemo(() => {
    const allVals = data.map((d) => d.volumeMl);
    const max = Math.max(100, ...allVals);
    // Round up to nearest 100ml
    const roundedMax = Math.ceil(max / 100) * 100;

    const ticks: number[] = [];
    const step = Math.max(50, Math.ceil(roundedMax / 4 / 50) * 50);
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

          {/* Bars */}
          {data.map((day, i) => {
            const x = PAD.left + (i + 0.5) * (PLOT_W / data.length) - barWidth / 2;
            const barH = maxVal > 0 ? (day.volumeMl / maxVal) * PLOT_H : 0;

            return day.volumeMl > 0 ? (
              <Rect
                key={i}
                x={x}
                y={PAD.top + PLOT_H - barH}
                width={barWidth}
                height={barH}
                rx={3}
                fill={day.isEstimated ? BAR_ESTIMATED_COLOR : BAR_COLOR}
                opacity={0.9}
              />
            ) : null;
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
              x={PAD.left - 4}
              y={scaleY(val) + 3}
              fontSize={8}
              fill={LABEL_COLOR}
              textAnchor="end"
            >
              {val}
            </SvgText>
          ))}

          {/* Y-axis unit */}
          <SvgText
            x={4}
            y={PAD.top + 4}
            fontSize={7}
            fill={LABEL_COLOR}
            textAnchor="start"
          >
            ml
          </SvgText>
        </Svg>
      </View>

      {/* Estimation disclaimer */}
      {hasEstimated && (
        <View style={styles.disclaimer}>
          <View style={[styles.disclaimerDot, { backgroundColor: BAR_ESTIMATED_COLOR }]} />
          <Text style={styles.disclaimerText}>
            Estimated based on average flow. 1 min ≈ 15ml
          </Text>
        </View>
      )}
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
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  disclaimerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#8A8A8A',
    fontStyle: 'italic',
  },
});

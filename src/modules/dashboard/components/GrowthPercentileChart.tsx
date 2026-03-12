// ============================================================
// Lumina — Growth Percentile Chart (line chart)
// Weight percentile over time with P25/P50/P75 reference lines
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import type { GrowthPoint } from '../hooks/useChartData';

const VIEWBOX_W = 320;
const VIEWBOX_H = 180;
const PAD = { top: 12, right: 16, bottom: 28, left: 32 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const LINE_COLOR = '#8BA88E';
const DOT_COLOR = '#8BA88E';
const REF_COLOR = '#D4CFC8';
const REF_LABEL_COLOR = '#B0AAA2';
const GRID_COLOR = '#E8E4DF';
const LABEL_COLOR = '#8A8A8A';

interface GrowthPercentileChartProps {
  data: GrowthPoint[];
  hasData: boolean;
}

export function GrowthPercentileChart({ data, hasData }: GrowthPercentileChartProps) {
  if (!hasData) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No measurements yet</Text>
        <Text style={styles.placeholderSub}>Add a growth measurement to see trends</Text>
      </View>
    );
  }

  const { maxWeeks, scaleX, scaleY, xTicks } = useMemo(() => {
    const maxW = Math.max(4, ...data.map((d) => d.ageWeeks));
    const roundedMax = Math.ceil(maxW / 4) * 4;

    const ticks: number[] = [];
    const step = Math.max(1, Math.ceil(roundedMax / 5));
    for (let v = 0; v <= roundedMax; v += step) ticks.push(v);

    return {
      maxWeeks: roundedMax,
      scaleX: (weeks: number) => PAD.left + (weeks / roundedMax) * PLOT_W,
      scaleY: (pct: number) => PAD.top + PLOT_H - (pct / 100) * PLOT_H,
      xTicks: ticks,
    };
  }, [data]);

  // Build data line path
  const linePath = useMemo(() => {
    if (data.length < 2) return '';
    return data
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.ageWeeks)},${scaleY(p.percentile)}`)
      .join('');
  }, [data, scaleX, scaleY]);

  const refLines = [25, 50, 75];

  return (
    <View style={{ aspectRatio: VIEWBOX_W / VIEWBOX_H }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
        {/* Horizontal grid at reference percentiles */}
        {refLines.map((pct) => (
          <React.Fragment key={`ref-${pct}`}>
            <Line
              x1={PAD.left}
              y1={scaleY(pct)}
              x2={VIEWBOX_W - PAD.right}
              y2={scaleY(pct)}
              stroke={REF_COLOR}
              strokeWidth={0.8}
              strokeDasharray="4,3"
            />
            <SvgText
              x={VIEWBOX_W - PAD.right + 2}
              y={scaleY(pct) + 3}
              fontSize={7}
              fill={REF_LABEL_COLOR}
              textAnchor="start"
            >
              P{pct}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Vertical grid */}
        {xTicks.map((weeks) => (
          <Line
            key={`xg-${weeks}`}
            x1={scaleX(weeks)}
            y1={PAD.top}
            x2={scaleX(weeks)}
            y2={PAD.top + PLOT_H}
            stroke={GRID_COLOR}
            strokeWidth={0.5}
          />
        ))}

        {/* Data line */}
        {linePath && (
          <Path
            d={linePath}
            stroke={LINE_COLOR}
            strokeWidth={2.5}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Data dots */}
        {data.map((p, i) => (
          <Circle
            key={`dot-${i}`}
            cx={scaleX(p.ageWeeks)}
            cy={scaleY(p.percentile)}
            r={4}
            fill={DOT_COLOR}
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
        ))}

        {/* X-axis labels */}
        {xTicks.map((weeks) => (
          <SvgText
            key={`xl-${weeks}`}
            x={scaleX(weeks)}
            y={VIEWBOX_H - 8}
            fontSize={8}
            fill={LABEL_COLOR}
            textAnchor="middle"
          >
            {weeks}w
          </SvgText>
        ))}

        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <SvgText
            key={`yl-${pct}`}
            x={PAD.left - 6}
            y={scaleY(pct) + 3}
            fontSize={8}
            fill={LABEL_COLOR}
            textAnchor="end"
          >
            {pct}
          </SvgText>
        ))}
      </Svg>
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
    color: '#B0AAA2',
    marginTop: 4,
  },
});

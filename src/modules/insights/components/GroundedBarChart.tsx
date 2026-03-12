// ============================================================
// Lumina — Grounded Bar Chart
// Proper SVG bar chart with true zero baseline, Y-axis ticks,
// stacked segments, and bars flush against the X-axis
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

// ── Types ────────────────────────────────────────────────────

export interface BarSegment {
  value: number;
  color: string;
}

export interface BarDay {
  label: string;
  segments: BarSegment[];
}

export interface LegendItem {
  label: string;
  color: string;
}

interface GroundedBarChartProps {
  data: BarDay[];
  /** Unit suffix for Y-axis labels (e.g., "h", "ml"). Empty string for counts. */
  yUnit?: string;
  legend?: LegendItem[];
}

// ── Layout ───────────────────────────────────────────────────

const VIEWBOX_W = 320;
const VIEWBOX_H = 180;
const PAD = { top: 12, right: 12, bottom: 28, left: 32 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const AXIS_COLOR = '#C4C0B8';
const GRID_COLOR = '#C4C0B8';
const LABEL_COLOR = '#5C5C66';

// ── Component ────────────────────────────────────────────────

export function GroundedBarChart({ data, yUnit = '', legend }: GroundedBarChartProps) {
  const { maxVal, yTicks, scaleY } = useMemo(() => {
    const totals = data.map((d) => d.segments.reduce((s, seg) => s + seg.value, 0));
    const max = Math.max(1, ...totals);

    // Pick a clean step: 2, 3, 4, or 5
    const step = max <= 6 ? 2 : max <= 12 ? 3 : max <= 20 ? 5 : 5;
    const roundedMax = Math.ceil(max / step) * step;

    const ticks: number[] = [];
    for (let v = 0; v <= roundedMax; v += step) ticks.push(v);

    return {
      maxVal: roundedMax,
      yTicks: ticks,
      scaleY: (val: number) => PAD.top + PLOT_H - (val / roundedMax) * PLOT_H,
    };
  }, [data]);

  const baselineY = PAD.top + PLOT_H;
  const barGroupWidth = PLOT_W / data.length;
  const barWidth = barGroupWidth * 0.5;

  return (
    <View>
      <View style={{ aspectRatio: VIEWBOX_W / VIEWBOX_H }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
          {/* Horizontal grid lines (skip 0 — that's the baseline) */}
          {yTicks.filter((v) => v > 0).map((val) => (
            <Line
              key={`grid-${val}`}
              x1={PAD.left} y1={scaleY(val)}
              x2={VIEWBOX_W - PAD.right} y2={scaleY(val)}
              stroke={GRID_COLOR}
              strokeWidth={0.75}
              strokeDasharray="4,3"
            />
          ))}

          {/* Baseline (X-axis at 0) — solid */}
          <Line
            x1={PAD.left} y1={baselineY}
            x2={VIEWBOX_W - PAD.right} y2={baselineY}
            stroke={AXIS_COLOR}
            strokeWidth={1}
          />

          {/* Y-axis line */}
          <Line
            x1={PAD.left} y1={PAD.top}
            x2={PAD.left} y2={baselineY}
            stroke={AXIS_COLOR}
            strokeWidth={0.75}
          />

          {/* Stacked bars — flush against baseline, per-corner rounding */}
          {data.map((day, i) => {
            const centerX = PAD.left + (i + 0.5) * barGroupWidth;
            const x = centerX - barWidth / 2;
            const total = day.segments.reduce((s, seg) => s + seg.value, 0);
            if (total <= 0) return null;

            // Build segments bottom-up from baseline
            let currentY = baselineY;
            return (
              <React.Fragment key={i}>
                {day.segments.map((seg, j) => {
                  if (seg.value <= 0) return null;
                  const segH = (seg.value / maxVal) * PLOT_H;
                  currentY -= segH;

                  const isTop = j === day.segments.length - 1 ||
                    day.segments.slice(j + 1).every((s) => s.value <= 0);
                  const isBottom = j === 0 ||
                    day.segments.slice(0, j).every((s) => s.value <= 0);

                  const R = 4; // corner radius for exposed ends
                  const rTop = isTop ? R : 0;
                  const rBot = isBottom ? R : 0;
                  const w = barWidth;
                  const h = segH;
                  const sy = currentY;

                  // SVG path with selective corner rounding
                  const d = [
                    `M ${x + rTop} ${sy}`,
                    rTop > 0
                      ? `Q ${x} ${sy} ${x} ${sy + rTop}`
                      : `L ${x} ${sy}`,
                    `L ${x} ${sy + h - rBot}`,
                    rBot > 0
                      ? `Q ${x} ${sy + h} ${x + rBot} ${sy + h}`
                      : `L ${x} ${sy + h}`,
                    `L ${x + w - rBot} ${sy + h}`,
                    rBot > 0
                      ? `Q ${x + w} ${sy + h} ${x + w} ${sy + h - rBot}`
                      : `L ${x + w} ${sy + h}`,
                    `L ${x + w} ${sy + rTop}`,
                    rTop > 0
                      ? `Q ${x + w} ${sy} ${x + w - rTop} ${sy}`
                      : `L ${x + w} ${sy}`,
                    'Z',
                  ].join(' ');

                  return (
                    <Path
                      key={j}
                      d={d}
                      fill={seg.color}
                      opacity={0.85}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* X-axis day labels */}
          {data.map((day, i) => {
            const x = PAD.left + (i + 0.5) * barGroupWidth;
            return (
              <SvgText
                key={`xl-${i}`}
                x={x} y={VIEWBOX_H - 6}
                fontSize={10} fill={LABEL_COLOR} fontWeight="500"
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
              x={PAD.left - 6} y={scaleY(val) + 3.5}
              fontSize={10} fill={LABEL_COLOR} fontWeight="500"
              textAnchor="end"
            >
              {val}{yUnit}
            </SvgText>
          ))}
        </Svg>
      </View>

      {/* Legend */}
      {legend && legend.length > 0 && (
        <View style={styles.legend}>
          {legend.map((item, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: '#5C5C66',
    fontWeight: '500',
  },
});

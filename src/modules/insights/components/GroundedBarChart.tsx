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
const VIEWBOX_H = 190;
const PAD = { top: 16, right: 12, bottom: 32, left: 46 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const AXIS_COLOR = '#D6D3CD';
const GRID_COLOR = '#E8E5DF';
const LABEL_COLOR = '#9CA3AF';

// ── Nice step calculation ────────────────────────────────────
// Picks a "round" step size that yields 3–5 Y-axis ticks.

function niceStep(rawMax: number): number {
  if (rawMax <= 0) return 1;

  // Target 4 ticks (excluding 0)
  const rawStep = rawMax / 4;

  // Round to a nice number
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let niceMultiplier: number;
  if (normalized <= 1) niceMultiplier = 1;
  else if (normalized <= 2) niceMultiplier = 2;
  else if (normalized <= 2.5) niceMultiplier = 2.5;
  else if (normalized <= 5) niceMultiplier = 5;
  else niceMultiplier = 10;

  return Math.max(1, niceMultiplier * magnitude);
}

// ── Component ────────────────────────────────────────────────

export function GroundedBarChart({ data, yUnit = '', legend }: GroundedBarChartProps) {
  const { maxVal, yTicks, scaleY } = useMemo(() => {
    // Dynamic max from data
    const totals = data.map((d) => d.segments.reduce((s, seg) => s + seg.value, 0));
    const dataMax = Math.max(1, ...totals);

    // Add 12% headroom so tallest bar never touches the top
    const bufferedMax = dataMax * 1.12;

    // Calculate nice step and round up
    const step = niceStep(bufferedMax);
    const roundedMax = Math.ceil(bufferedMax / step) * step;

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

  // Format Y label: no space before unit, compact
  const formatYLabel = (val: number): string => {
    if (yUnit) return `${val}${yUnit}`;
    return `${val}`;
  };

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
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
          ))}

          {/* Baseline (X-axis at 0) — solid, slightly heavier */}
          <Line
            x1={PAD.left} y1={baselineY}
            x2={VIEWBOX_W - PAD.right} y2={baselineY}
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
                x={x} y={VIEWBOX_H - 8}
                fontSize={10} fill={LABEL_COLOR} fontWeight="500"
                textAnchor="middle"
              >
                {day.label}
              </SvgText>
            );
          })}

          {/* Y-axis labels — offset left of plot area, vertically centered on grid */}
          {yTicks.map((val) => (
            <SvgText
              key={`yl-${val}`}
              x={PAD.left - 8}
              y={scaleY(val) + 3.5}
              fontSize={10}
              fill={LABEL_COLOR}
              fontWeight="400"
              textAnchor="end"
            >
              {formatYLabel(val)}
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

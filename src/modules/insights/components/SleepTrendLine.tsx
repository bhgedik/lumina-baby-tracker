// ============================================================
// Lumina — Sleep Trend Line Chart
// Line chart with healthy-range band showing if baby is
// sleeping enough, too little, or exceeding expectations
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Rect, Line, Circle, Path, Defs, LinearGradient, Stop,
  Text as SvgText,
} from 'react-native-svg';

// ── Types ────────────────────────────────────────────────────

export interface TrendDay {
  label: string;
  totalHours: number;
}

interface SleepTrendLineProps {
  data: TrendDay[];
  /** Bottom of the "healthy range" band (hours) */
  healthyMin: number;
  /** Top of the "healthy range" band (hours) */
  healthyMax: number;
  /** Label for the range, e.g. "Recommended: 14-17h" */
  rangeLabel?: string;
}

// ── Layout ───────────────────────────────────────────────────

const VIEWBOX_W = 320;
const VIEWBOX_H = 160;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const LINE_COLOR = '#4A5899';
const DOT_COLOR = '#4A5899';
const DOT_FILL = '#FFFFFF';
const RANGE_COLOR = '#4A5899';
const AXIS_COLOR = '#D4CFC8';
const GRID_COLOR = '#EDE9E3';
const LABEL_COLOR = '#5C5C66';  // Darker for legibility

// ── Component ────────────────────────────────────────────────

export function SleepTrendLine({
  data,
  healthyMin,
  healthyMax,
  rangeLabel,
}: SleepTrendLineProps) {
  const { yMin, yMax, yTicks, scaleY, points, pathD } = useMemo(() => {
    const allVals = data.map((d) => d.totalHours);
    const dataMin = Math.min(...allVals, healthyMin);
    const dataMax = Math.max(...allVals, healthyMax);

    // Add some breathing room
    const rangeMin = Math.floor(dataMin - 1);
    const rangeMax = Math.ceil(dataMax + 1);

    const scale = (val: number) =>
      PAD.top + PLOT_H - ((val - rangeMin) / (rangeMax - rangeMin)) * PLOT_H;

    // Y-axis ticks
    const step = rangeMax - rangeMin <= 8 ? 2 : 3;
    const ticks: number[] = [];
    const tickStart = Math.ceil(rangeMin / step) * step;
    for (let v = tickStart; v <= rangeMax; v += step) ticks.push(v);

    // Data points
    const pts = data.map((d, i) => ({
      x: PAD.left + (i / Math.max(1, data.length - 1)) * PLOT_W,
      y: scale(d.totalHours),
      value: d.totalHours,
    }));

    // SVG path
    const d = pts.length > 0
      ? pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      : '';

    return { yMin: rangeMin, yMax: rangeMax, yTicks: ticks, scaleY: scale, points: pts, pathD: d };
  }, [data, healthyMin, healthyMax]);

  const bandY1 = scaleY(healthyMax);
  const bandY2 = scaleY(healthyMin);
  const bandHeight = bandY2 - bandY1;

  return (
    <View>
      <View style={{ aspectRatio: VIEWBOX_W / VIEWBOX_H }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
          <Defs>
            <LinearGradient id="rangeBand" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={RANGE_COLOR} stopOpacity="0.08" />
              <Stop offset="1" stopColor={RANGE_COLOR} stopOpacity="0.04" />
            </LinearGradient>
          </Defs>

          {/* Horizontal grid lines */}
          {yTicks.map((val) => (
            <React.Fragment key={val}>
              <Line
                x1={PAD.left} y1={scaleY(val)}
                x2={VIEWBOX_W - PAD.right} y2={scaleY(val)}
                stroke={GRID_COLOR}
                strokeWidth={0.5}
                strokeDasharray="3,3"
              />
              <SvgText
                x={PAD.left - 6} y={scaleY(val) + 3.5}
                fontSize={9} fill={LABEL_COLOR} fontWeight="500" textAnchor="end"
              >
                {val} h
              </SvgText>
            </React.Fragment>
          ))}

          {/* Healthy range band */}
          <Rect
            x={PAD.left}
            y={bandY1}
            width={PLOT_W}
            height={Math.max(0, bandHeight)}
            fill="url(#rangeBand)"
            rx={4}
          />
          {/* Band border lines */}
          <Line
            x1={PAD.left} y1={bandY1}
            x2={PAD.left + PLOT_W} y2={bandY1}
            stroke={RANGE_COLOR} strokeWidth={0.5} strokeOpacity={0.25}
            strokeDasharray="4,3"
          />
          <Line
            x1={PAD.left} y1={bandY2}
            x2={PAD.left + PLOT_W} y2={bandY2}
            stroke={RANGE_COLOR} strokeWidth={0.5} strokeOpacity={0.25}
            strokeDasharray="4,3"
          />

          {/* Y-axis */}
          <Line
            x1={PAD.left} y1={PAD.top}
            x2={PAD.left} y2={PAD.top + PLOT_H}
            stroke={AXIS_COLOR} strokeWidth={0.5}
          />

          {/* Baseline */}
          <Line
            x1={PAD.left} y1={PAD.top + PLOT_H}
            x2={VIEWBOX_W - PAD.right} y2={PAD.top + PLOT_H}
            stroke={AXIS_COLOR} strokeWidth={1}
          />

          {/* Data line */}
          {pathD && (
            <Path
              d={pathD}
              stroke={LINE_COLOR}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data dots */}
          {points.map((p, i) => (
            <React.Fragment key={i}>
              <Circle cx={p.x} cy={p.y} r={5} fill={DOT_FILL} />
              <Circle cx={p.x} cy={p.y} r={3.5} fill={DOT_COLOR} />
            </React.Fragment>
          ))}

          {/* X-axis labels */}
          {data.map((day, i) => {
            const x = PAD.left + (i / Math.max(1, data.length - 1)) * PLOT_W;
            return (
              <SvgText
                key={i}
                x={x} y={VIEWBOX_H - 6}
                fontSize={10} fill={LABEL_COLOR} fontWeight="500" textAnchor="middle"
              >
                {day.label}
              </SvgText>
            );
          })}
        </Svg>
      </View>

      {/* Range label */}
      {rangeLabel && (
        <View style={styles.rangeLabelRow}>
          <View style={styles.rangeSwatch} />
          <Text style={styles.rangeLabelText}>{rangeLabel}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rangeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  rangeSwatch: {
    width: 16,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#4A589915',
    borderWidth: 0.5,
    borderColor: '#4A589930',
  },
  rangeLabelText: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '500',
  },
});

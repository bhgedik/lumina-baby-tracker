// ============================================================
// Lumina — Dual-Axis Feed Chart
// Left Y-axis: Bottle volume (ml) as bars
// Right Y-axis: Breast duration (min) as line + dots
// Tap a day for combined tooltip
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Rect, Line, Circle, Polyline, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

// ── Types ────────────────────────────────────────────────────

export interface FeedDayData {
  label: string;
  bottleMl: number;
  breastMin: number;
}

interface DualAxisFeedChartProps {
  data: FeedDayData[];
}

// ── Layout ───────────────────────────────────────────────────

const VIEWBOX_W = 320;
const VIEWBOX_H = 200;
const PAD = { top: 16, right: 36, bottom: 28, left: 36 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

// Colors
const BAR_COLOR = '#D4874E';        // Warm terracotta for bottle bars
const LINE_COLOR = '#7BA3C4';       // Soft dusty blue for breast line
const LINE_DOT_COLOR = '#6690B0';   // Slightly darker for dots
const AXIS_COLOR = '#C4C0B8';
const GRID_COLOR = '#E2DDD4';
const LABEL_COLOR = '#5C5C66';
const LABEL_MUTED = '#9A9590';

// ── Helpers ──────────────────────────────────────────────────

function niceStep(max: number): number {
  if (max <= 30) return 10;
  if (max <= 60) return 15;
  if (max <= 100) return 25;
  if (max <= 200) return 50;
  if (max <= 500) return 100;
  return 100;
}

function buildTicks(max: number): { roundedMax: number; ticks: number[] } {
  const step = niceStep(max);
  const roundedMax = Math.ceil(max / step) * step || step;
  const ticks: number[] = [];
  for (let v = 0; v <= roundedMax; v += step) ticks.push(v);
  return { roundedMax, ticks };
}

// ── Component ────────────────────────────────────────────────

export function DualAxisFeedChart({ data }: DualAxisFeedChartProps) {
  const [activeDay, setActiveDay] = useState<number | null>(null);

  const maxMl = Math.max(1, ...data.map((d) => d.bottleMl));
  const maxMin = Math.max(1, ...data.map((d) => d.breastMin));

  const mlAxis = useMemo(() => buildTicks(maxMl), [maxMl]);
  const minAxis = useMemo(() => buildTicks(maxMin), [maxMin]);

  const barGroupW = PLOT_W / data.length;
  const barW = barGroupW * 0.45;
  const baselineY = PAD.top + PLOT_H;

  const scaleML = useCallback((val: number) => {
    return baselineY - (val / mlAxis.roundedMax) * PLOT_H;
  }, [mlAxis.roundedMax, baselineY]);

  const scaleMin = useCallback((val: number) => {
    return baselineY - (val / minAxis.roundedMax) * PLOT_H;
  }, [minAxis.roundedMax, baselineY]);

  const handleDayPress = useCallback((idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveDay((prev) => (prev === idx ? null : idx));
  }, []);

  // Build line points string
  const linePoints = data.map((d, i) => {
    const x = PAD.left + (i + 0.5) * barGroupW;
    const y = scaleMin(d.breastMin);
    return `${x},${y}`;
  }).join(' ');

  return (
    <View>
      <Pressable onPress={() => setActiveDay(null)}>
        <View style={{ aspectRatio: VIEWBOX_W / VIEWBOX_H }}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
            {/* ── Grid lines (from left axis) ── */}
            {mlAxis.ticks.filter((v) => v > 0).map((val) => (
              <Line
                key={`grid-${val}`}
                x1={PAD.left} y1={scaleML(val)}
                x2={VIEWBOX_W - PAD.right} y2={scaleML(val)}
                stroke={GRID_COLOR} strokeWidth={0.75} strokeDasharray="4,3"
              />
            ))}

            {/* ── Baseline ── */}
            <Line
              x1={PAD.left} y1={baselineY}
              x2={VIEWBOX_W - PAD.right} y2={baselineY}
              stroke={AXIS_COLOR} strokeWidth={1}
            />

            {/* ── Left Y-axis (ml) ── */}
            <Line
              x1={PAD.left} y1={PAD.top}
              x2={PAD.left} y2={baselineY}
              stroke={AXIS_COLOR} strokeWidth={0.75}
            />
            {mlAxis.ticks.map((val) => (
              <SvgText
                key={`yl-${val}`}
                x={PAD.left - 5} y={scaleML(val) + 3.5}
                fontSize={9} fill={BAR_COLOR} fontWeight="600" textAnchor="end"
              >
                {val}
              </SvgText>
            ))}
            <SvgText
              x={PAD.left - 5} y={PAD.top - 4}
              fontSize={7} fill={LABEL_MUTED} fontWeight="500" textAnchor="end"
            >
              ml
            </SvgText>

            {/* ── Right Y-axis (min) ── */}
            <Line
              x1={VIEWBOX_W - PAD.right} y1={PAD.top}
              x2={VIEWBOX_W - PAD.right} y2={baselineY}
              stroke={AXIS_COLOR} strokeWidth={0.75}
            />
            {minAxis.ticks.map((val) => (
              <SvgText
                key={`yr-${val}`}
                x={VIEWBOX_W - PAD.right + 5} y={scaleMin(val) + 3.5}
                fontSize={9} fill={LINE_COLOR} fontWeight="600" textAnchor="start"
              >
                {val}
              </SvgText>
            ))}
            <SvgText
              x={VIEWBOX_W - PAD.right + 5} y={PAD.top - 4}
              fontSize={7} fill={LABEL_MUTED} fontWeight="500" textAnchor="start"
            >
              min
            </SvgText>

            {/* ── Bottle bars ── */}
            {data.map((d, i) => {
              const centerX = PAD.left + (i + 0.5) * barGroupW;
              const x = centerX - barW / 2;
              const barH = (d.bottleMl / mlAxis.roundedMax) * PLOT_H;
              const y = baselineY - barH;
              const isActive = activeDay === i;

              return (
                <Rect
                  key={`bar-${i}`}
                  x={x} y={y} width={barW} height={Math.max(barH, 2)}
                  rx={3}
                  fill={BAR_COLOR}
                  opacity={isActive ? 1 : 0.8}
                  onPress={() => handleDayPress(i)}
                />
              );
            })}

            {/* ── Breast line ── */}
            <Polyline
              points={linePoints}
              fill="none"
              stroke={LINE_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* ── Breast dots ── */}
            {data.map((d, i) => {
              const cx = PAD.left + (i + 0.5) * barGroupW;
              const cy = scaleMin(d.breastMin);
              const isActive = activeDay === i;

              return (
                <Circle
                  key={`dot-${i}`}
                  cx={cx} cy={cy}
                  r={isActive ? 5 : 3.5}
                  fill={isActive ? LINE_DOT_COLOR : LINE_COLOR}
                  stroke="#FFFFFF"
                  strokeWidth={isActive ? 2 : 1.5}
                  onPress={() => handleDayPress(i)}
                />
              );
            })}

            {/* ── X-axis labels ── */}
            {data.map((d, i) => (
              <SvgText
                key={`xl-${i}`}
                x={PAD.left + (i + 0.5) * barGroupW}
                y={VIEWBOX_H - 6}
                fontSize={10}
                fill={activeDay === i ? LABEL_COLOR : LABEL_MUTED}
                fontWeight={activeDay === i ? '700' : '500'}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            ))}
          </Svg>
        </View>
      </Pressable>

      {/* ── Active day tooltip ── */}
      {activeDay !== null && (
        <View style={styles.tooltipBar}>
          <Text style={styles.tooltipDay}>{data[activeDay].label}</Text>
          <View style={styles.tooltipValues}>
            <View style={styles.tooltipItem}>
              <View style={[styles.tooltipSwatch, { backgroundColor: BAR_COLOR }]} />
              <Text style={styles.tooltipText}>{data[activeDay].bottleMl} ml</Text>
            </View>
            <View style={styles.tooltipItem}>
              <View style={[styles.tooltipSwatch, { backgroundColor: LINE_COLOR, borderRadius: 4 }]} />
              <Text style={styles.tooltipText}>{data[activeDay].breastMin} min</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Legend ── */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendBar} />
          <Text style={styles.legendLabel}>Bottle (ml)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendLineWrap}>
            <View style={styles.legendLine} />
            <View style={styles.legendDot} />
          </View>
          <Text style={styles.legendLabel}>Breast (min)</Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  tooltipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C3349',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 8,
    marginHorizontal: 20,
    gap: 12,
  },
  tooltipDay: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tooltipValues: {
    flexDirection: 'row',
    gap: 12,
  },
  tooltipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tooltipSwatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B0B8D0',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBar: {
    width: 12,
    height: 10,
    borderRadius: 2,
    backgroundColor: BAR_COLOR,
    opacity: 0.85,
  },
  legendLineWrap: {
    width: 18,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendLine: {
    width: 18,
    height: 2,
    backgroundColor: LINE_COLOR,
    borderRadius: 1,
  },
  legendDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LINE_DOT_COLOR,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  legendLabel: {
    fontSize: 11,
    color: '#5C5C66',
    fontWeight: '500',
  },
});

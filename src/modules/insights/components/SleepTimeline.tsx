// ============================================================
// Lumina — Sleep Timeline Chart
// Horizontal bars showing WHEN sleep happened each day
// 24h window from 6PM → 6PM, night sleep + naps visible
// Tap any segment for duration tooltip with haptic feedback
// ============================================================

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

// ── Types ────────────────────────────────────────────────────

export interface SleepEvent {
  /** Start hour in 24h format (e.g., 19.5 = 7:30 PM) */
  startHour: number;
  /** End hour in 24h format */
  endHour: number;
  type: 'night' | 'nap';
}

export interface TimelineDay {
  label: string;
  events: SleepEvent[];
}

interface SleepTimelineProps {
  data: TimelineDay[];
}

interface TooltipInfo {
  x: number;       // center X in view coords
  y: number;       // top Y in view coords (above the bar)
  label: string;   // e.g. "1h 15m"
  timeRange: string; // e.g. "1:00 PM – 2:15 PM"
  type: 'night' | 'nap';
}

// ── Layout ───────────────────────────────────────────────────

const VIEWBOX_W = 320;
const VIEWBOX_H = 216;
const PAD = { top: 24, right: 8, bottom: 8, left: 36 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const WINDOW_START = 18; // 6 PM
const WINDOW_HOURS = 24;

const NIGHT_COLOR = '#4A5899';
const NAP_COLOR = '#A2B4E8';
const AXIS_COLOR = '#D4CFC8';
const LABEL_COLOR = '#5C5C66';
const GRID_COLOR = '#C4C0B8';

const MIN_BAR_W = 4; // minimum SVG width for tappability (view overlay handles actual touch)
const MIN_TOUCH_W = 32; // minimum touch target in view pixels

const TIME_MARKS = [
  { hour: 18, label: '6p' },
  { hour: 21, label: '9p' },
  { hour: 24, label: '12a' },
  { hour: 27, label: '3a' },
  { hour: 30, label: '6a' },
  { hour: 33, label: '9a' },
  { hour: 36, label: '12p' },
  { hour: 39, label: '3p' },
];

// ── Helpers ──────────────────────────────────────────────────

function toWindowHour(hour: number): number {
  return hour < WINDOW_START ? hour + 24 : hour;
}

function hourToX(windowHour: number): number {
  const fraction = (windowHour - WINDOW_START) / WINDOW_HOURS;
  return PAD.left + fraction * PLOT_W;
}

/** Format fractional hour to "Xh Ym" */
function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Format fractional 24h hour to "H:MM AM/PM" */
function formatTime(hour24: number): string {
  const h = Math.floor(hour24) % 24;
  const m = Math.round((hour24 - Math.floor(hour24)) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Compute duration in hours between start and end (handling overnight) */
function eventDuration(startHour: number, endHour: number): number {
  const startW = toWindowHour(startHour);
  let endW = toWindowHour(endHour);
  if (endW <= startW) endW = startW + 0.5;
  return endW - startW;
}

// ── Inline label threshold in SVG units ──
// If bar is wider than this, show duration text inside
const INLINE_LABEL_THRESHOLD = 42;

// ── Component ────────────────────────────────────────────────

export function SleepTimeline({ data }: SleepTimelineProps) {
  const rowHeight = PLOT_H / data.length;
  const barHeight = Math.min(rowHeight * 0.55, 18);

  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const containerSize = useRef({ width: 0, height: 0 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    containerSize.current = {
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    };
  }, []);

  /** Convert SVG viewBox coords to actual view coords */
  const svgToView = useCallback((svgX: number, svgY: number) => {
    const { width, height } = containerSize.current;
    return {
      x: (svgX / VIEWBOX_W) * width,
      y: (svgY / VIEWBOX_H) * height,
    };
  }, []);

  const handleSegmentPress = useCallback((event: SleepEvent, barY: number, x1: number, x2: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const duration = eventDuration(event.startHour, event.endHour);
    const centerSvgX = (x1 + x2) / 2;
    const topSvgY = barY;

    const viewPos = svgToView(centerSvgX, topSvgY);

    setTooltip({
      x: viewPos.x,
      y: viewPos.y,
      label: formatDuration(duration),
      timeRange: `${formatTime(event.startHour)} – ${formatTime(event.endHour)}`,
      type: event.type,
    });
  }, [svgToView]);

  const dismissTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <View>
      <Pressable onPress={dismissTooltip}>
        <View onLayout={onLayout} style={{ aspectRatio: VIEWBOX_W / VIEWBOX_H }}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
            {/* Vertical grid lines at time marks */}
            {TIME_MARKS.map((mark) => {
              const x = hourToX(mark.hour);
              return (
                <React.Fragment key={mark.hour}>
                  <Line
                    x1={x} y1={PAD.top} x2={x} y2={PAD.top + PLOT_H}
                    stroke={GRID_COLOR}
                    strokeWidth={0.75}
                  />
                  <SvgText
                    x={x} y={PAD.top - 8}
                    fontSize={10} fill={LABEL_COLOR}
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {mark.label}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* Midnight highlight line */}
            <Line
              x1={hourToX(24)} y1={PAD.top}
              x2={hourToX(24)} y2={PAD.top + PLOT_H}
              stroke={AXIS_COLOR}
              strokeWidth={0.75}
            />

            {/* Horizontal rows for each day */}
            {data.map((day, i) => {
              const rowY = PAD.top + i * rowHeight;
              const barY = rowY + (rowHeight - barHeight) / 2;

              return (
                <React.Fragment key={i}>
                  {/* Row separator */}
                  {i > 0 && (
                    <Line
                      x1={PAD.left} y1={rowY}
                      x2={VIEWBOX_W - PAD.right} y2={rowY}
                      stroke={GRID_COLOR}
                      strokeWidth={0.5}
                    />
                  )}

                  {/* Day label */}
                  <SvgText
                    x={PAD.left - 6}
                    y={barY + barHeight / 2 + 3.5}
                    fontSize={10}
                    fill={LABEL_COLOR}
                    textAnchor="end"
                    fontWeight="500"
                  >
                    {day.label}
                  </SvgText>

                  {/* Sleep event bars */}
                  {day.events.map((event, j) => {
                    const startW = toWindowHour(event.startHour);
                    let endW = toWindowHour(event.endHour);
                    if (endW <= startW) endW = startW + 0.5;

                    const x1 = hourToX(startW);
                    const x2 = hourToX(endW);
                    const barW = Math.max(MIN_BAR_W, x2 - x1);
                    const duration = endW - startW;
                    const showInline = barW > INLINE_LABEL_THRESHOLD;

                    return (
                      <React.Fragment key={j}>
                        <Rect
                          x={x1}
                          y={barY}
                          width={barW}
                          height={barHeight}
                          rx={barHeight / 2}
                          fill={event.type === 'night' ? NIGHT_COLOR : NAP_COLOR}
                          opacity={event.type === 'night' ? 0.85 : 0.75}
                          onPress={() => handleSegmentPress(event, barY, x1, x1 + barW)}
                        />
                        {/* Inline duration label for wide segments */}
                        {showInline && (
                          <SvgText
                            x={x1 + barW / 2}
                            y={barY + barHeight / 2 + 3.5}
                            fontSize={8}
                            fill="#FFFFFF"
                            fontWeight="600"
                            textAnchor="middle"
                            onPress={() => handleSegmentPress(event, barY, x1, x1 + barW)}
                          >
                            {formatDuration(duration)}
                          </SvgText>
                        )}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </Svg>

          {/* Tooltip overlay */}
          {tooltip && (
            <View
              style={[
                styles.tooltip,
                {
                  left: tooltip.x,
                  top: tooltip.y - 48,
                  transform: [{ translateX: -72 }],
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.tooltipDuration}>{tooltip.label}</Text>
              <Text style={styles.tooltipTime}>{tooltip.timeRange}</Text>
              <View
                style={[
                  styles.tooltipArrow,
                  { borderTopColor: tooltip.type === 'night' ? '#2C3349' : '#4A5C8A' },
                ]}
              />
            </View>
          )}
        </View>
      </Pressable>

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
        <Text style={styles.legendHint}>Tap a segment for details</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  legendHint: {
    fontSize: 10,
    color: '#B0ACA6',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  // ── Tooltip ──
  tooltip: {
    position: 'absolute',
    width: 144,
    backgroundColor: '#2C3349',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  tooltipDuration: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  tooltipTime: {
    fontSize: 11,
    fontWeight: '400',
    color: '#B0B8D0',
    marginTop: 2,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

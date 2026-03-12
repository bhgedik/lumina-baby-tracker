// ============================================================
// Lumina — Weekly Pattern Grid (Huckleberry Style)
// Unified 24h × 7-day grid overlaying sleep, feeds, and diapers
// Y-axis: time slots (6AM → 6AM), X-axis: 7 day columns
// Semantic icon badges for feeds/diapers (not abstract dots)
// Smart clustering for overlapping events
// Tap any item for a tooltip with haptic feedback
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ── Types ────────────────────────────────────────────────────

export interface SleepBlock {
  startHour: number;
  endHour: number;
  type: 'night' | 'nap';
}

export interface FeedEvent {
  hour: number;
  type: 'breast' | 'bottle';
  detail?: string;
}

export interface DiaperEvent {
  hour: number;
  type: 'wet' | 'dirty';
}

export interface PatternDay {
  label: string;
  sleep: SleepBlock[];
  feeds: FeedEvent[];
  diapers: DiaperEvent[];
}

interface WeeklyPatternGridProps {
  data: PatternDay[];
}

interface TooltipInfo {
  x: number;
  y: number;
  lines: string[];
  color: string;
}

// ── Layout ───────────────────────────────────────────────────

const VIEWBOX_W = 320;
const VIEWBOX_H = 520;
const PAD = { top: 20, right: 8, bottom: 8, left: 36 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

const WINDOW_START = 6;
const WINDOW_HOURS = 24;

// Colors
const NIGHT_COLOR = '#4A5899';
const NIGHT_COLOR_LIGHT = 'rgba(74, 88, 153, 0.22)';
const NAP_COLOR = '#A2B4E8';
const NAP_COLOR_LIGHT = 'rgba(162, 180, 232, 0.28)';
const BREAST_COLOR = '#E8A87C';
const BREAST_BG = '#FDF2E9';
const BOTTLE_COLOR = '#D4874E';
const BOTTLE_BG = '#FDEBD2';
const WET_COLOR = '#A0927D';
const WET_BG = '#F3EFE8';
const DIRTY_COLOR = '#8B7D68';
const DIRTY_BG = '#EDE8DF';
const GRID_COLOR = '#E8E4DE';
const GRID_COLOR_STRONG = '#D4CFC8';
const LABEL_COLOR = '#5C5C66';

const BADGE_SIZE = 18;
const BADGE_OVERLAP = 6;

// Minimum SVG height for inline duration label
const INLINE_LABEL_MIN_H = 28;

const TIME_MARKS = [
  { hour: 6, label: '6 AM' },
  { hour: 9, label: '9 AM' },
  { hour: 12, label: '12 PM' },
  { hour: 15, label: '3 PM' },
  { hour: 18, label: '6 PM' },
  { hour: 21, label: '9 PM' },
  { hour: 0, label: '12 AM' },
  { hour: 3, label: '3 AM' },
];

// ── Helpers ──────────────────────────────────────────────────

function toWindowHour(hour: number): number {
  return hour < WINDOW_START ? hour + 24 : hour;
}

function hourToY(windowHour: number): number {
  const fraction = (windowHour - WINDOW_START) / WINDOW_HOURS;
  return PAD.top + fraction * PLOT_H;
}

function formatTime12(hour24: number): string {
  const h = Math.floor(hour24) % 24;
  const m = Math.round((hour24 - Math.floor(hour24)) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Short format for inline labels: "10h" or "1.5h" or "45m" */
function formatDurationShort(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  if (m === 30) return `${h}.5h`;
  return `${h}h${m}`;
}

// ── Badge event type for clustering ──
interface BadgeEvent {
  hour: number;
  kind: 'breast' | 'bottle' | 'wet' | 'dirty';
  detail?: string;
  tooltipLines: string[];
  iconColor: string;
  bgColor: string;
}

interface BadgeCluster {
  dayIdx: number;
  svgX: number;
  svgY: number;
  badges: BadgeEvent[];
}

// ── Component ────────────────────────────────────────────────

export function WeeklyPatternGrid({ data }: WeeklyPatternGridProps) {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  // Use STATE (not ref) so layout triggers re-render for badge positioning
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize((prev) => {
      if (prev.width === width && prev.height === height) return prev;
      return { width, height };
    });
  }, []);

  const colWidth = PLOT_W / data.length;

  const showTooltip = useCallback((svgX: number, svgY: number, lines: string[], color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { width, height } = containerSize;
    setTooltip({
      x: (svgX / VIEWBOX_W) * width,
      y: (svgY / VIEWBOX_H) * height,
      lines,
      color,
    });
  }, [containerSize]);

  const dismissTooltip = useCallback(() => setTooltip(null), []);

  // Precompute sleep rects (SVG) and badge clusters (native overlay)
  const { sleepRects, badgeClusters } = useMemo(() => {
    const rects: React.ReactNode[] = [];
    const clusters: BadgeCluster[] = [];

    data.forEach((day, dayIdx) => {
      const colX = PAD.left + dayIdx * colWidth;
      const colCenter = colX + colWidth / 2;
      const barWidth = colWidth * 0.65;
      const barX = colCenter - barWidth / 2;

      // ── Sleep blocks → SVG rects with inline duration labels ──
      day.sleep.forEach((block, j) => {
        const startW = toWindowHour(block.startHour);
        let endW = toWindowHour(block.endHour);
        if (endW <= startW) endW += 24;
        const clampedStart = Math.max(startW, WINDOW_START);
        const clampedEnd = Math.min(endW, WINDOW_START + WINDOW_HOURS);
        if (clampedEnd <= clampedStart) return;

        const y1 = hourToY(clampedStart);
        const y2 = hourToY(clampedEnd);
        const h = y2 - y1;
        const isNight = block.type === 'night';
        const duration = endW - startW;
        const showInlineLabel = h >= INLINE_LABEL_MIN_H;

        rects.push(
          <React.Fragment key={`s-${dayIdx}-${j}`}>
            <Rect
              x={barX}
              y={y1}
              width={barWidth}
              height={h}
              rx={4}
              fill={isNight ? NIGHT_COLOR_LIGHT : NAP_COLOR_LIGHT}
              stroke={isNight ? NIGHT_COLOR : NAP_COLOR}
              strokeWidth={1}
              strokeOpacity={0.4}
              onPress={() => showTooltip(
                colCenter, y1,
                [
                  isNight ? 'Night Sleep' : 'Nap',
                  formatDuration(duration),
                  `${formatTime12(block.startHour)} – ${formatTime12(block.endHour)}`,
                ],
                isNight ? NIGHT_COLOR : NAP_COLOR,
              )}
            />
            {showInlineLabel && (
              <SvgText
                x={colCenter}
                y={y1 + h / 2 + 3}
                fontSize={8}
                fontWeight="700"
                fill={isNight ? NIGHT_COLOR : '#5A6BA8'}
                textAnchor="middle"
                onPress={() => showTooltip(
                  colCenter, y1,
                  [
                    isNight ? 'Night Sleep' : 'Nap',
                    formatDuration(duration),
                    `${formatTime12(block.startHour)} – ${formatTime12(block.endHour)}`,
                  ],
                  isNight ? NIGHT_COLOR : NAP_COLOR,
                )}
              >
                {formatDurationShort(duration)}
              </SvgText>
            )}
          </React.Fragment>
        );
      });

      // ── Collect feed + diaper events, cluster by time proximity ──
      const allEvents: BadgeEvent[] = [];

      day.feeds.forEach((feed) => {
        const wh = toWindowHour(feed.hour);
        if (wh < WINDOW_START || wh >= WINDOW_START + WINDOW_HOURS) return;
        const isBreast = feed.type === 'breast';
        allEvents.push({
          hour: feed.hour,
          kind: feed.type,
          detail: feed.detail,
          tooltipLines: [
            isBreast ? 'Breast Feed' : 'Bottle Feed',
            feed.detail ?? '',
            formatTime12(feed.hour),
          ].filter(Boolean),
          iconColor: isBreast ? BREAST_COLOR : BOTTLE_COLOR,
          bgColor: isBreast ? BREAST_BG : BOTTLE_BG,
        });
      });

      day.diapers.forEach((diaper) => {
        const wh = toWindowHour(diaper.hour);
        if (wh < WINDOW_START || wh >= WINDOW_START + WINDOW_HOURS) return;
        const isWet = diaper.type === 'wet';
        allEvents.push({
          hour: diaper.hour,
          kind: diaper.type,
          tooltipLines: [
            isWet ? 'Wet Diaper' : 'Dirty Diaper',
            formatTime12(diaper.hour),
          ],
          iconColor: isWet ? WET_COLOR : DIRTY_COLOR,
          bgColor: isWet ? WET_BG : DIRTY_BG,
        });
      });

      allEvents.sort((a, b) => toWindowHour(a.hour) - toWindowHour(b.hour));

      let currentCluster: BadgeEvent[] = [];
      let clusterAnchorHour = -999;

      const flushCluster = () => {
        if (currentCluster.length === 0) return;
        const avgHour = currentCluster.reduce((s, e) => s + toWindowHour(e.hour), 0) / currentCluster.length;
        clusters.push({
          dayIdx,
          svgX: colCenter,
          svgY: hourToY(avgHour),
          badges: [...currentCluster],
        });
        currentCluster = [];
      };

      allEvents.forEach((evt) => {
        const wh = toWindowHour(evt.hour);
        if (wh - clusterAnchorHour > 0.5) {
          flushCluster();
          clusterAnchorHour = wh;
        }
        currentCluster.push(evt);
      });
      flushCluster();
    });

    return { sleepRects: rects, badgeClusters: clusters };
  }, [data, colWidth, showTooltip]);

  return (
    <View>
      <Pressable onPress={dismissTooltip}>
        <View onLayout={onLayout} style={{ aspectRatio: VIEWBOX_W / VIEWBOX_H }}>
          {/* SVG layer: grid + sleep blocks */}
          <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
            {data.map((day, i) => {
              const x = PAD.left + (i + 0.5) * colWidth;
              return (
                <SvgText
                  key={`hdr-${i}`}
                  x={x} y={PAD.top - 6}
                  fontSize={10} fill={LABEL_COLOR} fontWeight="600" textAnchor="middle"
                >
                  {day.label}
                </SvgText>
              );
            })}

            {TIME_MARKS.map((mark) => {
              const wh = toWindowHour(mark.hour);
              const y = hourToY(wh);
              const isMajor = mark.hour === 12 || mark.hour === 0 || mark.hour === 18;
              return (
                <React.Fragment key={`tm-${mark.hour}`}>
                  <Line
                    x1={PAD.left} y1={y} x2={VIEWBOX_W - PAD.right} y2={y}
                    stroke={isMajor ? GRID_COLOR_STRONG : GRID_COLOR}
                    strokeWidth={isMajor ? 1 : 0.5}
                  />
                  <SvgText
                    x={PAD.left - 4} y={y + 3.5}
                    fontSize={8} fill={LABEL_COLOR} fontWeight="500" textAnchor="end"
                  >
                    {mark.label}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {data.map((_, i) => {
              if (i === 0) return null;
              const x = PAD.left + i * colWidth;
              return (
                <Line
                  key={`vl-${i}`}
                  x1={x} y1={PAD.top} x2={x} y2={PAD.top + PLOT_H}
                  stroke={GRID_COLOR} strokeWidth={0.5}
                />
              );
            })}

            {sleepRects}
          </Svg>

          {/* Native overlay: icon badges for feeds + diapers */}
          {containerSize.width > 0 && badgeClusters.map((cluster, ci) => {
            const viewX = (cluster.svgX / VIEWBOX_W) * containerSize.width;
            const viewY = (cluster.svgY / VIEWBOX_H) * containerSize.height;
            const count = cluster.badges.length;
            const totalWidth = BADGE_SIZE + (count - 1) * (BADGE_SIZE - BADGE_OVERLAP);

            return (
              <View
                key={`cl-${ci}`}
                style={[
                  styles.clusterContainer,
                  {
                    left: viewX - totalWidth / 2,
                    top: viewY - BADGE_SIZE / 2,
                    zIndex: 10,
                    elevation: 5,
                  },
                ]}
              >
                {cluster.badges.map((badge, bi) => (
                  <Pressable
                    key={bi}
                    style={[
                      styles.badge,
                      {
                        backgroundColor: badge.bgColor,
                        marginLeft: bi > 0 ? -BADGE_OVERLAP : 0,
                        zIndex: count - bi,
                      },
                    ]}
                    onPress={() => showTooltip(
                      cluster.svgX, cluster.svgY,
                      badge.tooltipLines,
                      badge.iconColor,
                    )}
                    hitSlop={4}
                  >
                    <BadgeIcon kind={badge.kind} color={badge.iconColor} />
                  </Pressable>
                ))}
              </View>
            );
          })}

          {/* Tooltip overlay */}
          {tooltip && (
            <View
              style={[
                styles.tooltip,
                {
                  left: tooltip.x,
                  top: tooltip.y - 16,
                  transform: [{ translateX: -72 }, { translateY: -48 }],
                  borderLeftColor: tooltip.color,
                },
              ]}
              pointerEvents="none"
            >
              {tooltip.lines.map((line, i) => (
                <Text
                  key={i}
                  style={i === 0 ? styles.tooltipTitle : styles.tooltipDetail}
                >
                  {line}
                </Text>
              ))}
            </View>
          )}
        </View>
      </Pressable>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendGroup}>
          <View style={[styles.legendSwatch, { backgroundColor: NIGHT_COLOR_LIGHT, borderColor: NIGHT_COLOR }]} />
          <Text style={styles.legendLabel}>Night</Text>
        </View>
        <View style={styles.legendGroup}>
          <View style={[styles.legendSwatch, { backgroundColor: NAP_COLOR_LIGHT, borderColor: NAP_COLOR }]} />
          <Text style={styles.legendLabel}>Nap</Text>
        </View>
        <View style={styles.legendGroup}>
          <View style={[styles.legendBadge, { backgroundColor: BREAST_BG }]}>
            <Feather name="droplet" size={8} color={BREAST_COLOR} />
          </View>
          <Text style={styles.legendLabel}>Breast</Text>
        </View>
        <View style={styles.legendGroup}>
          <View style={[styles.legendBadge, { backgroundColor: BOTTLE_BG }]}>
            <MaterialCommunityIcons name="baby-bottle-outline" size={8} color={BOTTLE_COLOR} />
          </View>
          <Text style={styles.legendLabel}>Bottle</Text>
        </View>
        <View style={styles.legendGroup}>
          <View style={[styles.legendBadge, { backgroundColor: WET_BG }]}>
            <MaterialCommunityIcons name="baby-face-outline" size={8} color={WET_COLOR} />
          </View>
          <Text style={styles.legendLabel}>Diaper</Text>
        </View>
      </View>
      <Text style={styles.legendHint}>Tap any item for details</Text>
    </View>
  );
}

// ── Badge Icon ───────────────────────────────────────────────

function BadgeIcon({ kind, color }: { kind: BadgeEvent['kind']; color: string }) {
  switch (kind) {
    case 'breast':
      return <Feather name="droplet" size={10} color={color} />;
    case 'bottle':
      return <MaterialCommunityIcons name="baby-bottle-outline" size={10} color={color} />;
    case 'wet':
    case 'dirty':
      return <MaterialCommunityIcons name="baby-face-outline" size={10} color={color} />;
  }
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  clusterContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  tooltip: {
    position: 'absolute',
    width: 144,
    backgroundColor: '#2C3349',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  tooltipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tooltipDetail: {
    fontSize: 11,
    fontWeight: '400',
    color: '#B0B8D0',
    marginTop: 1,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  legendGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendSwatch: {
    width: 14,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  legendLabel: {
    fontSize: 10,
    color: '#8A8A8A',
    fontWeight: '500',
  },
  legendHint: {
    fontSize: 10,
    color: '#B0ACA6',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
});

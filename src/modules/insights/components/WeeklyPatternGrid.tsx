// ============================================================
// Lumina — Weekly Pattern Grid (Calendar Block Style)
// Google/Apple Calendar week view with zoom in/out.
// Every event is a distinct rounded rectangle block.
// High-contrast colors, structured layout, zero dots.
// ============================================================

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ── Types ────────────────────────────────────────────────────

export interface SleepBlock {
  startHour: number;
  endHour: number;
  type: 'night' | 'nap';
}

export interface FeedEvent {
  hour: number;
  type: 'breast' | 'bottle' | 'pumping';
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
const PAD = { top: 24, right: 8, bottom: 8, left: 36 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const COL_PAD = 1.5;

const WINDOW_START = 6;
const WINDOW_HOURS = 24;

// ── Zoom levels ─────────────────────────────────────────────

const ZOOM_LEVELS = [
  { label: '1×', viewboxH: 520, scrollable: false },
  { label: '2×', viewboxH: 1040, scrollable: true },
  { label: '3×', viewboxH: 1560, scrollable: true },
];

// ── High-Contrast Colors ────────────────────────────────────

const NIGHT_FILL = '#334177';
const NIGHT_TEXT = '#FFFFFF';
const NAP_FILL = '#B8D4F0';
const NAP_TEXT = '#2A4A78';
const FEED_FILL = '#F2C196';
const FEED_TEXT = '#7A4A1A';
const PUMPING_FILL = '#A78BBA';
const PUMPING_TEXT = '#4A3660';
const DIAPER_FILL = '#A8D5BA';
const DIAPER_TEXT = '#2A5A3A';

const GRID_COLOR = '#E8E4DE';
const GRID_COLOR_STRONG = '#D4CFC8';
const LABEL_COLOR = '#5C5C66';

const MIN_BLOCK_H = 8;
const EVENT_BLOCK_H = 10;

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

function formatDurationShort(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  if (m === 30) return `${h}.5h`;
  return `${h}h${m}`;
}

interface CalBlock {
  y: number;
  h: number;
  fill: string;
  textColor: string;
  label?: string;
  detailLabel?: string;
  tooltipLines: string[];
  tooltipColor: string;
}

// ── Component ────────────────────────────────────────────────

export function WeeklyPatternGrid({ data }: WeeklyPatternGridProps) {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoomIdx, setZoomIdx] = useState(0);
  const prevZoomIdx = useRef(0);

  const zoom = ZOOM_LEVELS[zoomIdx];
  const VIEWBOX_H = zoom.viewboxH;
  const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

  // At higher zoom, show more time marks (every hour at 3×)
  const activeTimeMarks = useMemo(() => {
    if (zoomIdx === 0) return TIME_MARKS;
    // Show every hour at 2×+
    const marks: { hour: number; label: string }[] = [];
    for (let i = 0; i < 24; i++) {
      const hour = (WINDOW_START + i) % 24;
      const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const period = hour >= 12 ? 'PM' : 'AM';
      marks.push({ hour, label: `${h12} ${period}` });
    }
    return marks;
  }, [zoomIdx]);

  const hourToY = useCallback((windowHour: number): number => {
    const fraction = (windowHour - WINDOW_START) / WINDOW_HOURS;
    return PAD.top + fraction * PLOT_H;
  }, [PLOT_H]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const colWidth = PLOT_W / data.length;

  const showTooltip = useCallback((svgX: number, svgY: number, lines: string[], color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTooltip({ x: (svgX / VIEWBOX_W) * containerWidth, y: svgY, lines, color });
  }, [containerWidth]);

  const dismissTooltip = useCallback(() => setTooltip(null), []);

  const handleZoomIn = useCallback(() => {
    setTooltip(null);
    setZoomIdx((prev) => {
      const next = Math.min(prev + 1, ZOOM_LEVELS.length - 1);
      // Reward haptic when details first reveal (entering 2×)
      if (prev === 0 && next >= 1) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.selectionAsync();
      }
      prevZoomIdx.current = next;
      return next;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setTooltip(null);
    setZoomIdx((prev) => {
      const next = Math.max(prev - 1, 0);
      Haptics.selectionAsync();
      prevZoomIdx.current = next;
      return next;
    });
  }, []);

  // The rendered SVG height in points (for ScrollView)
  const svgDisplayHeight = useMemo(() => {
    if (!containerWidth) return 400;
    return (VIEWBOX_H / VIEWBOX_W) * containerWidth;
  }, [containerWidth, VIEWBOX_H]);

  const svgElements = useMemo(() => {
    const elements: React.ReactNode[] = [];

    // Scaled block heights for zoomed view — taller at 2×+ so detail labels fit
    const scaledEventBlockH = EVENT_BLOCK_H * (zoomIdx === 0 ? 1 : zoomIdx === 1 ? 1.8 : 2.4);
    const scaledMinBlockH = MIN_BLOCK_H * (zoomIdx === 0 ? 1 : zoomIdx === 1 ? 1.5 : 2);
    const labelMinH = zoomIdx === 0 ? 20 : 16;
    const fontSize = zoomIdx === 0 ? 7 : zoomIdx === 1 ? 8 : 9;

    data.forEach((day, dayIdx) => {
      const colX = PAD.left + dayIdx * colWidth;
      const blockWidth = colWidth - COL_PAD * 2;
      const blockX = colX + COL_PAD;
      const colCenter = colX + colWidth / 2;

      const blocks: CalBlock[] = [];

      // ── Sleep blocks ──
      day.sleep.forEach((block) => {
        const startW = toWindowHour(block.startHour);
        let endW = toWindowHour(block.endHour);
        if (endW <= startW) endW += 24;
        const clampedStart = Math.max(startW, WINDOW_START);
        const clampedEnd = Math.min(endW, WINDOW_START + WINDOW_HOURS);
        if (clampedEnd <= clampedStart) return;

        const y1 = hourToY(clampedStart);
        const y2 = hourToY(clampedEnd);
        const h = Math.max(y2 - y1, scaledMinBlockH);
        const isNight = block.type === 'night';
        const duration = endW - startW;

        blocks.push({
          y: y1, h,
          fill: isNight ? NIGHT_FILL : NAP_FILL,
          textColor: isNight ? NIGHT_TEXT : NAP_TEXT,
          label: formatDurationShort(duration),
          tooltipLines: [
            isNight ? 'Night Sleep' : 'Nap',
            formatDuration(duration),
            `${formatTime12(block.startHour)} – ${formatTime12(block.endHour)}`,
          ],
          tooltipColor: isNight ? NIGHT_FILL : NAP_FILL,
        });
      });

      // ── Feed blocks ──
      day.feeds.forEach((feed) => {
        const wh = toWindowHour(feed.hour);
        if (wh < WINDOW_START || wh >= WINDOW_START + WINDOW_HOURS) return;
        const y = hourToY(wh);
        const isPumping = feed.type === 'pumping';
        const fillColor = isPumping ? PUMPING_FILL : FEED_FILL;
        const textColor = isPumping ? PUMPING_TEXT : FEED_TEXT;
        const typeLabel = feed.type === 'breast' ? 'Breast' : feed.type === 'pumping' ? 'Pumping' : 'Bottle';

        // Build concise detail label for zoom reveal
        let detailLabel: string | undefined;
        if (feed.detail) {
          detailLabel = feed.detail;
        }

        blocks.push({
          y: y - scaledEventBlockH / 2, h: scaledEventBlockH,
          fill: fillColor, textColor, detailLabel,
          tooltipLines: [
            typeLabel,
            feed.detail ?? '', formatTime12(feed.hour),
          ].filter(Boolean),
          tooltipColor: fillColor,
        });
      });

      // ── Diaper blocks ──
      day.diapers.forEach((diaper) => {
        const wh = toWindowHour(diaper.hour);
        if (wh < WINDOW_START || wh >= WINDOW_START + WINDOW_HOURS) return;
        const y = hourToY(wh);
        blocks.push({
          y: y - scaledEventBlockH / 2, h: scaledEventBlockH,
          fill: DIAPER_FILL, textColor: DIAPER_TEXT,
          detailLabel: diaper.type === 'wet' ? 'Wet' : 'Dirty',
          tooltipLines: [
            diaper.type === 'wet' ? 'Wet' : 'Dirty',
            formatTime12(diaper.hour),
          ],
          tooltipColor: DIAPER_FILL,
        });
      });

      blocks.sort((a, b) => a.y - b.y);

      // Resolve overlaps
      for (let i = 1; i < blocks.length; i++) {
        const prevBottom = blocks[i - 1].y + blocks[i - 1].h + 1;
        if (blocks[i].y < prevBottom) {
          blocks[i].y = prevBottom;
        }
      }

      // Detail labels visible only at 2×+
      const showDetails = zoomIdx >= 1;
      const detailFontSize = zoomIdx === 1 ? 6.5 : 7.5;

      blocks.forEach((block, j) => {
        const showLabel = block.h >= labelMinH && block.label;
        const showDetail = showDetails && block.detailLabel;
        elements.push(
          <React.Fragment key={`b-${dayIdx}-${j}`}>
            <Rect
              x={blockX} y={block.y} width={blockWidth} height={block.h} rx={3}
              fill={block.fill}
              onPress={() => showTooltip(colCenter, block.y, block.tooltipLines, block.tooltipColor)}
            />
            {showLabel && (
              <SvgText
                x={colCenter} y={block.y + block.h / 2 + 3}
                fontSize={fontSize} fontWeight="700"
                fill={block.textColor} textAnchor="middle"
              >
                {block.label}
              </SvgText>
            )}
            {showDetail && !showLabel && (
              <SvgText
                x={colCenter} y={block.y + block.h / 2 + (detailFontSize / 2.5)}
                fontSize={detailFontSize} fontWeight="600"
                fill={block.textColor} textAnchor="middle"
                opacity={zoomIdx >= 2 ? 1 : 0.85}
              >
                {block.detailLabel}
              </SvgText>
            )}
          </React.Fragment>,
        );
      });
    });

    return elements;
  }, [data, colWidth, hourToY, showTooltip, zoomIdx]);

  // ── Day headers (sticky at top, outside ScrollView) ──
  const dayHeaders = useMemo(() => (
    <Svg width="100%" height="20" viewBox={`0 0 ${VIEWBOX_W} 20`}>
      {data.map((day, i) => (
        <SvgText
          key={`hdr-${i}`}
          x={PAD.left + (i + 0.5) * colWidth} y={14}
          fontSize={10} fill={LABEL_COLOR} fontWeight="600" textAnchor="middle"
        >
          {day.label}
        </SvgText>
      ))}
    </Svg>
  ), [data, colWidth]);

  const gridContent = (
    <Svg
      width="100%"
      height={zoom.scrollable ? svgDisplayHeight : '100%'}
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
    >
      {/* Time grid lines */}
      {activeTimeMarks.map((mark) => {
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

      {/* Column dividers */}
      {data.map((_, i) => {
        if (i === 0) return null;
        const x = PAD.left + i * colWidth;
        return (
          <Line key={`vl-${i}`}
            x1={x} y1={PAD.top} x2={x} y2={PAD.top + PLOT_H}
            stroke={GRID_COLOR} strokeWidth={0.5}
          />
        );
      })}

      {/* Event blocks */}
      {svgElements}
    </Svg>
  );

  return (
    <View onLayout={onLayout}>
      {/* Zoom controls */}
      <View style={styles.zoomBar}>
        <Pressable
          style={[styles.zoomBtn, zoomIdx === 0 && styles.zoomBtnDisabled]}
          onPress={handleZoomOut}
          disabled={zoomIdx === 0}
          hitSlop={8}
        >
          <Feather name="minus" size={14} color={zoomIdx === 0 ? '#CCC' : LABEL_COLOR} />
        </Pressable>
        <Text style={styles.zoomLabel}>{zoom.label}</Text>
        <Pressable
          style={[styles.zoomBtn, zoomIdx === ZOOM_LEVELS.length - 1 && styles.zoomBtnDisabled]}
          onPress={handleZoomIn}
          disabled={zoomIdx === ZOOM_LEVELS.length - 1}
          hitSlop={8}
        >
          <Feather name="plus" size={14} color={zoomIdx === ZOOM_LEVELS.length - 1 ? '#CCC' : LABEL_COLOR} />
        </Pressable>
      </View>

      {/* Sticky day headers */}
      {dayHeaders}

      {/* Grid — scrollable when zoomed */}
      <Pressable onPress={dismissTooltip}>
        {zoom.scrollable ? (
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {gridContent}
          </ScrollView>
        ) : (
          <View style={{ aspectRatio: VIEWBOX_W / VIEWBOX_H }}>
            {gridContent}
          </View>
        )}
      </Pressable>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendGroup}>
          <View style={[styles.legendBlock, { backgroundColor: NIGHT_FILL }]} />
          <Text style={styles.legendLabel}>Night</Text>
        </View>
        <View style={styles.legendGroup}>
          <View style={[styles.legendBlock, { backgroundColor: NAP_FILL }]} />
          <Text style={styles.legendLabel}>Nap</Text>
        </View>
        <View style={styles.legendGroup}>
          <View style={[styles.legendBlock, { backgroundColor: FEED_FILL }]} />
          <Text style={styles.legendLabel}>Feed</Text>
        </View>
        <View style={styles.legendGroup}>
          <View style={[styles.legendBlock, { backgroundColor: PUMPING_FILL }]} />
          <Text style={styles.legendLabel}>Pump</Text>
        </View>
        <View style={styles.legendGroup}>
          <View style={[styles.legendBlock, { backgroundColor: DIAPER_FILL }]} />
          <Text style={styles.legendLabel}>Diaper</Text>
        </View>
      </View>
      <Text style={styles.legendHint}>Tap any block for details · Zoom in to reveal metrics</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  zoomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 4,
    paddingRight: 4,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0ECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnDisabled: {
    opacity: 0.5,
  },
  zoomLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C5C66',
    minWidth: 22,
    textAlign: 'center',
  },
  scrollContainer: {
    maxHeight: 480,
    borderRadius: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  legendGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBlock: {
    width: 14,
    height: 10,
    borderRadius: 3,
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

// ============================================================
// Nodd — Calendar & History Screen
// Segmented Daily | Weekly | Monthly views
// Color-coded vertical timeline with weekly summary charts
// ============================================================

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';
import { SleepTrendLine, type TrendDay } from '../../src/modules/insights/components/SleepTrendLine';
import { GroundedBarChart } from '../../src/modules/insights/components/GroundedBarChart';
import { WeeklyPatternGrid, type PatternDay } from '../../src/modules/insights/components/WeeklyPatternGrid';

type ViewMode = 'daily' | 'weekly' | 'monthly';

const SEGMENTS: { key: ViewMode; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

// Color-coded event types
const EVENT_TYPES = {
  feed: { color: '#D4874E', bg: '#FDF2E9', icon: 'droplet' as const, label: 'Feed' },
  sleep: { color: '#6B7DB3', bg: '#EEF0F7', icon: 'moon' as const, label: 'Sleep' },
  diaper: { color: '#A0927D', bg: '#F3EFE8', icon: 'droplet' as const, label: 'Diaper' },
  activity: { color: '#8BA88E', bg: '#EDF3EE', icon: 'smile' as const, label: 'Activity' },
  health: { color: '#C4696B', bg: '#F9EDED', icon: 'thermometer' as const, label: 'Health' },
  growth: { color: '#5E8A72', bg: '#EDF3EE', icon: 'trending-up' as const, label: 'Growth' },
};

// Daily view sample events
const SAMPLE_EVENTS = [
  { id: '1', type: 'feed' as const, time: '8:30 AM', detail: 'Bottle — 120 ml formula' },
  { id: '2', type: 'diaper' as const, time: '9:15 AM', detail: 'Wet diaper' },
  { id: '3', type: 'sleep' as const, time: '10:00 AM', detail: 'Nap — 45 min' },
  { id: '4', type: 'feed' as const, time: '11:30 AM', detail: 'Left breast — 15 min' },
  { id: '5', type: 'diaper' as const, time: '12:00 PM', detail: 'Dirty diaper' },
  { id: '6', type: 'activity' as const, time: '1:00 PM', detail: 'Tummy time — 10 min' },
  { id: '7', type: 'feed' as const, time: '2:30 PM', detail: 'Right breast — 12 min' },
  { id: '8', type: 'sleep' as const, time: '3:00 PM', detail: 'Nap — 1 hr 20 min' },
];

// ── Weekly dummy data ──

const BREAST_COLOR = '#E8A87C';
const FORMULA_COLOR = '#D4874E';
const NIGHT_COLOR = '#4A5899';
const NAP_COLOR = '#A2B4E8';
const WET_COLOR = EVENT_TYPES.diaper.color;
const DIRTY_COLOR = '#C4B8A8';

// Unified weekly pattern data — all events with timestamps
const WEEKLY_PATTERN_DATA: PatternDay[] = [
  {
    label: 'Mon',
    sleep: [
      { startHour: 19.5, endHour: 6, type: 'night' },
      { startHour: 9, endHour: 10.25, type: 'nap' },
      { startHour: 13, endHour: 14.5, type: 'nap' },
      { startHour: 16.5, endHour: 17.25, type: 'nap' },
    ],
    feeds: [
      { hour: 6.5, type: 'breast', detail: '15 min L' },
      { hour: 8.5, type: 'bottle', detail: '120 ml' },
      { hour: 11, type: 'breast', detail: '12 min R' },
      { hour: 14.5, type: 'bottle', detail: '90 ml' },
      { hour: 17.5, type: 'breast', detail: '10 min L' },
      { hour: 19, type: 'bottle', detail: '120 ml' },
      { hour: 23, type: 'breast', detail: '8 min R' },
      { hour: 3, type: 'breast', detail: '10 min L' },
    ],
    diapers: [
      { hour: 6.25, type: 'wet' },
      { hour: 9, type: 'dirty' },
      { hour: 11.5, type: 'wet' },
      { hour: 14, type: 'wet' },
      { hour: 16, type: 'dirty' },
      { hour: 18.5, type: 'wet' },
      { hour: 21, type: 'wet' },
      { hour: 1, type: 'wet' },
      { hour: 4, type: 'dirty' },
    ],
  },
  {
    label: 'Tue',
    sleep: [
      { startHour: 19, endHour: 5.5, type: 'night' },
      { startHour: 8.5, endHour: 9.75, type: 'nap' },
      { startHour: 12.5, endHour: 14.5, type: 'nap' },
      { startHour: 16, endHour: 17, type: 'nap' },
    ],
    feeds: [
      { hour: 6, type: 'breast', detail: '14 min R' },
      { hour: 10, type: 'bottle', detail: '110 ml' },
      { hour: 12, type: 'breast', detail: '12 min L' },
      { hour: 15, type: 'bottle', detail: '100 ml' },
      { hour: 17.5, type: 'breast', detail: '10 min R' },
      { hour: 18.75, type: 'bottle', detail: '130 ml' },
      { hour: 22.5, type: 'breast', detail: '8 min L' },
    ],
    diapers: [
      { hour: 6.5, type: 'wet' },
      { hour: 8, type: 'dirty' },
      { hour: 10.5, type: 'wet' },
      { hour: 13, type: 'wet' },
      { hour: 15.5, type: 'wet' },
      { hour: 17, type: 'dirty' },
      { hour: 20, type: 'wet' },
      { hour: 23, type: 'wet' },
      { hour: 3.5, type: 'wet' },
    ],
  },
  {
    label: 'Wed',
    sleep: [
      { startHour: 20, endHour: 5.5, type: 'night' },
      { startHour: 9, endHour: 10, type: 'nap' },
      { startHour: 13, endHour: 14, type: 'nap' },
      { startHour: 16, endHour: 16.75, type: 'nap' },
    ],
    feeds: [
      { hour: 6, type: 'breast', detail: '15 min L' },
      { hour: 8, type: 'bottle', detail: '100 ml' },
      { hour: 10.5, type: 'breast', detail: '13 min R' },
      { hour: 12.5, type: 'bottle', detail: '110 ml' },
      { hour: 14.5, type: 'breast', detail: '10 min L' },
      { hour: 17, type: 'breast', detail: '12 min R' },
      { hour: 19.5, type: 'bottle', detail: '130 ml' },
      { hour: 23, type: 'breast', detail: '8 min L' },
      { hour: 3, type: 'breast', detail: '10 min R' },
    ],
    diapers: [
      { hour: 7, type: 'wet' },
      { hour: 9.5, type: 'dirty' },
      { hour: 11, type: 'wet' },
      { hour: 14, type: 'dirty' },
      { hour: 16.5, type: 'wet' },
      { hour: 19, type: 'wet' },
      { hour: 22, type: 'dirty' },
      { hour: 2, type: 'wet' },
    ],
  },
  {
    label: 'Thu',
    sleep: [
      { startHour: 19.5, endHour: 6, type: 'night' },
      { startHour: 9.5, endHour: 10.5, type: 'nap' },
      { startHour: 13.5, endHour: 14.5, type: 'nap' },
    ],
    feeds: [
      { hour: 6.5, type: 'breast', detail: '12 min R' },
      { hour: 8.5, type: 'bottle', detail: '120 ml' },
      { hour: 11, type: 'breast', detail: '15 min L' },
      { hour: 15, type: 'bottle', detail: '100 ml' },
      { hour: 17, type: 'breast', detail: '10 min R' },
      { hour: 19, type: 'bottle', detail: '130 ml' },
      { hour: 23.5, type: 'breast', detail: '8 min L' },
      { hour: 3.5, type: 'breast', detail: '10 min R' },
    ],
    diapers: [
      { hour: 6, type: 'wet' },
      { hour: 8, type: 'dirty' },
      { hour: 10, type: 'wet' },
      { hour: 13, type: 'wet' },
      { hour: 15, type: 'wet' },
      { hour: 18, type: 'dirty' },
      { hour: 21, type: 'wet' },
      { hour: 1, type: 'wet' },
    ],
  },
  {
    label: 'Fri',
    sleep: [
      { startHour: 19, endHour: 6.5, type: 'night' },
      { startHour: 9, endHour: 10.5, type: 'nap' },
      { startHour: 13, endHour: 15, type: 'nap' },
      { startHour: 16.5, endHour: 17, type: 'nap' },
    ],
    feeds: [
      { hour: 7, type: 'breast', detail: '14 min L' },
      { hour: 10.75, type: 'bottle', detail: '110 ml' },
      { hour: 12.5, type: 'breast', detail: '12 min R' },
      { hour: 15.5, type: 'bottle', detail: '100 ml' },
      { hour: 17.5, type: 'breast', detail: '10 min L' },
      { hour: 18.75, type: 'bottle', detail: '120 ml' },
      { hour: 22, type: 'breast', detail: '8 min R' },
    ],
    diapers: [
      { hour: 7, type: 'wet' },
      { hour: 9.5, type: 'dirty' },
      { hour: 11, type: 'wet' },
      { hour: 13.5, type: 'wet' },
      { hour: 15, type: 'dirty' },
      { hour: 17, type: 'wet' },
      { hour: 19.5, type: 'wet' },
      { hour: 22, type: 'dirty' },
      { hour: 2, type: 'wet' },
      { hour: 4.5, type: 'wet' },
    ],
  },
  {
    label: 'Sat',
    sleep: [
      { startHour: 19.5, endHour: 6, type: 'night' },
      { startHour: 9.5, endHour: 10.25, type: 'nap' },
      { startHour: 13, endHour: 14.5, type: 'nap' },
    ],
    feeds: [
      { hour: 6.5, type: 'breast', detail: '15 min R' },
      { hour: 8.5, type: 'bottle', detail: '120 ml' },
      { hour: 11, type: 'breast', detail: '12 min L' },
      { hour: 14.75, type: 'bottle', detail: '100 ml' },
      { hour: 17, type: 'breast', detail: '10 min R' },
      { hour: 19, type: 'bottle', detail: '130 ml' },
      { hour: 23, type: 'breast', detail: '8 min L' },
      { hour: 3, type: 'breast', detail: '10 min R' },
    ],
    diapers: [
      { hour: 7, type: 'wet' },
      { hour: 9, type: 'dirty' },
      { hour: 11, type: 'wet' },
      { hour: 14, type: 'wet' },
      { hour: 17, type: 'dirty' },
      { hour: 20, type: 'wet' },
      { hour: 23, type: 'wet' },
      { hour: 3.5, type: 'wet' },
    ],
  },
  {
    label: 'Sun',
    sleep: [
      { startHour: 19, endHour: 6, type: 'night' },
      { startHour: 9, endHour: 10.5, type: 'nap' },
      { startHour: 13, endHour: 14.75, type: 'nap' },
      { startHour: 16.5, endHour: 17.25, type: 'nap' },
    ],
    feeds: [
      { hour: 6.5, type: 'breast', detail: '14 min L' },
      { hour: 8.5, type: 'bottle', detail: '110 ml' },
      { hour: 11, type: 'breast', detail: '12 min R' },
      { hour: 15, type: 'bottle', detail: '100 ml' },
      { hour: 17.5, type: 'breast', detail: '10 min L' },
      { hour: 19, type: 'bottle', detail: '120 ml' },
      { hour: 22.5, type: 'breast', detail: '8 min R' },
      { hour: 3, type: 'breast', detail: '10 min L' },
    ],
    diapers: [
      { hour: 6.5, type: 'wet' },
      { hour: 9, type: 'dirty' },
      { hour: 11.5, type: 'wet' },
      { hour: 14, type: 'wet' },
      { hour: 16, type: 'dirty' },
      { hour: 18.5, type: 'wet' },
      { hour: 21, type: 'wet' },
      { hour: 0.5, type: 'wet' },
      { hour: 4, type: 'dirty' },
    ],
  },
];

// Derived aggregates for metrics
const WEEKLY_SLEEP_AGG = WEEKLY_PATTERN_DATA.map((d) => {
  let nightHrs = 0;
  let napHrs = 0;
  let napCount = 0;
  d.sleep.forEach((s) => {
    let startW = s.startHour < 6 ? s.startHour + 24 : s.startHour;
    let endW = s.endHour < 6 ? s.endHour + 24 : s.endHour;
    if (endW <= startW) endW += 24;
    const dur = endW - startW;
    if (s.type === 'night') nightHrs += dur;
    else { napHrs += dur; napCount++; }
  });
  return { day: d.label, totalHrs: nightHrs + napHrs, nightHrs, napHrs, napCount };
});

const WEEKLY_SLEEP_TREND: TrendDay[] = WEEKLY_SLEEP_AGG.map((d) => ({
  label: d.day,
  totalHours: d.totalHrs,
}));

const WEEKLY_FEEDS_AGG = WEEKLY_PATTERN_DATA.map((d) => {
  const breast = d.feeds.filter((f) => f.type === 'breast').length;
  const bottle = d.feeds.filter((f) => f.type === 'bottle').length;
  return { day: d.label, breast, bottle, total: breast + bottle };
});

const WEEKLY_DIAPERS_AGG = WEEKLY_PATTERN_DATA.map((d) => {
  const wet = d.diapers.filter((dp) => dp.type === 'wet').length;
  const dirty = d.diapers.filter((dp) => dp.type === 'dirty').length;
  return { day: d.label, wet, dirty, total: wet + dirty };
});

// ── Data Grid Cell ──

function DataCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.dataCell}>
      <Text style={styles.dataCellLabel}>{label}</Text>
      <Text style={[styles.dataCellValue, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

// ── Weekly View (Huckleberry-style unified grid) ──

function WeeklyView() {
  // ── Aggregated analytics ──
  const totalSleepWeek = WEEKLY_SLEEP_AGG.reduce((s, d) => s + d.totalHrs, 0);
  const totalNightWeek = WEEKLY_SLEEP_AGG.reduce((s, d) => s + d.nightHrs, 0);
  const totalNapHrsWeek = WEEKLY_SLEEP_AGG.reduce((s, d) => s + d.napHrs, 0);
  const totalNapCountWeek = WEEKLY_SLEEP_AGG.reduce((s, d) => s + d.napCount, 0);
  const avgSleepTotal = totalSleepWeek / 7;
  const avgNight = totalNightWeek / 7;
  const avgNapHrs = totalNapHrsWeek / 7;
  const avgNapCount = (totalNapCountWeek / 7).toFixed(1);
  const avgFeeds = (WEEKLY_FEEDS_AGG.reduce((s, d) => s + d.total, 0) / 7).toFixed(1);
  const avgDiapers = Math.round(WEEKLY_DIAPERS_AGG.reduce((s, d) => s + d.total, 0) / 7);

  const fmtHM = (hrs: number) => {
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <View style={styles.weeklyContainer}>
      {/* ── Lumina Insight Card (TOP — the "So what?") ── */}
      <View style={styles.luminaInsightCard}>
        <View style={styles.luminaInsightHeader}>
          <View style={styles.luminaInsightIcon}>
            <Feather name="message-circle" size={16} color={colors.primary[600]} />
          </View>
          <Text style={styles.luminaInsightTitle}>Lumina's Patterns</Text>
        </View>
        <View style={styles.luminaInsightBody}>
          <View style={styles.insightBullet}>
            <View style={[styles.insightBulletDot, { backgroundColor: NIGHT_COLOR }]} />
            <Text style={styles.insightBulletText}>
              Sleep has been consistent — averaging {fmtHM(avgSleepTotal)} with steady night stretches.
            </Text>
          </View>
          <View style={styles.insightBullet}>
            <View style={[styles.insightBulletDot, { backgroundColor: EVENT_TYPES.feed.color }]} />
            <Text style={styles.insightBulletText}>
              Wednesday had the most feeds ({Math.max(...WEEKLY_FEEDS_AGG.map(d => d.total))}). Consider whether a growth spurt is happening.
            </Text>
          </View>
          <View style={styles.insightBullet}>
            <View style={[styles.insightBulletDot, { backgroundColor: colors.primary[500] }]} />
            <Text style={styles.insightBulletText}>
              Diaper output looks healthy and regular — good hydration signs.
            </Text>
          </View>
        </View>
      </View>

      {/* ── Unified Pattern Grid (Huckleberry-style) ── */}
      <View style={styles.premiumCard}>
        <View style={styles.cardTitleRow}>
          <Feather name="grid" size={16} color={colors.primary[600]} />
          <Text style={styles.cardTitleText}>Weekly Pattern</Text>
        </View>
        <Text style={styles.heroSubtitle}>Sleep, feeds & diapers at a glance</Text>

        <WeeklyPatternGrid data={WEEKLY_PATTERN_DATA} />
      </View>

      {/* ── Quick Stats Row ── */}
      <View style={styles.quickStatsRow}>
        <View style={[styles.quickStatCard, { borderLeftColor: NIGHT_COLOR }]}>
          <Text style={styles.quickStatValue}>{fmtHM(avgSleepTotal)}</Text>
          <Text style={styles.quickStatLabel}>Avg Sleep</Text>
        </View>
        <View style={[styles.quickStatCard, { borderLeftColor: EVENT_TYPES.feed.color }]}>
          <Text style={styles.quickStatValue}>{avgFeeds}</Text>
          <Text style={styles.quickStatLabel}>Avg Feeds</Text>
        </View>
        <View style={[styles.quickStatCard, { borderLeftColor: WET_COLOR }]}>
          <Text style={styles.quickStatValue}>{avgDiapers}</Text>
          <Text style={styles.quickStatLabel}>Avg Diapers</Text>
        </View>
      </View>

      {/* ── Lumina's Analysis ── */}
      <View style={styles.luminaAnalysisCard}>
        <View style={styles.luminaAnalysisHeader}>
          <View style={styles.luminaAnalysisIcon}>
            <Feather name="star" size={14} color={NIGHT_COLOR} />
          </View>
          <Text style={styles.luminaAnalysisTitle}>Lumina's Analysis</Text>
        </View>
        <Text style={styles.luminaAnalysisBody}>
          Ece's pattern is beautifully consistent. Night sleep clusters between 7–8 PM to 5:30–6:30 AM with feeds naturally filling the wake windows. Her naps are well-spaced through the day and diaper output confirms good hydration. A bedtime routine around 7:15 PM is forming — this rhythm leads to longer stretches over the coming weeks.
        </Text>
      </View>

      {/* ── Sleep Trend (Line — shows if baby is sleeping enough) ── */}
      <View style={styles.premiumCard}>
        <View style={styles.cardTitleRow}>
          <Feather name="trending-up" size={16} color={NIGHT_COLOR} />
          <Text style={styles.cardTitleText}>Sleep Trend</Text>
        </View>
        <Text style={styles.heroSubtitle}>Is baby sleeping enough?</Text>

        <SleepTrendLine
          data={WEEKLY_SLEEP_TREND}
          healthyMin={14}
          healthyMax={17}
          rangeLabel="Recommended: 14–17h (0–3 months)"
        />

        <View style={styles.dataGridDivider} />
        <View style={styles.dataGrid}>
          <DataCell label="NIGHT AVG" value={fmtHM(avgNight)} color={NIGHT_COLOR} />
          <DataCell label="NAP AVG" value={fmtHM(avgNapHrs)} color={NAP_COLOR} />
          <DataCell label="NAPS / DAY" value={avgNapCount} />
          <DataCell label="CONSISTENCY" value="Good" color={colors.primary[500]} />
        </View>
      </View>

      {/* ── Feeds Breakdown ── */}
      <View style={styles.premiumCard}>
        <View style={styles.cardTitleRow}>
          <Feather name="droplet" size={16} color={EVENT_TYPES.feed.color} />
          <Text style={styles.cardTitleText}>Feeds Breakdown</Text>
        </View>
        <Text style={styles.heroMetric}>{avgFeeds}</Text>
        <Text style={styles.heroSubtitle}>Avg Sessions / Day</Text>

        <GroundedBarChart
          data={WEEKLY_FEEDS_AGG.map((d) => ({
            label: d.day,
            segments: [
              { value: d.breast, color: BREAST_COLOR },
              { value: d.bottle, color: FORMULA_COLOR },
            ],
          }))}
          legend={[
            { label: 'Breast', color: BREAST_COLOR },
            { label: 'Bottle', color: FORMULA_COLOR },
          ]}
        />

        <View style={styles.dataGridDivider} />
        <View style={styles.dataGrid}>
          <DataCell label="MOST FEEDS" value={`${Math.max(...WEEKLY_FEEDS_AGG.map(d => d.total))}`} />
          <DataCell label="LEAST FEEDS" value={`${Math.min(...WEEKLY_FEEDS_AGG.map(d => d.total))}`} />
        </View>
      </View>

      {/* ── Diapers Breakdown ── */}
      <View style={styles.premiumCard}>
        <View style={styles.cardTitleRow}>
          <MaterialCommunityIcons name="baby-face-outline" size={18} color={WET_COLOR} />
          <Text style={styles.cardTitleText}>Diapers Breakdown</Text>
        </View>
        <Text style={styles.heroMetric}>{avgDiapers}</Text>
        <Text style={styles.heroSubtitle}>Avg Changes / Day</Text>

        <GroundedBarChart
          data={WEEKLY_DIAPERS_AGG.map((d) => ({
            label: d.day,
            segments: [
              { value: d.wet, color: WET_COLOR },
              { value: d.dirty, color: DIRTY_COLOR },
            ],
          }))}
          legend={[
            { label: 'Wet', color: WET_COLOR },
            { label: 'Dirty', color: DIRTY_COLOR },
          ]}
        />
      </View>
    </View>
  );
}

// ── Monthly dummy data ──

const MONTHLY_SLEEP = [
  { week: 'Week 1', avgHrs: 14.3 },
  { week: 'Week 2', avgHrs: 14.6 },
  { week: 'Week 3', avgHrs: 15.1 },
  { week: 'Week 4', avgHrs: 14.8 },
];

const MONTHLY_FEEDS_TREND = [
  { week: 'Week 1', avgBreast: 5.1, avgBottle: 3.1, avgFormulaMl: 265, avgBreastMin: 68 },
  { week: 'Week 2', avgBreast: 4.8, avgBottle: 3.0, avgFormulaMl: 255, avgBreastMin: 62 },
  { week: 'Week 3', avgBreast: 4.5, avgBottle: 3.0, avgFormulaMl: 270, avgBreastMin: 58 },
  { week: 'Week 4', avgBreast: 4.2, avgBottle: 2.9, avgFormulaMl: 280, avgBreastMin: 54 },
];

const MONTHLY_GROWTH = {
  startWeight: 4.2,
  endWeight: 4.8,
  startLength: 53,
  endLength: 55.5,
  startHead: 36.5,
  endHead: 37.8,
};

// Calendar grid: 1 = low activity, 2 = normal, 3 = busy day
const CALENDAR_GRID: (number | null)[][] = [
  [null, null, null, null, null, 2, 3],  // row 1 (starts Sat)
  [2, 3, 2, 2, 1, 3, 2],
  [3, 2, 2, 3, 2, 2, 1],
  [2, 2, 3, 2, 2, 3, 2],
  [3, 2, 1, null, null, null, null],     // row 5 (ends Tue)
];
const CAL_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CAL_COLORS: Record<number, string> = {
  1: colors.primary[100],
  2: colors.primary[300],
  3: colors.primary[500],
};

// ── Monthly View ──

function MonthlyView() {
  const weightGain = (MONTHLY_GROWTH.endWeight - MONTHLY_GROWTH.startWeight).toFixed(1);
  const lengthGain = (MONTHLY_GROWTH.endLength - MONTHLY_GROWTH.startLength).toFixed(1);

  return (
    <View style={styles.weeklyContainer}>
      {/* Month summary cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: EVENT_TYPES.sleep.bg }]}>
          <Feather name="moon" size={16} color={EVENT_TYPES.sleep.color} />
          <Text style={styles.summaryValue}>14.7h</Text>
          <Text style={styles.summaryLabel}>avg sleep</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: EVENT_TYPES.feed.bg }]}>
          <Feather name="droplet" size={16} color={EVENT_TYPES.feed.color} />
          <Text style={styles.summaryValue}>7.7</Text>
          <Text style={styles.summaryLabel}>avg feeds/day</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: EVENT_TYPES.growth.bg }]}>
          <Feather name="trending-up" size={16} color={EVENT_TYPES.growth.color} />
          <Text style={styles.summaryValue}>+{weightGain}kg</Text>
          <Text style={styles.summaryLabel}>weight gain</Text>
        </View>
      </View>

      {/* Activity calendar heatmap */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Feather name="calendar" size={14} color={colors.primary[500]} />
          <Text style={styles.chartTitle}>Activity</Text>
          <Text style={styles.chartUnit}>March 2026</Text>
        </View>
        {/* Day headers */}
        <View style={styles.calRow}>
          {CAL_HEADERS.map((d, i) => (
            <View key={i} style={styles.calCell}>
              <Text style={styles.calHeaderText}>{d}</Text>
            </View>
          ))}
        </View>
        {/* Calendar grid */}
        {CALENDAR_GRID.map((row, ri) => (
          <View key={ri} style={styles.calRow}>
            {row.map((val, ci) => {
              const dayNum = ri * 7 + ci - 4; // offset for starting day
              return (
                <View key={ci} style={styles.calCell}>
                  {val != null ? (
                    <View style={[styles.calDot, { backgroundColor: CAL_COLORS[val] }]}>
                      <Text style={[
                        styles.calDayText,
                        val >= 3 && { color: '#FFF' },
                      ]}>
                        {dayNum > 0 && dayNum <= 31 ? dayNum : ''}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.calEmpty} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
        <View style={styles.chartLegend}>
          <Text style={styles.legendText}>Less</Text>
          {[1, 2, 3].map((v) => (
            <View key={v} style={[styles.calLegendDot, { backgroundColor: CAL_COLORS[v] }]} />
          ))}
          <Text style={styles.legendText}>More</Text>
        </View>
      </View>

      {/* Sleep trend (premium — grounded chart) */}
      <View style={styles.premiumCard}>
        <View style={styles.cardTitleRow}>
          <Feather name="moon" size={16} color={NIGHT_COLOR} />
          <Text style={styles.cardTitleText}>Sleep Trend</Text>
        </View>
        <Text style={styles.heroMetric}>
          {(MONTHLY_SLEEP.reduce((s, d) => s + d.avgHrs, 0) / 4).toFixed(1)}h
        </Text>
        <Text style={styles.heroSubtitle}>Monthly Avg / Night</Text>

        <GroundedBarChart
          data={MONTHLY_SLEEP.map((d) => ({
            label: d.week.replace('Week ', 'W'),
            segments: [{ value: d.avgHrs, color: NIGHT_COLOR }],
          }))}
          yUnit="h"
        />

        <View style={styles.dataGridDivider} />
        <View style={styles.dataGrid}>
          <DataCell label="BEST WEEK" value={`${Math.max(...MONTHLY_SLEEP.map(d => d.avgHrs)).toFixed(1)}h`} color={NIGHT_COLOR} />
          <DataCell label="MONTHLY AVG" value={`${(MONTHLY_SLEEP.reduce((s, d) => s + d.avgHrs, 0) / 4).toFixed(1)}h`} />
        </View>
      </View>

      {/* ── Lumina's Analysis — Monthly Sleep ── */}
      <View style={styles.luminaAnalysisCard}>
        <View style={styles.luminaAnalysisHeader}>
          <View style={styles.luminaAnalysisIcon}>
            <Feather name="star" size={14} color={NIGHT_COLOR} />
          </View>
          <Text style={styles.luminaAnalysisTitle}>Lumina's Analysis</Text>
        </View>
        <Text style={styles.luminaAnalysisBody}>
          Sleep improved steadily through the month — Week 3 was the best at {Math.max(...MONTHLY_SLEEP.map(d => d.avgHrs)).toFixed(1)}h average. Night stretches are getting longer, which means Ece's circadian rhythm is maturing right on schedule. Keep the consistent bedtime routine going!
        </Text>
      </View>

      {/* Feeds trend (premium — grounded chart) */}
      <View style={styles.premiumCard}>
        <View style={styles.cardTitleRow}>
          <Feather name="droplet" size={16} color={EVENT_TYPES.feed.color} />
          <Text style={styles.cardTitleText}>Feeds Trend</Text>
        </View>
        <Text style={styles.heroMetric}>
          {(MONTHLY_FEEDS_TREND.reduce((s, d) => s + d.avgBreast + d.avgBottle, 0) / 4).toFixed(1)}
        </Text>
        <Text style={styles.heroSubtitle}>Avg Sessions / Day</Text>

        <GroundedBarChart
          data={MONTHLY_FEEDS_TREND.map((d) => ({
            label: d.week.replace('Week ', 'W'),
            segments: [
              { value: d.avgBreast, color: BREAST_COLOR },
              { value: d.avgBottle, color: FORMULA_COLOR },
            ],
          }))}
          legend={[
            { label: 'Breast', color: BREAST_COLOR },
            { label: 'Formula', color: FORMULA_COLOR },
          ]}
        />

        <View style={styles.dataGridDivider} />
        <View style={styles.dataGrid}>
          <DataCell label="AVG NURSING" value={`${Math.round(MONTHLY_FEEDS_TREND.reduce((s, d) => s + d.avgBreastMin, 0) / 4)}m/day`} color={BREAST_COLOR} />
          <DataCell label="AVG FORMULA" value={`${Math.round(MONTHLY_FEEDS_TREND.reduce((s, d) => s + d.avgFormulaMl, 0) / 4)}ml/day`} color={FORMULA_COLOR} />
        </View>
      </View>

      {/* ── Lumina's Analysis — Monthly Feeds ── */}
      <View style={styles.luminaAnalysisFeedCard}>
        <View style={styles.luminaAnalysisHeader}>
          <View style={styles.luminaAnalysisFeedIcon}>
            <Feather name="star" size={14} color={EVENT_TYPES.feed.color} />
          </View>
          <Text style={[styles.luminaAnalysisTitle, { color: '#8B5E3C' }]}>Lumina's Analysis</Text>
        </View>
        <Text style={styles.luminaAnalysisBody}>
          Feeds gradually decreased from {(MONTHLY_FEEDS_TREND[0].avgBreast + MONTHLY_FEEDS_TREND[0].avgBottle).toFixed(1)} to {(MONTHLY_FEEDS_TREND[3].avgBreast + MONTHLY_FEEDS_TREND[3].avgBottle).toFixed(1)} sessions/day — this is perfectly normal as Ece grows and takes more per feed. Nursing time is also becoming more efficient, a great sign of a strong latch.
        </Text>
      </View>

      {/* Growth card */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Feather name="trending-up" size={14} color={EVENT_TYPES.growth.color} />
          <Text style={styles.chartTitle}>Growth</Text>
          <Text style={styles.chartUnit}>this month</Text>
        </View>
        <View style={styles.growthGrid}>
          <View style={styles.growthItem}>
            <Text style={styles.growthLabel}>Weight</Text>
            <Text style={styles.growthValue}>
              {MONTHLY_GROWTH.startWeight} → {MONTHLY_GROWTH.endWeight} kg
            </Text>
            <Text style={[styles.growthDelta, { color: EVENT_TYPES.growth.color }]}>
              +{weightGain} kg
            </Text>
          </View>
          <View style={styles.growthDivider} />
          <View style={styles.growthItem}>
            <Text style={styles.growthLabel}>Length</Text>
            <Text style={styles.growthValue}>
              {MONTHLY_GROWTH.startLength} → {MONTHLY_GROWTH.endLength} cm
            </Text>
            <Text style={[styles.growthDelta, { color: EVENT_TYPES.growth.color }]}>
              +{lengthGain} cm
            </Text>
          </View>
          <View style={styles.growthDivider} />
          <View style={styles.growthItem}>
            <Text style={styles.growthLabel}>Head</Text>
            <Text style={styles.growthValue}>
              {MONTHLY_GROWTH.startHead} → {MONTHLY_GROWTH.endHead} cm
            </Text>
            <Text style={[styles.growthDelta, { color: EVENT_TYPES.growth.color }]}>
              +{(MONTHLY_GROWTH.endHead - MONTHLY_GROWTH.startHead).toFixed(1)} cm
            </Text>
          </View>
        </View>
      </View>

      {/* Monthly Insights */}
      <View style={styles.insightsCard}>
        <View style={styles.insightsHeader}>
          <Feather name="zap" size={14} color={colors.primary[500]} />
          <Text style={styles.insightsTitle}>Month in review</Text>
        </View>
        <View style={styles.insightRow}>
          <View style={[styles.insightDot, { backgroundColor: EVENT_TYPES.sleep.color }]} />
          <Text style={styles.insightText}>
            Sleep improved by Week 3 — night stretches got longer. Great progress!
          </Text>
        </View>
        <View style={styles.insightRow}>
          <View style={[styles.insightDot, { backgroundColor: EVENT_TYPES.feed.color }]} />
          <Text style={styles.insightText}>
            Feeds gradually decreased from 8.2 to 7.1/day — normal as baby grows and takes more per feed.
          </Text>
        </View>
        <View style={styles.insightRow}>
          <View style={[styles.insightDot, { backgroundColor: EVENT_TYPES.growth.color }]} />
          <Text style={styles.insightText}>
            Gained {weightGain} kg and {lengthGain} cm — tracking well along the growth curve.
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ──

export default function CalendarScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('daily');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Calendar & History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentRow}>
        {SEGMENTS.map((seg) => (
          <Pressable
            key={seg.key}
            style={[styles.segment, viewMode === seg.key && styles.segmentActive]}
            onPress={() => setViewMode(seg.key)}
          >
            <Text
              style={[styles.segmentText, viewMode === seg.key && styles.segmentTextActive]}
            >
              {seg.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Date label */}
      <View style={styles.dateRow}>
        <Feather name="calendar" size={14} color={colors.textTertiary} />
        <Text style={styles.dateLabel}>
          {viewMode === 'daily'
            ? 'Today'
            : viewMode === 'weekly'
            ? 'Mar 3 – Mar 9'
            : 'March 2026'}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'daily' ? (
          SAMPLE_EVENTS.map((event, index) => {
            const type = EVENT_TYPES[event.type];
            const isLast = index === SAMPLE_EVENTS.length - 1;
            return (
              <View key={event.id} style={styles.timelineRow}>
                <Text style={styles.timelineTime}>{event.time}</Text>
                <View style={styles.timelineDotCol}>
                  <View style={[styles.timelineDot, { backgroundColor: type.color }]} />
                  {!isLast && <View style={styles.timelineLine} />}
                </View>
                <View style={[styles.timelineCard, { backgroundColor: type.bg }]}>
                  <View style={styles.timelineCardHeader}>
                    <Feather name={type.icon} size={14} color={type.color} />
                    <Text style={[styles.timelineCardLabel, { color: type.color }]}>
                      {type.label}
                    </Text>
                  </View>
                  <Text style={styles.timelineCardDetail}>{event.detail}</Text>
                </View>
              </View>
            );
          })
        ) : viewMode === 'weekly' ? (
          <WeeklyView />
        ) : (
          <MonthlyView />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },

  // Segmented Control
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    padding: 3,
    marginBottom: spacing.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  segmentText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },

  // Date
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.base,
  },
  dateLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },

  scrollContent: { paddingHorizontal: spacing.base },

  // Daily Timeline
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 72 },
  timelineTime: {
    width: 64,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    paddingTop: spacing.sm,
    textAlign: 'right',
    marginRight: spacing.md,
  },
  timelineDotCol: { alignItems: 'center', width: 20, marginRight: spacing.md },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: spacing.sm },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.neutral[200], marginTop: spacing.xs },
  timelineCard: { flex: 1, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
  timelineCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  timelineCardLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timelineCardDetail: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },

  // ── Weekly View ──
  weeklyContainer: { gap: spacing.lg },

  // ── Lumina Insight Card (premium, top of weekly) ──
  luminaInsightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.lg,
    shadowColor: '#4A7A5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  luminaInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  luminaInsightIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  luminaInsightTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  luminaInsightBody: {
    gap: spacing.md,
  },
  insightBullet: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  insightBulletDot: {
    width: 6, height: 6, borderRadius: 3,
    marginTop: 6,
  },
  insightBulletText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },

  // ── Lumina's Analysis Card (AI interpretation between charts) ──
  luminaAnalysisCard: {
    backgroundColor: '#EEF0F7',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D8DCE8',
  },
  luminaAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  luminaAnalysisIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D8DCE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  luminaAnalysisTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A5899',
    letterSpacing: 0.2,
  },
  luminaAnalysisBody: {
    fontSize: 14,
    color: '#3A3D52',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  luminaAnalysisFeedCard: {
    backgroundColor: '#FDF2E9',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0DCC8',
  },
  luminaAnalysisFeedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0DCC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  luminaAnalysisDiaperCard: {
    backgroundColor: '#F3EFE8',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2DDD4',
  },
  luminaAnalysisDiaperIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2DDD4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Premium Card (Apple Health / Oura style) ──
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitleText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  heroMetric: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textTertiary,
    marginBottom: 20,
  },

  // ── Legend (used by calendar heatmap) ──
  chartLegend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: 14,
    justifyContent: 'center',
  },
  legendText: { fontSize: 12, fontWeight: '500', color: colors.textTertiary },

  // ── Data Grid ──
  dataGridDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral[200],
    marginTop: 18,
    marginBottom: 16,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dataCell: {
    width: '50%',
    paddingVertical: 8,
  },
  dataCellLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 3,
  },
  dataCellValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },


  // ── Quick Stats Row ──
  quickStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Monthly views reuse ──
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  chartUnit: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },

  // Insights card (monthly view)
  insightsCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 24,
    padding: spacing.lg,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  insightsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  insightRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  insightDot: {
    width: 6, height: 6, borderRadius: 3,
    marginTop: 5,
  },
  insightText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },

  // ── Monthly: Calendar grid ──
  calRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 3,
  },
  calHeaderText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  calDot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  calDayText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  calEmpty: {
    width: 32, height: 32,
  },
  calLegendDot: {
    width: 12, height: 12, borderRadius: 3,
  },

  // ── Monthly: Growth ──
  growthGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  growthItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  growthLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  growthValue: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  growthDelta: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  growthDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: 4,
  },
});

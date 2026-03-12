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
import { SleepTimeline, type TimelineDay } from '../../src/modules/insights/components/SleepTimeline';
import { SleepTrendLine, type TrendDay } from '../../src/modules/insights/components/SleepTrendLine';
import { GroundedBarChart } from '../../src/modules/insights/components/GroundedBarChart';

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

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WEEKLY_SLEEP = [
  { day: 'Mon', totalHrs: 14.5, naps: 4, nightHrs: 10 },
  { day: 'Tue', totalHrs: 15.2, naps: 3, nightHrs: 10.5 },
  { day: 'Wed', totalHrs: 13.8, naps: 4, nightHrs: 9.5 },
  { day: 'Thu', totalHrs: 14.0, naps: 3, nightHrs: 10 },
  { day: 'Fri', totalHrs: 15.5, naps: 4, nightHrs: 11 },
  { day: 'Sat', totalHrs: 14.2, naps: 3, nightHrs: 10 },
  { day: 'Sun', totalHrs: 14.8, naps: 4, nightHrs: 10.5 },
];

// Timeline data — shows WHEN sleep happened each day
const WEEKLY_SLEEP_TIMELINE: TimelineDay[] = [
  { label: 'Mon', events: [
    { startHour: 19.5, endHour: 6, type: 'night' },
    { startHour: 9, endHour: 10.25, type: 'nap' },
    { startHour: 13, endHour: 14.5, type: 'nap' },
    { startHour: 16.5, endHour: 17.25, type: 'nap' },
  ]},
  { label: 'Tue', events: [
    { startHour: 19, endHour: 5.5, type: 'night' },
    { startHour: 8.5, endHour: 9.75, type: 'nap' },
    { startHour: 12.5, endHour: 14.5, type: 'nap' },
    { startHour: 16, endHour: 17, type: 'nap' },
  ]},
  { label: 'Wed', events: [
    { startHour: 20, endHour: 5.5, type: 'night' },
    { startHour: 9, endHour: 10, type: 'nap' },
    { startHour: 13, endHour: 14, type: 'nap' },
    { startHour: 16, endHour: 16.75, type: 'nap' },
  ]},
  { label: 'Thu', events: [
    { startHour: 19.5, endHour: 6, type: 'night' },
    { startHour: 9.5, endHour: 10.5, type: 'nap' },
    { startHour: 13.5, endHour: 14.5, type: 'nap' },
  ]},
  { label: 'Fri', events: [
    { startHour: 19, endHour: 6.5, type: 'night' },
    { startHour: 9, endHour: 10.5, type: 'nap' },
    { startHour: 13, endHour: 15, type: 'nap' },
    { startHour: 16.5, endHour: 17, type: 'nap' },
  ]},
  { label: 'Sat', events: [
    { startHour: 19.5, endHour: 6, type: 'night' },
    { startHour: 9.5, endHour: 10.25, type: 'nap' },
    { startHour: 13, endHour: 14.5, type: 'nap' },
  ]},
  { label: 'Sun', events: [
    { startHour: 19, endHour: 6, type: 'night' },
    { startHour: 9, endHour: 10.5, type: 'nap' },
    { startHour: 13, endHour: 14.75, type: 'nap' },
    { startHour: 16.5, endHour: 17.25, type: 'nap' },
  ]},
];

// Trend data — total hours per day for the line chart
const WEEKLY_SLEEP_TREND: TrendDay[] = WEEKLY_SLEEP.map((d) => ({
  label: d.day,
  totalHours: d.totalHrs,
}));

const WEEKLY_FEEDS = [
  { day: 'Mon', breast: 5, bottle: 3, breastMin: 68, formulaMl: 270 },
  { day: 'Tue', breast: 4, bottle: 3, breastMin: 55, formulaMl: 240 },
  { day: 'Wed', breast: 6, bottle: 3, breastMin: 82, formulaMl: 260 },
  { day: 'Thu', breast: 5, bottle: 3, breastMin: 65, formulaMl: 280 },
  { day: 'Fri', breast: 4, bottle: 3, breastMin: 52, formulaMl: 250 },
  { day: 'Sat', breast: 5, bottle: 3, breastMin: 70, formulaMl: 270 },
  { day: 'Sun', breast: 5, bottle: 3, breastMin: 66, formulaMl: 260 },
];

const BREAST_COLOR = '#E8A87C';
const FORMULA_COLOR = '#D4874E';

// Sleep colors — Apple Health inspired
const NIGHT_COLOR = '#4A5899';
const NAP_COLOR = '#A2B4E8';

// Diaper colors
const WET_COLOR = EVENT_TYPES.diaper.color;
const DIRTY_COLOR = '#C4B8A8';

const WEEKLY_DIAPERS = [
  { day: 'Mon', wet: 6, dirty: 3 },
  { day: 'Tue', wet: 7, dirty: 2 },
  { day: 'Wed', wet: 5, dirty: 3 },
  { day: 'Thu', wet: 6, dirty: 2 },
  { day: 'Fri', wet: 7, dirty: 3 },
  { day: 'Sat', wet: 6, dirty: 2 },
  { day: 'Sun', wet: 6, dirty: 3 },
];

// ── Data Grid Cell ──

function DataCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.dataCell}>
      <Text style={styles.dataCellLabel}>{label}</Text>
      <Text style={[styles.dataCellValue, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

// ── Weekly View (Apple Health / Oura inspired) ──

function WeeklyView() {
  // ── Sleep analytics ──
  const totalSleepWeek = WEEKLY_SLEEP.reduce((s, d) => s + d.totalHrs, 0);
  const totalNightWeek = WEEKLY_SLEEP.reduce((s, d) => s + d.nightHrs, 0);
  const totalNapHrsWeek = WEEKLY_SLEEP.reduce((s, d) => s + (d.totalHrs - d.nightHrs), 0);
  const totalNapCountWeek = WEEKLY_SLEEP.reduce((s, d) => s + d.naps, 0);
  const avgSleepTotal = totalSleepWeek / 7;
  const avgNight = totalNightWeek / 7;
  const avgNapHrs = totalNapHrsWeek / 7;
  const avgNapCount = (totalNapCountWeek / 7).toFixed(1);
  // ── Feeds analytics (sessions only — no mixed units) ──
  const avgBreastMin = Math.round(WEEKLY_FEEDS.reduce((s, d) => s + d.breastMin, 0) / 7);
  const avgFormulaMl = Math.round(WEEKLY_FEEDS.reduce((s, d) => s + d.formulaMl, 0) / 7);

  // Format hours + minutes
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
              Wednesday had the most feeds (9). Consider whether a growth spurt is happening.
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

      {/* ── Sleep Schedule (Timeline — shows WHEN sleep happened) ── */}
      <View style={styles.premiumCard}>
        <View style={styles.cardTitleRow}>
          <Feather name="moon" size={16} color={NIGHT_COLOR} />
          <Text style={styles.cardTitleText}>Sleep Schedule</Text>
        </View>
        <Text style={styles.heroMetric}>{fmtHM(avgSleepTotal)}</Text>
        <Text style={styles.heroSubtitle}>Avg Daily Sleep</Text>

        <SleepTimeline data={WEEKLY_SLEEP_TIMELINE} />

        {/* Metrics Grid — the 4 most useful numbers for a parent */}
        <View style={styles.dataGridDivider} />
        <View style={styles.dataGrid}>
          <DataCell label="AVG BEDTIME" value="7:15 PM" color={NIGHT_COLOR} />
          <DataCell label="AVG NAPS / DAY" value={avgNapCount} color={NAP_COLOR} />
          <DataCell label="AVG NAP LENGTH" value={fmtHM(avgNapHrs / (totalNapCountWeek / 7))} color={NAP_COLOR} />
          <DataCell label="LONGEST STRETCH" value="5h 45m" color={NIGHT_COLOR} />
        </View>
      </View>

      {/* ── Lumina's Analysis (AI interpretation of the sleep data) ── */}
      <View style={styles.luminaAnalysisCard}>
        <View style={styles.luminaAnalysisHeader}>
          <View style={styles.luminaAnalysisIcon}>
            <Feather name="star" size={14} color={NIGHT_COLOR} />
          </View>
          <Text style={styles.luminaAnalysisTitle}>Lumina's Analysis</Text>
        </View>
        <Text style={styles.luminaAnalysisBody}>
          Ece's longest sleep stretch improved to 5h 45m this week. Her night wake-ups correlate with feeding times, meaning she's waking for hunger, not habit. A consistent 7:15 PM bedtime is forming — this is exactly the kind of rhythm that leads to longer stretches over the coming weeks. You're doing great.
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
          <DataCell label="TOTAL NAPS" value={String(totalNapCountWeek)} />
          <DataCell label="CONSISTENCY" value="Good" color={colors.primary[500]} />
        </View>
      </View>

      {/* ── Feeds Card (Premium — proper grounded chart) ── */}
      <View style={styles.premiumCard}>
        <View style={styles.cardTitleRow}>
          <Feather name="droplet" size={16} color={EVENT_TYPES.feed.color} />
          <Text style={styles.cardTitleText}>Feeds</Text>
        </View>
        <Text style={styles.heroMetric}>
          {((WEEKLY_FEEDS.reduce((s, d) => s + d.breast + d.bottle, 0) / 7)).toFixed(1)}
        </Text>
        <Text style={styles.heroSubtitle}>Avg Sessions / Day</Text>

        <GroundedBarChart
          data={WEEKLY_FEEDS.map((d) => ({
            label: d.day,
            segments: [
              { value: d.breast, color: BREAST_COLOR },
              { value: d.bottle, color: FORMULA_COLOR },
            ],
          }))}
          legend={[
            { label: 'Breast', color: BREAST_COLOR },
            { label: 'Formula', color: FORMULA_COLOR },
          ]}
        />

        <View style={styles.dataGridDivider} />
        <View style={styles.dataGrid}>
          <DataCell label="AVG BREAST" value={`${avgBreastMin}m/day`} color={BREAST_COLOR} />
          <DataCell label="AVG FORMULA" value={`${avgFormulaMl}ml/day`} color={FORMULA_COLOR} />
          <DataCell label="MOST FEEDS" value={`${Math.max(...WEEKLY_FEEDS.map(d => d.breast + d.bottle))}`} />
          <DataCell label="LEAST FEEDS" value={`${Math.min(...WEEKLY_FEEDS.map(d => d.breast + d.bottle))}`} />
        </View>
      </View>

      {/* ── Lumina's Analysis — Feeds ── */}
      <View style={styles.luminaAnalysisFeedCard}>
        <View style={styles.luminaAnalysisHeader}>
          <View style={styles.luminaAnalysisFeedIcon}>
            <Feather name="star" size={14} color={EVENT_TYPES.feed.color} />
          </View>
          <Text style={[styles.luminaAnalysisTitle, { color: '#8B5E3C' }]}>Lumina's Analysis</Text>
        </View>
        <Text style={styles.luminaAnalysisBody}>
          Ece is maintaining a steady rhythm of about {((WEEKLY_FEEDS.reduce((s, d) => s + d.breast + d.bottle, 0) / 7)).toFixed(0)} feeding sessions a day. The combination of breast and formula is working beautifully to keep her satisfied and growing. You're doing a great job tracking!
        </Text>
      </View>

      {/* ── Diapers Card (Premium — proper grounded chart) ── */}
      <View style={styles.premiumCard}>
        <View style={styles.cardTitleRow}>
          <MaterialCommunityIcons name="baby-face-outline" size={18} color={WET_COLOR} />
          <Text style={styles.cardTitleText}>Diapers</Text>
        </View>
        <Text style={styles.heroMetric}>
          {Math.round(WEEKLY_DIAPERS.reduce((s, d) => s + d.wet + d.dirty, 0) / 7)}
        </Text>
        <Text style={styles.heroSubtitle}>Avg Changes / Day</Text>

        <GroundedBarChart
          data={WEEKLY_DIAPERS.map((d) => ({
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

      {/* ── Lumina's Analysis — Diapers ── */}
      <View style={styles.luminaAnalysisDiaperCard}>
        <View style={styles.luminaAnalysisHeader}>
          <View style={styles.luminaAnalysisDiaperIcon}>
            <Feather name="star" size={14} color={WET_COLOR} />
          </View>
          <Text style={[styles.luminaAnalysisTitle, { color: '#6B5D4F' }]}>Lumina's Analysis</Text>
        </View>
        <Text style={styles.luminaAnalysisBody}>
          Ece is averaging about {Math.round(WEEKLY_DIAPERS.reduce((s, d) => s + d.wet + d.dirty, 0) / 7)} diaper changes a day with a healthy mix of wet and dirty. This is a fantastic sign that she is well-hydrated and getting plenty of milk. Great job!
        </Text>
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

        <View style={{ height: 40 }} />
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

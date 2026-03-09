// ============================================================
// Sprouty — Calendar & History Screen
// Segmented Daily | Weekly | Monthly views
// Color-coded vertical timeline of logged events
// ============================================================

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';

type ViewMode = 'daily' | 'weekly' | 'monthly';

const SEGMENTS: { key: ViewMode; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

// Color-coded event types
const EVENT_TYPES = {
  feed: { color: '#D4874E', bg: '#FDF2E9', icon: 'coffee' as const, label: 'Feed' },
  sleep: { color: '#6B7DB3', bg: '#EEF0F7', icon: 'moon' as const, label: 'Sleep' },
  diaper: { color: '#A0927D', bg: '#F3EFE8', icon: 'droplet' as const, label: 'Diaper' },
  activity: { color: '#8BA88E', bg: '#EDF3EE', icon: 'smile' as const, label: 'Activity' },
  health: { color: '#C4696B', bg: '#F9EDED', icon: 'thermometer' as const, label: 'Health' },
  growth: { color: '#5E8A72', bg: '#EDF3EE', icon: 'trending-up' as const, label: 'Growth' },
};

// Placeholder timeline events
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
            ? 'This Week'
            : 'This Month'}
        </Text>
      </View>

      {/* Timeline */}
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
                {/* Time column */}
                <Text style={styles.timelineTime}>{event.time}</Text>

                {/* Dot + line */}
                <View style={styles.timelineDotCol}>
                  <View style={[styles.timelineDot, { backgroundColor: type.color }]} />
                  {!isLast && <View style={styles.timelineLine} />}
                </View>

                {/* Event card */}
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
        ) : (
          <View style={styles.placeholderView}>
            <Feather
              name={viewMode === 'weekly' ? 'bar-chart-2' : 'grid'}
              size={48}
              color={colors.neutral[300]}
            />
            <Text style={styles.placeholderTitle}>
              {viewMode === 'weekly' ? 'Weekly Overview' : 'Monthly Overview'}
            </Text>
            <Text style={styles.placeholderText}>
              {viewMode === 'weekly'
                ? 'Charts and patterns for the past 7 days will appear here.'
                : 'A month-at-a-glance calendar with color-coded entries will appear here.'}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
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

  scrollContent: {
    paddingHorizontal: spacing.base,
  },

  // Timeline
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 72,
  },
  timelineTime: {
    width: 64,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    paddingTop: spacing.sm,
    textAlign: 'right',
    marginRight: spacing.md,
  },
  timelineDotCol: {
    alignItems: 'center',
    width: 20,
    marginRight: spacing.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: spacing.sm,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.neutral[200],
    marginTop: spacing.xs,
  },
  timelineCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
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

  // Placeholder
  placeholderView: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  placeholderTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
});

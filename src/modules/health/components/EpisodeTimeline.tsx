// ============================================================
// Lumina — Episode Timeline
// Vertical chronological timeline of health logs within an episode
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants/theme';
import type { HealthLog, IllnessEpisode } from '../types';
import type { HealthLogType } from '../../../shared/types/common';

interface Props {
  episode: IllnessEpisode;
  logs: HealthLog[];
}

const LOG_TYPE_CONFIG: Record<HealthLogType, { icon: string; color: string; label: string }> = {
  temperature: { icon: 'thermometer', color: colors.error, label: 'Temperature' },
  medication: { icon: 'package', color: colors.secondary[500], label: 'Medication' },
  symptom: { icon: 'activity', color: '#FF9800', label: 'Symptoms' },
  doctor_visit: { icon: 'user', color: colors.primary[500], label: 'Doctor Visit' },
  er_visit: { icon: 'alert-circle', color: colors.emergency, label: 'ER Visit' },
  well_child_checkup: { icon: 'clipboard', color: colors.primary[500], label: 'Checkup' },
  other: { icon: 'file-text', color: colors.textTertiary, label: 'Other' },
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getLogSummary(log: HealthLog): string {
  const parts: string[] = [];
  if (log.temperature_celsius != null) {
    parts.push(`${log.temperature_celsius}°C`);
  }
  if (log.symptoms && log.symptoms.length > 0) {
    parts.push(log.symptoms.join(', '));
  }
  if (log.medication_name) {
    parts.push(`${log.medication_name}${log.medication_dose ? ` ${log.medication_dose}` : ''}`);
  }
  if (log.doctor_name) {
    parts.push(`Dr. ${log.doctor_name}`);
  }
  if (log.diagnosis) {
    parts.push(log.diagnosis);
  }
  if (parts.length === 0 && log.notes) {
    parts.push(log.notes);
  }
  return parts.join(' · ');
}

function TimelineEntry({ log, isLast }: { log: HealthLog; isLast: boolean }) {
  const config = LOG_TYPE_CONFIG[log.type] ?? LOG_TYPE_CONFIG.other;
  const summary = getLogSummary(log);

  return (
    <View style={styles.entryRow}>
      {/* Dot + line */}
      <View style={styles.dotColumn}>
        <View style={[styles.dot, { backgroundColor: config.color }]}>
          <Feather name={config.icon as any} size={10} color="#FFF" />
        </View>
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Content */}
      <View style={styles.entryContent}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryType}>{config.label}</Text>
          <Text style={styles.entryTime}>
            {formatDate(log.logged_at)} · {formatTime(log.logged_at)}
          </Text>
        </View>
        {summary ? <Text style={styles.entrySummary}>{summary}</Text> : null}
        {log.notes && log.notes !== summary ? (
          <Text style={styles.entryNotes}>{log.notes}</Text>
        ) : null}
      </View>
    </View>
  );
}

export function EpisodeTimeline({ episode, logs }: Props) {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Feather name="clock" size={32} color={colors.neutral[300]} />
        <Text style={styles.emptyText}>No entries yet</Text>
        <Text style={styles.emptyHint}>Add symptoms, temperatures, or medications to build the timeline</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sorted.map((log, index) => (
        <TimelineEntry key={log.id} log={log} isLast={index === sorted.length - 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: spacing.xs,
  },
  entryRow: {
    flexDirection: 'row',
  },
  dotColumn: {
    alignItems: 'center',
    width: 28,
    marginRight: spacing.sm,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.neutral[200],
    marginVertical: 2,
  },
  entryContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  entryType: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  entryTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  entrySummary: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  entryNotes: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  emptyHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    maxWidth: 260,
  },
});

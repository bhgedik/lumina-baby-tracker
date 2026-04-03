// ============================================================
// Nodd — Episode Detail Screen
// Full timeline view for an illness episode with resolve action
// Claymorphism design — soft clay cards, inner light borders
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../../src/shared/constants/theme';
import { EpisodeTimeline } from '../../../../src/modules/health/components/EpisodeTimeline';
import { InsightToast } from '../../../../src/shared/components/InsightToast';
import { useHealthStore } from '../../../../src/stores/healthStore';

// ── Claymorphism tokens ─────────────────────────────────────

const CLAY_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 6,
};

const CLAY_INNER = {
  borderTopWidth: 2,
  borderLeftWidth: 1.5,
  borderTopColor: 'rgba(255,255,255,0.9)',
  borderLeftColor: 'rgba(255,255,255,0.6)',
  borderBottomWidth: 1.5,
  borderRightWidth: 1,
  borderBottomColor: 'rgba(0,0,0,0.04)',
  borderRightColor: 'rgba(0,0,0,0.02)',
};

const CLAY_PRESSED = {
  transform: [{ scale: 0.98 }] as any,
  shadowOpacity: 0.04,
};

export default function EpisodeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const episodes = useHealthStore((s) => s.episodes);
  const healthLogs = useHealthStore((s) => s.healthLogs);
  const resolveEpisode = useHealthStore((s) => s.resolveEpisode);

  const episode = useMemo(
    () => episodes.find((ep) => ep.id === id),
    [episodes, id],
  );

  const logs = useMemo(
    () => healthLogs.filter((log) => log.episode_id === id),
    [healthLogs, id],
  );

  const handleResolve = useCallback(() => {
    Alert.alert(
      'Resolve Episode',
      'Mark this illness episode as resolved? You can still view it in the Resolved section.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: () => {
            if (id) resolveEpisode(id);
            setToastMsg('Episode resolved');
            setShowToast(true);
            setTimeout(() => router.back(), 1500);
          },
        },
      ],
    );
  }, [id, resolveEpisode, router]);

  const headerLeft = useCallback(
    () => (
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
        <Feather name="chevron-left" size={26} color={colors.primary[600]} />
        <Text style={styles.backLabel}>Health</Text>
      </Pressable>
    ),
    [router],
  );

  if (!episode) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Episode', headerLeft }} />
        <View style={styles.emptyState}>
          <Feather name="alert-circle" size={40} color={colors.neutral[300]} />
          <Text style={styles.emptyText}>Episode not found</Text>
        </View>
      </View>
    );
  }

  const isActive = episode.status === 'active';
  const startDate = new Date(episode.started_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: episode.title,
          headerTintColor: colors.primary[600],
          headerLeft,
          headerStyle: { backgroundColor: '#F7F4F0' },
          headerTitleStyle: {
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            color: colors.textPrimary,
          },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Episode Header */}
        <View style={[styles.headerCard, CLAY_SHADOW]}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle}>{episode.title}</Text>
              <Text style={styles.headerDate}>Started {startDate}</Text>
            </View>
            <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.resolvedBadge]}>
              <Text style={[styles.statusBadgeText, isActive ? styles.activeText : styles.resolvedText]}>
                {isActive ? 'Active' : 'Resolved'}
              </Text>
            </View>
          </View>

          {episode.primary_symptoms.length > 0 && (
            <View style={styles.chipRow}>
              {episode.primary_symptoms.map((s) => (
                <View key={s} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {episode.diagnosis && (
            <View style={styles.diagnosisRow}>
              <Feather name="clipboard" size={14} color={colors.primary[500]} />
              <Text style={styles.diagnosisText}>Diagnosis: {episode.diagnosis}</Text>
            </View>
          )}

          {episode.notes && (
            <Text style={styles.notes}>{episode.notes}</Text>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <EpisodeTimeline episode={episode} logs={logs} />
        </View>

        {/* Resolve button */}
        {isActive && (
          <Pressable style={({ pressed }) => [styles.resolveButton, pressed && CLAY_PRESSED]} onPress={handleResolve}>
            <Feather name="check-circle" size={18} color={colors.primary[600]} />
            <Text style={styles.resolveText}>Mark as Resolved</Text>
          </Pressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <InsightToast
        visible={showToast}
        title="Updated!"
        body={toastMsg}
        severity="info"
        onDismiss={() => setShowToast(false)}
        autoDismissMs={3000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4F0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  backLabel: {
    fontSize: typography.fontSize.md,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
  },

  // Header card
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...CLAY_INNER,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerTitleCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2A26',
  },
  headerDate: {
    fontSize: 13,
    color: '#8A8A8A',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  activeBadge: {
    backgroundColor: colors.secondary[50],
  },
  resolvedBadge: {
    backgroundColor: colors.primary[50],
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeText: {
    color: colors.secondary[600],
  },
  resolvedText: {
    color: colors.primary[600],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    color: colors.secondary[600],
  },
  diagnosisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  diagnosisText: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '700',
  },
  notes: {
    fontSize: 13,
    color: '#8A8A8A',
    fontStyle: 'italic',
  },

  // Timeline
  timelineSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8A9F',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },

  // Resolve
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: spacing.base,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  resolveText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary[600],
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 13,
    color: '#8A8A8A',
  },
});

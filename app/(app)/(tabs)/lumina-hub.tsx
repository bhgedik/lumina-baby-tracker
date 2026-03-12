// ============================================================
// Nodd — Lumina Hub
// Persistent AI consultations + active care plans
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ChatSheet } from '../../../src/modules/insights/components/ChatSheet';
import { useDashboardData } from '../../../src/modules/dashboard/hooks/useDashboardData';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useLuminaThreadStore } from '../../../src/stores/luminaThreadStore';
import { timeAgo } from '../../../src/shared/utils/dateTime';

// ── Design tokens (same pattern as daily.tsx) ────────────────
const UI = {
  bg: '#F7F4F0',
  card: '#FFFFFF',
  text: '#3D3D3D',
  textSecondary: '#5C5C5C',
  textMuted: '#8A8A8A',
  textLight: '#B0AAA2',
  accent: '#8BA88E',
  accentLight: '#EDF3EE',
  accentDark: '#5E8A72',
};

const SOFT_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
};

export default function LuminaHubScreen() {
  const { babyName, babyAge, feedingMethod } = useDashboardData();
  const activeBaby = useBabyStore((s) => s.getActiveBaby());
  const isPregnant = activeBaby?.is_pregnant ?? false;

  const threads = useLuminaThreadStore((s) => s.threads);
  const deleteThread = useLuminaThreadStore((s) => s.deleteThread);

  const recentThreads = useMemo(
    () => threads.filter((t) => !t.isCarePlan).sort((a, b) => b.updatedAt - a.updatedAt),
    [threads],
  );
  const carePlans = useMemo(
    () => threads.filter((t) => t.isCarePlan).sort((a, b) => b.updatedAt - a.updatedAt),
    [threads],
  );

  const [showChat, setShowChat] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const displayName = babyName || 'Baby';
  const babyAgeDays = babyAge?.days ?? null;

  const handleNewConsultation = useCallback(() => {
    setActiveThreadId(null);
    setShowChat(true);
  }, []);

  const handleOpenThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
    setShowChat(true);
  }, []);

  const handleDeleteThread = useCallback((threadId: string, title: string) => {
    Alert.alert(
      'Delete Consultation',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteThread(threadId),
        },
      ],
    );
  }, [deleteThread]);

  const handleThreadCreated = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lumina</Text>
          <Text style={styles.headerSubtitle}>
            Your AI parenting companion
          </Text>
        </View>

        {/* ── Active Care Plans ── */}
        {carePlans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACTIVE CARE PLANS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carePlanScroll}
            >
              {carePlans.map((plan) => {
                const meta = plan.carePlanMeta;
                const progress = meta
                  ? meta.currentDay / meta.totalDays
                  : 0;
                return (
                  <Pressable
                    key={plan.id}
                    style={styles.carePlanCard}
                    onPress={() => handleOpenThread(plan.id)}
                  >
                    <View style={styles.carePlanIconWrap}>
                      <Feather name="clipboard" size={18} color={UI.accent} />
                    </View>
                    <Text style={styles.carePlanTitle} numberOfLines={2}>
                      {plan.title}
                    </Text>
                    {meta && (
                      <>
                        <Text style={styles.carePlanProgress}>
                          Day {meta.currentDay} of {meta.totalDays}
                        </Text>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${Math.min(progress * 100, 100)}%` },
                            ]}
                          />
                        </View>
                      </>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── New Consultation ── */}
        <Pressable
          style={styles.newConsultationCard}
          onPress={handleNewConsultation}
        >
          <View style={styles.newConsultationIcon}>
            <Feather name="plus" size={24} color={UI.accentDark} />
          </View>
          <View style={styles.newConsultationText}>
            <Text style={styles.newConsultationTitle}>
              Start New Consultation
            </Text>
            <Text style={styles.newConsultationSubtitle}>
              Ask Lumina about sleep, feeding, health, or anything on your mind
            </Text>
          </View>
          <Pressable
            style={styles.consultationMicButton}
            onPress={handleNewConsultation}
            hitSlop={12}
            accessibilityLabel="Voice input"
            accessibilityHint="Start a consultation with your voice"
          >
            <Feather name="mic" size={18} color={UI.accentDark} />
          </Pressable>
        </Pressable>

        {/* ── Recent Consultations ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT CONSULTATIONS</Text>

          {recentThreads.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={32} color={UI.textLight} />
              <Text style={styles.emptyText}>
                Your conversations with Lumina will appear here
              </Text>
            </View>
          ) : (
            recentThreads.map((thread) => (
              <Pressable
                key={thread.id}
                style={styles.threadRow}
                onPress={() => handleOpenThread(thread.id)}
              >
                <View style={styles.threadContent}>
                  <Text style={styles.threadTitle} numberOfLines={1}>
                    {thread.title}
                  </Text>
                  <Text style={styles.threadPreview} numberOfLines={1}>
                    {thread.preview}
                  </Text>
                </View>
                <View style={styles.threadRight}>
                  <Text style={styles.threadTime}>
                    {timeAgo(new Date(thread.updatedAt))}
                  </Text>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteThread(thread.id, thread.title)}
                    hitSlop={8}
                    accessibilityLabel="Delete consultation"
                  >
                    <Feather name="trash-2" size={16} color={UI.textLight} />
                  </Pressable>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <ChatSheet
        visible={showChat}
        onClose={() => setShowChat(false)}
        insight={null}
        babyName={babyName}
        babyAgeDays={babyAgeDays}
        feedingMethod={feedingMethod}
        isPregnant={isPregnant}
        mode="persistent"
        threadId={activeThreadId}
        onThreadCreated={handleThreadCreated}
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  // ── Header ──
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: UI.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: UI.textSecondary,
    marginTop: 4,
  },

  // ── Sections ──
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: UI.textMuted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  // ── Care Plan Cards ──
  carePlanScroll: {
    gap: 12,
  },
  carePlanCard: {
    width: 280,
    backgroundColor: UI.card,
    borderRadius: 20,
    padding: 16,
    ...SOFT_SHADOW,
  },
  carePlanIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UI.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  carePlanTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: UI.text,
    marginBottom: 6,
  },
  carePlanProgress: {
    fontSize: 13,
    fontWeight: '400',
    color: UI.textMuted,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8E4DF',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: UI.accent,
  },

  // ── New Consultation ──
  newConsultationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.accentLight,
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
    gap: 14,
    borderWidth: 1,
    borderColor: UI.accent + '30',
    ...SOFT_SHADOW,
  },
  newConsultationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: UI.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: UI.accent + '30',
  },
  newConsultationText: {
    flex: 1,
  },
  newConsultationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: UI.accentDark,
  },
  newConsultationSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: UI.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  consultationMicButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UI.card,
    borderWidth: 1,
    borderColor: UI.accent + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Thread Rows ──
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E4DF',
    gap: 12,
  },
  threadContent: {
    flex: 1,
    gap: 3,
  },
  threadTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: UI.text,
  },
  threadPreview: {
    fontSize: 14,
    fontWeight: '400',
    color: UI.textMuted,
  },
  threadRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  threadTime: {
    fontSize: 12,
    fontWeight: '400',
    color: UI.textLight,
  },
  deleteButton: {
    padding: 4,
  },

  // ── Empty State ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: UI.textMuted,
    textAlign: 'center',
  },
});

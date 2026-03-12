// ============================================================
// Lumina — Nurse Says Data Hook
// Provides veteran nurse reference cards + daily nurse insight
// for the dedicated Nurse Says tab
// ============================================================

import { useMemo } from 'react';
import { useBabyStore } from '../../../stores/babyStore';
import { useInsightDismissStore } from '../../../stores/insightDismissStore';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { getNurseInsightForDay } from '../../../ai/dailyNurseInsights';
import { VETERAN_RULES } from '../../../ai/veteranInsights';
import { VET_CATEGORY_TAG, VET_CATEGORY_ICON, VET_SEVERITY_PRIORITY } from '../constants';
import type { InsightCardData, InsightTag, VisualGuide } from '../types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeBabyAgeDays(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const birth = new Date(dateOfBirth);
  birth.setHours(0, 0, 0, 0);
  const diff = now.getTime() - birth.getTime();
  if (diff < 0) return null;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatAgeDays(days: number): string {
  if (days <= 14) return `Day ${days}`;
  const weeks = Math.floor(days / 7);
  if (weeks <= 12) return `Week ${weeks}`;
  const months = Math.floor(days / 30.44);
  return `${months} month${months > 1 ? 's' : ''} old`;
}

/** Map daily nurse insight categories to InsightTag */
const NURSE_CATEGORY_TAG: Record<string, InsightTag> = {
  Feeding: 'feeding_insight',
  Recovery: 'health_pattern',
  Sleep: 'sleep_alert',
  Bonding: 'general',
};
const NURSE_CATEGORY_ICON: Record<string, string> = {
  Feeding: 'coffee',
  Recovery: 'heart',
  Sleep: 'moon',
  Bonding: 'sun',
};

interface NurseSaysState {
  referenceCards: InsightCardData[];
  dailyNurseCard: InsightCardData | null;
  babyName: string | null;
  babyAgeDays: number | null;
  feedingMethod: string;
}

export function useNurseSaysData(): NurseSaysState {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const feedingMethod = useOnboardingStore((s) => s.feedingMethod) ?? 'mixed';
  const dismissedHashes = useInsightDismissStore((s) => s.dismissedHashes);

  const baby = useMemo(() => {
    if (!activeBabyId) return babies[0] ?? null;
    return babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;
  }, [babies, activeBabyId]);

  const babyName = baby?.name ?? null;
  const dateOfBirth = (!baby?.is_pregnant && baby?.date_of_birth) ? baby.date_of_birth : null;
  const babyAgeDays = useMemo(() => computeBabyAgeDays(dateOfBirth), [dateOfBirth]);

  const { referenceCards, dailyNurseCard } = useMemo(() => {
    const ageDays = babyAgeDays ?? 0;
    const ageLabel = ageDays > 0 ? formatAgeDays(ageDays) : '';
    const day = todayKey();

    // Daily nurse insight
    const nurseInsight = getNurseInsightForDay(ageDays);
    const nurseTag = NURSE_CATEGORY_TAG[nurseInsight.category] ?? 'general';
    const nurseIcon = NURSE_CATEGORY_ICON[nurseInsight.category] ?? 'sun';
    const dailyCard: InsightCardData = {
      id: generateId(),
      contentHash: `nurse-daily-${nurseInsight.day}-${day}`,
      tag: nurseTag,
      tagLabel: "Nurse's Note",
      tagIcon: nurseIcon,
      hook: `${ageLabel || 'Today'} — from your veteran nurse...`,
      title: nurseInsight.title,
      body: nurseInsight.body,
      priority: 'low',
      createdAt: Date.now(),
    };

    // Reference cards from veteran rules
    const refs: InsightCardData[] = VETERAN_RULES
      .filter((rule) => {
        if (!rule.trigger.age_range) return true;
        const [min, max] = rule.trigger.age_range;
        return ageDays >= min && ageDays <= max;
      })
      .map((rule) => ({
        id: generateId(),
        contentHash: `ref-${rule.id}`,
        tag: (VET_CATEGORY_TAG[rule.insight.category] ?? 'general') as InsightTag,
        tagLabel: rule.insight.source,
        tagIcon: VET_CATEGORY_ICON[rule.insight.category] ?? 'book-open',
        hook: `Nurse's reference — ${rule.insight.category.replace(/_/g, ' ')}`,
        title: rule.insight.title,
        body: rule.insight.body,
        priority: VET_SEVERITY_PRIORITY[rule.insight.severity] ?? ('low' as const),
        createdAt: Date.now() - 86400000,
        ...(rule.insight.visual_guide ? { visualGuide: rule.insight.visual_guide as VisualGuide } : {}),
      }));

    // Filter dismissed
    const filteredDaily = (dailyCard.contentHash in dismissedHashes) ? null : dailyCard;
    const filteredRefs = refs.filter((c) => !(c.contentHash in dismissedHashes));

    return { referenceCards: filteredRefs, dailyNurseCard: filteredDaily };
  }, [babyAgeDays, dismissedHashes]);

  return {
    referenceCards,
    dailyNurseCard,
    babyName,
    babyAgeDays,
    feedingMethod,
  };
}

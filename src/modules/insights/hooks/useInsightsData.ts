// ============================================================
// Lumina — Insights Data Hook
// Cross-references ALL stores to generate smart insight cards
// Combines static nurse knowledge + live pattern detection
// ============================================================

import { useMemo } from 'react';
import { useBabyStore } from '../../../stores/babyStore';
import { useFeedingStore } from '../../../stores/feedingStore';
import { useSleepStore } from '../../../stores/sleepStore';
import { useDiaperStore } from '../../../stores/diaperStore';
import { useGrowthStore } from '../../../stores/growthStore';
import { useMotherMedsStore } from '../../../stores/motherMedsStore';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { useInsightDismissStore } from '../../../stores/insightDismissStore';
import { calculateCorrectedAge } from '../../baby/utils/correctedAge';
import { getNurseInsightForDay } from '../../../ai/dailyNurseInsights';
import { ALLERGEN_DISPLAY } from '../../../ai/contentFilter';

import type { InsightCardData, InsightTag, GroupedInsights, PulseData, PulseDomain } from '../types';
import type { DomainStatus } from '../types';
import type { GrowthLog } from '../../growth/types';
import type { Baby } from '../../baby/types';

/** Map daily nurse insight categories to InsightTag */
const NURSE_CATEGORY_TAG: Record<string, InsightTag> = {
  Feeding: 'feeding_insight',
  Recovery: 'health_pattern',
  Sleep: 'sleep_alert',
  Bonding: 'general',
};
const NURSE_CATEGORY_ICON: Record<string, string> = {
  Feeding: 'droplet',
  Recovery: 'heart',
  Sleep: 'moon',
  Bonding: 'sun',
};


function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Stable YYYY-MM-DD key for content hash bucketing */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface InsightsState {
  grouped: GroupedInsights;
  babyName: string | null;
  babyAgeDays: number | null;
  feedingMethod: string;
  growthLogs: GrowthLog[];
  baby: Baby | null;
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

export function useInsightsData(): InsightsState {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const feedingMethod = useOnboardingStore((s) => s.feedingMethod) ?? 'mixed';
  const activeMeds = useMotherMedsStore((s) => s.activeMeds);
  const feedingTimer = useFeedingStore((s) => s.activeTimer);
  const sleepTimer = useSleepStore((s) => s.activeTimer);
  const dismissedHashes = useInsightDismissStore((s) => s.dismissedHashes);
  const growthItems = useGrowthStore((s) => s.items);

  const baby = useMemo(() => {
    if (!activeBabyId) return babies[0] ?? null;
    return babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;
  }, [babies, activeBabyId]);

  const babyName = baby?.name ?? null;
  const dateOfBirth = (!baby?.is_pregnant && baby?.date_of_birth) ? baby.date_of_birth : null;
  const babyAgeDays = useMemo(() => computeBabyAgeDays(dateOfBirth), [dateOfBirth]);

  const correctedAge = useMemo(() => {
    return baby ? calculateCorrectedAge(baby) : null;
  }, [baby]);

  const grouped = useMemo<GroupedInsights>(() => {
    const allCards: InsightCardData[] = [];
    const name = babyName || 'your baby';
    const ageDays = babyAgeDays ?? 0;
    const ageLabel = ageDays > 0 ? formatAgeDays(ageDays) : '';
    const day = todayKey();

    // Gather live data snapshots
    const feedingSummary = baby ? useFeedingStore.getState().getSummaryToday(baby.id) : null;
    const sleepSummary = baby ? useSleepStore.getState().getSummaryToday(baby.id) : null;
    const diaperSummary = baby ? useDiaperStore.getState().getSummaryToday(baby.id) : null;

    // ─── CROSS-REFERENCED INSIGHTS ───

    // 1. Feeding pattern insight
    if (feedingSummary && feedingSummary.total_feeds > 0) {
      const totalFeeds = feedingSummary.total_feeds;
      const isNewborn = ageDays <= 28;
      const expectedMin = isNewborn ? 8 : 6;

      if (totalFeeds >= expectedMin) {
        allCards.push({
          id: generateId(),
          contentHash: `feeding-ontrack-${day}`,
          tag: 'feeding_insight',
          tagLabel: 'Feeding Pattern',
          tagIcon: 'droplet',
          hook: `Based on ${totalFeeds} feeds logged today and ${name}'s ${ageLabel} development...`,
          title: `${name}'s feeding is right on track`,
          body: `You're doing a wonderful job keeping up with feeds. At **${ageLabel}**, ${isNewborn ? '8-12 feeds per day is exactly what we expect' : 'this feeding frequency supports healthy growth'}. ${name}'s stomach is growing, and your routine is clearly working.\n\n**Pro tip from the nursery:** Watch for ${name}'s early hunger cues — hand-to-mouth movements and lip smacking — rather than waiting for crying. Catching feeds early means **less stress for both of you** and more efficient feeding sessions.`,
          priority: 'low',
          createdAt: Date.now() - 3600000,
        });
      } else if (totalFeeds > 0 && totalFeeds < expectedMin) {
        allCards.push({
          id: generateId(),
          contentHash: `feeding-low-${day}`,
          tag: 'feeding_insight',
          tagLabel: 'Feeding Pattern',
          tagIcon: 'droplet',
          hook: `Based on ${totalFeeds} feeds so far today (${ageLabel})...`,
          title: 'A gentle feeding reminder',
          body: `I've noticed ${totalFeeds} feed${totalFeeds > 1 ? 's' : ''} so far today. At **${ageLabel}**, we typically want to see **${expectedMin}-${expectedMin + 4} feeds in 24 hours**. **Forgot to log a couple?** That happens — tap below to catch up. If the count is accurate, no stress — some babies cluster their feeds later in the day.\n\n**What to watch for:** If ${name} seems content, has good wet diapers, and is gaining weight, the pattern is likely fine. But if you're noticing fewer wet diapers too, it's worth a quick check-in with your pediatrician.`,
          priority: 'medium',
          quickAction: { type: 'log_feed', label: 'I forgot to log! Add Feed', icon: 'plus-circle' },
          createdAt: Date.now() - 1800000,
        });
      }
    }

    // 2b. Allergy reaction insight — scan today's solid foods
    if (baby) {
      const todayFeedings = useFeedingStore.getState().items.filter(
        (item) => item.baby_id === baby.id && item.started_at.startsWith(day) && item.type === 'solid' && item.solid_foods,
      );
      const allSolidFoods = todayFeedings.flatMap((f) => f.solid_foods ?? []);
      const reactedFoods = allSolidFoods.filter(
        (f) => f.allergen_flags.length > 0 && f.reaction && f.reaction !== 'none',
      );

      if (reactedFoods.length > 0) {
        const foodNames = reactedFoods.map((f) => f.food_name).join(', ');
        const reactionTypes = [...new Set(reactedFoods.map((f) => f.reaction))].join(', ');
        const allergenEmojis = [...new Set(reactedFoods.flatMap((f) => f.allergen_flags))]
          .map((k) => ALLERGEN_DISPLAY[k]?.emoji ?? '')
          .join('');
        allCards.push({
          id: generateId(),
          contentHash: `allergy-reaction-${day}`,
          tag: 'feeding_insight',
          tagLabel: 'Allergy Reaction',
          tagIcon: 'alert-triangle',
          hook: `Based on today's solid feeding log with flagged allergens...`,
          title: `${allergenEmojis} Allergy Reaction Detected`,
          body: `**${foodNames}** triggered a reaction today (${reactionTypes}). This is important to track.\n\n**What to do now:** Monitor ${name} closely for the next 2-4 hours. Note any additional symptoms like fussiness, skin changes, or digestive issues.\n\n**When to call your pediatrician:** If symptoms worsen, if you see hives spreading, difficulty breathing, or persistent vomiting — seek medical attention immediately.\n\n**Pro tip:** Log this reaction consistently so you can share a clear pattern with your pediatrician at the next visit.`,
          priority: 'high',
          actionItems: [
            `Monitor ${name} for 2-4 hours`,
            'Note any additional symptoms',
            'Contact pediatrician if symptoms worsen',
          ],
          createdAt: Date.now(),
        });
      } else if ((baby.known_allergies?.length ?? 0) > 0 && allSolidFoods.length > 0) {
        // Baby has known allergies but today's solids had no reactions — positive card
        allCards.push({
          id: generateId(),
          contentHash: `allergy-safe-${day}`,
          tag: 'feeding_insight',
          tagLabel: 'Allergy Safe',
          tagIcon: 'shield',
          hook: `Based on today's solid foods and ${name}'s allergy profile...`,
          title: 'Allergy-Safe Feeding Today',
          body: `Great job navigating solid foods with ${name}'s allergies in mind. Today's meals went smoothly with **no reactions detected**.\n\nKeeping a consistent log helps you build confidence with new foods and gives your pediatrician reliable data.`,
          priority: 'low',
          createdAt: Date.now() - 3000000,
        });
      }
    }

    // 3. Diaper pattern cross-referenced with feeding
    if (diaperSummary) {
      const wetCount = diaperSummary.wet_count ?? 0;
      const dirtyCount = diaperSummary.dirty_count ?? 0;
      const isNewborn = ageDays <= 28;

      if (isNewborn && wetCount < 4 && ageDays > 3) {
        allCards.push({
          id: generateId(),
          contentHash: `diaper-low-wet-${day}`,
          tag: 'diaper_pattern',
          tagLabel: 'Diaper Pattern',
          tagIcon: 'droplet',
          hook: `Based on ${wetCount} wet diaper${wetCount !== 1 ? 's' : ''} today and ${feedingSummary?.total_feeds ?? 0} feeds...`,
          title: 'Hydration check',
          body: `At **${ageLabel}**, we like to see **at least 6 wet diapers per day** as a sign of good hydration. You've logged ${wetCount} so far. **If you just forgot to log a few changes, no worries** — tap below to catch up! But if the count is accurate, try offering a feed soon.\n\n**The connection:** Wet diapers are our best proxy for whether ${name} is getting enough milk or formula. If you're also seeing fewer feeds today, try offering a feed soon and watch for improvement.\n\n**When to call:** If you see no wet diaper for 8+ hours in a newborn, contact your pediatrician.`,
          priority: 'high',
          actionItems: [
            `Offer ${name} a feed soon`,
            'Track the next diaper closely',
            'Call pediatrician if no wet diaper for 8+ hours',
          ],
          quickAction: { type: 'log_diaper', label: 'I forgot to log! Add Diaper', icon: 'plus-circle' },
          createdAt: Date.now() - 900000,
        });
      }

      if (dirtyCount > 0 && wetCount >= 4) {
        allCards.push({
          id: generateId(),
          contentHash: `diaper-healthy-${day}`,
          tag: 'diaper_pattern',
          tagLabel: 'Diaper Pattern',
          tagIcon: 'droplet',
          hook: `Based on today's ${wetCount} wet and ${dirtyCount} dirty diapers...`,
          title: 'Diaper output looks healthy',
          body: `**${wetCount} wet and ${dirtyCount} dirty** — this is exactly what I'd want to see. Good diaper output is one of the most reliable signs that ${name} is **feeding well and staying hydrated**.\n\nKeep up the great tracking. It might feel tedious, but this data is genuinely valuable for your pediatrician appointments.`,
          priority: 'low',
          createdAt: Date.now() - 7200000,
        });
      }
    }

    // 4. Sleep insight (cross-referenced with age)
    if (sleepSummary && sleepSummary.total_sleep_hours > 0) {
      const totalHours = Math.round(sleepSummary.total_sleep_hours * 10) / 10;
      const isNewborn = ageDays <= 28;
      const expected = isNewborn ? '14-17' : ageDays <= 90 ? '12-15' : '11-14';

      allCards.push({
        id: generateId(),
        contentHash: `sleep-${day}`,
        tag: 'sleep_alert',
        tagLabel: 'Sleep Pattern',
        tagIcon: 'moon',
        hook: `Based on ${totalHours}h of sleep logged today at ${ageLabel}...`,
        title: `Sleep snapshot for ${name}`,
        body: `${name} has logged about **${totalHours} hours** of sleep so far. At **${ageLabel}**, babies typically need **${expected} hours total** (including naps).\n\n${isNewborn
          ? "**Newborn sleep truth:** It comes in 2-3 hour bursts, and that's biologically normal. Your baby's circadian rhythm won't mature until around 3-4 months. Swaddling, white noise, and a dark room help signal \"it's sleep time.\""
          : "**At this age**, you might start seeing longer stretches at night. A consistent bedtime routine — dim lights, feed, swaddle or sleep sack — helps reinforce the difference between day and night."
        }`,
        priority: 'low',
        createdAt: Date.now() - 5400000,
      });
    }

    // 5. Medication adherence insight
    if (activeMeds.length > 0) {
      const overdueMeds = activeMeds.filter(
        (m) => m.nextDueAt && m.nextDueAt <= Date.now()
      );
      if (overdueMeds.length > 0) {
        const medNames = overdueMeds.map((m) => m.medName).join(', ');
        allCards.push({
          id: generateId(),
          contentHash: `meds-overdue-${medNames}-${day}`,
          tag: 'health_pattern',
          tagLabel: "Health & Recovery",
          tagIcon: 'heart',
          hook: `Based on your medication schedule (${medNames} overdue)...`,
          title: 'Your recovery medication is overdue',
          body: `Your **${medNames}** ${overdueMeds.length > 1 ? 'are' : 'is'} past due. I know it's easy to forget when you're focused on ${name}, but **staying ahead of pain is much easier than catching up**.\n\nSkipping doses can lead to breakthrough pain that makes caring for your baby harder. Set it as a routine — take your meds right before or after a feed, so it becomes automatic.\n\n**Your recovery matters.** You can't pour from an empty cup.`,
          priority: 'high',
          actionItems: [`Take ${medNames} now`, 'Pair med times with feeding schedule'],
          createdAt: Date.now() - 600000,
        });
      }
    }

    // Corrected age insight for preterm babies
    if (correctedAge && correctedAge.isPreterm && correctedAge.corrected) {
      allCards.push({
        id: generateId(),
        contentHash: `preterm-corrected-age-${day}`,
        tag: 'growth_note',
        tagLabel: 'Growth & Development',
        tagIcon: 'trending-up',
        hook: `Based on ${name}'s preterm birth and corrected age calculation...`,
        title: `Corrected age: What it means for ${name}`,
        body: `Since ${name} arrived early, we use **corrected age** for all developmental milestones. This means we adjust expectations based on when ${name} *would have* been born at full term.\n\n**This is important:** If someone says "${name} should be doing X by now," remember — their developmental clock started at their corrected age, not their birth date. **Vaccinations are the one exception** — those always follow chronological age.\n\nPreterm babies are incredible fighters, and they catch up on their own timeline.`,
        priority: 'medium',
        createdAt: Date.now() - 10800000,
      });
    }

    // 7. General daily encouragement (always present as a baseline)
    if (ageDays <= 14) {
      allCards.push({
        id: generateId(),
        contentHash: `encouragement-${ageDays}-${day}`,
        tag: 'general',
        tagLabel: 'Daily Encouragement',
        tagIcon: 'sun',
        hook: `${ageLabel} — the early days are the hardest...`,
        title: "You're in the trenches — and you're doing it",
        body: `The first two weeks are often described as the hardest. **Everything is new, sleep is scarce, and doubts are loud.** But here's what 20 years of nursing has taught me: the parents who worry are usually the ones doing the best job.\n\n${name} doesn't need perfection. They need **you** — your warmth, your voice, your presence. That's already more than enough.\n\nRemember to eat, drink water, and accept every offer of help. This phase is temporary, even when it doesn't feel like it.`,
        priority: 'low',
        createdAt: Date.now() - 14400000,
      });
    }

    // 8. Daily nurse insight — always present, age-appropriate default content
    const nurseInsight = getNurseInsightForDay(ageDays);
    const nurseTag = NURSE_CATEGORY_TAG[nurseInsight.category] ?? 'general';
    const nurseIcon = NURSE_CATEGORY_ICON[nurseInsight.category] ?? 'sun';
    allCards.push({
      id: generateId(),
      contentHash: `nurse-daily-${nurseInsight.day}-${day}`,
      tag: nurseTag,
      tagLabel: `Nurse's Note`,
      tagIcon: nurseIcon,
      hook: `${ageLabel || 'Today'} — from your veteran nurse...`,
      title: nurseInsight.title,
      body: nurseInsight.body,
      priority: 'low',
      createdAt: Date.now() - 20000000,
    });

    // ─── FILTER DISMISSED CARDS ───
    const cards = allCards.filter((c) => !(c.contentHash in dismissedHashes));

    // ─── GROUP INTO SECTIONS ───
    const urgent: InsightCardData[] = [];
    const patterns: InsightCardData[] = [];
    const positive: InsightCardData[] = [];

    for (const card of cards) {
      if (card.priority === 'high') {
        urgent.push(card);
      } else if (card.priority === 'medium') {
        patterns.push(card);
      } else {
        positive.push(card);
      }
    }

    // Sort each group by recency
    const byRecency = (a: InsightCardData, b: InsightCardData) => b.createdAt - a.createdAt;
    urgent.sort(byRecency);
    patterns.sort(byRecency);
    positive.sort(byRecency);

    // ─── COMPUTE PULSE DATA ───
    const totalFeeds = feedingSummary?.total_feeds ?? 0;
    const isNewborn = ageDays <= 28;
    const expectedMin = isNewborn ? 8 : 6;

    const feedingStatus: DomainStatus =
      totalFeeds === 0 ? 'no_data' : totalFeeds >= expectedMin ? 'good' : 'attention';

    const totalSleepHours = sleepSummary?.total_sleep_hours ?? 0;
    const sleepStatus: DomainStatus = totalSleepHours === 0 ? 'no_data' : 'good';

    const wetCount = diaperSummary?.wet_count ?? 0;
    const dirtyCount = diaperSummary?.dirty_count ?? 0;
    const diaperStatus: DomainStatus =
      wetCount + dirtyCount === 0
        ? 'no_data'
        : isNewborn && wetCount < 4 && ageDays > 3
          ? 'attention'
          : 'good';

    const overdueMeds = activeMeds.filter(
      (m) => m.nextDueAt && m.nextDueAt <= Date.now()
    );
    const medsStatus: DomainStatus =
      activeMeds.length === 0 ? 'no_data' : overdueMeds.length > 0 ? 'attention' : 'good';

    const domains: PulseDomain[] = [
      { key: 'feeding', label: 'Feeding', status: feedingStatus, icon: 'droplet' },
      { key: 'sleep', label: 'Sleep', status: sleepStatus, icon: 'moon' },
      { key: 'diapers', label: 'Diapers', status: diaperStatus, icon: 'droplet' },
      { key: 'meds', label: 'Meds', status: medsStatus, icon: 'thermometer' },
    ];

    const trackedCount = domains.filter((d) => d.status !== 'no_data').length;
    const goodCount = domains.filter((d) => d.status === 'good').length;
    const summary =
      trackedCount === 0
        ? 'Start logging to see your daily snapshot'
        : `${goodCount} of ${trackedCount} tracked areas looking good`;

    const dayLabel = ageLabel || 'Today';

    const pulse: PulseData = { domains, summary, dayLabel };

    return { pulse, urgent, patterns, positive };
  }, [baby, babyName, babyAgeDays, correctedAge, activeMeds, feedingTimer, sleepTimer, feedingMethod, dismissedHashes]);

  const growthLogs = useMemo(() => {
    if (!baby) return [];
    return growthItems
      .filter((item) => item.baby_id === baby.id)
      .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
  }, [baby, growthItems]);

  return {
    grouped,
    babyName,
    babyAgeDays,
    feedingMethod,
    growthLogs,
    baby,
  };
}

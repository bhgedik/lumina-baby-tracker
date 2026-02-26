// ============================================================
// Sprout — Dashboard Home Screen
// Veteran nurse shift-handoff: Recovery → Baby → Nurse Insight
// Pregnancy → Postpartum transition via "I Had My Baby!" flow
// ============================================================

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { ActiveTimerBar } from '../../../src/shared/components/ActiveTimerBar';
import { BottomSheet } from '../../../src/shared/components/BottomSheet';
import { CelebrationModal } from '../../../src/shared/components/CelebrationModal';
import { PrepDashboard } from '../../../src/modules/pregnancy/components/PrepDashboard';
import { WellnessQuickEntry } from '../../../src/modules/wellness/components/WellnessQuickEntry';
import { useDashboardData } from '../../../src/modules/dashboard/hooks/useDashboardData';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useDateFormat } from '../../../src/shared/hooks/useDateFormat';
import type { PetDomain } from '../../../src/shared/utils/petState';
import type { FeedingSummary } from '../../../src/modules/feeding/types';
import type { SleepSummary } from '../../../src/modules/sleep/types';
import type { DiaperSummary } from '../../../src/modules/diaper/types';
import { DynamicLottieIcon } from '../../../src/shared/components/DynamicLottieIcon';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const LOG_TYPES = [
  { id: 'feeding', label: 'Feeding', color: colors.secondary[400], bg: '#FEF5F0', route: '/(app)/log/feeding' },
  { id: 'sleep', label: 'Sleep', color: colors.primary[400], bg: '#F0F5F2', route: '/(app)/log/sleep' },
  { id: 'diaper', label: 'Diaper', color: colors.warning, bg: '#FFF8EE', route: '/(app)/log/diaper' },
  { id: 'growth', label: 'Growth', color: colors.success, bg: '#F0F8F0', route: '/(app)/log/growth' },
  { id: 'health', label: 'Health', color: colors.error, bg: '#FFF0F0', route: '/(app)/log/health' },
  { id: 'activity', label: 'Activity', color: colors.info, bg: '#F0F5F2', route: '/(app)/log/activity' },
] as const;

const PET_DOMAINS = new Set<string>(['feeding', 'sleep', 'diaper']);

function getTileData(
  id: string,
  feedingSummary: FeedingSummary | null,
  sleepSummary: SleepSummary | null,
  diaperSummary: DiaperSummary | null,
  lastFedAgo: string | null,
  lastSleepAgo: string | null,
): { hero: string; subtitle: string } {
  switch (id) {
    case 'feeding': {
      if (!feedingSummary || feedingSummary.total_feeds === 0)
        return { hero: '\u2014', subtitle: 'Tap to log' };
      const parts: string[] = [`${feedingSummary.total_feeds} feeds`];
      if (feedingSummary.total_bottle_ml > 0) parts.push(`${feedingSummary.total_bottle_ml}ml`);
      return { hero: lastFedAgo ?? 'Just now', subtitle: parts.join(' \u00B7 ') };
    }
    case 'sleep': {
      if (!sleepSummary || (sleepSummary.total_sleep_hours === 0 && sleepSummary.nap_count === 0))
        return { hero: '\u2014', subtitle: 'Tap to log' };
      const parts: string[] = [`${sleepSummary.total_sleep_hours.toFixed(1)}h total`];
      if (sleepSummary.nap_count > 0) parts.push(`${sleepSummary.nap_count} nap${sleepSummary.nap_count > 1 ? 's' : ''}`);
      return { hero: lastSleepAgo ?? 'Just now', subtitle: parts.join(' \u00B7 ') };
    }
    case 'diaper': {
      if (!diaperSummary || diaperSummary.total_changes === 0)
        return { hero: '\u2014', subtitle: 'Tap to log' };
      const parts: string[] = [];
      if (diaperSummary.wet_count > 0) parts.push(`${diaperSummary.wet_count} wet`);
      if (diaperSummary.dirty_count > 0) parts.push(`${diaperSummary.dirty_count} dirty`);
      if (parts.length === 0) parts.push(`${diaperSummary.total_changes} changes`);
      const h = diaperSummary.hours_since_last_change;
      const hero = h != null ? (h < 1 ? 'Just now' : `${h.toFixed(0)}h ago`) : '\u2014';
      return { hero, subtitle: parts.join(' \u00B7 ') };
    }
    case 'growth':
      return { hero: '\u2014', subtitle: 'Tap to log' };
    case 'health':
      return { hero: 'All good', subtitle: 'No flags' };
    case 'activity':
      return { hero: '\u2014', subtitle: 'Tap to log' };
    default:
      return { hero: '\u2014', subtitle: 'Tap to log' };
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    babyName,
    isPregnant,
    dueDate,
    gestationalInfo,
    petStates,
    feedingSummary,
    sleepSummary,
    diaperSummary,
    lastFedAgo,
    lastSleepAgo,
    babyAge,
  } = useDashboardData();

  const babyAgeMonths = babyAge ? babyAge.days / 30.44 : 0;

  // Celebration + birth capture state
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBirthSheet, setShowBirthSheet] = useState(false);
  const [birthDateDisplay, setBirthDateDisplay] = useState('');

  const updateBaby = useBabyStore((s) => s.updateBaby);
  const getActiveBaby = useBabyStore((s) => s.getActiveBaby);
  const { formatDateInput, toISO, fromISO, placeholder: DATE_PLACEHOLDER } = useDateFormat();

  const birthDateValid = useMemo(() => {
    const iso = toISO(birthDateDisplay);
    if (!iso || iso.length !== 10) return false;
    const d = new Date(iso);
    return !isNaN(d.getTime());
  }, [birthDateDisplay, toISO]);

  const handleBabyArrivedPress = () => setShowCelebration(true);

  const handleCelebrationContinue = () => {
    setShowCelebration(false);
    const todayISO = new Date().toISOString().split('T')[0];
    setBirthDateDisplay(fromISO(todayISO));
    setTimeout(() => setShowBirthSheet(true), 300);
  };

  const handleConfirmBirth = () => {
    const iso = toISO(birthDateDisplay);
    if (!iso || !birthDateValid) return;
    const baby = getActiveBaby();
    if (!baby) return;
    setShowBirthSheet(false);
    setBirthDateDisplay('');
    updateBaby(baby.id, { is_pregnant: false, date_of_birth: iso });
  };

  // Pregnancy mode — show prep dashboard (ring + tips + "I Had My Baby!" button)
  if (isPregnant && dueDate) {
    const safeGestationalInfo = {
      week: gestationalInfo?.week ?? 4,
      dayOfWeek: gestationalInfo?.dayOfWeek ?? 0,
      progress: gestationalInfo?.progress ?? 0,
    };
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <PrepDashboard
          babyName={babyName || 'your little one'}
          dueDate={dueDate}
          gestationalInfo={safeGestationalInfo}
          onBabyArrivedPress={handleBabyArrivedPress}
        />

        <CelebrationModal
          visible={showCelebration}
          onContinue={handleCelebrationContinue}
        />

        {/* Birth date capture */}
        <BottomSheet
          visible={showBirthSheet}
          onClose={() => setShowBirthSheet(false)}
          title="Congratulations!"
        >
          <Text style={styles.sheetSubtitle}>
            When did your little one arrive?
          </Text>
          <View style={styles.sheetDateRow}>
            <Feather name="calendar" size={18} color={colors.textTertiary} style={styles.sheetDateIcon} />
            <TextInput
              style={styles.sheetDateInput}
              placeholder={DATE_PLACEHOLDER}
              placeholderTextColor={colors.textTertiary}
              value={birthDateDisplay}
              onChangeText={(t) => setBirthDateDisplay(formatDateInput(t))}
              keyboardType="number-pad"
              maxLength={10}
              autoFocus
            />
          </View>
          <Pressable
            style={[styles.sheetConfirmButton, shadows.sm, !birthDateValid && styles.sheetConfirmDisabled]}
            onPress={handleConfirmBirth}
            disabled={!birthDateValid}
          >
            <Feather name="heart" size={18} color={colors.textInverse} />
            <Text style={styles.sheetConfirmText}>Welcome Baby</Text>
          </Pressable>
        </BottomSheet>
      </SafeAreaView>
    );
  }

  // Postpartum — Quick Log grid
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ActiveTimerBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Quick Log</Text>
        <Text style={styles.subtitle}>What would you like to track?</Text>

        <WellnessQuickEntry onNavigate={() => router.push('/(app)/log/mood' as any)} />

        <View style={styles.grid}>
          {LOG_TYPES.map((type) => {
            const isPet = PET_DOMAINS.has(type.id);
            const pet = isPet ? petStates[type.id as PetDomain] : null;
            const illustrationColor = pet ? pet.iconColor : type.color;
            const { hero, subtitle } = getTileData(
              type.id, feedingSummary, sleepSummary, diaperSummary, lastFedAgo, lastSleepAgo,
            );
            const hasData = hero !== '\u2014';
            return (
              <TouchableOpacity
                key={type.id}
                style={[styles.card, shadows.soft, { backgroundColor: type.bg }]}
                onPress={() => router.push(type.route as any)}
                activeOpacity={0.85}
              >
                {/* Illustration — top right float */}
                <View style={styles.illustrationWrap}>
                  <DynamicLottieIcon
                    type={type.id as any}
                    size={52}
                    hoursSinceLastEvent={
                      type.id === 'feeding' ? feedingSummary?.hours_since_last_feed :
                      type.id === 'diaper' ? diaperSummary?.hours_since_last_change :
                      undefined
                    }
                    babyAgeMonths={type.id === 'growth' ? babyAgeMonths : undefined}
                  />
                </View>

                {/* Label */}
                <Text style={[styles.cardLabel, { color: illustrationColor }]}>{type.label}</Text>

                {/* Hero stat */}
                <Text style={[styles.cardHero, !hasData && styles.cardHeroEmpty]}>
                  {hero}
                </Text>

                {/* Subtitle */}
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 100 },
  title: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, paddingHorizontal: spacing.sm },
  subtitle: { fontSize: typography.fontSize.base, color: colors.textSecondary, paddingHorizontal: spacing.sm, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: {
    width: '47%',
    borderRadius: borderRadius['3xl'],
    padding: spacing.lg,
    paddingTop: spacing.base,
    minHeight: 140,
    overflow: 'hidden',
  },
  illustrationWrap: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xs,
    marginTop: -spacing.xs,
    marginRight: -spacing.sm,
  },
  cardLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cardHero: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardHeroEmpty: {
    color: colors.textTertiary,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  // Birth date capture BottomSheet
  sheetSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  sheetDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xl,
  },
  sheetDateIcon: {
    marginRight: spacing.sm,
  },
  sheetDateInput: {
    flex: 1,
    paddingVertical: spacing.base,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  sheetConfirmButton: {
    flexDirection: 'row',
    backgroundColor: colors.secondary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sheetConfirmDisabled: { opacity: 0.4 },
  sheetConfirmText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

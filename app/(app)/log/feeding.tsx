// ============================================================
// Lumina — Feeding Log Screen
// Warm, squishy Breast | Bottle | Solid with timer + response
// ============================================================

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Animated, LayoutAnimation, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
// SafeAreaView not needed — Stack header handles top safe area
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { SegmentControl } from '../../../src/shared/components/SegmentControl';
import { InsightToast } from '../../../src/shared/components/InsightToast';
import { BreastFeedingPanel } from '../../../src/modules/feeding/components/BreastFeedingPanel';
import { BottleFeedingPanel } from '../../../src/modules/feeding/components/BottleFeedingPanel';
import { SolidFeedingPanel } from '../../../src/modules/feeding/components/SolidFeedingPanel';
import { FeedingResponsePanel } from '../../../src/modules/feeding/components/FeedingResponsePanel';
import { BottomSheet } from '../../../src/shared/components/BottomSheet';
import { KeyboardDoneBar, KEYBOARD_DONE_ID } from '../../../src/shared/components/KeyboardDoneBar';
import { ALLERGEN_DISPLAY, searchAllergens } from '../../../src/ai/contentFilter';
import type { AllergenSuggestion } from '../../../src/ai/contentFilter';
import { useFeedingStore } from '../../../src/stores/feedingStore';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { useSleepStore } from '../../../src/stores/sleepStore';
import { useVeteranInsight } from '../../../src/ai/hooks/useVeteranInsight';
import { calculateCorrectedAge } from '../../../src/modules/baby/utils/correctedAge';
import { generateUUID } from '../../../src/stores/createSyncedStore';
import { APP_CONFIG } from '../../../src/shared/constants/config';
import type { FeedingType, BabyResponse, BottleContentType } from '../../../src/shared/types/common';
import type { FeedingLog, SolidFoodEntry } from '../../../src/modules/feeding/types';

export default function FeedingLogScreen() {
  const router = useRouter();
  const headerLeft = useCallback(
    () => (
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: Platform.OS === 'ios' ? -8 : 0 }}>
        <Feather name="chevron-left" size={26} color={colors.primary[600]} />
        <Text style={{ fontSize: 17, color: colors.primary[600], marginLeft: -2 }}>Home</Text>
      </Pressable>
    ),
    [router],
  );
  const baby = useBabyStore((s) => s.getActiveBaby());
  const profile = useAuthStore((s) => s.profile);
  const { addItem, stopTimer, activeTimer } = useFeedingStore();
  const sleepTimer = useSleepStore((s) => s.activeTimer);
  const { insight, checkAfterLog, dismiss } = useVeteranInsight();

  const correctedAge = baby ? calculateCorrectedAge(baby) : null;
  const canLogSolids =
    (correctedAge?.effectiveAgeMonths ?? 0) >=
    APP_CONFIG.medical.SOLID_FOODS_MIN_AGE_MONTHS;

  const typeOptions = useMemo(() => {
    const opts = [
      { value: 'breast', label: 'Breast' },
      { value: 'bottle', label: 'Bottle' },
    ];
    if (canLogSolids) {
      opts.push({ value: 'solid', label: 'Solid' });
    }
    return opts;
  }, [canLogSolids]);

  // Milestone animation: fade-in banner when solids first become available
  const solidsBannerOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (canLogSolids) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      Animated.timing(solidsBannerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [canLogSolids]);

  const [feedingType, setFeedingType] = useState<FeedingType>(
    activeTimer?.type ?? 'breast'
  );

  // Safety: reset to breast if solid was selected but age-gate kicked in
  useEffect(() => {
    if (feedingType === 'solid' && !canLogSolids) {
      setFeedingType('breast');
    }
  }, [feedingType, canLogSolids]);
  const [babyResponse, setBabyResponse] = useState<BabyResponse | null>(null);
  const [notes, setNotes] = useState('');

  const [bottleAmount, setBottleAmount] = useState(60);
  const [bottleContent, setBottleContent] = useState<BottleContentType | null>(null);
  const [bottleTemp, setBottleTemp] = useState<'warm' | 'room' | 'cold' | null>(null);

  const [solidFoods, setSolidFoods] = useState<SolidFoodEntry[]>([]);
  const [sensitivityNotes, setSensitivityNotes] = useState('');
  const [showSensitivity, setShowSensitivity] = useState(false);

  const [showAllergySheet, setShowAllergySheet] = useState(false);
  const knownAllergies = useMemo(() => baby?.known_allergies ?? [], [baby?.known_allergies]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(knownAllergies);
  const [allergyQuery, setAllergyQuery] = useState('');
  const allergenSuggestions = useMemo(() => {
    return searchAllergens(allergyQuery).filter((s) => !selectedAllergies.includes(s.key));
  }, [allergyQuery, selectedAllergies]);

  const handleSelectSuggestion = useCallback((suggestion: AllergenSuggestion) => {
    setSelectedAllergies((prev) => [...prev, suggestion.key]);
    setAllergyQuery('');
  }, []);

  const handleRemoveAllergy = useCallback((key: string) => {
    setSelectedAllergies((prev) => prev.filter((k) => k !== key));
  }, []);

  const handleSaveAllergies = useCallback(() => {
    if (baby) {
      useBabyStore.getState().updateBaby(baby.id, { known_allergies: selectedAllergies });
    }
    setAllergyQuery('');
    setShowAllergySheet(false);
  }, [baby, selectedAllergies]);

  const [timerStopped, setTimerStopped] = useState(false);

  const handleTimerStop = useCallback(() => {
    setTimerStopped(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!baby) return;

    const now = new Date().toISOString();
    const familyId = profile?.family_id ?? baby.family_id;
    const loggedBy = profile?.id ?? '';

    let log: FeedingLog;

    if (feedingType === 'breast' && timerStopped) {
      const stoppedLog = useFeedingStore.getState().items.find(
        (i) => i.baby_response === null && i.type === 'breast'
      );
      if (stoppedLog) {
        useFeedingStore.getState().updateItem(stoppedLog.id, {
          baby_id: baby.id,
          family_id: familyId,
          logged_by: loggedBy,
          baby_response: babyResponse,
          notes: notes.trim() || null,
          sensitivity_notes: sensitivityNotes.trim() || null,
        });
        checkAfterLog('feeding', {
          type: 'breast',
          baby_response: babyResponse,
        }, correctedAge?.effectiveAgeDays ?? 0);
        setTimeout(() => router.back(), 500);
        return;
      }
    }

    log = {
      id: generateUUID(),
      baby_id: baby.id,
      family_id: familyId,
      logged_by: loggedBy,
      type: feedingType,
      started_at: now,
      ended_at: now,
      breast_side: null,
      left_duration_seconds: null,
      right_duration_seconds: null,
      bottle_amount_ml: feedingType === 'bottle' ? bottleAmount : null,
      bottle_content: feedingType === 'bottle' ? bottleContent : null,
      bottle_temperature: feedingType === 'bottle' ? bottleTemp : null,
      solid_foods: feedingType === 'solid' ? solidFoods : null,
      notes: notes.trim() || null,
      sensitivity_notes: sensitivityNotes.trim() || null,
      baby_response: babyResponse,
      photo_url: null,
      created_at: now,
      updated_at: now,
    };

    addItem(log);

    checkAfterLog('feeding', {
      type: feedingType,
      baby_response: babyResponse,
      bottle_amount_ml: log.bottle_amount_ml,
    }, correctedAge?.effectiveAgeDays ?? 0);

    setTimeout(() => router.back(), 500);
  }, [baby, profile, feedingType, babyResponse, notes, sensitivityNotes, bottleAmount, bottleContent, bottleTemp, solidFoods, timerStopped, correctedAge, addItem, checkAfterLog, router]);

  const canSave = feedingType === 'breast'
    ? timerStopped
    : feedingType === 'bottle'
      ? bottleAmount > 0
      : solidFoods.length > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Log Feeding', headerTintColor: colors.primary[600], headerLeft, headerStyle: { backgroundColor: colors.background }, headerShadowVisible: false }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {/* Conflict warning */}
        {sleepTimer && (
          <View style={styles.warningBanner}>
            <Feather name="alert-circle" size={16} color={colors.warning} />
            <Text style={styles.warningText}>Sleep timer is active — stop it before feeding</Text>
          </View>
        )}

        {/* Solids milestone banner */}
        {canLogSolids && (
          <Animated.View
            style={[styles.milestoneBanner, { opacity: solidsBannerOpacity }]}
          >
            <Feather name="award" size={16} color={colors.success} />
            <Text style={styles.milestoneText}>
              Solid foods unlocked! Your baby is ready to explore new tastes.
            </Text>
          </Animated.View>
        )}

        {/* Type selector */}
        {!activeTimer && (
          <SegmentControl
            options={typeOptions}
            selected={feedingType}
            onSelect={(v) => setFeedingType(v as FeedingType)}
            size="large"
          />
        )}

        {/* Sub-panels */}
        <View style={styles.panelContainer}>
          {feedingType === 'breast' && (
            <BreastFeedingPanel onTimerStop={handleTimerStop} />
          )}
          {feedingType === 'bottle' && (
            <BottleFeedingPanel
              amount={bottleAmount}
              content={bottleContent}
              temperature={bottleTemp}
              onAmountChange={setBottleAmount}
              onContentChange={setBottleContent}
              onTemperatureChange={setBottleTemp}
            />
          )}
          {feedingType === 'solid' && (
            <SolidFeedingPanel
              foods={solidFoods}
              onFoodsChange={setSolidFoods}
              knownAllergies={knownAllergies}
            />
          )}
        </View>

        {/* Allergy alerts */}
        <View style={[styles.allergySection, shadows.sm]}>
          {knownAllergies.length > 0 ? (
            <>
              <View style={styles.allergyHeader}>
                <View style={styles.allergyIconBadge}>
                  <Feather name="alert-triangle" size={16} color={colors.warning} />
                </View>
                <Text style={styles.allergyTitle}>Allergy Alerts</Text>
              </View>
              <View style={styles.allergyChips}>
                {knownAllergies.map((key) => {
                  const info = ALLERGEN_DISPLAY[key];
                  if (!info) return null;
                  return (
                    <View key={key} style={styles.allergyChip}>
                      <Text style={styles.allergyChipText}>{info.emoji} {info.label}</Text>
                    </View>
                  );
                })}
              </View>
              <Pressable
                style={styles.manageButton}
                onPress={() => { setSelectedAllergies(knownAllergies); setShowAllergySheet(true); }}
                accessibilityRole="button"
              >
                <Feather name="edit-2" size={14} color={colors.primary[500]} />
                <Text style={styles.manageLinkText}>Manage Allergies</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => { setSelectedAllergies([]); setShowAllergySheet(true); }}
              style={styles.addAllergyButton}
              accessibilityRole="button"
            >
              <View style={styles.addAllergyIcon}>
                <Feather name="plus" size={18} color={colors.secondary[500]} />
              </View>
              <View style={styles.addAllergyTextGroup}>
                <Text style={styles.addAllergyLabel}>Add Allergy Info</Text>
                <Text style={styles.addAllergyHint}>Track allergens to get warnings when logging foods</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Sensitivity tracker — collapsible */}
        <Pressable
          style={styles.sensitivityToggle}
          onPress={() => setShowSensitivity(!showSensitivity)}
          accessibilityRole="button"
        >
          <View style={styles.sensitivityIconBadge}>
            <Feather name="wind" size={15} color={colors.primary[500]} />
          </View>
          <View style={styles.sensitivityToggleText}>
            <Text style={styles.sensitivityLabel}>Sensitivity Tracker</Text>
            <Text style={styles.sensitivityHint} numberOfLines={1}>
              {sensitivityNotes ? sensitivityNotes : 'Note suspected triggers'}
            </Text>
          </View>
          <Feather
            name={showSensitivity ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textTertiary}
          />
        </Pressable>
        {showSensitivity && (
          <View style={styles.sensitivityBody}>
            <TextInput
              style={styles.sensitivityInput}
              placeholder="e.g. Dairy, Caffeine, Spicy food..."
              placeholderTextColor={colors.textTertiary}
              value={sensitivityNotes}
              onChangeText={setSensitivityNotes}
              multiline
              textAlignVertical="top"
              maxLength={300}
              inputAccessoryViewID={KEYBOARD_DONE_ID}
            />
          </View>
        )}

        {/* Response panel */}
        {(feedingType !== 'breast' || timerStopped) && (
          <View style={styles.responseSection}>
            <FeedingResponsePanel
              response={babyResponse}
              notes={notes}
              onResponseChange={setBabyResponse}
              onNotesChange={setNotes}
            />
          </View>
        )}

        {/* Save button */}
        {(feedingType !== 'breast' || timerStopped) && (
          <Pressable
            style={[styles.saveButton, shadows.sm, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
          >
            <Feather name="check" size={20} color={colors.textInverse} style={styles.saveIcon} />
            <Text style={styles.saveButtonText}>Save Feeding</Text>
          </Pressable>
        )}
      </ScrollView>

      {insight && (
        <InsightToast
          visible={!!insight}
          title={insight.title}
          body={insight.body}
          severity={insight.severity}
          source={insight.source}
          onDismiss={dismiss}
        />
      )}

      {/* Manage allergies bottom sheet */}
      <BottomSheet
        visible={showAllergySheet}
        onClose={() => { setAllergyQuery(''); setShowAllergySheet(false); }}
        title="Manage Allergies"
      >
        {/* Selected allergy chips */}
        {selectedAllergies.length > 0 && (
          <View style={styles.selectedAllergyChips}>
            {selectedAllergies.map((key) => {
              const info = ALLERGEN_DISPLAY[key];
              if (!info) return null;
              return (
                <View key={key} style={styles.selectedAllergyChip}>
                  <Text style={styles.selectedAllergyChipText}>{info.emoji} {info.label}</Text>
                  <Pressable onPress={() => handleRemoveAllergy(key)} hitSlop={6}>
                    <Feather name="x" size={14} color={colors.warning} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {/* Free-text search input */}
        <TextInput
          style={styles.allergySearchInput}
          placeholder="Type to search (e.g. milk, peanut...)"
          placeholderTextColor={colors.textTertiary}
          value={allergyQuery}
          onChangeText={setAllergyQuery}
          autoCapitalize="none"
          autoCorrect={false}
          inputAccessoryViewID={KEYBOARD_DONE_ID}
        />

        {/* Suggestions list */}
        {allergyQuery.length > 0 && allergyQuery.length < 3 && (
          <Text style={styles.suggestionHint}>Type at least 3 letters to see suggestions</Text>
        )}
        {allergenSuggestions.length > 0 && (
          <View style={styles.suggestionList}>
            {allergenSuggestions.map((s) => (
              <Pressable
                key={s.key}
                style={styles.suggestionRow}
                onPress={() => handleSelectSuggestion(s)}
                accessibilityRole="button"
              >
                <Text style={styles.suggestionEmoji}>{s.emoji}</Text>
                <View style={styles.suggestionTextGroup}>
                  <Text style={styles.suggestionLabel}>{s.label}</Text>
                  {s.matchedTerm.toLowerCase() !== s.label.toLowerCase() && (
                    <Text style={styles.suggestionMatch}>matched "{s.matchedTerm}"</Text>
                  )}
                </View>
                <Feather name="plus-circle" size={20} color={colors.primary[500]} />
              </Pressable>
            ))}
          </View>
        )}
        {allergyQuery.length >= 3 && allergenSuggestions.length === 0 && (
          <Text style={styles.suggestionHint}>No matching allergens found</Text>
        )}

        <Pressable style={styles.allergySaveButton} onPress={handleSaveAllergies} accessibilityRole="button">
          <Text style={styles.allergySaveText}>Save</Text>
        </Pressable>
      </BottomSheet>
      <KeyboardDoneBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning + '12',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.base,
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
  },
  milestoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success + '12',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  milestoneText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  panelContainer: {
    marginTop: spacing.xl,
  },
  responseSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  saveButton: {
    height: 56,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  saveIcon: {
    marginTop: 1,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },
  allergySection: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  allergyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  allergyIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allergyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  allergyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  allergyChip: {
    backgroundColor: colors.warning + '18',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  allergyChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: typography.fontWeight.semibold,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    marginTop: spacing.xs,
  },
  manageLinkText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
  // Sensitivity Tracker
  sensitivityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  sensitivityIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensitivityToggleText: {
    flex: 1,
  },
  sensitivityLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  sensitivityHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: 1,
  },
  sensitivityBody: {
    marginTop: spacing.sm,
  },
  sensitivityInput: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    minHeight: 72,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  addAllergyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  addAllergyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary[50],
    borderWidth: 1.5,
    borderColor: colors.secondary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAllergyTextGroup: {
    flex: 1,
  },
  addAllergyLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  addAllergyHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedAllergyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  selectedAllergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning + '18',
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  selectedAllergyChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: typography.fontWeight.semibold,
  },
  allergySearchInput: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.neutral[50],
  },
  suggestionHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  suggestionList: {
    marginTop: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    gap: spacing.md,
  },
  suggestionEmoji: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  suggestionTextGroup: {
    flex: 1,
  },
  suggestionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  suggestionMatch: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: 1,
  },
  allergySaveButton: {
    height: 56,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  allergySaveText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },
});

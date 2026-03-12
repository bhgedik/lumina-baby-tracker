// ============================================================
// Lumina — Play & Bonding Screen
// Warm, plush activity logger: Tummy Time, Fresh Air,
// + AI-powered Reading, Sensory Play, Music & Sound cards
// ============================================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { LuminaWhisper } from '../../../src/shared/components/LuminaWhisper';
import { KeyboardDoneBar, KEYBOARD_DONE_ID } from '../../../src/shared/components/KeyboardDoneBar';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useCorrectedAge } from '../../../src/modules/baby/hooks/useCorrectedAge';
import { ChatSheet } from '../../../src/modules/insights/components/ChatSheet';
import {
  fetchActivitySuggestions,
  type ActivitySuggestions,
} from '../../../src/modules/activity/services/activitySuggestionsService';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

// ── AI Play Suggestions by Age (months) ──
interface PlaySuggestion {
  activity: string;
  tip: string;
  icon: keyof typeof Feather.glyphMap;
}

function getPlaySuggestion(ageMonths: number, babyName: string): PlaySuggestion {
  if (ageMonths < 1) {
    return {
      activity: 'Skin-to-Skin Time',
      tip: `${babyName || 'Baby'}'s vision is blurry right now — about 8–12 inches. Get close, talk softly, and just be present. That's all the play ${babyName || 'she'} needs today.`,
      icon: 'heart',
    };
  }
  if (ageMonths < 2) {
    return {
      activity: 'Face Gazing',
      tip: `Hold ${babyName || 'baby'} about 10 inches from your face and make slow, exaggerated expressions. Stick out your tongue — ${babyName || 'baby'} might just copy you!`,
      icon: 'eye',
    };
  }
  if (ageMonths < 3) {
    return {
      activity: 'Contrast Cards',
      tip: `Black-and-white patterns are fascinating at this age. Hold a high-contrast card 10 inches away and slowly move it side to side. ${babyName || 'Baby'}'s eyes will follow!`,
      icon: 'grid',
    };
  }
  if (ageMonths < 4) {
    return {
      activity: 'Tummy Time Chat',
      tip: `Lie face-to-face with ${babyName || 'baby'} during tummy time and narrate your day. "Now mama's going to tell you about the birds outside." Two activities in one!`,
      icon: 'message-circle',
    };
  }
  if (ageMonths < 6) {
    return {
      activity: 'Reach & Grab',
      tip: `Dangle a colorful rattle or crinkly toy just within ${babyName || 'baby'}'s reach. The concentration on their face when they grab it is priceless. Celebrate every attempt!`,
      icon: 'gift',
    };
  }
  if (ageMonths < 9) {
    return {
      activity: 'Peek-a-Boo',
      tip: `The classic — and there's real science behind it! ${babyName || 'Baby'} is learning object permanence: you still exist even when hidden. Try it with a cloth or your hands.`,
      icon: 'smile',
    };
  }
  if (ageMonths < 12) {
    return {
      activity: 'Container Play',
      tip: `Give ${babyName || 'baby'} a bowl and some safe objects to put in and take out. Stacking cups, wooden blocks, even big pasta shapes. They could do this for 20 minutes!`,
      icon: 'box',
    };
  }
  return {
    activity: 'Stack & Knock',
    tip: `Build a tower of blocks together and let ${babyName || 'baby'} knock it down. The crash is the best part! This teaches cause and effect while building fine motor skills.`,
    icon: 'layers',
  };
}

// ── Duration presets ──
const TUMMY_PRESETS = [
  { value: '2', label: '2 min' },
  { value: '5', label: '5 min' },
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
];

const OUTSIDE_PRESETS = [
  { value: '10', label: '10 min' },
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hr' },
];

// ── Skeleton shimmer for loading state ──
function SkeletonRow() {
  const opacity = useMemo(() => new Animated.Value(0.3), []);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonRow, { opacity }]}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonReason} />
    </Animated.View>
  );
}

// ── Suggestion chip (selectable) ──
function SuggestionChip({
  label,
  reason,
  product,
  isSelected,
  onPress,
  accentColor,
}: {
  label: string;
  reason: string;
  product?: string | null;
  isSelected: boolean;
  onPress: () => void;
  accentColor: string;
}) {
  return (
    <Pressable
      style={[
        styles.aiChip,
        isSelected && { backgroundColor: accentColor + '12', borderColor: accentColor },
      ]}
      onPress={onPress}
    >
      <View style={styles.aiChipHeader}>
        <View style={[
          styles.aiChipCheck,
          isSelected && { backgroundColor: accentColor, borderColor: accentColor },
        ]}>
          {isSelected && <Feather name="check" size={12} color="#FFFFFF" />}
        </View>
        <Text style={[styles.aiChipTitle, isSelected && { color: accentColor }]} numberOfLines={2}>
          {label}
        </Text>
        <Feather name="chevron-right" size={14} color={isSelected ? accentColor : colors.neutral[300]} />
      </View>
      <Text style={styles.aiChipReason} numberOfLines={2}>{reason}</Text>
      {product ? (
        <View style={styles.aiChipProductRow}>
          <Feather name="shopping-bag" size={11} color={colors.textTertiary} />
          <Text style={styles.aiChipProduct} numberOfLines={1}>{product}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// ── Colors for the 3 new sections ──
const READING_COLOR = '#2E7D6F';
const SENSORY_COLOR = '#7B61A6';
const MUSIC_COLOR = '#C2703E';

export default function ActivityLogScreen() {
  const router = useRouter();
  const baby = useBabyStore((s) => s.getActiveBaby());
  const age = useCorrectedAge(baby);

  const effectiveAgeMonths = age?.effectiveAgeMonths ?? 0;
  const chronoAgeMonths = age?.chronological.months ?? 0;
  const babyName = baby?.name ?? '';

  const suggestion = useMemo(
    () => getPlaySuggestion(effectiveAgeMonths, babyName),
    [effectiveAgeMonths, babyName],
  );

  // Tummy time
  const [tummyMinutes, setTummyMinutes] = useState('');
  const [tummyTipExpanded, setTummyTipExpanded] = useState(false);

  // Fresh air
  const [outsideMinutes, setOutsideMinutes] = useState('');
  const [outsideTipExpanded, setOutsideTipExpanded] = useState(false);

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<ActivitySuggestions | null>(null);
  const [aiLoading, setAiLoading] = useState(true);

  // Selections for activity sections
  const [selectedSensory, setSelectedSensory] = useState<string[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<string[]>([]);

  // ChatSheet for book ideas
  const [showChat, setShowChat] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>(undefined);

  // Whisper
  const [showWhisper, setShowWhisper] = useState(false);
  const [whisperMsg, setWhisperMsg] = useState('');

  // Fetch AI suggestions on mount
  useEffect(() => {
    let cancelled = false;
    setAiLoading(true);
    fetchActivitySuggestions(chronoAgeMonths, effectiveAgeMonths, babyName).then((result) => {
      if (!cancelled) {
        setAiSuggestions(result.suggestions);
        setAiLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [chronoAgeMonths, effectiveAgeMonths, babyName]);

  const toggleSelection = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  };

  const showWhisperToast = (msg: string) => {
    setWhisperMsg(msg);
    setShowWhisper(true);
  };

  const handleLogTummy = () => {
    showWhisperToast(`\u2728 Tummy time saved. ${tummyMinutes} min.`);
    setTummyMinutes('');
  };

  const handleLogOutside = () => {
    showWhisperToast(`\u2728 Fresh air tracked. ${outsideMinutes} min.`);
    setOutsideMinutes('');
  };

  const handleLogSensory = () => {
    showWhisperToast('\u2728 Sensory play saved.');
    setSelectedSensory([]);
  };

  const handleLogMusic = () => {
    showWhisperToast('\u2728 Music session saved.');
    setSelectedMusic([]);
  };

  const handleGetBookIdeas = () => {
    setChatInitialMessage(
      `What are the best books for a ${effectiveAgeMonths}-month-old baby? I'd love age-appropriate recommendations for ${babyName || 'my baby'}.`
    );
    setShowChat(true);
  };

  const headerLeft = useCallback(
    () => (
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
        <Feather name="chevron-left" size={26} color={colors.primary[600]} />
        <Text style={styles.backLabel}>Home</Text>
      </Pressable>
    ),
    [router],
  );

  // Render 3 skeleton rows while loading
  const renderSkeletons = () => (
    <>
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Play Time',
          headerTintColor: colors.primary[600],
          headerBackTitle: 'Home',
          headerLeft,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* ── AI Play Suggestion ── */}
        <View style={[styles.suggestionCard, shadows.soft]}>
          <View style={styles.suggestionHeader}>
            <View style={styles.suggestionIconWrap}>
              <Feather name={suggestion.icon} size={20} color={colors.primary[600]} />
            </View>
            <View style={styles.suggestionLabelWrap}>
              <Text style={styles.suggestionLabel}>Today's Play Idea</Text>
              <Text style={styles.suggestionActivity}>{suggestion.activity}</Text>
            </View>
          </View>
          <Text style={styles.suggestionTip}>{suggestion.tip}</Text>
          <View style={styles.suggestionActions}>
            <Pressable
              style={styles.suggestionLogButton}
              onPress={() => showWhisperToast(`\u2728 ${suggestion.activity} saved.`)}
            >
              <Feather name="plus" size={14} color={colors.primary[600]} />
              <Text style={styles.suggestionLogText}>Log Activity</Text>
            </Pressable>
          </View>
          <View style={styles.suggestionFooter}>
            <Feather name="zap" size={11} color={colors.textTertiary} />
            <Text style={styles.suggestionFooterText}>
              Age-appropriate suggestion from Lumina
            </Text>
          </View>
        </View>

        {/* ── Card 1: Tummy Time ── */}
        <View style={[styles.activityCard, shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: colors.primary[50] }]}>
              <Feather name="target" size={20} color={colors.primary[600]} />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Tummy Time</Text>
              <Text style={styles.cardSubtitle}>Build strength at their own pace</Text>
            </View>
          </View>

          <Text style={styles.durationLabel}>How long?</Text>
          <View style={styles.presetRow}>
            {TUMMY_PRESETS.map((preset) => {
              const isSelected = tummyMinutes === preset.value;
              return (
                <Pressable
                  key={preset.value}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => setTummyMinutes(isSelected ? '' : preset.value)}
                >
                  <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
            <View style={styles.customInputWrap}>
              <TextInput
                style={styles.customInput}
                placeholder="min"
                placeholderTextColor={colors.textTertiary}
                value={TUMMY_PRESETS.some((p) => p.value === tummyMinutes) ? '' : tummyMinutes}
                onChangeText={(v) => setTummyMinutes(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={3}
                inputAccessoryViewID={KEYBOARD_DONE_ID}
              />
            </View>
          </View>

          <Pressable
            style={styles.tipToggle}
            onPress={() => setTummyTipExpanded((p) => !p)}
          >
            <Feather name="heart" size={13} color={colors.primary[500]} />
            <Text style={styles.tipToggleText}>Lumina's Tip</Text>
            <Feather
              name={tummyTipExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.primary[400]}
            />
          </Pressable>
          {tummyTipExpanded && (
            <View style={styles.tipBody}>
              <Text style={styles.tipText}>
                Lying on your chest completely counts as tummy time for newborns! Skin-to-skin while you rest on the couch? That's tummy time.{'\n\n'}
                Start with 2–3 minutes at a time and build up gradually. If baby fusses, that's okay — try again later. Every little bit counts.
              </Text>
            </View>
          )}

          {tummyMinutes !== '' && (
            <Pressable style={styles.inlineLogButton} onPress={handleLogTummy}>
              <Feather name="check" size={16} color="#FFFFFF" />
              <Text style={styles.inlineLogText}>Log {tummyMinutes} min</Text>
            </Pressable>
          )}
        </View>

        {/* ── Card 2: Fresh Air & Sunlight ── */}
        <View style={[styles.activityCard, shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: colors.secondary[50] }]}>
              <Feather name="sun" size={20} color={colors.secondary[500]} />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Fresh Air & Sunlight</Text>
              <Text style={styles.cardSubtitle}>Good for baby's rhythm and mama's mood</Text>
            </View>
          </View>

          <Text style={styles.durationLabel}>Time outside?</Text>
          <View style={styles.presetRow}>
            {OUTSIDE_PRESETS.map((preset) => {
              const isSelected = outsideMinutes === preset.value;
              return (
                <Pressable
                  key={preset.value}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => setOutsideMinutes(isSelected ? '' : preset.value)}
                >
                  <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={styles.tipToggle}
            onPress={() => setOutsideTipExpanded((p) => !p)}
          >
            <Feather name="heart" size={13} color={colors.primary[500]} />
            <Text style={styles.tipToggleText}>Why this matters</Text>
            <Feather
              name={outsideTipExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.primary[400]}
            />
          </Pressable>
          {outsideTipExpanded && (
            <View style={styles.tipBody}>
              <Text style={styles.tipText}>
                Natural sunlight helps set your baby's circadian rhythm — making nighttime sleep come more naturally. Even 10–15 minutes of indirect daylight (not direct sun on a newborn) makes a real difference.{'\n\n'}
                Bonus: getting outside does wonders for your own mood and energy too. A short walk around the block counts. Fresh air is medicine for both of you.
              </Text>
            </View>
          )}

          {outsideMinutes !== '' && (
            <Pressable style={styles.inlineLogButton} onPress={handleLogOutside}>
              <Feather name="check" size={16} color="#FFFFFF" />
              <Text style={styles.inlineLogText}>Log {outsideMinutes} min</Text>
            </Pressable>
          )}
        </View>

        {/* ── Card 3: Reading (Inspiration) ── */}
        <View style={[styles.activityCard, styles.inspirationCard, shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#E8F5F2' }]}>
              <Feather name="book-open" size={20} color={READING_COLOR} />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Building {babyName || 'Baby'}'s First Library</Text>
              <Text style={styles.cardSubtitle}>It's never too early for stories</Text>
            </View>
          </View>
          <Text style={styles.inspirationBody}>
            Discover our favorite books for this age, or just tell a story
            from your imagination — your voice is the best story there is!
          </Text>
          <Pressable style={styles.inspirationButton} onPress={handleGetBookIdeas}>
            <Feather name="book" size={16} color={READING_COLOR} />
            <Text style={styles.inspirationButtonText}>Get Book Ideas</Text>
            <Feather name="arrow-right" size={16} color={READING_COLOR} />
          </Pressable>
        </View>

        {/* ── Card 4: Sensory Play ── */}
        <View style={[styles.activityCard, shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#F3EFF9' }]}>
              <Feather name="star" size={20} color={SENSORY_COLOR} />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Sensory Play</Text>
              <Text style={styles.cardSubtitle}>Touch, see, explore — build new pathways</Text>
            </View>
          </View>

          <Text style={styles.durationLabel}>Ideas for today</Text>
          {aiLoading ? renderSkeletons() : (
            aiSuggestions?.sensory.map((item) => (
              <SuggestionChip
                key={item.name}
                label={item.name}
                reason={item.reason}
                product={item.product}
                isSelected={selectedSensory.includes(item.name)}
                onPress={() => toggleSelection(item.name, setSelectedSensory)}
                accentColor={SENSORY_COLOR}
              />
            ))
          )}

          {selectedSensory.length > 0 && (
            <Pressable style={styles.inlineLogButton} onPress={handleLogSensory}>
              <Feather name="check" size={16} color="#FFFFFF" />
              <Text style={styles.inlineLogText}>Log Activity</Text>
            </Pressable>
          )}
        </View>

        {/* ── Card 5: Music & Sound ── */}
        <View style={[styles.activityCard, shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#FDF2EB' }]}>
              <Feather name="music" size={20} color={MUSIC_COLOR} />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Music & Sound</Text>
              <Text style={styles.cardSubtitle}>Rhythm, melody, and joyful noise</Text>
            </View>
          </View>

          <Text style={styles.durationLabel}>Sing, shake, or listen</Text>
          {aiLoading ? renderSkeletons() : (
            aiSuggestions?.music.map((item) => (
              <SuggestionChip
                key={item.name}
                label={item.name}
                reason={item.reason}
                product={item.product}
                isSelected={selectedMusic.includes(item.name)}
                onPress={() => toggleSelection(item.name, setSelectedMusic)}
                accentColor={MUSIC_COLOR}
              />
            ))
          )}

          {selectedMusic.length > 0 && (
            <Pressable style={styles.inlineLogButton} onPress={handleLogMusic}>
              <Feather name="check" size={16} color="#FFFFFF" />
              <Text style={styles.inlineLogText}>Log Activity</Text>
            </Pressable>
          )}
        </View>

        {/* Encouragement footer */}
        <Text style={styles.footerText}>
          You don't need expensive toys or perfect activities.{'\n'}
          Being present is the best thing you can do.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ChatSheet
        visible={showChat}
        onClose={() => {
          setShowChat(false);
          setChatInitialMessage(undefined);
        }}
        insight={null}
        babyName={babyName}
        babyAgeDays={age?.chronological.days ?? null}
        feedingMethod={baby?.primary_feeding_method ?? 'unknown'}
        initialMessage={chatInitialMessage}
      />

      <LuminaWhisper
        visible={showWhisper}
        message={whisperMsg}
        onDismiss={() => setShowWhisper(false)}
      />
      <KeyboardDoneBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },

  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Platform.OS === 'ios' ? -spacing.sm : 0,
  },
  backLabel: {
    fontSize: typography.fontSize.md,
    color: colors.primary[600],
    marginLeft: -2,
  },

  // ── AI Suggestion Card ──
  suggestionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['3xl'],
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[400],
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  suggestionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionLabelWrap: {
    flex: 1,
  },
  suggestionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionActivity: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  suggestionTip: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  suggestionActions: {
    marginTop: spacing.md,
  },
  suggestionLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  suggestionLogText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  suggestionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  suggestionFooterText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },

  // ── Activity Cards ──
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // Duration
  durationLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  presetChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  presetText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  presetTextActive: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
  customInputWrap: {
    flex: 1,
  },
  customInput: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'center',
    backgroundColor: colors.neutral[50],
  },

  // Nurse tip toggle
  tipToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tipToggleText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
  },
  tipBody: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  tipText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },

  // ── AI Suggestion Chips ──
  aiChip: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.neutral[50],
  },
  aiChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  aiChipCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiChipTitle: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  aiChipReason: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
    marginLeft: 30,
  },
  aiChipProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
    marginLeft: 30,
  },
  aiChipProduct: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },

  // ── Skeleton Loading ──
  skeletonRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.neutral[100],
  },
  skeletonTitle: {
    width: '60%',
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.neutral[200],
    marginBottom: spacing.sm,
  },
  skeletonReason: {
    width: '90%',
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neutral[200],
  },

  // ── Inline Log Button ──
  inlineLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  inlineLogText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },

  // ── Inspiration Card (Reading) ──
  inspirationCard: {
    borderLeftWidth: 4,
    borderLeftColor: READING_COLOR,
  },
  inspirationBody: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    marginBottom: spacing.base,
  },
  inspirationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#E8F5F2',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  inspirationButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: READING_COLOR,
  },

  // Footer
  footerText: {
    fontFamily: SERIF_FONT,
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    marginTop: spacing.xl,
  },
});

// ============================================================
// Lumina — Knowledge Library + Myth Buster
// Non-linear, age-aware encyclopedia for baby care
// with "Common Misconceptions" accordion section
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LIBRARY_CATEGORIES, STAGE_FEATURED } from '../../../src/modules/guide/guideData';
import type { LibraryCard, LibraryCategory, ApplicableAge } from '../../../src/modules/guide/guideData';
import { MYTHS_DATABASE } from '../guide/myths';
import { ChatSheet } from '../../../src/modules/insights/components/ChatSheet';
import { VisualGuide } from '../../../src/modules/insights/components/VisualGuide';
import { useDashboardData } from '../../../src/modules/dashboard/hooks/useDashboardData';
import type { VisualGuide as VisualGuideData } from '../../../src/modules/insights/types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Claymorphism design tokens ───────────────────────────────
const UI = {
  bg: '#F0EDE8',
  card: '#FFFFFF',
  text: '#3D3D3D',
  textSecondary: '#5C5C5C',
  textMuted: '#8A8A8A',
  textLight: '#B0AAA2',
  pillBg: '#F0EDE8',
  pillBgActive: '#A78BBA',
  pillText: '#6B6560',
  pillTextActive: '#FFFFFF',
  stageBg: '#F5F0FA',
  stageAccent: '#A78BBA',
  mythAmber: '#B8860B',
  mythAmberBg: '#FDF6E8',
  mythAmberBorder: '#F0E0C0',
  factGreen: '#4A8C5E',
  factGreenBg: '#EFF8F2',
  factGreenBorder: '#D0E8D6',
  sourceBlue: '#5A7A9E',
  sourceBlueBg: '#EEF3F8',
};

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

// ── Today's Insight (migrated from Daily) ────────────────────

interface SmartSuggestion {
  id: string;
  title: string;
  snippet: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  tint: string;
  visualGuide?: VisualGuideData;
}

function generateSmartSuggestions(
  ageDays: number | null,
  totalFeeds: number,
  sleepHours: number | null,
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  const weeks = ageDays ? Math.floor(ageDays / 7) : 0;

  if (weeks <= 2) {
    suggestions.push({
      id: 'colostrum',
      title: 'Early feeding patterns',
      snippet: 'Newborns feed 8-12 times a day. Cluster feeding in the evening is completely normal and helps establish your supply.',
      icon: 'droplet',
      tint: '#A08B6E',
      visualGuide: {
        type: 'step_by_step',
        media_url: 'https://placeholder.lumina.app/guides/early-feeding',
        action_text: 'Early feeding basics',
        steps: [
          { step: 1, instruction: 'Watch for feeding cues: rooting, lip smacking, hand-to-mouth', icon: 'eye' },
          { step: 2, instruction: 'Feed on demand — don\'t wait for crying', icon: 'clock' },
          { step: 3, instruction: 'Track wet diapers: 6+ per day by day 4 means adequate intake', icon: 'check-circle' },
        ],
      },
    });
    suggestions.push({
      id: 'newborn-sleep',
      title: 'Newborn sleep basics',
      snippet: 'Expect 14-17 hours of sleep in short bursts. Day-night confusion is normal and typically resolves by 6-8 weeks.',
      icon: 'moon',
      tint: '#A78BBA',
    });
  } else if (weeks <= 6) {
    suggestions.push({
      id: 'growth-spurt',
      title: 'Growth spurt window',
      snippet: 'Around 3-6 weeks, babies often have their first major growth spurt. Increased fussiness and feeding are normal signs.',
      icon: 'trending-up',
      tint: '#A78BBA',
    });
  } else if (weeks <= 12) {
    suggestions.push({
      id: 'social-smile',
      title: 'Social milestones emerging',
      snippet: 'Between 6-12 weeks, watch for your baby\'s first social smile — a real response to your face, not just a reflex.',
      icon: 'smile',
      tint: '#9B7DB8',
    });
  } else if (weeks <= 20) {
    suggestions.push({
      id: 'routine',
      title: 'Building a flexible routine',
      snippet: 'Around 3-4 months, babies start showing predictable patterns. Follow their cues rather than the clock.',
      icon: 'clock',
      tint: '#A08B6E',
    });
  }

  if (sleepHours !== null && sleepHours < 3) {
    suggestions.push({
      id: 'low-sleep',
      title: 'Managing wake windows',
      snippet: 'Short on sleep today? Watch for drowsy cues — yawning, eye rubbing, looking away. Catching the window early makes settling easier.',
      icon: 'eye',
      tint: '#C4943A',
      visualGuide: {
        type: 'step_by_step',
        media_url: 'https://placeholder.lumina.app/guides/wake-windows',
        action_text: 'Spotting drowsy cues',
        steps: [
          { step: 1, instruction: 'Watch for yawning, eye rubbing, or looking away', icon: 'eye' },
          { step: 2, instruction: 'Start wind-down routine immediately when cues appear', icon: 'moon' },
          { step: 3, instruction: 'Dim lights, reduce stimulation, gentle rocking', icon: 'sun' },
        ],
      },
    });
  }

  if (totalFeeds >= 10) {
    suggestions.push({
      id: 'cluster-feed',
      title: 'Cluster feeding is normal',
      snippet: 'High feeding frequency often signals a growth spurt or comfort nursing. Both are healthy and help regulate supply.',
      icon: 'repeat',
      tint: '#A08B6E',
    });
  }

  suggestions.push({
    id: 'parent-care',
    title: 'A moment for you',
    snippet: 'Parental wellbeing matters. Even 5 minutes of quiet breathing or a warm drink can help reset your nervous system.',
    icon: 'heart',
    tint: '#C47A7A',
  });

  return suggestions;
}

function SuggestionCard({
  suggestion,
  onAskAI,
}: {
  suggestion: SmartSuggestion;
  onAskAI: (suggestion: SmartSuggestion) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  return (
    <View style={styles.suggestionCard}>
      <View style={styles.suggestionLeft}>
        <View style={[styles.suggestionIconWrap, { backgroundColor: suggestion.tint + '15' }]}>
          <Feather name={suggestion.icon} size={18} color={suggestion.tint} />
        </View>
      </View>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
        <Text
          style={styles.suggestionSnippet}
          numberOfLines={expanded ? undefined : 2}
        >
          {suggestion.snippet}
        </Text>
        <Pressable onPress={toggleExpand} hitSlop={6}>
          <Text style={styles.readMoreText}>
            {expanded ? 'Show less' : 'Read more'}
          </Text>
        </Pressable>
        {expanded && (
          <>
            {suggestion.visualGuide && (
              <View style={styles.expandedVisualGuide}>
                <VisualGuide guide={suggestion.visualGuide} />
              </View>
            )}
            <Pressable
              style={styles.askAIButton}
              onPress={() => onAskAI(suggestion)}
              hitSlop={4}
            >
              <Feather name="message-circle" size={14} color={UI.stageAccent} />
              <Text style={styles.askAIText}>Ask Lumina about this</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

// ── Myth Carousel Preview Card ───────────────────────────────

function MythPreviewCard({
  myth,
  onPress,
}: {
  myth: typeof MYTHS_DATABASE[number];
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.mythCarouselCard,
        CLAY_SHADOW,
        pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
      ]}
      onPress={onPress}
    >
      <View style={[styles.mythCarouselIcon, { backgroundColor: UI.mythAmberBg }]}>
        <Feather name="help-circle" size={16} color={UI.mythAmber} />
      </View>
      <View style={styles.mythCarouselBadge}>
        <Text style={styles.mythCarouselBadgeText}>DID YOU KNOW?</Text>
      </View>
      <Text style={styles.mythCarouselTitle} numberOfLines={2}>{myth.myth}</Text>
      <View style={styles.mythCarouselFooter}>
        <Text style={styles.mythCarouselCategory}>
          {myth.category.charAt(0).toUpperCase() + myth.category.slice(1)}
        </Text>
        <Feather name="arrow-right" size={12} color={UI.textLight} />
      </View>
    </Pressable>
  );
}

// ── Filter pill data ─────────────────────────────────────────
const FILTERS = [
  { id: 'all', label: 'All', icon: 'grid' as const },
  { id: 'soothing', label: '4th Tri', icon: 'wind' as const },
  { id: 'brain', label: 'Brain', icon: 'zap' as const },
  { id: 'sleep', label: 'Sleep', icon: 'moon' as const },
  { id: 'feeding', label: 'Feeding', icon: 'droplet' as const },
  { id: 'health', label: 'Health', icon: 'shield' as const },
];

// ── Mock: current baby stage (replace with real data later) ──
const MOCK_STAGE: ApplicableAge = '0-3m';

// ── Geometric decoration (soft abstract shape behind icon) ───
function GeoDecoration({ color }: { color: string }) {
  return (
    <View style={styles.geoContainer}>
      <View style={[styles.geoCircle, { backgroundColor: color + '12' }]} />
      <View style={[styles.geoDiamond, { backgroundColor: color + '08' }]} />
    </View>
  );
}

// ── Featured Stage Card (horizontal scroll item) ─────────────

function FeaturedCard({
  card,
  onPress,
}: {
  card: LibraryCard;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.featuredCard,
        CLAY_SHADOW,
        pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
      ]}
      onPress={onPress}
    >
      <View style={[styles.featuredIconWrap, { backgroundColor: card.accentColor + '14' }]}>
        <Feather name={card.icon as any} size={20} color={card.accentColor} />
      </View>
      <Text style={styles.featuredTitle} numberOfLines={2}>{card.title}</Text>
      <Text style={styles.featuredSubtitle} numberOfLines={2}>{card.subtitle}</Text>
      <View style={styles.featuredFooter}>
        <Text style={[styles.featuredAge, { color: card.accentColor }]}>
          {formatAge(card.applicableAge)}
        </Text>
        <Feather name="arrow-right" size={12} color={UI.textLight} />
      </View>
    </Pressable>
  );
}

function formatAge(age: ApplicableAge): string {
  switch (age) {
    case '0-3m': return '0-3 months';
    case '3-6m': return '3-6 months';
    case '6-12m': return '6-12 months';
    case '12m+': return '12+ months';
    default: return 'All ages';
  }
}

// ── Library Card Component ───────────────────────────────────

function LibraryCardView({
  card,
  onPress,
}: {
  card: LibraryCard;
  onPress: () => void;
}) {
  const freeCount = card.articles.filter((a) => !a.locked).length;
  const totalCount = card.articles.length;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        card.isMaster && styles.cardMaster,
        card.isHighlighted && styles.cardHighlighted,
        CLAY_SHADOW,
        pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] },
      ]}
      onPress={onPress}
    >
      {card.isHighlighted && (
        <View style={[styles.highlightStrip, { backgroundColor: card.accentColor }]} />
      )}
      {card.isMaster && (
        <View style={[styles.masterTab, { backgroundColor: card.accentColor + '18' }]}>
          <Feather name="folder" size={10} color={card.accentColor} />
          <Text style={[styles.masterTabText, { color: card.accentColor }]}>Collection</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={[styles.iconArea, { backgroundColor: card.cardBg }]}>
          <GeoDecoration color={card.accentColor} />
          <Feather
            name={card.icon as any}
            size={card.isMaster ? 26 : 22}
            color={card.accentColor}
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>{card.subtitle}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardCount}>
              {freeCount > 0
                ? `${freeCount} free of ${totalCount} guides`
                : `${totalCount} guides`}
            </Text>
            <Feather name="chevron-right" size={14} color={UI.textLight} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ── Section Header ───────────────────────────────────────────

function SectionHeader({ category }: { category: LibraryCategory }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: category.accentColor + '14' }]}>
        <Feather name={category.icon as any} size={14} color={category.accentColor} />
      </View>
      <Text style={styles.sectionTitle}>{category.title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function GuideScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  const [showChat, setShowChat] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>();

  const { babyAge, totalFeedsToday, sleepSummary, babyName } = useDashboardData();
  const babyAgeDays = babyAge?.days ?? null;
  const sleepHours = sleepSummary?.total_sleep_hours ?? null;
  const smartSuggestions = useMemo(
    () => generateSmartSuggestions(babyAgeDays, totalFeedsToday, sleepHours),
    [babyAgeDays, totalFeedsToday, sleepHours],
  );

  const allCards = useMemo(() =>
    LIBRARY_CATEGORIES.flatMap((cat) => cat.cards),
  []);

  const featuredCards = useMemo(() => {
    const ids = STAGE_FEATURED[MOCK_STAGE] ?? STAGE_FEATURED.all;
    return ids
      .map((id) => allCards.find((c) => c.id === id))
      .filter(Boolean) as LibraryCard[];
  }, [allCards]);

  const filteredCategories = useMemo(() => {
    return activeFilter === 'all'
      ? LIBRARY_CATEGORIES
      : LIBRARY_CATEGORIES.filter((cat) => cat.id === activeFilter);
  }, [activeFilter]);

  const mythsPreview = MYTHS_DATABASE.slice(0, 5);

  const openTopicHub = (cardId: string) => {
    router.push({
      pathname: '/(app)/guide/[topicId]',
      params: { topicId: cardId },
    });
  };

  const showMyths = activeFilter === 'all' || activeFilter === 'health';

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Today's Insight ── */}
        {smartSuggestions.length > 0 && (
          <View style={styles.insightSection}>
            <View style={styles.insightHeader}>
              <Feather name="sunrise" size={13} color={UI.stageAccent} />
              <Text style={styles.insightLabel}>Today's Insight</Text>
            </View>
            {smartSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAskAI={(s) => {
                  setChatInitialMessage(`Tell me more about: ${s.title}`);
                  setShowChat(true);
                }}
              />
            ))}
          </View>
        )}

        {/* ── Featured: For Baby's Stage ── */}
        <View style={styles.stageSection}>
          <View style={styles.stageLabelRow}>
            <Feather name="star" size={13} color={UI.stageAccent} />
            <Text style={styles.stageLabel}>Current Focus</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredRow}
          >
            {featuredCards.map((card) => (
              <FeaturedCard
                key={card.id}
                card={card}
                onPress={() => openTopicHub(card.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── Filter Pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <Pressable
                key={f.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(f.id)}
              >
                <Feather
                  name={f.icon}
                  size={13}
                  color={isActive ? UI.pillTextActive : UI.pillText}
                />
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Category Sections ── */}
        {filteredCategories.map((category) => (
          <View key={category.id} style={styles.section}>
            <SectionHeader category={category} />
            {category.cards.map((card) => (
              <LibraryCardView
                key={card.id}
                card={card}
                onPress={() => openTopicHub(card.id)}
              />
            ))}
          </View>
        ))}

        {/* ── Myth Buster Carousel ── */}
        {showMyths && mythsPreview.length > 0 && (
          <View style={styles.mythSection}>
            <View style={styles.mythSectionHeader}>
              <View style={styles.mythSectionLeft}>
                <Feather name="help-circle" size={13} color={UI.mythAmber} />
                <Text style={styles.mythSectionTitle}>Common Misconceptions</Text>
              </View>
              <Pressable
                style={styles.seeAllButton}
                onPress={() => router.push('/(app)/guide/myths')}
                hitSlop={8}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Feather name="chevron-right" size={14} color={UI.stageAccent} />
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mythCarouselRow}
            >
              {mythsPreview.map((myth) => (
                <MythPreviewCard
                  key={myth.id}
                  myth={myth}
                  onPress={() => router.push({
                    pathname: '/(app)/guide/myths',
                    params: { expandId: myth.id },
                  })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Scientific Sources Footer ── */}
        <View style={styles.sourcesFooter}>
          <View style={styles.sourcesIconRow}>
            <View style={styles.sourcesBadge}>
              <Feather name="award" size={14} color={UI.sourceBlue} />
            </View>
          </View>
          <Text style={styles.sourcesTitle}>Scientific Sources</Text>
          <Text style={styles.sourcesBody}>
            All content in the Lumina Guide is based on peer-reviewed research and guidelines from leading health organizations:
          </Text>
          <View style={styles.sourcesList}>
            {[
              { abbr: 'WHO', name: 'World Health Organization' },
              { abbr: 'AAP', name: 'American Academy of Pediatrics' },
              { abbr: 'NHS', name: 'National Health Service (UK)' },
              { abbr: 'UNICEF', name: 'United Nations Children\'s Fund' },
              { abbr: 'AAPD', name: 'American Academy of Pediatric Dentistry' },
              { abbr: 'CDC', name: 'Centers for Disease Control and Prevention' },
              { abbr: 'FDA', name: 'U.S. Food and Drug Administration' },
            ].map((org) => (
              <View key={org.abbr} style={styles.sourceItem}>
                <View style={styles.sourceAbbr}>
                  <Text style={styles.sourceAbbrText}>{org.abbr}</Text>
                </View>
                <Text style={styles.sourceOrgName}>{org.name}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.sourcesDisclaimer}>
            This guide is for informational purposes only and does not replace professional medical advice. Always consult your pediatrician for concerns about your child's health.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <ChatSheet
        visible={showChat}
        onClose={() => { setShowChat(false); setChatInitialMessage(undefined); }}
        insight={null}
        babyName={babyName ?? null}
        babyAgeDays={babyAgeDays}
        feedingMethod=""
        initialMessage={chatInitialMessage}
      />
    </SafeAreaView>
  );
}

// ── Main Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ── Today's Insight ──
  insightSection: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  insightLabel: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: UI.text,
    letterSpacing: -0.1,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  suggestionLeft: {},
  suggestionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: UI.text,
    marginBottom: 4,
  },
  suggestionSnippet: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: UI.textSecondary,
    lineHeight: 20,
  },
  readMoreText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: UI.stageAccent,
    marginTop: 4,
  },
  expandedVisualGuide: {
    marginTop: 10,
  },
  askAIButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
  },
  askAIText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: UI.stageAccent,
  },

  // ── Stage Featured Section ──
  stageSection: {
    marginTop: 18,
  },
  stageLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  stageLabel: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: UI.text,
    letterSpacing: -0.1,
  },
  featuredRow: {
    paddingHorizontal: 20,
    gap: 12,
  },
  featuredCard: {
    width: 160,
    backgroundColor: UI.card,
    borderRadius: 32,
    padding: 16,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  featuredIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featuredTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: UI.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: UI.textMuted,
    lineHeight: 15,
    marginBottom: 8,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredAge: {
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
    letterSpacing: 0.2,
  },

  // ── Filter Pills ──
  filterScroll: {
    marginTop: 20,
    marginBottom: 4,
  },
  filterRow: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#EDE9E4',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    borderLeftColor: 'rgba(0,0,0,0.03)',
    borderBottomColor: 'rgba(255,255,255,0.8)',
    borderRightColor: 'rgba(255,255,255,0.5)',
  },
  filterPillActive: {
    backgroundColor: UI.pillBgActive,
  },
  filterPillText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: UI.pillText,
  },
  filterPillTextActive: {
    color: UI.pillTextActive,
  },

  // ── Section ──
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: UI.text,
    letterSpacing: -0.2,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E4DE',
    marginLeft: 8,
  },

  // ── Card (Clay) ──
  card: {
    backgroundColor: UI.card,
    borderRadius: 32,
    marginBottom: 12,
    overflow: 'hidden',
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  cardMaster: {
    borderTopWidth: 2,
    borderTopColor: 'rgba(167,139,186,0.25)',
  },
  cardHighlighted: {
    borderWidth: 0,
  },
  highlightStrip: {
    height: 3,
    width: '100%',
  },
  masterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomRightRadius: 20,
  },
  masterTabText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },

  // ── Icon Area ──
  iconArea: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  geoContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  geoCircle: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  geoDiamond: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 20,
    height: 20,
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
  },

  // ── Card Content ──
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: UI.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: UI.textMuted,
    lineHeight: 17,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardCount: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    color: UI.textLight,
    letterSpacing: 0.2,
  },

  // ── Myth Carousel ──
  mythSection: {
    marginTop: 18,
  },
  mythSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  mythSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mythSectionTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: UI.text,
    letterSpacing: -0.1,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: UI.stageAccent,
  },
  mythCarouselRow: {
    paddingHorizontal: 20,
    gap: 12,
  },
  mythCarouselCard: {
    width: 160,
    backgroundColor: UI.card,
    borderRadius: 32,
    padding: 16,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  mythCarouselIcon: {
    width: 36,
    height: 36,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  mythCarouselBadge: {
    backgroundColor: UI.mythAmberBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: UI.mythAmberBorder,
  },
  mythCarouselBadgeText: {
    fontSize: 9,
    fontFamily: 'Nunito_700Bold',
    color: UI.mythAmber,
    letterSpacing: 0.8,
  },
  mythCarouselTitle: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: UI.text,
    lineHeight: 17,
    marginBottom: 8,
  },
  mythCarouselFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mythCarouselCategory: {
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
    color: UI.mythAmber,
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },

  // ── Scientific Sources Footer ──
  sourcesFooter: {
    marginTop: 32,
    marginHorizontal: 20,
    backgroundColor: UI.sourceBlueBg,
    borderRadius: 32,
    padding: 22,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  sourcesIconRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sourcesBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(90,122,158,0.2)',
  },
  sourcesTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#3A5A7A',
    textAlign: 'center',
    marginBottom: 8,
  },
  sourcesBody: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#5A7A9E',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  sourcesList: {
    gap: 8,
    marginBottom: 16,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sourceAbbr: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(90,122,158,0.15)',
    minWidth: 48,
    alignItems: 'center',
  },
  sourceAbbrText: {
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    color: '#3A5A7A',
    letterSpacing: 0.3,
  },
  sourceOrgName: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#5A7A9E',
  },
  sourcesDisclaimer: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: '#8A9DB0',
    lineHeight: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

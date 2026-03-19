// ============================================================
// Lumina — Knowledge Library
// Non-linear, age-aware encyclopedia for baby care
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LIBRARY_CATEGORIES, STAGE_FEATURED } from '../../../src/modules/guide/guideData';
import type { LibraryCard, LibraryCategory, ApplicableAge } from '../../../src/modules/guide/guideData';
import { CardIllustrationMap } from '../../../src/shared/components/CardIllustrations';
import { ClayIcon } from '../../../src/shared/components/ClayIcons';

// ── Design tokens ────────────────────────────────────────────
const UI = {
  bg: '#F7F4F0',
  card: '#FFFFFF',
  text: '#2D2A26',
  textSecondary: '#5C5C5C',
  textMuted: '#A08060',
  textLight: '#A08060',
  pillBg: '#F7F4F0',
  pillBgActive: '#EDE7F6',
  pillText: '#5C5C5C',
  pillTextActive: '#7B5EA7',
  pillBorderActive: '#B199CE',
  stageBg: '#F7F4F0',
  stageAccent: '#7C9A8E',
  sectionTitle: '#8A8A8A',
  link: '#7C9A8E',
  cta: '#7C9A8E',
  inputBg: '#F7F4F0',
  inputBorder: '#EDE8E2',
};

const CLAY_SHADOW = {
  shadowColor: '#B0A090',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 14,
  elevation: 4,
};

// ── Map feather icon names to clay illustration keys ─────────
const ICON_TO_ILLUSTRATION: Record<string, string> = {
  heart: 'health',
  shield: 'health',
  'alert-triangle': 'health',
  clipboard: 'health',
  moon: 'sleep',
  sun: 'sleep',
  feather: 'sleep',
  'trending-up': 'growth',
  zap: 'activity',
  cpu: 'activity',
  link: 'activity',
  droplet: 'feeding',
  'battery-charging': 'feeding',
  sunset: 'feeding',
  coffee: 'feeding',
  'volume-2': 'activity',
  cloud: 'sleep',
  wind: 'activity',
};

// ── Map category ids to clay icon names ──────────────────────
const CATEGORY_TO_CLAY_ICON: Record<string, string> = {
  soothing: 'music',
  brain: 'book',
  sleep: 'moon-night',
  feeding: 'bottle',
  health: 'thermometer',
};

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
const MOCK_BABY_NAME = 'Baby';
const MOCK_STAGE: ApplicableAge = '0-3m';

// ── Render clay illustration or fallback to Feather icon ─────
function renderCardIcon(iconName: string, size: number, accentColor: string) {
  const illustrationKey = ICON_TO_ILLUSTRATION[iconName];
  const Illustration = illustrationKey ? CardIllustrationMap[illustrationKey] : null;
  if (Illustration) {
    return <Illustration size={size} />;
  }
  return <Feather name={iconName as any} size={size} color={accentColor} />;
}

function renderCategoryIcon(categoryId: string, fallbackIcon: string, size: number, accentColor: string) {
  const clayIconName = CATEGORY_TO_CLAY_ICON[categoryId];
  if (clayIconName) {
    return <ClayIcon name={clayIconName as any} size={size} />;
  }
  return <Feather name={fallbackIcon as any} size={size} color={accentColor} />;
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
      <View style={styles.featuredIconWrap}>
        {renderCardIcon(card.icon, 32, card.accentColor)}
      </View>
      <Text style={styles.featuredTitle} numberOfLines={2}>{card.title}</Text>
      <Text style={styles.featuredSubtitle} numberOfLines={2}>{card.subtitle}</Text>
      <View style={styles.featuredFooter}>
        <Text style={[styles.featuredAge, { color: UI.link }]}>
          {formatAge(card.applicableAge)}
        </Text>
        <Feather name="arrow-right" size={12} color={UI.link} />
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
      {/* Highlighted accent strip */}
      {card.isHighlighted && (
        <View style={[styles.highlightStrip, { backgroundColor: card.accentColor }]} />
      )}

      {/* Master folder indicator */}
      {card.isMaster && (
        <View style={[styles.masterTab, { backgroundColor: card.accentColor + '18' }]}>
          <Feather name="folder" size={10} color={card.accentColor} />
          <Text style={[styles.masterTabText, { color: card.accentColor }]}>Collection</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        {/* Icon area — clay illustration, no background */}
        <View style={styles.iconArea}>
          {renderCardIcon(card.icon, card.isMaster ? 44 : 38, card.accentColor)}
        </View>

        {/* Text content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>{card.subtitle}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardCount}>
              {freeCount > 0
                ? `${freeCount} free of ${totalCount} guides`
                : `${totalCount} guides`}
            </Text>
            <Feather name="chevron-right" size={14} color={UI.link} />
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
      <View style={styles.sectionIconWrap}>
        {renderCategoryIcon(category.id, category.icon, 20, category.accentColor)}
      </View>
      <Text style={styles.sectionTitle}>{category.title.toUpperCase()}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function GuideScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');

  // Collect all cards flat for featured lookup
  const allCards = useMemo(() =>
    LIBRARY_CATEGORIES.flatMap((cat) => cat.cards),
  []);

  // Featured cards for current stage
  const featuredCards = useMemo(() => {
    const ids = STAGE_FEATURED[MOCK_STAGE] ?? STAGE_FEATURED.all;
    return ids
      .map((id) => allCards.find((c) => c.id === id))
      .filter(Boolean) as LibraryCard[];
  }, [allCards]);

  const filteredCategories = useMemo(() => {
    if (activeFilter === 'all') return LIBRARY_CATEGORIES;
    return LIBRARY_CATEGORIES.filter((cat) => cat.id === activeFilter);
  }, [activeFilter]);

  const openTopicHub = (cardId: string) => {
    router.push({
      pathname: '/(app)/guide/[topicId]',
      params: { topicId: cardId },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Knowledge Library</Text>
          <Text style={styles.headerSubtitle}>
            Expert guides for every stage, at your own pace
          </Text>
        </View>

        {/* ── Featured: For Baby's Stage ── */}
        <View style={styles.stageSection}>
          <View style={styles.stageLabelRow}>
            <Feather name="star" size={13} color={UI.stageAccent} />
            <Text style={styles.stageLabel}>
              CURRENT FOCUS
            </Text>
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
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter(f.id)}
              >
                <Feather
                  name={f.icon}
                  size={13}
                  color={isActive ? UI.pillTextActive : UI.pillText}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
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

        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingBottom: 20,
  },

  // ── Header ──
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: UI.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: UI.textMuted,
    lineHeight: 21,
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
    fontSize: 13,
    fontWeight: '700',
    color: UI.sectionTitle,
    letterSpacing: 0.8,
  },
  featuredRow: {
    paddingHorizontal: 20,
    gap: 12,
  },
  featuredCard: {
    width: 160,
    backgroundColor: UI.card,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  featuredIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: UI.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: UI.textSecondary,
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
    fontWeight: '600',
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
    borderRadius: 22,
    backgroundColor: UI.pillBg,
    borderWidth: 1,
    borderColor: UI.inputBorder,
  },
  filterPillActive: {
    backgroundColor: UI.pillBgActive,
    borderColor: UI.pillBorderActive,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: UI.sectionTitle,
    letterSpacing: 0.8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: UI.inputBorder,
    marginLeft: 8,
  },

  // ── Card ──
  card: {
    backgroundColor: UI.card,
    borderRadius: 22,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  cardMaster: {
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,186,0.2)',
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
    borderBottomRightRadius: 10,
  },
  masterTabText: {
    fontSize: 10,
    fontWeight: '700',
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
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Card Content ──
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: UI.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: UI.textSecondary,
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
    fontWeight: '600',
    color: UI.textMuted,
    letterSpacing: 0.2,
  },
});

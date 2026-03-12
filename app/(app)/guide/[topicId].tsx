// ============================================================
// Lumina — Topic Hub (Full-Screen)
// MasterClass/Headspace-style topic page with hero + article list
// ============================================================

import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { DISCOVERY_NODES, TAG_COLORS } from '../../../src/modules/guide/guideData';
import type { GuideArticle } from '../../../src/modules/guide/guideData';

const UI = {
  bg: '#F7F4F0',
  card: '#FFFFFF',
  text: '#3D3D3D',
  textSecondary: '#5C5C5C',
  textMuted: '#8A8A8A',
  textLight: '#B0AAA2',
  lockedBg: '#FAF9F7',
  proBg: '#F5F0E8',
  proText: '#9A8260',
};

const SOFT_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 3,
};

export default function TopicHubScreen() {
  const router = useRouter();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();

  const topic = DISCOVERY_NODES.find((n) => n.id === topicId);

  if (!topic) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
          <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={UI.text} />
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Topic not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const freeCount = topic.articles.filter((a) => !a.locked).length;
  const totalCount = topic.articles.length;

  const openArticle = (article: GuideArticle) => {
    if (article.locked) return;
    router.push({
      pathname: '/(app)/article/[id]',
      params: {
        id: article.id,
        title: article.title,
        body: article.body,
        label: article.tag,
        icon: 'book-open',
        accentColor: topic.accentColor,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Back button (floating over hero) ── */}
        <Pressable style={[styles.backButton, styles.backButtonFloating, SOFT_SHADOW]} onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={UI.text} />
        </Pressable>

        {/* ── Hero Section ── */}
        <View style={[styles.hero, { backgroundColor: topic.accentColor + '14' }]}>
          <Text style={styles.heroEmoji}>{topic.icon}</Text>
          <Text style={styles.heroBadge}>{topic.badge}</Text>
          <Text style={styles.heroTitle}>{topic.title}</Text>
          <Text style={styles.heroSubtitle}>{topic.subtitle}</Text>
          <View style={styles.heroMeta}>
            <View style={[styles.heroMetaPill, { backgroundColor: topic.accentColor + '20' }]}>
              <Feather name="award" size={12} color={topic.accentColor} />
              <Text style={[styles.heroMetaText, { color: topic.accentColor }]}>
                Comprehensive Masterclass
              </Text>
            </View>
          </View>
          <Text style={styles.heroChapterCount}>
            {totalCount} expert chapters
          </Text>
        </View>

        {/* ── Free Guides ── */}
        <View style={styles.articleSection}>
          <Text style={styles.sectionLabel}>AVAILABLE NOW</Text>
          {topic.articles.filter((a) => !a.locked).map((article, index) => {
            const tagStyle = TAG_COLORS[article.tag] ?? { bg: '#F0EDE8', text: '#7A7060' };
            return (
              <Pressable
                key={article.id}
                style={[styles.articleRow, SOFT_SHADOW]}
                onPress={() => openArticle(article)}
              >
                <View style={[styles.articleNumber, { backgroundColor: topic.accentColor + '12' }]}>
                  <Text style={[styles.articleNumberText, { color: topic.accentColor }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.articleContent}>
                  <View style={styles.articleTagRow}>
                    <View style={[styles.articleTag, { backgroundColor: tagStyle.bg }]}>
                      <Text style={[styles.articleTagText, { color: tagStyle.text }]}>
                        {article.tag}
                      </Text>
                    </View>
                    <Text style={styles.articleTime}>{article.readTime}</Text>
                  </View>
                  <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
                  <Text style={styles.articleSummary} numberOfLines={2}>{article.summary}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={UI.textLight} />
              </Pressable>
            );
          })}
        </View>

        {/* ── Locked Premium Guides ── */}
        {topic.articles.some((a) => a.locked) && (
          <View style={styles.articleSection}>
            <View style={styles.proSectionHeader}>
              <Text style={styles.sectionLabel}>COMING IN PRO</Text>
              <View style={styles.proPill}>
                <Feather name="star" size={10} color={UI.proText} />
                <Text style={styles.proText}>PRO</Text>
              </View>
            </View>
            {topic.articles.filter((a) => a.locked).map((article, index) => {
              const tagStyle = TAG_COLORS[article.tag] ?? { bg: '#F0EDE8', text: '#7A7060' };
              return (
                <View
                  key={article.id}
                  style={[styles.articleRow, styles.articleRowLocked, SOFT_SHADOW]}
                >
                  <View style={[styles.articleNumber, { backgroundColor: '#F0EDE8' }]}>
                    <Feather name="lock" size={14} color={UI.textLight} />
                  </View>
                  <View style={[styles.articleContent, { opacity: 0.6 }]}>
                    <View style={styles.articleTagRow}>
                      <View style={[styles.articleTag, { backgroundColor: tagStyle.bg }]}>
                        <Text style={[styles.articleTagText, { color: tagStyle.text }]}>
                          {article.tag}
                        </Text>
                      </View>
                      <Text style={styles.articleTime}>{article.readTime}</Text>
                    </View>
                    <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
                    <Text style={styles.articleSummary} numberOfLines={2}>{article.summary}</Text>
                  </View>
                  <Feather name="lock" size={14} color={UI.textLight} />
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ── Back Button ──
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: UI.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonFloating: {
    position: 'absolute',
    top: 16,
    left: 20,
    zIndex: 10,
  },

  // ── Hero ──
  hero: {
    paddingTop: 72,
    paddingBottom: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
  },
  heroEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  heroBadge: {
    fontSize: 20,
    position: 'absolute',
    top: 72,
    right: 28,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: UI.text,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: UI.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroMetaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroChapterCount: {
    fontSize: 12,
    fontWeight: '500',
    color: UI.textMuted,
    marginTop: 10,
    letterSpacing: 0.2,
  },

  // ── Article Section ──
  articleSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: UI.textLight,
    letterSpacing: 1.2,
    marginBottom: 14,
    marginLeft: 4,
  },
  proSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    marginLeft: 4,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: UI.proBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  proText: {
    fontSize: 9,
    fontWeight: '800',
    color: UI.proText,
    letterSpacing: 0.8,
  },

  // ── Article Row ──
  articleRow: {
    backgroundColor: UI.card,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  articleRowLocked: {
    backgroundColor: UI.lockedBg,
  },
  articleNumber: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleNumberText: {
    fontSize: 15,
    fontWeight: '700',
  },
  articleContent: {
    flex: 1,
  },
  articleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  articleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  articleTagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  articleTime: {
    fontSize: 11,
    fontWeight: '500',
    color: UI.textLight,
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: UI.text,
    lineHeight: 20,
    marginBottom: 3,
  },
  articleSummary: {
    fontSize: 12,
    fontWeight: '400',
    color: UI.textMuted,
    lineHeight: 17,
  },

  // ── Empty State ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: UI.textMuted,
  },
});

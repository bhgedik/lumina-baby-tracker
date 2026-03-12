// ============================================================
// Lumina — Guide (Interactive Parenting Map)
// A warm, editorial journey of discovery nodes.
// Polaroid-style cards along a winding path.
// ============================================================

import React from 'react';
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
import { useDashboardData } from '../../../src/modules/dashboard/hooks/useDashboardData';
import { DISCOVERY_NODES } from '../../../src/modules/guide/guideData';
import type { DiscoveryNode } from '../../../src/modules/guide/guideData';

// ── Design tokens ────────────────────────────────────────────
const UI = {
  bg: '#F7F4F0',
  card: '#FFFFFF',
  text: '#3D3D3D',
  textSecondary: '#5C5C5C',
  textMuted: '#8A8A8A',
  textLight: '#B0AAA2',
  accent: '#8BA88E',
  accentDark: '#5E8A72',
  pathLine: '#DDD8D0',
  pathNode: '#C8C2B8',
  pathNodeActive: '#5E8A72',
  glow: '#F5E6C8',
};

const SOFT_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.06,
  shadowRadius: 20,
  elevation: 3,
};


// ── Polaroid Card Rotations (alternating slight tilts) ───────
const ROTATIONS = ['-1.5deg', '1.2deg', '-0.8deg', '1.5deg', '-1deg'];

// ── Discovery Card Component ────────────────────────────────

function DiscoveryCard({
  node,
  index,
  onPress,
}: {
  node: DiscoveryNode;
  index: number;
  onPress: () => void;
}) {
  const isRight = index % 2 === 1;
  const rotation = ROTATIONS[index % ROTATIONS.length];

  return (
    <View style={[styles.discoveryRow, isRight && styles.discoveryRowRight]}>
      <Pressable
        style={[
          styles.polaroidCard,
          { backgroundColor: node.cardBg, transform: [{ rotate: rotation }] },
          SOFT_SHADOW,
        ]}
        onPress={onPress}
      >
        {/* Image area (color block + large icon) */}
        <View style={[styles.polaroidImageArea, { backgroundColor: node.accentColor + '18' }]}>
          <Text style={styles.polaroidEmoji}>{node.icon}</Text>
          <View style={styles.polaroidBadge}>
            <Text style={styles.polaroidBadgeText}>{node.badge}</Text>
          </View>
        </View>

        {/* Caption area */}
        <View style={styles.polaroidCaption}>
          <Text style={styles.polaroidTitle}>{node.title}</Text>
          <Text style={styles.polaroidSubtitle}>{node.subtitle}</Text>
          <View style={styles.polaroidMeta}>
            <Text style={styles.polaroidArticleCount}>
              {node.articles.length} guides
            </Text>
            <Feather name="chevron-right" size={16} color={UI.textLight} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function GuideScreen() {
  const router = useRouter();
  const { parentName } = useDashboardData();
  const displayName = parentName || 'there';

  const openTopicHub = (topicId: string) => {
    router.push({
      pathname: '/(app)/guide/[topicId]',
      params: { topicId },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Lumina Greeting Card ── */}
        <View style={[styles.greetingCard, SOFT_SHADOW]}>
          <View style={styles.greetingGlow}>
            <View style={styles.glowOrb} />
          </View>
          <View style={styles.greetingContent}>
            <Text style={styles.greetingHi}>Hello, {displayName}</Text>
            <Text style={styles.greetingBody}>
              Lumina is here to guide you at every step.{'\n'}
              Tap any topic to explore expert knowledge at your own pace.
            </Text>
          </View>
          <View style={styles.greetingIconWrap}>
            <Feather name="sun" size={22} color={UI.accentDark} />
          </View>
        </View>

        {/* ── Journey Path ── */}
        <View style={styles.pathContainer}>
          {/* Vertical path line */}
          <View style={styles.pathLine} />

          {/* Discovery nodes */}
          {DISCOVERY_NODES.map((node, index) => (
            <View key={node.id}>
              {/* Path node dot */}
              <View
                style={[
                  styles.pathNode,
                  index % 2 === 1 ? styles.pathNodeRight : styles.pathNodeLeft,
                ]}
              >
                <View style={[styles.pathDot, { backgroundColor: node.accentColor }]} />
              </View>

              {/* Discovery card */}
              <DiscoveryCard
                node={node}
                index={index}
                onPress={() => openTopicHub(node.id)}
              />

              {/* Spacer between nodes */}
              {index < DISCOVERY_NODES.length - 1 && (
                <View style={styles.pathSpacer} />
              )}
            </View>
          ))}

          {/* End of path marker */}
          <View style={styles.pathEnd}>
            <View style={styles.pathEndDot}>
              <Feather name="heart" size={14} color={UI.accentDark} />
            </View>
            <Text style={styles.pathEndText}>More guides coming soon</Text>
          </View>
        </View>

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
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // ── Greeting Card ──
  greetingCard: {
    backgroundColor: UI.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  greetingGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 100,
    height: 100,
  },
  glowOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: UI.glow,
    opacity: 0.5,
  },
  greetingContent: {
    flex: 1,
    paddingLeft: 8,
  },
  greetingHi: {
    fontSize: 22,
    fontWeight: '700',
    color: UI.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  greetingBody: {
    fontSize: 14,
    fontWeight: '400',
    color: UI.textMuted,
    lineHeight: 20,
  },
  greetingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: UI.accentDark + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // ── Journey Path ──
  pathContainer: {
    position: 'relative',
    paddingBottom: 20,
  },
  pathLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: UI.pathLine,
    marginLeft: -1,
  },
  pathNode: {
    position: 'absolute',
    zIndex: 2,
    top: 30,
  },
  pathNodeLeft: {
    left: '50%',
    marginLeft: -7,
  },
  pathNodeRight: {
    left: '50%',
    marginLeft: -7,
  },
  pathDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: UI.bg,
  },
  pathSpacer: {
    height: 20,
  },

  // ── Discovery Row ──
  discoveryRow: {
    paddingRight: '48%',
    paddingLeft: 4,
    marginBottom: 4,
  },
  discoveryRowRight: {
    paddingRight: 4,
    paddingLeft: '48%',
  },

  // ── Polaroid Card ──
  polaroidCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  polaroidImageArea: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  polaroidEmoji: {
    fontSize: 36,
  },
  polaroidBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  polaroidBadgeText: {
    fontSize: 16,
  },
  polaroidCaption: {
    backgroundColor: UI.card,
    padding: 14,
    paddingTop: 12,
  },
  polaroidTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: UI.text,
    marginBottom: 2,
  },
  polaroidSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: UI.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  polaroidMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  polaroidArticleCount: {
    fontSize: 11,
    fontWeight: '600',
    color: UI.textLight,
    letterSpacing: 0.3,
  },

  // ── Path End ──
  pathEnd: {
    alignItems: 'center',
    paddingTop: 24,
    gap: 8,
  },
  pathEndDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UI.accentDark + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: UI.pathLine,
  },
  pathEndText: {
    fontSize: 13,
    fontWeight: '500',
    color: UI.textLight,
  },
});

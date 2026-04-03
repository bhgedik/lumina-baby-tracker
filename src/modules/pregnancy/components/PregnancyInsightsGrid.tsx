// ============================================================
// Lumina — Pregnancy Content Cards + Lumina AI Hub
// Matches postpartum home screen design language exactly
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Image as RNImage } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../../shared/constants/theme';
import { WEEKLY_DEVELOPMENT, BODY_CHANGES_BY_TRIMESTER } from '../data/prepContent';

const pregBabyIcon = require('../../../../assets/illustrations/pregnancy-baby.png');
const pregBodyIcon = require('../../../../assets/illustrations/pregnancy-body.png');
const pregJournalIcon = require('../../../../assets/illustrations/pregnancy-journal.png');

const luminaMascot = require('../../../../assets/illustrations/lumina-mascot.png');

// ── Claymorphism tokens (identical to home.tsx) ─────────────
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

interface PregnancyInsightsGridProps {
  week: number;
  babyName: string;
  onJournal: () => void;
  onAskLumina: () => void;
}

function getTrimester(week: number): 1 | 2 | 3 {
  if (week <= 13) return 1;
  if (week <= 27) return 2;
  return 3;
}

const PREGNANCY_PROMPTS = [
  'Is this normal at this stage?',
  'Safe exercises for me?',
  'Hospital bag checklist',
  'Foods to avoid',
  'When to call the doctor',
];

export function PregnancyInsightsGrid({ week, babyName, onJournal, onAskLumina }: PregnancyInsightsGridProps) {
  const devData = WEEKLY_DEVELOPMENT[week] ?? WEEKLY_DEVELOPMENT[40];
  const development = devData.summary;
  const trimester = getTrimester(week);
  const bodyChanges = BODY_CHANGES_BY_TRIMESTER[trimester];

  const bodyChange = useMemo(() => {
    return bodyChanges[week % bodyChanges.length];
  }, [week, bodyChanges]);

  return (
    <View style={styles.container}>

      {/* ════════════════════════════════════════════════════════
          LUMINA AI HUB — identical to postpartum
          ════════════════════════════════════════════════════════ */}
      <View style={styles.luminaHub}>
        <View style={styles.luminaHubHeader}>
          <RNImage source={luminaMascot} style={styles.luminaMascot} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.luminaHubTitle}>Lumina</Text>
            <Text style={styles.luminaHubSubtitle}>Your AI pregnancy companion</Text>
          </View>
        </View>

        <Pressable style={styles.luminaInputBar} onPress={onAskLumina}>
          <Feather name="search" size={18} color="#8A8A8A" />
          <Text style={styles.luminaInputPlaceholder}>
            What's on your mind about {babyName}?
          </Text>
          <Pressable
            style={styles.luminaHubMic}
            onPress={(e) => { e.stopPropagation(); onAskLumina(); }}
            hitSlop={12}
          >
            <Feather name="mic" size={18} color={colors.primary[600]} />
          </Pressable>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promptChipsRow}
        >
          {PREGNANCY_PROMPTS.map((prompt) => (
            <Pressable key={prompt} style={styles.promptChip} onPress={onAskLumina}>
              <Text style={styles.promptChipText}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ════════════════════════════════════════════════════════
          THIS WEEK — clay list items (matching postpartum)
          ════════════════════════════════════════════════════════ */}
      <Text style={styles.sectionHeader}>THIS WEEK</Text>

      {/* Baby This Week */}
      <Pressable
        style={({ pressed }) => [
          styles.clayListItem,
          pressed && styles.clayListItemPressed,
        ]}
        onPress={onAskLumina}
      >
        <View style={[styles.clayListIcon, { backgroundColor: '#FEE8DC' }]}>
          <RNImage source={pregBabyIcon} style={styles.clayListIconImg} resizeMode="contain" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.clayListLabel}>Baby This Week</Text>
          <Text style={styles.clayListDesc}>{development}</Text>
        </View>
        <Feather name="chevron-right" size={18} color="#8A8A8A" />
      </Pressable>

      {/* Body Changes */}
      <Pressable
        style={({ pressed }) => [
          styles.clayListItem,
          pressed && styles.clayListItemPressed,
        ]}
        onPress={onAskLumina}
      >
        <View style={[styles.clayListIcon, { backgroundColor: '#E8DDF3' }]}>
          <RNImage source={pregBodyIcon} style={styles.clayListIconImg} resizeMode="contain" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.clayListLabel}>Body Changes</Text>
          <Text style={styles.clayListDesc}>{bodyChange}</Text>
        </View>
        <Feather name="chevron-right" size={18} color="#8A8A8A" />
      </Pressable>

      {/* Daily Reflection */}
      <Pressable
        style={({ pressed }) => [
          styles.clayListItem,
          pressed && styles.clayListItemPressed,
        ]}
        onPress={onJournal}
      >
        <View style={[styles.clayListIcon, { backgroundColor: '#FFF3E0' }]}>
          <RNImage source={pregJournalIcon} style={styles.clayListIconImg} resizeMode="contain" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.clayListLabel}>How are you feeling?</Text>
          <Text style={styles.clayListDesc}>Capture a thought or feeling about {babyName}</Text>
        </View>
        <Feather name="chevron-right" size={18} color="#8A8A8A" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },

  // Section headers (identical to postpartum)
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8E8A9F',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 2,
  },

  // ══════════════════════════════════════════════════════════
  // LUMINA HUB (identical to postpartum home)
  // ══════════════════════════════════════════════════════════
  luminaHub: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    paddingBottom: 14,
    marginBottom: 2,
    shadowColor: '#B0A090',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  luminaHubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  luminaMascot: {
    width: 90,
    height: 90,
  },
  luminaHubTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary[700],
  },
  luminaHubSubtitle: {
    fontSize: 13,
    color: colors.primary[500],
    marginTop: 1,
  },
  luminaInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F4F0',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE8E2',
  },
  luminaInputPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: '#8A8A8A',
  },
  luminaHubMic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptChipsRow: {
    gap: 8,
    paddingRight: 4,
  },
  promptChip: {
    backgroundColor: '#F7F4F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EDE8E2',
  },
  promptChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B5B4E',
  },

  // ══════════════════════════════════════════════════════════
  // CLAY LIST ITEMS (identical to postpartum HEALTH & GROWTH)
  // ══════════════════════════════════════════════════════════
  clayListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    marginBottom: 12,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  clayListItemPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  clayListIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clayListIconImg: {
    width: 40,
    height: 40,
  },
  clayListLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2A26',
    marginBottom: 2,
  },
  clayListDesc: {
    fontSize: 13,
    color: '#8A8A8A',
    lineHeight: 18,
  },
});

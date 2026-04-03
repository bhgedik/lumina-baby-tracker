// ============================================================
// Lumina — Pregnancy Dashboard (Complete Redesign)
// Editorial claymorphism: hero card, linear progress,
// 3D clay assets, refined typography
// ============================================================

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Image as RNImage } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../../shared/constants/theme';
import { DAILY_PREP_CARDS } from '../data/prepContent';
import { PregnancyInsightsGrid } from './PregnancyInsightsGrid';

const pregnancyHero = require('../../../../assets/illustrations/pregnancy-hero.png');
const pregStorkIcon = require('../../../../assets/illustrations/pregnancy-stork.png');

const { width: SCREEN_W } = Dimensions.get('window');

// ── Design tokens ───────────────────────────────────────────
const CLAY = {
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  inner: {
    borderTopWidth: 2,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.9)',
    borderLeftColor: 'rgba(255,255,255,0.6)',
    borderBottomWidth: 1.5,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    borderRightColor: 'rgba(0,0,0,0.02)',
  },
};

const MUTED_PURPLE = '#8E8A9F';

const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

// ── Compact progress ring (120px) ───────────────────────────
const RING_SIZE = 120;
const STROKE_W = 8;
const RING_R = (RING_SIZE - STROKE_W) / 2;
const RING_CIRC = 2 * Math.PI * RING_R;

function CompactRing({ week, progress, babyName, dayOfWeek }: { week: number; progress: number; babyName: string; dayOfWeek: number }) {
  const offset = RING_CIRC * (1 - Math.min(1, Math.max(0, progress)));
  const daysUntilNext = 7 - dayOfWeek;
  const weeksLeft = Math.max(0, 40 - week);

  const subtext =
    week >= 40
      ? 'Any day now!'
      : `${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} to go`;

  return (
    <View style={styles.compactRingWrap}>
      <View style={styles.compactRingContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <LinearGradient id="compactGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F5E6D0" />
              <Stop offset="1" stopColor={colors.secondary[400]} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_R}
            stroke={colors.secondary[100]}
            strokeWidth={STROKE_W}
            fill="none"
            opacity={0.4}
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_R}
            stroke="url(#compactGrad)"
            strokeWidth={STROKE_W}
            fill="none"
            strokeDasharray={`${RING_CIRC}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.compactRingCenter}>
          <Text style={styles.compactRingLabel}>Week</Text>
          <Text style={styles.compactRingNum}>{week}</Text>
        </View>
      </View>
      <Text style={styles.compactRingSubtext}>{subtext}</Text>
    </View>
  );
}

// ── Props ───────────────────────────────────────────────────
interface PrepDashboardProps {
  babyName: string;
  dueDate: string;
  gestationalInfo: {
    week: number;
    dayOfWeek: number;
    progress: number;
  };
  onBabyArrivedPress?: () => void;
  onJournal?: () => void;
  onAskLumina?: () => void;
}

export function PrepDashboard({
  babyName,
  dueDate,
  gestationalInfo,
  onBabyArrivedPress,
  onJournal,
  onAskLumina,
}: PrepDashboardProps) {
  const { week, dayOfWeek, progress } = gestationalInfo;

  // Gentle hero pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  // Tips
  const startTipIndex = useMemo(() => {
    const idx = DAILY_PREP_CARDS.findIndex((c) => c.week === week);
    if (idx >= 0) return idx;
    let best = 0;
    let bestD = Math.abs(DAILY_PREP_CARDS[0].week - week);
    for (let i = 1; i < DAILY_PREP_CARDS.length; i++) {
      const d = Math.abs(DAILY_PREP_CARDS[i].week - week);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }, [week]);

  const [tipOffset, setTipOffset] = useState(0);
  const tipIdx = DAILY_PREP_CARDS.length > 0
    ? (startTipIndex + tipOffset) % DAILY_PREP_CARDS.length
    : 0;
  const tip = DAILY_PREP_CARDS[tipIdx] ?? null;
  const [expanded, setExpanded] = useState(false);
  const tipBody = tip?.body ?? '';
  const isLong = tipBody.length > 160;
  const displayBody = expanded || !isLong
    ? tipBody
    : tipBody.slice(0, 160).trimEnd() + '...';

  return (
    <View style={styles.root}>

      {/* ════════════════════════════════════════════════════════
          HERO CARD — 3D clay illustration + compact ring side by side
          ════════════════════════════════════════════════════════ */}
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <Animated.View style={[styles.heroImageWrap, { transform: [{ scale: pulseAnim }] }]}>
            <RNImage source={pregnancyHero} style={styles.heroImage} resizeMode="contain" />
          </Animated.View>

          <CompactRing
            week={week}
            dayOfWeek={dayOfWeek}
            progress={progress}
            babyName={babyName}
          />
        </View>
      </View>

      {/* ════════════════════════════════════════════════════════
          "I HAD MY BABY!" — clay list item style
          ════════════════════════════════════════════════════════ */}
      {onBabyArrivedPress && (
        <Pressable
          style={({ pressed }) => [
            styles.babyArrivedItem,
            pressed && styles.babyArrivedItemPressed,
          ]}
          onPress={onBabyArrivedPress}
        >
          <View style={styles.babyArrivedIcon}>
            <RNImage source={pregStorkIcon} style={styles.babyArrivedIconImg} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.babyArrivedLabel}>I Had My Baby!</Text>
            <Text style={styles.babyArrivedDesc}>Switch to baby tracking mode</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#8A8A8A" />
        </Pressable>
      )}

      {/* ════════════════════════════════════════════════════════
          ASK LUMINA + CONTENT CARDS
          ════════════════════════════════════════════════════════ */}
      {onJournal && onAskLumina && (
        <PregnancyInsightsGrid
          week={week}
          babyName={babyName}
          onJournal={onJournal}
          onAskLumina={onAskLumina}
        />
      )}

      {/* ════════════════════════════════════════════════════════
          TIP OF THE DAY
          ════════════════════════════════════════════════════════ */}
      {tip && (
        <>
          <Text style={styles.sectionHeader}>DAILY INSIGHT</Text>
          <View style={styles.tipCard}>
            <View style={styles.tipAccent} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipBody}>{displayBody}</Text>

              {isLong && (
                <Pressable
                  style={styles.tipToggle}
                  onPress={() => setExpanded(!expanded)}
                >
                  <Text style={styles.tipToggleText}>
                    {expanded ? 'Show less' : 'Read more'}
                  </Text>
                  <Feather
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.primary[600]}
                  />
                </Pressable>
              )}

              <Pressable
                style={styles.nextTipBtn}
                onPress={() => { setTipOffset((p) => p + 1); setExpanded(false); }}
              >
                <Text style={styles.nextTipText}>Next insight</Text>
                <Feather name="arrow-right" size={14} color={colors.primary[600]} />
              </Pressable>
            </View>
          </View>
        </>
      )}

    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    paddingBottom: 20,
  },

  // ══════════════════════════════════════════════════════════
  // HERO CARD
  // ══════════════════════════════════════════════════════════
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 16,
    ...CLAY.shadow,
    ...CLAY.inner,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroImageWrap: {
    flex: 1,
    alignItems: 'center',
  },
  heroImage: {
    width: SCREEN_W * 0.38,
    height: SCREEN_W * 0.38,
  },

  // Compact ring
  compactRingWrap: {
    alignItems: 'center',
  },
  compactRingContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactRingCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  compactRingLabel: {
    fontSize: 12,
    fontFamily: SERIF,
    fontWeight: '500',
    color: colors.secondary[400],
    letterSpacing: 0.5,
  },
  compactRingNum: {
    fontSize: 36,
    fontFamily: SERIF,
    fontWeight: '700',
    color: colors.secondary[600],
    letterSpacing: -1,
    marginTop: -2,
  },
  compactRingSubtext: {
    fontSize: 12,
    fontFamily: SERIF,
    fontWeight: '500',
    color: colors.secondary[400],
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
  },

  // ══════════════════════════════════════════════════════════
  // I HAD MY BABY — clay list item
  // ══════════════════════════════════════════════════════════
  babyArrivedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    marginTop: 16,
    ...CLAY.shadow,
    ...CLAY.inner,
  },
  babyArrivedItemPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  babyArrivedIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE8DC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  babyArrivedIconImg: {
    width: 40,
    height: 40,
  },
  babyArrivedLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2A26',
    marginBottom: 2,
  },
  babyArrivedDesc: {
    fontSize: 13,
    color: '#8A8A8A',
    lineHeight: 18,
  },

  // ── Section headers ──
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED_PURPLE,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  // ══════════════════════════════════════════════════════════
  // TIP CARD
  // ══════════════════════════════════════════════════════════
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    ...CLAY.shadow,
    ...CLAY.inner,
  },
  tipAccent: {
    width: 4,
    backgroundColor: colors.secondary[300],
  },
  tipContent: {
    flex: 1,
    padding: 18,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2A26',
    marginBottom: 8,
  },
  tipBody: {
    fontSize: 14,
    color: '#5C5C5C',
    lineHeight: 14 * 1.75,
    marginBottom: 10,
  },
  tipToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  tipToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  nextTipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.primary[50],
    borderRadius: 14,
  },
  nextTipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
});

// ============================================================
// Lumina — Celebration Interstitial
// Premium SVG illustration + elegant botanical particles
// for the "I Had My Baby!" flow
// ============================================================

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import Svg, { Ellipse, Circle, Path } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

// ── Particle system ─────────────────────────────────────────

type ParticleShape = 'leaf' | 'sparkle' | 'dot';

interface Particle {
  x: number;
  size: number;
  color: string;
  shape: ParticleShape;
  delay: number;
  duration: number;
  drift: number;
}

// Muted botanical palette
const LEAF_COLORS = ['#8EBA9B', '#B3D1BC', '#D8E8DD'];
const SPARKLE_COLORS = ['#D4B96A', '#E8D19A', '#DBC88A'];
const DOT_COLORS = ['#D4A088', '#EDE0D0', '#C49080', '#F5E6D0'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateParticles(): Particle[] {
  const particles: Particle[] = [];

  // Leaves — gentle, floating
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: Math.random() * SCREEN_WIDTH,
      size: 14 + Math.random() * 8,
      color: pick(LEAF_COLORS),
      shape: 'leaf',
      delay: Math.random() * 500,
      duration: 2800 + Math.random() * 1500,
      drift: (Math.random() - 0.5) * 100,
    });
  }

  // Sparkles — twinkling, delicate
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: Math.random() * SCREEN_WIDTH,
      size: 10 + Math.random() * 8,
      color: pick(SPARKLE_COLORS),
      shape: 'sparkle',
      delay: Math.random() * 400,
      duration: 2200 + Math.random() * 1500,
      drift: (Math.random() - 0.5) * 80,
    });
  }

  // Dots — subtle, soft
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: Math.random() * SCREEN_WIDTH,
      size: 6 + Math.random() * 5,
      color: pick(DOT_COLORS),
      shape: 'dot',
      delay: Math.random() * 600,
      duration: 2500 + Math.random() * 1800,
      drift: (Math.random() - 0.5) * 60,
    });
  }

  return particles;
}

// Per-shape rotation feel
const ROTATION_END: Record<ParticleShape, string> = {
  leaf: '200deg',     // gentle tumble
  sparkle: '540deg',  // twinkling spin
  dot: '0deg',        // no rotation
};

// ── SVG particle shapes ─────────────────────────────────────

function LeafSvg({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M8 1 Q13 4 14 8 Q13 12 8 15 Q3 12 2 8 Q3 4 8 1 Z"
        fill={color}
      />
      <Path
        d="M8 4 L8 12"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={0.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SparkleSvg({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z"
        fill={color}
      />
    </Svg>
  );
}

function DotSvg({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      <Circle cx={5} cy={5} r={4.5} fill={color} opacity={0.7} />
    </Svg>
  );
}

// ── Cute cartoon baby illustration ───────────────────────────

function CartoonBabySvg() {
  return (
    <Svg width={100} height={100} viewBox="0 0 100 100">
      {/* ── Swaddle blanket — sage green, rounded bundle ── */}
      <Path
        d="M28 48 Q24 62 28 78 Q35 92 50 94 Q65 92 72 78 Q76 62 72 48 Q64 42 50 44 Q36 42 28 48 Z"
        fill="#B3D1BC"
      />
      {/* Blanket V-fold */}
      <Path
        d="M36 50 L50 60 L64 50"
        stroke="#D8E8DD"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Blanket wrap line */}
      <Path
        d="M32 62 Q50 67 68 62"
        stroke="#8EBA9B"
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />

      {/* ── Big round head — takes up most of the space ── */}
      <Circle cx={50} cy={28} r={26} fill="#F5DEC4" />

      {/* ── Cute hair tuft — three little wisps ── */}
      <Path
        d="M44 4 Q48 -2 52 4"
        stroke="#C4B0A0"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M48 2 Q52 -2 55 3"
        stroke="#D4C0B0"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />

      {/* ── Dot eyes — big, kawaii style ── */}
      <Circle cx={40} cy={28} r={3.5} fill="#4A4440" />
      <Circle cx={60} cy={28} r={3.5} fill="#4A4440" />
      {/* Eye sparkles — top-right */}
      <Circle cx={41.5} cy={26.5} r={1.4} fill="white" />
      <Circle cx={61.5} cy={26.5} r={1.4} fill="white" />
      {/* Small secondary sparkle */}
      <Circle cx={39} cy={29.5} r={0.6} fill="white" opacity={0.7} />
      <Circle cx={59} cy={29.5} r={0.6} fill="white" opacity={0.7} />

      {/* ── Rosy cheeks — oval blush patches ── */}
      <Ellipse cx={32} cy={35} rx={6} ry={4} fill="#F7B8A0" opacity={0.35} />
      <Ellipse cx={68} cy={35} rx={6} ry={4} fill="#F7B8A0" opacity={0.35} />

      {/* ── Tiny nose ── */}
      <Circle cx={50} cy={33} r={1.5} fill="#EECBB4" />

      {/* ── Happy smile — wide, cheerful arc ── */}
      <Path
        d="M43 38 Q50 44 57 38"
        stroke="#D4A088"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Props ────────────────────────────────────────────────────

interface CelebrationModalProps {
  visible: boolean;
  onContinue: () => void;
}

export function CelebrationModal({ visible, onContinue }: CelebrationModalProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const particles = useRef(generateParticles()).current;
  const particleAnims = useRef(
    particles.map(() => new Animated.Value(0)),
  ).current;

  // ── Entry animation ──────────────────────────────────────
  useEffect(() => {
    if (visible) {
      backdropOpacity.setValue(0);
      cardScale.setValue(0.8);
      cardOpacity.setValue(0);
      particleAnims.forEach((a) => a.setValue(0));

      // Backdrop fade
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Card spring-in
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Particle burst — staggered 200ms after card
      const anims = particleAnims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: particles[i].duration,
          delay: 200 + particles[i].delay,
          easing: Easing.quad,
          useNativeDriver: true,
        }),
      );
      Animated.stagger(0, anims).start();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Exit animation ───────────────────────────────────────
  const handleContinue = useCallback(() => {
    Animated.parallel([
      Animated.timing(cardScale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onContinue();
    });
  }, [onContinue, cardScale, cardOpacity, backdropOpacity]);

  // ── Render ───────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleContinue}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        {/* Content card */}
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: cardScale }], opacity: cardOpacity },
          ]}
        >
          {/* Glow rings + baby illustration */}
          <View style={styles.illustrationWrap}>
            <View style={styles.outerGlow} />
            <View style={styles.innerGlow}>
              <CartoonBabySvg />
            </View>
          </View>

          <Text style={styles.headline}>
            {"Congratulations, Mama! \u2728"}
          </Text>
          <Text style={styles.subtitle}>
            {"What an incredible journey \u2014 your little one is finally here. We\u2019re so happy for you!"}
          </Text>

          <Pressable
            style={[styles.continueButton, shadows.sm]}
            onPress={handleContinue}
          >
            <Feather name="heart" size={18} color={colors.textInverse} />
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </Animated.View>

        {/* Particle layer — in front of card */}
        <View style={styles.particleLayer} pointerEvents="none">
          {particles.map((particle, i) => {
            const progress = particleAnims[i];
            const translateY = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-particle.size, SCREEN_HEIGHT + particle.size],
            });
            const translateX = progress.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, particle.drift, particle.drift * 0.6],
            });
            const rotate = progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', ROTATION_END[particle.shape]],
            });
            const opacity = progress.interpolate({
              inputRange: [0, 0.08, 0.75, 1],
              outputRange: [0, 1, 1, 0],
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.particle,
                  {
                    left: particle.x,
                    transform: [{ translateY }, { translateX }, { rotate }],
                    opacity,
                  },
                ]}
              >
                {particle.shape === 'leaf' && (
                  <LeafSvg size={particle.size} color={particle.color} />
                )}
                {particle.shape === 'sparkle' && (
                  <SparkleSvg size={particle.size} color={particle.color} />
                )}
                {particle.shape === 'dot' && (
                  <DotSvg size={particle.size} color={particle.color} />
                )}
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,24,21,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    top: 0,
  },
  card: {
    width: SCREEN_WIDTH - spacing['2xl'] * 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['3xl'],
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  outerGlow: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: colors.primary[50],
    opacity: 0.5,
  },
  innerGlow: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FEF8F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headline: {
    fontFamily: SERIF_FONT,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.sm,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: colors.secondary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  continueText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

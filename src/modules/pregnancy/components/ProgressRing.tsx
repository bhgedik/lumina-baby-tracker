// ============================================================
// Lumina — Flo-Inspired Progress Ring
// Ethereal gradient ring with pulse glow + serif center text
// ============================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, typography, spacing } from '../../../shared/constants/theme';

const RING_SIZE = 240;
const STROKE_WIDTH = 16;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Champagne to warm blush gradient stops
const GRADIENT_START = '#F5E6D0'; // champagne
const GRADIENT_END = colors.secondary[300]; // warm blush

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

interface ProgressRingProps {
  week: number;
  dayOfWeek: number;
  progress: number; // 0–1
  babyName: string;
}

export function ProgressRing({ week, dayOfWeek, progress, babyName }: ProgressRingProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = CIRCUMFERENCE * (1 - clampedProgress);
  const daysUntilNextWeek = 7 - dayOfWeek;

  // Pulse animation — gentle breathing glow
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const subtext =
    week >= 40
      ? 'Any day now!'
      : dayOfWeek === 0
        ? `${babyName} is growing strong`
        : `${daysUntilNextWeek} ${daysUntilNextWeek === 1 ? 'day' : 'days'} until Week ${week + 1}`;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.ringWrapper,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        {/* Soft glow behind ring */}
        <View style={styles.glowLayer} />

        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <LinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={GRADIENT_START} stopOpacity="1" />
              <Stop offset="1" stopColor={GRADIENT_END} stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Track — very soft, barely visible */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.secondary[100]}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            opacity={0.5}
          />

          {/* Progress — gradient stroke */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="url(#ringGradient)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>

        {/* Center text — serif font */}
        <View style={styles.centerText}>
          <Text style={styles.weekLabel}>Week</Text>
          <Text style={styles.weekNumber}>{week}</Text>
        </View>
      </Animated.View>

      <Text style={styles.subtext}>{subtext}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  ringWrapper: {
    width: RING_SIZE + 40,
    height: RING_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowLayer: {
    position: 'absolute',
    width: RING_SIZE - 20,
    height: RING_SIZE - 20,
    borderRadius: (RING_SIZE - 20) / 2,
    backgroundColor: colors.secondary[100],
    opacity: 0.4,
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: SERIF_FONT,
    fontWeight: typography.fontWeight.medium,
    color: colors.secondary[400],
    marginBottom: -2,
    letterSpacing: 1,
  },
  weekNumber: {
    fontSize: 56,
    fontFamily: SERIF_FONT,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary[600],
    letterSpacing: -1,
  },
  subtext: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    fontFamily: SERIF_FONT,
    fontWeight: typography.fontWeight.medium,
    color: colors.secondary[400],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

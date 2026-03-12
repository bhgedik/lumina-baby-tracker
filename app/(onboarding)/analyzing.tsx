// ============================================================
// Lumina — Analyzing Screen
// Artificial 3-4s loading screen after onboarding quiz,
// before the paywall. Pulsing animation + phased text.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../src/shared/constants/theme';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

const PHASE_TEXTS = (name: string) => [
  `Analyzing ${name}'s developmental stage...`,
  'Customizing your Nurture-First dashboard...',
  'Almost ready...',
];

export default function AnalyzingScreen() {
  const router = useRouter();
  const babyName = useOnboardingStore((s) => s.babyName) || 'your baby';

  const [phase, setPhase] = useState(1);
  const [dots, setDots] = useState('.');

  // Pulse animation values
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  // Text crossfade opacity
  const textOpacity = useRef(new Animated.Value(1)).current;

  const texts = PHASE_TEXTS(babyName);

  // Start pulsing circle animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseScale, pulseOpacity]);

  // Phase timers + navigation
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(2), 1500);
    const t2 = setTimeout(() => setPhase(3), 3000);
    const t3 = setTimeout(() => router.replace('/(onboarding)/paywall'), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Text crossfade on phase change
  const crossfade = useCallback(() => {
    Animated.timing(textOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [textOpacity]);

  useEffect(() => {
    if (phase > 1) {
      crossfade();
    }
  }, [phase, crossfade]);

  // Progress dots cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '.' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Pulsing circle */}
        <Animated.View
          style={[
            styles.outerCircle,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        >
          <View style={styles.innerCircle} />
        </Animated.View>

        {/* Phase text */}
        <Animated.Text style={[styles.phaseText, { opacity: textOpacity }]}>
          {texts[phase - 1]}
        </Animated.Text>

        {/* Progress dots */}
        <Text style={styles.dotsText}>{dots}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  outerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  innerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
  },
  phaseText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
  },
  dotsText: {
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 2,
  },
});

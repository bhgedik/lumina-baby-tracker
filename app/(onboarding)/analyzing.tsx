// ============================================================
// Lumina — Magic Loading Screen
// Cross-fading onboarding images, personalized text,
// animated progress bar. Auto-routes to paywall.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '../../src/shared/constants/theme';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOTAL_DURATION = 3500;

const ONBOARDING_IMAGES = [
  require('../../assets/images/onboarding-1.png'),
  require('../../assets/images/onboarding-2.png'),
  require('../../assets/images/onboarding-3.png'),
];

const getPhaseTexts = (parentName: string, babyName: string) => [
  `Building ${parentName}'s personalized experience...`,
  babyName
    ? `Preparing ${babyName}'s developmental profile...`
    : 'Setting up your baby tracker...',
  babyName
    ? `Welcome to the family, ${babyName}! Almost ready...`
    : 'Almost ready — your plan is coming together...',
];

export default function AnalyzingScreen() {
  const router = useRouter();
  const parentName = useOnboardingStore((s) => s.parentName) || 'your';
  const babyName = useOnboardingStore((s) => s.babyName);

  const [phase, setPhase] = useState(0);
  const texts = getPhaseTexts(parentName, babyName);

  // Image cross-fade opacities (one per image)
  const imageOpacities = useRef(
    ONBOARDING_IMAGES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)),
  ).current;

  // Text crossfade
  const textOpacity = useRef(new Animated.Value(1)).current;

  // Progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Cross-fade images
  const crossFadeToImage = useCallback(
    (index: number) => {
      const animations = imageOpacities.map((opacity, i) =>
        Animated.timing(opacity, {
          toValue: i === index ? 1 : 0,
          duration: 600,
          useNativeDriver: true,
        }),
      );
      Animated.parallel(animations).start();
    },
    [imageOpacities],
  );

  // Cross-fade text
  const crossFadeText = useCallback(() => {
    Animated.sequence([
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [textOpacity]);

  // Animate progress bar continuously
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: TOTAL_DURATION,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  // Phase timers + navigation
  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase(1);
      crossFadeToImage(1);
      crossFadeText();
      Haptics.selectionAsync();
    }, 1200);

    const t2 = setTimeout(() => {
      setPhase(2);
      crossFadeToImage(2);
      crossFadeText();
      Haptics.selectionAsync();
    }, 2400);

    const t3 = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(onboarding)/paywall');
    }, TOTAL_DURATION);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [crossFadeToImage, crossFadeText, router]);

  return (
    <View style={styles.container}>
      {/* Stacked background images */}
      {ONBOARDING_IMAGES.map((source, i) => (
        <Animated.View key={i} style={[styles.imageContainer, { opacity: imageOpacities[i] }]}>
          <Image source={source} style={styles.backgroundImage} resizeMode="cover" blurRadius={8} />
          <View style={styles.imageOverlay} />
        </Animated.View>
      ))}

      {/* Content overlay */}
      <SafeAreaView style={styles.contentContainer}>
        <View style={styles.spacer} />

        <View style={styles.centerContent}>
          {/* Logo */}
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>L</Text>
          </View>

          {/* Phase text */}
          <Animated.Text style={[styles.phaseText, { opacity: textOpacity }]}>
            {texts[phase]}
          </Animated.Text>
        </View>

        {/* Progress bar at bottom */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>Personalizing your experience</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 245, 240, 0.75)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  spacer: { flex: 1 },
  centerContent: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  phaseText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
    paddingHorizontal: spacing.xl,
  },
  progressSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing['3xl'],
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral[200],
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary[500],
  },
  progressLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

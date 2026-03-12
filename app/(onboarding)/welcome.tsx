// ============================================================
// Lumina — Welcome Screen
// 3-slide swipeable carousel. Warm, nurturing first impression.
// ============================================================

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const AUTO_ADVANCE_MS = 4000;

const SLIDES = [
  {
    icon: 'moon' as const,
    title: 'AI Guidance at 3 AM',
    description:
      "Get expert-level guidance when the pediatrician's office is closed. Lumina, your AI companion, never sleeps.",
  },
  {
    icon: 'zap' as const,
    title: 'Frictionless Logging',
    description:
      'Track feedings, sleep, and diapers with one thumb. Designed for exhausted parents at 3 AM.',
  },
  {
    icon: 'heart' as const,
    title: 'Parental Burnout Tracking',
    description:
      "We don't just track your baby. We track YOU. Because a healthy parent means a thriving baby.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  // Start auto-advance interval
  const startAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
    }
    autoAdvanceRef.current = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % SLIDES.length;
        scrollViewRef.current?.scrollTo({ x: next * SLIDE_WIDTH, animated: true });
        return next;
      });
    }, AUTO_ADVANCE_MS);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    startAutoAdvance();
    return () => {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
      }
    };
  }, [startAutoAdvance]);

  // Cancel auto-advance on manual swipe
  const handleScrollBeginDrag = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }, []);

  // Track active slide
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH);
      setActiveSlide(index);
    },
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Logo badge */}
        <View style={styles.hero}>
          <View style={[styles.logoBadge, shadows.soft]}>
            <Text style={styles.logoText}>{'Lumina'.charAt(0)}</Text>
          </View>
          <Text style={styles.appName}>Lumina</Text>
        </View>

        {/* Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={handleScrollBeginDrag}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            contentContainerStyle={styles.carouselContent}
            decelerationRate="fast"
            snapToInterval={SLIDE_WIDTH}
          >
            {SLIDES.map((slide) => (
              <View key={slide.title} style={styles.slide}>
                <View style={styles.slideIconWrap}>
                  <Feather name={slide.icon} size={32} color={colors.primary[500]} />
                </View>
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <Text style={styles.slideDescription}>{slide.description}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Dot indicators */}
          <View style={styles.dotsContainer}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === activeSlide ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* CTA */}
        <Pressable
          style={[styles.button, shadows.md]}
          onPress={() => router.push('/(onboarding)/baby-profile')}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Let's meet your baby</Text>
          <Feather name="arrow-right" size={20} color={colors.textInverse} />
        </Pressable>
      </Animated.View>
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
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: spacing['2xl'],
  },
  hero: {
    marginTop: spacing['3xl'],
    alignItems: 'center',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  appName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
    letterSpacing: 1,
  },
  carouselContainer: {
    alignItems: 'center',
  },
  carouselContent: {
    // no extra padding — slides are sized to SLIDE_WIDTH
  },
  slide: {
    width: SLIDE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  slideIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  slideTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  slideDescription: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: spacing.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary[500],
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.neutral[200],
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

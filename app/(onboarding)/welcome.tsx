// ============================================================
// Sprout — Welcome Screen
// The emotional hook. Warm, nurturing first impression.
// ============================================================

import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';

const FEATURES = [
  {
    icon: 'heart' as const,
    color: colors.secondary[400],
    title: 'Track with Love',
    description: 'Feedings, sleep, diapers — effortless logging designed for one-handed use at 3AM',
  },
  {
    icon: 'zap' as const,
    color: colors.primary[500],
    title: 'Expert by Your Side',
    description: 'AI-powered guidance from a veteran nurse who has seen it all',
  },
  {
    icon: 'star' as const,
    color: colors.warning,
    title: 'Every Milestone',
    description: 'Personalized for your baby\'s unique developmental journey',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.logoBadge, shadows.soft]}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.appName}>Sprout</Text>
          <Text style={styles.title}>
            Welcome to your{'\n'}parenting journey
          </Text>
          <Text style={styles.subtitle}>
            You're not alone in this. Sprout is your calm, experienced companion — like having a
            gentle night nurse and pediatric expert always in your corner, cheering you on.
          </Text>
        </View>

        {/* Feature cards */}
        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={[styles.featureCard, shadows.sm]}>
              <View style={[styles.featureIconWrap, { backgroundColor: feature.color + '15' }]}>
                <Feather name={feature.icon} size={20} color={feature.color} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <Pressable
          style={[styles.button, shadows.md]}
          onPress={() => router.push('/(onboarding)/parent-profile')}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Let's Get Started</Text>
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
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: spacing.sm,
  },
  features: {
    gap: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: borderRadius['2xl'],
    gap: spacing.md,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
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

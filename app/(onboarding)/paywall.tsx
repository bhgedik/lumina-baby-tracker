// ============================================================
// Lumina — Paywall Screen
// High-conversion paywall with pricing toggle, trust timeline,
// and optimized CTA. Shown after the analyzing screen.
// ============================================================

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { flushOnboardingToStores } from '../../src/services/onboardingFlush';

const PREMIUM_FEATURES = [
  'Unlimited Lumina AI Consultations',
  'Personalized developmental insights',
  'Growth & milestone predictions',
  'Smart sleep & feeding analytics',
] as const;

type PricingPlan = 'annual' | 'monthly';

export default function PaywallScreen() {
  const router = useRouter();
  const babyName = useOnboardingStore((s) => s.babyName) || 'your baby';
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>('annual');

  const finishOnboarding = async () => {
    await flushOnboardingToStores({
      userId: 'local-user-' + Date.now(),
      userEmail: 'user@lumina.local',
    });
    router.replace('/(app)/(tabs)/home');
  };

  const handleContinue = () => {
    finishOnboarding();
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Close / Skip — top right */}
      <Pressable
        style={styles.closeButton}
        onPress={handleSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip for now"
        hitSlop={12}
      >
        <Feather name="x" size={22} color={colors.textTertiary} />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Feather name="gift" size={24} color={colors.primary[500]} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Your personalized plan for {babyName} is ready
        </Text>
        <Text style={styles.subtitle}>
          Unlock the full Lumina experience
        </Text>

        {/* Premium features */}
        <View style={[styles.premiumCard, shadows.md]}>
          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <View style={styles.checkIconWrap}>
                  <Feather name="check" size={16} color={colors.primary[500]} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Trust Timeline */}
        <View style={styles.timeline}>
          <View style={styles.timelineStep}>
            <View style={styles.timelineNodeActive}>
              <Feather name="unlock" size={14} color={colors.primary[600]} />
            </View>
            <View style={styles.timelineConnector} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Today</Text>
              <Text style={styles.timelineText}>Unlock all Premium features for free</Text>
            </View>
          </View>

          <View style={styles.timelineStep}>
            <View style={styles.timelineNode}>
              <Feather name="bell" size={14} color={colors.textTertiary} />
            </View>
            <View style={styles.timelineConnector} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Day 5</Text>
              <Text style={styles.timelineText}>We'll send you a reminder</Text>
            </View>
          </View>

          <View style={styles.timelineStep}>
            <View style={styles.timelineNode}>
              <Feather name="credit-card" size={14} color={colors.textTertiary} />
            </View>
            {/* No connector after last step */}
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Day 7</Text>
              <Text style={styles.timelineText}>You'll be charged unless you cancel</Text>
            </View>
          </View>
        </View>

        {/* Pricing Toggle */}
        <View style={styles.pricingContainer}>
          {/* Annual */}
          <Pressable
            style={[
              styles.pricingOption,
              selectedPlan === 'annual' && styles.pricingOptionSelected,
              selectedPlan === 'annual' && shadows.md,
            ]}
            onPress={() => setSelectedPlan('annual')}
          >
            <View style={styles.pricingHeader}>
              <View style={styles.pricingRadio}>
                {selectedPlan === 'annual' && <View style={styles.pricingRadioInner} />}
              </View>
              <View style={styles.pricingInfo}>
                <View style={styles.pricingTitleRow}>
                  <Text style={[
                    styles.pricingTitle,
                    selectedPlan === 'annual' && styles.pricingTitleSelected,
                  ]}>Annual</Text>
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>SAVE 50%</Text>
                  </View>
                </View>
                <Text style={styles.pricingBreakdown}>$4.99/mo</Text>
              </View>
              <Text style={[
                styles.pricingAmount,
                selectedPlan === 'annual' && styles.pricingAmountSelected,
              ]}>$59.99/yr</Text>
            </View>
          </Pressable>

          {/* Monthly */}
          <Pressable
            style={[
              styles.pricingOption,
              selectedPlan === 'monthly' && styles.pricingOptionSelected,
              selectedPlan === 'monthly' && shadows.md,
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.pricingHeader}>
              <View style={styles.pricingRadio}>
                {selectedPlan === 'monthly' && <View style={styles.pricingRadioInner} />}
              </View>
              <View style={styles.pricingInfo}>
                <Text style={[
                  styles.pricingTitle,
                  selectedPlan === 'monthly' && styles.pricingTitleSelected,
                ]}>Monthly</Text>
              </View>
              <Text style={[
                styles.pricingAmount,
                selectedPlan === 'monthly' && styles.pricingAmountSelected,
              ]}>$9.99/mo</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* CTA pinned to bottom */}
      <View style={styles.ctaContainer}>
        <Pressable
          style={[styles.primaryCta, shadows.lg]}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Start 7-day free trial"
        >
          <Text style={styles.primaryCtaText}>Start 7-Day Free Trial</Text>
        </Pressable>

        <Text style={styles.microCopy}>
          Cancel anytime securely via App Store / Google Play
        </Text>

        <Pressable onPress={handleSkip} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.xl + 44, // below safe area
    right: spacing.xl,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
  },

  // Header
  badgeContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // Premium card
  premiumCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  featureList: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },

  // Trust Timeline
  timeline: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 56,
  },
  timelineNodeActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineConnector: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: 0,
    width: 2,
    backgroundColor: colors.neutral[200],
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.md,
    paddingBottom: spacing.lg,
  },
  timelineLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  timelineText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Pricing
  pricingContainer: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  pricingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 2,
    borderColor: colors.neutral[200],
  },
  pricingOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  pricingHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricingRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pricingRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
  pricingInfo: {
    flex: 1,
  },
  pricingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pricingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  pricingTitleSelected: {
    color: colors.primary[700],
  },
  saveBadge: {
    backgroundColor: colors.secondary[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
    letterSpacing: 0.5,
  },
  pricingBreakdown: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pricingAmount: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  pricingAmountSelected: {
    color: colors.primary[600],
  },

  // CTA
  ctaContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    paddingTop: spacing.base,
    alignItems: 'center',
  },
  primaryCta: {
    width: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryCtaText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  microCopy: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  skipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    opacity: 0.5,
  },
});

// ============================================================
// Lumina — Step Indicator
// Icon-based progress bar with dashed connectors for onboarding
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors, typography, spacing } from '../constants/theme';

type IconName = ComponentProps<typeof Feather>['name'];

const STEPS: { icon: IconName; label: string }[] = [
  { icon: 'star', label: 'About' },
  { icon: 'heart', label: 'Baby' },
  { icon: 'calendar', label: 'Details' },
  { icon: 'check-circle', label: 'Finish' },
];

const CIRCLE_SIZE = 36;
const DASH_COUNT = 4;

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <React.Fragment key={step.label}>
            {/* Dashed connector (before every step except the first) */}
            {index > 0 && (
              <View style={styles.connectorRow}>
                {Array.from({ length: DASH_COUNT }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dash,
                      { backgroundColor: stepNum <= currentStep ? colors.primary[400] : colors.neutral[200] },
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Step circle + label */}
            <View style={styles.stepWrap}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isActive && styles.circleActive,
                  !isCompleted && !isActive && styles.circleUpcoming,
                ]}
              >
                {isCompleted ? (
                  <Feather name="check" size={16} color={colors.textInverse} />
                ) : (
                  <Feather
                    name={step.icon}
                    size={16}
                    color={isActive ? colors.primary[600] : colors.neutral[400]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  isCompleted && styles.labelCompleted,
                  isActive && styles.labelActive,
                  !isCompleted && !isActive && styles.labelUpcoming,
                ]}
              >
                {step.label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  stepWrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  circleCompleted: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  circleActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  circleUpcoming: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: CIRCLE_SIZE / 2,
    paddingHorizontal: 2,
  },
  dash: {
    width: 6,
    height: 2,
    borderRadius: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  labelCompleted: {
    color: colors.primary[600],
  },
  labelActive: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
  },
  labelUpcoming: {
    color: colors.neutral[400],
  },
});

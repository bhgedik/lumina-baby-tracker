// ============================================================
// Sprouty — Quiz Progress Bar
// Animated horizontal fill bar for onboarding quiz steps
// ============================================================

import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../constants/theme';

interface QuizProgressBarProps {
  currentStep: number; // 1-indexed
  totalSteps: number;
}

export function QuizProgressBar({ currentStep, totalSteps }: QuizProgressBarProps) {
  const fillAnim = useRef(new Animated.Value(currentStep / totalSteps)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: currentStep / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: fillAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
  },
});

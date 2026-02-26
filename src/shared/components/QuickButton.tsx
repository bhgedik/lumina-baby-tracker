// ============================================================
// Sprout — Quick Button
// Squishy round tap target — warm shadows, one-handed optimized
// ============================================================

import React, { useRef } from 'react';
import { Text, Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, shadows } from '../constants/theme';

interface Props {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  size?: number;
  color?: string;
  variant?: 'filled' | 'outlined';
  style?: ViewStyle;
}

export function QuickButton({
  icon,
  label,
  onPress,
  size = 80,
  color = colors.primary[500],
  variant = 'filled',
  style,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  const isFilled = variant === 'filled';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isFilled ? color : color + '10',
            borderWidth: isFilled ? 0 : 2.5,
            borderColor: color,
            transform: [{ scale: scaleAnim }],
          },
          isFilled && shadows.md,
          style,
        ]}
      >
        {icon}
        <Text
          style={[
            styles.label,
            { color: isFilled ? colors.textInverse : color },
            size < 70 && styles.labelSmall,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginTop: 2,
  },
  labelSmall: {
    fontSize: 9,
  },
});

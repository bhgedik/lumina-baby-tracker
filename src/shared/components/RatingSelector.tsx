// ============================================================
// Sprout — Rating Selector (1-5)
// Warm, squishy with 56px+ touch targets
// ============================================================

import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { colors, typography, spacing, shadows } from '../constants/theme';
import type { Rating } from '../types/common';

const DEFAULT_LABELS = ['😫', '😕', '😐', '🙂', '😊'];

interface Props {
  value: Rating | null;
  onChange: (value: Rating) => void;
  labels?: string[];
  size?: number;
}

export function RatingSelector({ value, onChange, labels = DEFAULT_LABELS, size = 56 }: Props) {
  return (
    <View style={styles.container}>
      {([1, 2, 3, 4, 5] as Rating[]).map((rating, index) => (
        <RatingCircle
          key={rating}
          rating={rating}
          label={labels[index] ?? `${rating}`}
          isSelected={value === rating}
          size={size}
          onPress={() => onChange(rating)}
        />
      ))}
    </View>
  );
}

function RatingCircle({
  rating,
  label,
  isSelected,
  size,
  onPress,
}: {
  rating: Rating;
  label: string;
  isSelected: boolean;
  size: number;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={() => {
        Animated.sequence([
          Animated.spring(scale, { toValue: 1.15, useNativeDriver: true }),
          Animated.spring(scale, { toValue: isSelected ? 1.1 : 1, useNativeDriver: true }),
        ]).start();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Rating ${rating}`}
    >
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isSelected ? colors.secondary[50] : colors.neutral[50],
            borderColor: isSelected ? colors.secondary[400] : colors.neutral[200],
            transform: [{ scale: isSelected ? 1.1 : 1 }],
          },
          isSelected && shadows.sm,
        ]}
      >
        <Text style={[styles.label, { fontSize: size * 0.4 }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  label: {
    textAlign: 'center',
  },
});

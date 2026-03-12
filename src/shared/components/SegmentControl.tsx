// ============================================================
// Lumina — Segment Control
// Squishy pill selector — warm, one-handed optimized (56px+)
// ============================================================

import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, LayoutChangeEvent } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/theme';

interface SegmentOption {
  value: string;
  label: string;
}

interface Props {
  options: SegmentOption[];
  selected: string;
  onSelect: (value: string) => void;
  size?: 'default' | 'large';
}

export function SegmentControl({ options, selected, onSelect, size = 'default' }: Props) {
  const height = size === 'large' ? 60 : 56;
  const translateX = useRef(new Animated.Value(0)).current;
  const segmentWidths = useRef<number[]>([]);
  const segmentPositions = useRef<number[]>([]);

  const selectedIndex = options.findIndex((o) => o.value === selected);

  useEffect(() => {
    if (segmentPositions.current[selectedIndex] !== undefined) {
      Animated.spring(translateX, {
        toValue: segmentPositions.current[selectedIndex],
        useNativeDriver: true,
        tension: 68,
        friction: 10,
      }).start();
    }
  }, [selectedIndex]);

  const onSegmentLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    segmentWidths.current[index] = width;
    segmentPositions.current[index] = x;
    if (index === selectedIndex) {
      translateX.setValue(x);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <Animated.View
        style={[
          styles.indicator,
          {
            height: height - 8,
            width: `${100 / options.length}%` as unknown as number,
            transform: [{ translateX }],
          },
        ]}
      />
      {options.map((option, index) => (
        <Pressable
          key={option.value}
          style={[styles.segment, { height }]}
          onPress={() => onSelect(option.value)}
          onLayout={onSegmentLayout(index)}
          accessibilityRole="button"
          accessibilityState={{ selected: option.value === selected }}
        >
          <Text
            style={[
              styles.label,
              option.value === selected && styles.labelSelected,
              size === 'large' && styles.labelLarge,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    padding: 4,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
  labelLarge: {
    fontSize: typography.fontSize.md,
  },
});

// ============================================================
// Lumina — Whisper Toast (Bottom Floating Pill)
// Premium micro-interaction: haptic feedback + animated pill
// Replaces generic "Logged" toasts with Lumina's warm voice
// ============================================================

import React, { useRef, useEffect } from 'react';
import { Text, Animated, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Props {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function LuminaWhisper({
  visible,
  message,
  onDismiss,
  durationMs = 2500,
}: Props) {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Haptic feedback on appear
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      // Slide up + fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 80,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onDismiss());
      }, durationMs);
    } else {
      translateY.setValue(80);
      opacity.setValue(0);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.pill,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    left: SCREEN_WIDTH * 0.15,
    right: SCREEN_WIDTH * 0.15,
    backgroundColor: '#2C3E2D',
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    // Premium shadow
    shadowColor: '#1A2B1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});

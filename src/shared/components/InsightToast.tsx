// ============================================================
// Lumina — Insight Toast
// Warm veteran insight popup — slides from top, auto-dismiss
// ============================================================

import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/theme';

interface Props {
  visible: boolean;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'urgent';
  source?: string;
  onDismiss: () => void;
  autoDismissMs?: number;
}

const SEVERITY_CONFIG = {
  info: { color: colors.primary[500], icon: 'info' as const },
  warning: { color: colors.warning, icon: 'alert-triangle' as const },
  urgent: { color: colors.error, icon: 'alert-circle' as const },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function InsightToast({
  visible,
  title,
  body,
  severity,
  source,
  onDismiss,
  autoDismissMs = 8000,
}: Props) {
  const translateY = useRef(new Animated.Value(-200)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }).start();

      timerRef.current = setTimeout(onDismiss, autoDismissMs);
    } else {
      Animated.timing(translateY, {
        toValue: -200,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  const config = SEVERITY_CONFIG[severity];

  return (
    <Animated.View
      style={[styles.container, shadows.lg, { transform: [{ translateY }] }]}
    >
      <Pressable onPress={onDismiss} style={styles.pressable}>
        <View style={[styles.accentBar, { backgroundColor: config.color }]} />
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Feather name={config.icon} size={16} color={config.color} style={styles.titleIcon} />
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>
          <Text style={styles.body} numberOfLines={3}>{body}</Text>
          {source && (
            <View style={styles.sourcePill}>
              <Text style={styles.sourceText}>{source}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.base,
    right: spacing.base,
    zIndex: 999,
  },
  pressable: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
  },
  accentBar: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: spacing.base,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleIcon: {
    marginRight: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  body: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  sourcePill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.full,
  },
  sourceText: {
    fontSize: typography.fontSize.xs,
    color: colors.secondary[600],
  },
});

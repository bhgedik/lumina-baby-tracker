// ============================================================
// Lumina — Rich Body Text
// Renders text with **bold** markers as actual bold Text nodes
// ============================================================

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../../shared/constants/theme';

interface Props {
  text: string;
  numberOfLines?: number;
  compact?: boolean;
}

export function RichBody({ text, numberOfLines, compact }: Props) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={compact ? styles.compactText : styles.bodyText} numberOfLines={numberOfLines}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={styles.bold}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    marginBottom: spacing.xs,
  },
  compactText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  bold: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});

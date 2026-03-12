// ============================================================
// Lumina — Visual Guide Component
// Actionable visual guidance: video thumbnails, step-by-step
// instructions, or illustration placeholders
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants/theme';
import type { VisualGuide as VisualGuideType } from '../types';

interface Props {
  guide: VisualGuideType;
}

export function VisualGuide({ guide }: Props) {
  switch (guide.type) {
    case 'video_link':
      return <VideoLinkGuide guide={guide} />;
    case 'step_by_step':
      return <StepByStepGuide guide={guide} />;
    case 'illustration':
      return <IllustrationGuide guide={guide} />;
    default:
      return null;
  }
}

// ─── Video Link ───

function VideoLinkGuide({ guide }: Props) {
  const handlePress = () => {
    if (guide.media_url) {
      Linking.openURL(guide.media_url).catch(() => {});
    }
  };

  return (
    <Pressable style={styles.videoContainer} onPress={handlePress}>
      {/* Thumbnail area */}
      <View style={styles.videoThumbnail}>
        <View style={styles.playButton}>
          <Feather name="play" size={24} color={colors.surface} />
        </View>
        {guide.duration_label && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{guide.duration_label}</Text>
          </View>
        )}
      </View>

      {/* Action text row */}
      <View style={styles.actionRow}>
        <Feather
          name={(guide.thumbnail_icon as any) || 'video'}
          size={16}
          color={colors.primary[600]}
        />
        <Text style={styles.actionText}>{guide.action_text}</Text>
        <Feather name="external-link" size={14} color={colors.primary[400]} />
      </View>
    </Pressable>
  );
}

// ─── Step by Step ───

function StepByStepGuide({ guide }: Props) {
  return (
    <View style={styles.stepsContainer}>
      <View style={styles.stepsHeader}>
        <Feather name="list" size={14} color={colors.primary[600]} />
        <Text style={styles.stepsTitle}>{guide.action_text}</Text>
      </View>

      {guide.steps?.map((step) => (
        <View key={step.step} style={styles.stepRow}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{step.step}</Text>
          </View>
          {step.icon && (
            <Feather
              name={step.icon as any}
              size={14}
              color={colors.primary[500]}
              style={styles.stepIcon}
            />
          )}
          <Text style={styles.stepInstruction}>{step.instruction}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Illustration ───

function IllustrationGuide({ guide }: Props) {
  return (
    <View style={styles.illustrationContainer}>
      <View style={styles.illustrationArea}>
        <Feather
          name={(guide.thumbnail_icon as any) || 'image'}
          size={32}
          color={colors.primary[400]}
        />
      </View>
      <View style={styles.actionRow}>
        <Feather name="info" size={14} color={colors.primary[600]} />
        <Text style={styles.actionText}>{guide.action_text}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  // Video Link
  videoContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.primary[50],
  },
  videoThumbnail: {
    height: 160,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3, // optical centering for play icon
  },
  durationBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textInverse,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  actionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },

  // Step by Step
  stepsContainer: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stepsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  stepIcon: {
    marginRight: spacing.xs,
    marginTop: 3,
  },
  stepInstruction: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary[800],
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },

  // Illustration
  illustrationContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.primary[50],
  },
  illustrationArea: {
    height: 120,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
});

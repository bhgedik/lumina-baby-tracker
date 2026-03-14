// ============================================================
// Lumina — Developmental Nudge Card
// Premium card for expert developmental insights from Supabase
// Distinct aesthetic from InsightCard: no accent bar, rounded
// visual placeholder, dismiss via X button
// ============================================================

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { VisualGuide } from './VisualGuide';
import type { VisualGuide as VisualGuideType, VisualGuideStep } from '../types';
import type { ExpertInsight } from '../services/expertInsightsService';

// ── Category → UI mapping ──

const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  motor: { label: 'MOTOR DEVELOPMENT', icon: 'move' },
  sleep: { label: 'SLEEP INSIGHT', icon: 'moon' },
  feeding: { label: 'FEEDING TIP', icon: 'coffee' },
  health: { label: 'HEALTH NOTE', icon: 'heart' },
  growth: { label: 'GROWTH NOTE', icon: 'trending-up' },
  milestone: { label: 'MILESTONE WATCH', icon: 'star' },
  wellness: { label: 'WELLNESS TIP', icon: 'sun' },
  general: { label: 'PEDIATRIC INSIGHT', icon: 'book-open' },
};

export { CATEGORY_CONFIG };

// ── Design tokens (matches nurse.tsx) ──

const UI = {
  card: '#FFFFFF',
  text: '#3D3D3D',
  textSecondary: '#5C5C5C',
  textLight: '#B0AAA2',
  accent: '#B199CE',
  accentLight: '#F0EBF5',
  accentDark: '#A78BBA',
};

const SOFT_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
};

// ── Props ──

interface DevelopmentalNudgeCardProps {
  insight: ExpertInsight;
  stageLabel?: string | null;
  onDismiss: (slug: string) => void;
  onAskAI: (insight: ExpertInsight) => void;
}

// ── Transform DB visual_guide to VisualGuide type ──

function parseVisualGuide(raw: Record<string, unknown> | null): VisualGuideType | undefined {
  if (!raw || !raw.type) return undefined;

  const guide: VisualGuideType = {
    type: raw.type as VisualGuideType['type'],
    media_url: (raw.media_url as string) ?? '',
    action_text: (raw.action_text as string) ?? '',
    thumbnail_icon: raw.thumbnail_icon as string | undefined,
    duration_label: raw.duration_label as string | undefined,
  };

  // Transform steps — DB may store simple strings or full step objects
  if (Array.isArray(raw.steps)) {
    guide.steps = (raw.steps as unknown[]).map((s, i): VisualGuideStep => {
      if (typeof s === 'string') {
        return { step: i + 1, instruction: s };
      }
      const obj = s as Record<string, unknown>;
      return {
        step: (obj.step as number) ?? i + 1,
        instruction: (obj.instruction as string) ?? '',
        icon: obj.icon as string | undefined,
      };
    });
  }

  return guide;
}

// ── Component ──

export function DevelopmentalNudgeCard({ insight, stageLabel, onDismiss, onAskAI }: DevelopmentalNudgeCardProps) {
  const [expanded, setExpanded] = useState(false);

  const config = CATEGORY_CONFIG[insight.category] ?? CATEGORY_CONFIG.general;
  const visualGuide = parseVisualGuide(insight.visual_guide);

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  return (
    <View style={styles.card}>
      {/* ── Header row ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Feather name={config.icon as any} size={14} color={UI.accent} />
          <Text style={styles.categoryLabel}>{config.label}</Text>
        </View>
        <Pressable
          onPress={() => onDismiss(insight.slug)}
          hitSlop={12}
          style={styles.dismissButton}
        >
          <Feather name="x" size={16} color={UI.textLight} />
        </Pressable>
      </View>

      {/* ── Stage pill ── */}
      {stageLabel && (
        <View style={styles.stagePill}>
          <Feather name="layers" size={11} color={UI.accentDark} />
          <Text style={styles.stageText}>{stageLabel}</Text>
        </View>
      )}

      {/* ── Title ── */}
      <Text style={styles.title}>{insight.title}</Text>

      {/* ── Visual placeholder (hidden when a real visual guide exists) ── */}
      {!visualGuide && (
        <View style={styles.visualPlaceholder}>
          <Feather name={config.icon as any} size={32} color={UI.accent} />
        </View>
      )}

      {/* ── Body text (collapsible) ── */}
      <Pressable onPress={toggleExpand}>
        <Text
          style={styles.body}
          numberOfLines={expanded ? undefined : 2}
        >
          {insight.body}
        </Text>
        <Text style={styles.readMore}>
          {expanded ? 'Show less' : 'Read more'}
        </Text>
      </Pressable>

      {/* ── Expanded content ── */}
      {expanded && (
        <>
          {/* Action items */}
          {insight.action_items && insight.action_items.length > 0 && (
            <View style={styles.actionList}>
              {insight.action_items.map((item, i) => (
                <View key={i} style={styles.actionItem}>
                  <View style={styles.actionBullet} />
                  <Text style={styles.actionText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Visual guide */}
          {visualGuide && (
            <View style={styles.visualGuideWrap}>
              <VisualGuide guide={visualGuide} />
            </View>
          )}

          {/* Ask Lumina button */}
          <Pressable
            style={styles.askAIButton}
            onPress={() => onAskAI(insight)}
            hitSlop={4}
          >
            <Feather name="message-circle" size={14} color={UI.accentDark} />
            <Text style={styles.askAIText}>Ask Lumina about this</Text>
          </Pressable>
        </>
      )}

      {/* ── Source line ── */}
      {insight.source && (
        <Text style={styles.source}>Source: {insight.source}</Text>
      )}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...SOFT_SHADOW,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: UI.accent,
    letterSpacing: 1.2,
  },
  dismissButton: {
    padding: 4,
  },

  // Stage pill
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: UI.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  stageText: {
    fontSize: 11,
    fontWeight: '600',
    color: UI.accentDark,
    letterSpacing: 0.3,
  },

  // Title
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: UI.text,
    marginBottom: 12,
  },

  // Visual placeholder
  visualPlaceholder: {
    height: 140,
    borderRadius: 16,
    backgroundColor: UI.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  // Body
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: UI.textSecondary,
    lineHeight: 20,
  },
  readMore: {
    fontSize: 13,
    fontWeight: '500',
    color: UI.accent,
    marginTop: 4,
  },

  // Action items (matches InsightCard pattern)
  actionList: {
    backgroundColor: UI.accentLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  actionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: UI.accentDark,
    marginTop: 6,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: UI.text,
    lineHeight: 20,
  },

  // Visual guide
  visualGuideWrap: {
    marginTop: 12,
  },

  // Ask Lumina
  askAIButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 12,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: UI.accentLight,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: UI.accent + '30',
  },
  askAIText: {
    fontSize: 13,
    fontWeight: '500',
    color: UI.accentDark,
  },

  // Source
  source: {
    fontSize: 11,
    fontStyle: 'italic',
    color: UI.textLight,
    marginTop: 12,
  },
});

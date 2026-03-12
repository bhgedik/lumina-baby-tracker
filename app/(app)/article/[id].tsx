// ============================================================
// Lumina — Editorial Article Reader
// Magazine-quality typography with rich markdown rendering
// Receives article data via route search params
// ============================================================

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';

const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

// ── Markdown-to-RN Renderer ────────────────────────────────

interface RenderedBlock {
  type: 'paragraph' | 'heading' | 'list' | 'callout';
  content: React.ReactNode;
}

/**
 * Parse inline markdown (**bold**, *italic*) into styled Text nodes.
 */
function renderInline(text: string, accent: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Match **bold** or numbered items like "1. **text:**"
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Text before the bold
    if (match.index > lastIndex) {
      nodes.push(
        <Text key={key++} style={mdStyles.body}>
          {text.slice(lastIndex, match.index)}
        </Text>
      );
    }
    // Bold text
    nodes.push(
      <Text key={key++} style={mdStyles.bold}>
        {match[1]}
      </Text>
    );
    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < text.length) {
    nodes.push(
      <Text key={key++} style={mdStyles.body}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  return nodes.length > 0 ? nodes : [<Text key={0} style={mdStyles.body}>{text}</Text>];
}

/**
 * Detect if a block of lines forms a "callout" (schedule, reference card, etc.)
 * Heuristic: starts with a heading-like bold line, followed by lines with arrows/colons.
 */
function isCalloutBlock(lines: string[]): boolean {
  if (lines.length < 3) return false;
  const hasSchedulePattern = lines.some((l) =>
    /\u2192|→|:.*\d/.test(l) && /night|day|month|week|age|min|hour/i.test(l)
  );
  return hasSchedulePattern;
}

/**
 * Parse full article body into structured blocks.
 */
function parseBody(body: string, accent: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const paragraphs = body.split(/\n\n+/);
  let key = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');

    // ── Heading: line is entirely **bold text** (possibly with colon)
    if (lines.length === 1 && /^\*\*[^*]+\*\*:?$/.test(trimmed)) {
      const headingText = trimmed.replace(/^\*\*/, '').replace(/\*\*:?$/, '').replace(/:$/, '');
      elements.push(
        <Text key={key++} style={mdStyles.heading}>
          {headingText}
        </Text>
      );
      continue;
    }

    // ── Numbered heading: "**1. Something:**" pattern on its own
    if (lines.length === 1 && /^\*\*\d+\.\s/.test(trimmed)) {
      const headingText = trimmed.replace(/^\*\*/, '').replace(/\*\*:?$/, '');
      elements.push(
        <Text key={key++} style={mdStyles.heading}>
          {headingText}
        </Text>
      );
      continue;
    }

    // ── Bullet/dash list
    if (lines.every((l) => /^[-\u2022\u2013]\s/.test(l.trim()))) {
      elements.push(
        <View key={key++} style={mdStyles.listBlock}>
          {lines.map((line, i) => {
            const content = line.trim().replace(/^[-\u2022\u2013]\s*/, '');
            return (
              <View key={i} style={mdStyles.listItem}>
                <Text style={[mdStyles.bullet, { color: accent }]}>{'\u2022'}</Text>
                <Text style={mdStyles.listText}>{renderInline(content, accent)}</Text>
              </View>
            );
          })}
        </View>
      );
      continue;
    }

    // ── Numbered list (lines starting with "1. ", "2. ")
    if (lines.every((l) => /^\d+\.\s/.test(l.trim()))) {
      elements.push(
        <View key={key++} style={mdStyles.listBlock}>
          {lines.map((line, i) => {
            const content = line.trim().replace(/^\d+\.\s*/, '');
            return (
              <View key={i} style={mdStyles.listItem}>
                <Text style={[mdStyles.numberBullet, { color: accent }]}>{i + 1}.</Text>
                <Text style={mdStyles.listText}>{renderInline(content, accent)}</Text>
              </View>
            );
          })}
        </View>
      );
      continue;
    }

    // ── Callout card (schedules, reference data)
    if (isCalloutBlock(lines)) {
      elements.push(
        <View key={key++} style={[mdStyles.calloutCard, { backgroundColor: accent + '0A', borderLeftColor: accent + '40' }]}>
          {lines.map((line, i) => (
            <Text key={i} style={mdStyles.calloutText}>
              {renderInline(line, accent)}
            </Text>
          ))}
        </View>
      );
      continue;
    }

    // ── Mixed content: heading + bullet list in one paragraph
    if (lines.length > 1 && /^\*\*[^*]+\*\*:?$/.test(lines[0].trim())) {
      const headingText = lines[0].trim().replace(/^\*\*/, '').replace(/\*\*:?$/, '').replace(/:$/, '');
      const restLines = lines.slice(1);
      const isList = restLines.every((l) => /^[-\u2022\u2013]\s/.test(l.trim()));

      elements.push(
        <Text key={key++} style={mdStyles.heading}>
          {headingText}
        </Text>
      );

      if (isList) {
        elements.push(
          <View key={key++} style={mdStyles.listBlock}>
            {restLines.map((line, i) => {
              const content = line.trim().replace(/^[-\u2022\u2013]\s*/, '');
              return (
                <View key={i} style={mdStyles.listItem}>
                  <Text style={[mdStyles.bullet, { color: accent }]}>{'\u2022'}</Text>
                  <Text style={mdStyles.listText}>{renderInline(content, accent)}</Text>
                </View>
              );
            })}
          </View>
        );
      } else {
        elements.push(
          <Text key={key++} style={mdStyles.bodyParagraph}>
            {renderInline(restLines.join('\n'), accent)}
          </Text>
        );
      }
      continue;
    }

    // ── Default paragraph
    elements.push(
      <Text key={key++} style={mdStyles.bodyParagraph}>
        {renderInline(trimmed, accent)}
      </Text>
    );
  }

  return elements;
}

// ── Main Screen ─────────────────────────────────────────────

export default function ArticleScreen() {
  const router = useRouter();
  const { title, body, label, icon, accentColor } = useLocalSearchParams<{
    title: string;
    body: string;
    label?: string;
    icon?: string;
    accentColor?: string;
  }>();

  const accent = accentColor || colors.primary[500];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header bar */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Label pill */}
        {label && (
          <View style={[styles.labelPill, { backgroundColor: accent + '15' }]}>
            {icon && (
              <Feather name={icon as any} size={14} color={accent} />
            )}
            <Text style={[styles.labelText, { color: accent }]}>{label}</Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{title || 'Article'}</Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: accent + '30' }]} />

        {/* Rendered body */}
        <View style={styles.bodyContainer}>
          {body ? parseBody(body, accent) : (
            <Text style={mdStyles.body}>Content is loading...</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Page-level styles ───────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },

  // Label
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  labelText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Title
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D2D2D',
    lineHeight: 36,
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },

  // Divider
  divider: {
    height: 3,
    width: 48,
    borderRadius: 2,
    marginBottom: 28,
  },

  // Body container
  bodyContainer: {
    gap: 0,
  },
});

// ── Markdown typography styles ──────────────────────────────

const mdStyles = StyleSheet.create({
  body: {
    fontSize: 16.5,
    color: '#3A3A3A',
    lineHeight: 28,
    letterSpacing: 0.15,
  },
  bold: {
    fontSize: 16.5,
    color: '#2D2D2D',
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
  bodyParagraph: {
    fontSize: 16.5,
    color: '#3A3A3A',
    lineHeight: 28,
    letterSpacing: 0.15,
    marginBottom: 20,
  },

  // ── Headings ──
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
    lineHeight: 28,
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: -0.3,
  },

  // ── Lists ──
  listBlock: {
    marginBottom: 20,
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 26,
    width: 18,
    fontWeight: '700',
  },
  numberBullet: {
    fontSize: 15,
    lineHeight: 26,
    width: 24,
    fontWeight: '700',
  },
  listText: {
    flex: 1,
    fontSize: 16,
    color: '#3A3A3A',
    lineHeight: 26,
    letterSpacing: 0.1,
  },

  // ── Callout Card (schedules, references) ──
  calloutCard: {
    borderRadius: 16,
    borderLeftWidth: 4,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 6,
  },
  calloutText: {
    fontSize: 15,
    color: '#3A3A3A',
    lineHeight: 24,
    letterSpacing: 0.1,
  },
});

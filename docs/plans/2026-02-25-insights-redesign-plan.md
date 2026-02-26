# Insights Screen Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the flat insights feed into a grouped, categorized, dismissible card system with a summary pulse card, filter chips, and differentiated card sizes by priority.

**Architecture:** The `useInsightsData` hook is refactored to return `GroupedInsights` (urgent/wellness/patterns/positive sections + pulse summary) instead of a flat array. Each card gets a `contentHash` for dismiss tracking. New UI components (PulseCard, FilterChips, CompactInsightCard, MiniInsightRow, SectionHeader) are composed in a sectioned layout in `insights.tsx`. A new Zustand store handles dismiss state with auto-resurface on data change.

**Tech Stack:** React Native, Expo, Zustand, AsyncStorage, RN Animated API, @expo/vector-icons (Feather)

**Parallelization:** Tasks 1 is foundation. Tasks 2, 3, 4 are independent and can run as parallel subagents. Task 5 assembles everything. Task 6 tests.

---

### Task 1: Update types + create dismiss store (FOUNDATION — must complete first)

**Files:**
- Modify: `src/modules/insights/types.ts`
- Create: `src/stores/insightDismissStore.ts`

**Step 1: Update types.ts**

Add `contentHash` to `InsightCardData` and add new grouped types. Replace the entire file:

```typescript
// ============================================================
// Nodd — Insights Module Types
// Smart card feed + conversational AI chat
// ============================================================

export type InsightTag =
  | 'health_pattern'
  | 'sleep_alert'
  | 'feeding_insight'
  | 'mothers_wellness'
  | 'diaper_pattern'
  | 'growth_note'
  | 'milestone_watch'
  | 'general';

export type QuickActionType = 'log_diaper' | 'log_feed' | 'log_sleep';

export interface QuickAction {
  type: QuickActionType;
  label: string;
  icon: string; // Feather icon name
}

export interface InsightCardData {
  id: string;
  tag: InsightTag;
  tagLabel: string;
  tagIcon: string; // Feather icon name
  hook: string; // "Based on..." data source explanation
  title: string;
  body: string; // Supports **bold** markers for rich text
  priority: 'low' | 'medium' | 'high';
  actionItems?: string[];
  quickAction?: QuickAction;
  createdAt: number; // Date.now() timestamp
  contentHash: string; // Derived from triggering data, used for dismiss tracking
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'nurse';
  text: string;
  timestamp: number;
}

// ─── Grouped Insights ───

export type DomainStatus = 'good' | 'attention' | 'no_data';

export interface PulseDomain {
  key: string;
  label: string;
  status: DomainStatus;
  icon: string; // Feather icon name
}

export interface PulseData {
  domains: PulseDomain[];
  summary: string;
  dayLabel: string;
}

export interface GroupedInsights {
  pulse: PulseData;
  urgent: InsightCardData[];
  wellness: InsightCardData[];
  patterns: InsightCardData[];
  positive: InsightCardData[];
}

export type InsightSection = 'urgent' | 'wellness' | 'patterns' | 'positive';

// Filter chip categories shown in the UI
export type FilterCategory = 'all' | 'feeding' | 'sleep' | 'diapers' | 'wellness' | 'growth';

export const FILTER_OPTIONS: { key: FilterCategory; label: string; tags: InsightTag[] }[] = [
  { key: 'all', label: 'All', tags: [] },
  { key: 'feeding', label: 'Feeding', tags: ['feeding_insight'] },
  { key: 'sleep', label: 'Sleep', tags: ['sleep_alert'] },
  { key: 'diapers', label: 'Diapers', tags: ['diaper_pattern'] },
  { key: 'wellness', label: 'My Wellness', tags: ['mothers_wellness'] },
  { key: 'growth', label: 'Growth', tags: ['growth_note', 'milestone_watch', 'general', 'health_pattern'] },
];
```

**Step 2: Create insightDismissStore.ts**

Follow the exact same Zustand + AsyncStorage pattern from `prepChecklistStore.ts`:

```typescript
// ============================================================
// Nodd — Insight Dismiss Store (Zustand)
// Tracks dismissed insight content hashes with auto-resurface
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@nodd/insight-dismiss-v1';

interface PersistedData {
  dismissedHashes: Record<string, number>; // contentHash → dismissedAt timestamp
}

interface InsightDismissState {
  dismissedHashes: Record<string, number>;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  dismiss: (contentHash: string) => void;
  isDismissed: (contentHash: string) => boolean;
  clearAll: () => void;
}

function persist(data: PersistedData) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

export const useInsightDismissStore = create<InsightDismissState>((set, get) => ({
  dismissedHashes: {},
  isHydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: PersistedData = JSON.parse(raw);
        set({
          dismissedHashes: data.dismissedHashes ?? {},
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  dismiss: (contentHash: string) => {
    const { dismissedHashes } = get();
    const next = { ...dismissedHashes, [contentHash]: Date.now() };
    set({ dismissedHashes: next });
    persist({ dismissedHashes: next });
  },

  isDismissed: (contentHash: string) => {
    return contentHash in get().dismissedHashes;
  },

  clearAll: () => {
    set({ dismissedHashes: {} });
    persist({ dismissedHashes: {} });
  },
}));
```

**Step 3: Verify typecheck**

Run: `cd /Users/bernahazalgedik/sprout-baby-tracker/nodd && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors in the modified files (existing errors elsewhere are OK)

---

### Task 2: Create new UI components (PARALLEL — no deps on Task 3 or 4)

**Files:**
- Create: `src/modules/insights/components/SectionHeader.tsx`
- Create: `src/modules/insights/components/PulseCard.tsx`
- Create: `src/modules/insights/components/FilterChips.tsx`
- Create: `src/modules/insights/components/CompactInsightCard.tsx`
- Create: `src/modules/insights/components/MiniInsightRow.tsx`

**Dependencies:** Task 1 (types.ts must exist)

**Reference files for style patterns:**
- Theme: `src/shared/constants/theme.ts` — colors, typography, spacing, borderRadius, shadows
- Existing card: `src/modules/insights/components/InsightCard.tsx` — TAG_COLORS map, RichBody helper

**Step 1: Create SectionHeader.tsx**

```typescript
// ============================================================
// Nodd — Section Header
// Reusable section divider with icon, title, and collapse toggle
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../shared/constants/theme';

interface Props {
  icon: string;
  iconColor: string;
  title: string;
  count: number;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function SectionHeader({ icon, iconColor, title, count, collapsible, collapsed, onToggle }: Props) {
  const content = (
    <View style={styles.row}>
      <Feather name={icon as any} size={16} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
      {collapsible && (
        <Feather
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={16}
          color={colors.textTertiary}
        />
      )}
    </View>
  );

  if (collapsible && onToggle) {
    return (
      <Pressable style={styles.container} onPress={onToggle} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.neutral[100],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
});
```

**Step 2: Create PulseCard.tsx**

```typescript
// ============================================================
// Nodd — Pulse Card
// Dynamic daily summary hero card replacing static nurse quote
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import type { PulseData, DomainStatus } from '../types';

interface Props {
  pulse: PulseData;
}

const STATUS_COLORS: Record<DomainStatus, string> = {
  good: colors.success,
  attention: colors.warning,
  no_data: colors.neutral[300],
};

export function PulseCard({ pulse }: Props) {
  return (
    <View style={[styles.card, shadows.sm]}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Today's Snapshot</Text>
        <Text style={styles.dayLabel}>{pulse.dayLabel}</Text>
      </View>

      <View style={styles.domainsRow}>
        {pulse.domains.map((domain) => (
          <View key={domain.key} style={styles.domainItem}>
            <View style={[styles.dot, { backgroundColor: STATUS_COLORS[domain.status] }]} />
            <Feather name={domain.icon as any} size={12} color={colors.textSecondary} />
            <Text style={styles.domainLabel}>{domain.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.summary}>{pulse.summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius['2xl'],
    padding: spacing.base,
    marginBottom: spacing.base,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[800],
  },
  dayLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
  },
  domainsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
    marginBottom: spacing.md,
  },
  domainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  domainLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  summary: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    color: colors.primary[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
});
```

**Step 3: Create FilterChips.tsx**

```typescript
// ============================================================
// Nodd — Filter Chips
// Horizontal scrollable category pills for insight filtering
// ============================================================

import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants/theme';
import { FILTER_OPTIONS, type FilterCategory } from '../types';

interface Props {
  selected: FilterCategory;
  onSelect: (category: FilterCategory) => void;
}

export function FilterChips({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {FILTER_OPTIONS.map((opt) => {
        const isActive = selected === opt.key;
        return (
          <Pressable
            key={opt.key}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(opt.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: spacing.base,
    flexGrow: 0,
  },
  container: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  chipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: typography.fontWeight.semibold,
  },
});
```

**Step 4: Create CompactInsightCard.tsx**

```typescript
// ============================================================
// Nodd — Compact Insight Card
// Smaller card for medium/low priority with tap-to-expand body
// ============================================================

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import type { InsightCardData, QuickAction } from '../types';

interface Props {
  insight: InsightCardData;
  onDiscuss: (insight: InsightCardData) => void;
  onQuickAction?: (action: QuickAction) => void;
  onDismiss?: (contentHash: string) => void;
}

const TAG_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  health_pattern:    { bg: colors.primary[50],    text: colors.primary[700],    icon: colors.primary[500] },
  sleep_alert:       { bg: '#EDE7F6',             text: '#5E35B1',              icon: '#7E57C2' },
  feeding_insight:   { bg: colors.secondary[50],  text: colors.secondary[700],  icon: colors.secondary[500] },
  mothers_wellness:  { bg: '#FCE4EC',             text: '#C62828',              icon: '#E53935' },
  diaper_pattern:    { bg: '#E3F2FD',             text: '#1565C0',              icon: '#42A5F5' },
  growth_note:       { bg: colors.primary[50],    text: colors.primary[700],    icon: colors.primary[500] },
  milestone_watch:   { bg: '#FFF8E1',             text: '#F57F17',              icon: '#FFB300' },
  general:           { bg: colors.neutral[100],   text: colors.neutral[700],    icon: colors.neutral[500] },
};

/**
 * Renders body text with **bold** markers converted to actual bold Text nodes.
 */
function RichBody({ text, numberOfLines }: { text: string; numberOfLines?: number }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={styles.bodyText} numberOfLines={numberOfLines}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={styles.bodyBold}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

export function CompactInsightCard({ insight, onDiscuss, onQuickAction, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false);
  const tagColor = TAG_COLORS[insight.tag] ?? TAG_COLORS.general;

  const toggleExpand = useCallback(() => setExpanded((prev) => !prev), []);

  return (
    <Pressable style={[styles.card, shadows.sm]} onPress={toggleExpand}>
      <View style={styles.topRow}>
        <View style={[styles.tag, { backgroundColor: tagColor.bg }]}>
          <Feather name={insight.tagIcon as any} size={10} color={tagColor.icon} />
          <Text style={[styles.tagText, { color: tagColor.text }]}>{insight.tagLabel}</Text>
        </View>
        {onDismiss && (
          <Pressable
            onPress={() => onDismiss(insight.contentHash)}
            hitSlop={8}
            accessibilityLabel="Dismiss insight"
          >
            <Feather name="x" size={14} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <Text style={styles.title}>{insight.title}</Text>

      <RichBody text={insight.body} numberOfLines={expanded ? undefined : 2} />

      {expanded && (
        <>
          {/* Action items */}
          {insight.actionItems && insight.actionItems.length > 0 && (
            <View style={styles.actionList}>
              {insight.actionItems.map((item, i) => (
                <View key={i} style={styles.actionItem}>
                  <View style={styles.actionBullet} />
                  <Text style={styles.actionText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Quick Action */}
          {insight.quickAction && onQuickAction && (
            <Pressable
              style={styles.quickActionButton}
              onPress={() => onQuickAction(insight.quickAction!)}
              accessibilityLabel={insight.quickAction.label}
            >
              <Feather name={insight.quickAction.icon as any} size={14} color={colors.secondary[600]} />
              <Text style={styles.quickActionText}>{insight.quickAction.label}</Text>
            </Pressable>
          )}

          {/* Discuss CTA */}
          <Pressable
            style={styles.discussButton}
            onPress={() => onDiscuss(insight)}
            accessibilityLabel={`Discuss: ${insight.title}`}
          >
            <Feather name="message-circle" size={14} color={colors.primary[600]} />
            <Text style={styles.discussText}>Discuss with your AI Nurse</Text>
            <Feather name="chevron-right" size={14} color={colors.primary[400]} />
          </Pressable>
        </>
      )}

      {!expanded && (
        <Text style={styles.readMore}>Tap to read more</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: typography.fontSize.base * typography.lineHeight.tight,
  },
  bodyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  bodyBold: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  readMore: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
  actionList: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  actionBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary[500],
    marginTop: 5,
  },
  actionText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.primary[800],
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderStyle: 'dashed',
    marginBottom: spacing.xs,
  },
  quickActionText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.secondary[600],
  },
  discussButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
    marginTop: spacing.xs,
  },
  discussText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
  },
});
```

**Step 5: Create MiniInsightRow.tsx**

```typescript
// ============================================================
// Nodd — Mini Insight Row
// Minimal positive reinforcement row with checkmark + title
// ============================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants/theme';
import type { InsightCardData } from '../types';

interface Props {
  insight: InsightCardData;
  onPress: (insight: InsightCardData) => void;
}

export function MiniInsightRow({ insight, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={() => onPress(insight)}>
      <View style={styles.checkCircle}>
        <Feather name="check" size={12} color={colors.success} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {insight.title}
      </Text>
      <Feather name="chevron-right" size={14} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
});
```

---

### Task 3: Update InsightCard with collapsible body + swipe-to-dismiss (PARALLEL)

**Files:**
- Modify: `src/modules/insights/components/InsightCard.tsx`

**Dependencies:** Task 1 (contentHash on InsightCardData)

**What changes:**
1. Add `onDismiss?: (contentHash: string) => void` prop
2. Add collapsible body (show 3 lines by default, "Read more" to expand)
3. Add swipe-to-dismiss using RN Animated + PanResponder

Replace the full file with this updated version:

```typescript
// ============================================================
// Nodd — Insight Card
// Premium smart card with context tag, rich body, chat CTA,
// collapsible body, and swipe-to-dismiss
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, PanResponder } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import type { InsightCardData, QuickAction } from '../types';

interface Props {
  insight: InsightCardData;
  onDiscuss: (insight: InsightCardData) => void;
  onQuickAction?: (action: QuickAction) => void;
  onDismiss?: (contentHash: string) => void;
}

export const TAG_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  health_pattern:    { bg: colors.primary[50],    text: colors.primary[700],    icon: colors.primary[500] },
  sleep_alert:       { bg: '#EDE7F6',             text: '#5E35B1',              icon: '#7E57C2' },
  feeding_insight:   { bg: colors.secondary[50],  text: colors.secondary[700],  icon: colors.secondary[500] },
  mothers_wellness:  { bg: '#FCE4EC',             text: '#C62828',              icon: '#E53935' },
  diaper_pattern:    { bg: '#E3F2FD',             text: '#1565C0',              icon: '#42A5F5' },
  growth_note:       { bg: colors.primary[50],    text: colors.primary[700],    icon: colors.primary[500] },
  milestone_watch:   { bg: '#FFF8E1',             text: '#F57F17',              icon: '#FFB300' },
  general:           { bg: colors.neutral[100],   text: colors.neutral[700],    icon: colors.neutral[500] },
};

const PRIORITY_ACCENT: Record<string, string> = {
  high: colors.secondary[500],
  medium: colors.primary[500],
  low: colors.neutral[300],
};

const SWIPE_THRESHOLD = -80;

/**
 * Renders body text with **bold** markers converted to actual bold Text nodes.
 */
function RichBody({ text, numberOfLines }: { text: string; numberOfLines?: number }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={styles.bodyText} numberOfLines={numberOfLines}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={styles.bodyBold}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

export function InsightCard({ insight, onDiscuss, onQuickAction, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false);
  const tagColor = TAG_COLORS[insight.tag] ?? TAG_COLORS.general;
  const accentColor = PRIORITY_ACCENT[insight.priority] ?? colors.neutral[300];

  const translateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0) {
          translateX.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < SWIPE_THRESHOLD && onDismiss) {
          Animated.parallel([
            Animated.timing(translateX, { toValue: -400, duration: 200, useNativeDriver: true }),
            Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]).start(() => onDismiss(insight.contentHash));
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const toggleExpand = useCallback(() => setExpanded((prev) => !prev), []);

  return (
    <Animated.View
      style={[{ transform: [{ translateX }], opacity: cardOpacity }]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.card, shadows.md]}>
        {/* Priority accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        <View style={styles.cardContent}>
          {/* Context tag + dismiss */}
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: tagColor.bg }]}>
              <Feather name={insight.tagIcon as any} size={12} color={tagColor.icon} />
              <Text style={[styles.tagText, { color: tagColor.text }]}>{insight.tagLabel}</Text>
            </View>
            {onDismiss && (
              <Pressable
                onPress={() => onDismiss(insight.contentHash)}
                hitSlop={8}
                accessibilityLabel="Dismiss insight"
              >
                <Feather name="x" size={16} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>

          {/* Data source hook */}
          <Text style={styles.hookText}>{insight.hook}</Text>

          {/* Title */}
          <Text style={styles.title}>{insight.title}</Text>

          {/* Rich body — collapsible */}
          <Pressable onPress={toggleExpand}>
            <RichBody text={insight.body} numberOfLines={expanded ? undefined : 3} />
            {!expanded && (
              <Text style={styles.readMore}>Read more</Text>
            )}
          </Pressable>

          {/* Expanded content */}
          {expanded && (
            <>
              {/* Action items */}
              {insight.actionItems && insight.actionItems.length > 0 && (
                <View style={styles.actionList}>
                  {insight.actionItems.map((item, i) => (
                    <View key={i} style={styles.actionItem}>
                      <View style={styles.actionBullet} />
                      <Text style={styles.actionText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Quick Action — "I forgot to log" */}
              {insight.quickAction && onQuickAction && (
                <Pressable
                  style={styles.quickActionButton}
                  onPress={() => onQuickAction(insight.quickAction!)}
                  accessibilityLabel={insight.quickAction.label}
                >
                  <Feather name={insight.quickAction.icon as any} size={16} color={colors.secondary[600]} />
                  <Text style={styles.quickActionText}>{insight.quickAction.label}</Text>
                </Pressable>
              )}
            </>
          )}

          {/* Discuss CTA — always visible */}
          <Pressable
            style={styles.discussButton}
            onPress={() => onDiscuss(insight)}
            accessibilityLabel={`Discuss: ${insight.title}`}
          >
            <Feather name="message-circle" size={16} color={colors.primary[600]} />
            <Text style={styles.discussText}>Discuss with your AI Nurse</Text>
            <Feather name="chevron-right" size={16} color={colors.primary[400]} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing.base,
    flexDirection: 'row',
  },
  accentBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: spacing.base,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hookText: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: typography.fontSize.md * typography.lineHeight.tight,
  },
  bodyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    marginBottom: spacing.xs,
  },
  bodyBold: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  readMore: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  actionList: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  actionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[500],
    marginTop: 6,
  },
  actionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary[800],
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderStyle: 'dashed',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.secondary[600],
  },
  discussButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary[200],
    marginTop: spacing.sm,
  },
  discussText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
  },
});
```

---

### Task 4: Refactor useInsightsData hook to return GroupedInsights (PARALLEL)

**Files:**
- Modify: `src/modules/insights/hooks/useInsightsData.ts`

**Dependencies:** Task 1 (new types)

**What changes:**
1. Return `GroupedInsights` instead of flat `InsightCardData[]`
2. Add `contentHash` to every card
3. Compute `PulseData` from all store summaries
4. Group cards into urgent/wellness/patterns/positive buckets
5. Filter out dismissed cards using `useInsightDismissStore`

Replace the full file:

```typescript
// ============================================================
// Nodd — Insights Data Hook
// Cross-references ALL stores to generate grouped smart insights
// Returns sectioned data with pulse summary + dismiss filtering
// ============================================================

import { useMemo } from 'react';
import { useBabyStore } from '../../../stores/babyStore';
import { useFeedingStore } from '../../../stores/feedingStore';
import { useSleepStore } from '../../../stores/sleepStore';
import { useDiaperStore } from '../../../stores/diaperStore';
import { useMotherMoodStore, MOOD_CONFIG, type MoodEmoji } from '../../../stores/motherMoodStore';
import { useMotherMedsStore } from '../../../stores/motherMedsStore';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { useInsightDismissStore } from '../../../stores/insightDismissStore';
import { calculateCorrectedAge } from '../../baby/utils/correctedAge';
import type { InsightCardData, InsightTag, GroupedInsights, PulseData, PulseDomain } from '../types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

interface InsightsState {
  grouped: GroupedInsights;
  babyName: string | null;
  babyAgeDays: number | null;
  feedingMethod: string;
}

function computeBabyAgeDays(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const birth = new Date(dateOfBirth);
  birth.setHours(0, 0, 0, 0);
  const diff = now.getTime() - birth.getTime();
  if (diff < 0) return null;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatAgeDays(days: number): string {
  if (days <= 14) return `Day ${days}`;
  const weeks = Math.floor(days / 7);
  if (weeks <= 12) return `Week ${weeks}`;
  const months = Math.floor(days / 30.44);
  return `${months} month${months > 1 ? 's' : ''} old`;
}

/** Create a date-based key for today to make hashes change daily */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function useInsightsData(): InsightsState {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const feedingMethod = useOnboardingStore((s) => s.feedingMethod) ?? 'mixed';
  const moodEntries = useMotherMoodStore((s) => s.entries);
  const activeMeds = useMotherMedsStore((s) => s.activeMeds);
  const feedingTimer = useFeedingStore((s) => s.activeTimer);
  const sleepTimer = useSleepStore((s) => s.activeTimer);
  const dismissedHashes = useInsightDismissStore((s) => s.dismissedHashes);

  const baby = useMemo(() => {
    if (!activeBabyId) return babies[0] ?? null;
    return babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;
  }, [babies, activeBabyId]);

  const babyName = baby?.name ?? null;
  const dateOfBirth = (!baby?.is_pregnant && baby?.date_of_birth) ? baby.date_of_birth : null;
  const babyAgeDays = useMemo(() => computeBabyAgeDays(dateOfBirth), [dateOfBirth]);

  const correctedAge = useMemo(() => {
    return baby ? calculateCorrectedAge(baby) : null;
  }, [baby]);

  const grouped = useMemo<GroupedInsights>(() => {
    const allCards: InsightCardData[] = [];
    const name = babyName || 'your baby';
    const ageDays = babyAgeDays ?? 0;
    const ageLabel = ageDays > 0 ? formatAgeDays(ageDays) : '';
    const day = todayKey();

    // Gather live data snapshots
    const feedingSummary = baby ? useFeedingStore.getState().getSummaryToday(baby.id) : null;
    const sleepSummary = baby ? useSleepStore.getState().getSummaryToday(baby.id) : null;
    const diaperSummary = baby ? useDiaperStore.getState().getSummaryToday(baby.id) : null;

    const recentMoods = moodEntries.slice(-7);
    const todaysMood = useMotherMoodStore.getState().getTodaysMood();

    // ─── GENERATE ALL INSIGHT CARDS ───

    // 1. Mother wellness + sleep pattern cross-reference
    const hasStrugglingMood = recentMoods.some(
      (e) => e.mood === 'struggling' || e.mood === 'overwhelmed'
    );

    if (hasStrugglingMood) {
      const moodLabel = todaysMood ? MOOD_CONFIG[todaysMood.mood].label.toLowerCase() : 'recent mood logs';
      allCards.push({
        id: generateId(),
        tag: 'mothers_wellness',
        tagLabel: "Mother's Wellness",
        tagIcon: 'heart',
        hook: `Based on your ${moodLabel} and ${name}'s frequent night waking logs...`,
        title: 'Checking in on you',
        body: `I want you to know that **feeling overwhelmed is not a sign of failure** — it's a sign you're giving everything you have. When ${name} wakes frequently at night, it creates a cycle of exhaustion that makes everything feel harder.\n\n**Here's what I'd suggest:** Try to get one uninterrupted 4-hour sleep block tonight. Ask your partner or a family member to take one night shift. Sleep deprivation is cumulative, and even one good stretch can reset your resilience.\n\nIf these feelings persist for more than two weeks, please talk to your OB or midwife. **Postpartum mood disorders are common, treatable, and never your fault.**`,
        priority: 'high',
        actionItems: [
          'Arrange one 4-hour uninterrupted sleep block tonight',
          'Talk to your partner about taking a night shift',
          'If feelings persist 2+ weeks, call your provider',
        ],
        createdAt: Date.now(),
        contentHash: `wellness-mood-struggling-${day}`,
      });
    }

    // 2. Feeding pattern insight
    if (feedingSummary && feedingSummary.total_feeds > 0) {
      const totalFeeds = feedingSummary.total_feeds;
      const isNewborn = ageDays <= 28;
      const expectedMin = isNewborn ? 8 : 6;

      if (totalFeeds >= expectedMin) {
        allCards.push({
          id: generateId(),
          tag: 'feeding_insight',
          tagLabel: 'Feeding Pattern',
          tagIcon: 'coffee',
          hook: `Based on ${totalFeeds} feeds logged today and ${name}'s ${ageLabel} development...`,
          title: `${name}'s feeding is right on track`,
          body: `You're doing a wonderful job keeping up with feeds. At **${ageLabel}**, ${isNewborn ? '8-12 feeds per day is exactly what we expect' : 'this feeding frequency supports healthy growth'}. ${name}'s stomach is growing, and your routine is clearly working.\n\n**Pro tip from the nursery:** Watch for ${name}'s early hunger cues — hand-to-mouth movements and lip smacking — rather than waiting for crying. Catching feeds early means **less stress for both of you** and more efficient feeding sessions.`,
          priority: 'low',
          createdAt: Date.now() - 3600000,
          contentHash: `feeding-ontrack-${totalFeeds}-${day}`,
        });
      } else if (totalFeeds > 0 && totalFeeds < expectedMin) {
        allCards.push({
          id: generateId(),
          tag: 'feeding_insight',
          tagLabel: 'Feeding Pattern',
          tagIcon: 'coffee',
          hook: `Based on ${totalFeeds} feeds so far today (${ageLabel})...`,
          title: 'A gentle feeding reminder',
          body: `I've noticed ${totalFeeds} feed${totalFeeds > 1 ? 's' : ''} so far today. At **${ageLabel}**, we typically want to see **${expectedMin}-${expectedMin + 4} feeds in 24 hours**. **Forgot to log a couple?** That happens — tap below to catch up. If the count is accurate, no stress — some babies cluster their feeds later in the day.\n\n**What to watch for:** If ${name} seems content, has good wet diapers, and is gaining weight, the pattern is likely fine. But if you're noticing fewer wet diapers too, it's worth a quick check-in with your pediatrician.`,
          priority: 'medium',
          quickAction: { type: 'log_feed', label: 'I forgot to log! Add Feed', icon: 'plus-circle' },
          createdAt: Date.now() - 1800000,
          contentHash: `feeding-low-${totalFeeds}-${day}`,
        });
      }
    }

    // 3. Diaper pattern cross-referenced with feeding
    if (diaperSummary) {
      const wetCount = diaperSummary.wet_count ?? 0;
      const dirtyCount = diaperSummary.dirty_count ?? 0;
      const isNewborn = ageDays <= 28;

      if (isNewborn && wetCount < 4 && ageDays > 3) {
        allCards.push({
          id: generateId(),
          tag: 'diaper_pattern',
          tagLabel: 'Diaper Pattern',
          tagIcon: 'droplet',
          hook: `Based on ${wetCount} wet diaper${wetCount !== 1 ? 's' : ''} today and ${feedingSummary?.total_feeds ?? 0} feeds...`,
          title: 'Hydration check',
          body: `At **${ageLabel}**, we like to see **at least 6 wet diapers per day** as a sign of good hydration. You've logged ${wetCount} so far. **If you just forgot to log a few changes, no worries** — tap below to catch up! But if the count is accurate, try offering a feed soon.\n\n**The connection:** Wet diapers are our best proxy for whether ${name} is getting enough milk or formula. If you're also seeing fewer feeds today, try offering a feed soon and watch for improvement.\n\n**When to call:** If you see no wet diaper for 8+ hours in a newborn, contact your pediatrician.`,
          priority: 'high',
          actionItems: [
            `Offer ${name} a feed soon`,
            'Track the next diaper closely',
            'Call pediatrician if no wet diaper for 8+ hours',
          ],
          quickAction: { type: 'log_diaper', label: 'I forgot to log! Add Diaper', icon: 'plus-circle' },
          createdAt: Date.now() - 900000,
          contentHash: `diaper-low-wet-${wetCount}-${day}`,
        });
      }

      if (dirtyCount > 0 && wetCount >= 4) {
        allCards.push({
          id: generateId(),
          tag: 'diaper_pattern',
          tagLabel: 'Diaper Pattern',
          tagIcon: 'droplet',
          hook: `Based on today's ${wetCount} wet and ${dirtyCount} dirty diapers...`,
          title: 'Diaper output looks healthy',
          body: `**${wetCount} wet and ${dirtyCount} dirty** — this is exactly what I'd want to see. Good diaper output is one of the most reliable signs that ${name} is **feeding well and staying hydrated**.\n\nKeep up the great tracking. It might feel tedious, but this data is genuinely valuable for your pediatrician appointments.`,
          priority: 'low',
          createdAt: Date.now() - 7200000,
          contentHash: `diaper-healthy-${wetCount}-${dirtyCount}-${day}`,
        });
      }
    }

    // 4. Sleep insight (cross-referenced with age)
    if (sleepSummary && sleepSummary.total_sleep_hours > 0) {
      const totalHours = Math.round(sleepSummary.total_sleep_hours * 10) / 10;
      const isNewborn = ageDays <= 28;
      const expected = isNewborn ? '14-17' : ageDays <= 90 ? '12-15' : '11-14';

      allCards.push({
        id: generateId(),
        tag: 'sleep_alert',
        tagLabel: 'Sleep Pattern',
        tagIcon: 'moon',
        hook: `Based on ${totalHours}h of sleep logged today at ${ageLabel}...`,
        title: `Sleep snapshot for ${name}`,
        body: `${name} has logged about **${totalHours} hours** of sleep so far. At **${ageLabel}**, babies typically need **${expected} hours total** (including naps).\n\n${isNewborn
          ? "**Newborn sleep truth:** It comes in 2-3 hour bursts, and that's biologically normal. Your baby's circadian rhythm won't mature until around 3-4 months. Swaddling, white noise, and a dark room help signal \"it's sleep time.\""
          : "**At this age**, you might start seeing longer stretches at night. A consistent bedtime routine — dim lights, feed, swaddle or sleep sack — helps reinforce the difference between day and night."
        }`,
        priority: 'low',
        createdAt: Date.now() - 5400000,
        contentHash: `sleep-${totalHours}-${day}`,
      });
    }

    // 5. Medication adherence insight
    if (activeMeds.length > 0) {
      const overdueMeds = activeMeds.filter(
        (m) => m.nextDueAt && m.nextDueAt <= Date.now()
      );
      if (overdueMeds.length > 0) {
        const medNames = overdueMeds.map((m) => m.medName).join(', ');
        allCards.push({
          id: generateId(),
          tag: 'mothers_wellness',
          tagLabel: "Mother's Wellness",
          tagIcon: 'heart',
          hook: `Based on your medication schedule (${medNames} overdue)...`,
          title: 'Your recovery medication is overdue',
          body: `Your **${medNames}** ${overdueMeds.length > 1 ? 'are' : 'is'} past due. I know it's easy to forget when you're focused on ${name}, but **staying ahead of pain is much easier than catching up**.\n\nSkipping doses can lead to breakthrough pain that makes caring for your baby harder. Set it as a routine — take your meds right before or after a feed, so it becomes automatic.\n\n**Your recovery matters.** You can't pour from an empty cup.`,
          priority: 'high',
          actionItems: [`Take ${medNames} now`, 'Pair med times with feeding schedule'],
          createdAt: Date.now() - 600000,
          contentHash: `meds-overdue-${medNames}-${day}`,
        });
      }
    }

    // 6. Corrected age insight for preterm babies
    if (correctedAge && correctedAge.isPreterm && correctedAge.corrected) {
      allCards.push({
        id: generateId(),
        tag: 'growth_note',
        tagLabel: 'Growth & Development',
        tagIcon: 'trending-up',
        hook: `Based on ${name}'s preterm birth and corrected age calculation...`,
        title: `Corrected age: What it means for ${name}`,
        body: `Since ${name} arrived early, we use **corrected age** for all developmental milestones. This means we adjust expectations based on when ${name} *would have* been born at full term.\n\n**This is important:** If someone says "${name} should be doing X by now," remember — their developmental clock started at their corrected age, not their birth date. **Vaccinations are the one exception** — those always follow chronological age.\n\nPreterm babies are incredible fighters, and they catch up on their own timeline.`,
        priority: 'medium',
        createdAt: Date.now() - 10800000,
        contentHash: `preterm-corrected-age-${day}`,
      });
    }

    // 7. General daily encouragement (always present as a baseline)
    if (ageDays <= 14) {
      allCards.push({
        id: generateId(),
        tag: 'general',
        tagLabel: 'Daily Encouragement',
        tagIcon: 'sun',
        hook: `${ageLabel} — the early days are the hardest...`,
        title: "You're in the trenches — and you're doing it",
        body: `The first two weeks are often described as the hardest. **Everything is new, sleep is scarce, and doubts are loud.** But here's what 20 years of nursing has taught me: the parents who worry are usually the ones doing the best job.\n\n${name} doesn't need perfection. They need **you** — your warmth, your voice, your presence. That's already more than enough.\n\nRemember to eat, drink water, and accept every offer of help. This phase is temporary, even when it doesn't feel like it.`,
        priority: 'low',
        createdAt: Date.now() - 14400000,
        contentHash: `encouragement-${ageDays}-${day}`,
      });
    }

    // ─── FILTER DISMISSED ───
    const cards = allCards.filter((c) => !(c.contentHash in dismissedHashes));

    // ─── GROUP INTO SECTIONS ───
    const urgent: InsightCardData[] = [];
    const wellness: InsightCardData[] = [];
    const patterns: InsightCardData[] = [];
    const positive: InsightCardData[] = [];

    for (const card of cards) {
      if (card.tag === 'mothers_wellness') {
        wellness.push(card);
      } else if (card.priority === 'high') {
        urgent.push(card);
      } else if (card.priority === 'medium') {
        patterns.push(card);
      } else {
        positive.push(card);
      }
    }

    // Sort within each section by recency
    const byRecent = (a: InsightCardData, b: InsightCardData) => b.createdAt - a.createdAt;
    urgent.sort(byRecent);
    wellness.sort(byRecent);
    patterns.sort(byRecent);
    positive.sort(byRecent);

    // ─── COMPUTE PULSE ───
    const totalFeeds = feedingSummary?.total_feeds ?? 0;
    const isNewborn = ageDays <= 28;
    const expectedMinFeeds = isNewborn ? 8 : 6;
    const wetCount = diaperSummary?.wet_count ?? 0;
    const sleepHours = sleepSummary?.total_sleep_hours ?? 0;
    const hasMoodToday = !!todaysMood;
    const hasOverdueMeds = activeMeds.some((m) => m.nextDueAt && m.nextDueAt <= Date.now());

    const feedingStatus = totalFeeds === 0 ? 'no_data' : totalFeeds >= expectedMinFeeds ? 'good' : 'attention';
    const sleepStatus = sleepHours === 0 ? 'no_data' : 'good';
    const diaperStatus = (diaperSummary?.wet_count ?? 0) === 0 && (diaperSummary?.dirty_count ?? 0) === 0
      ? 'no_data'
      : (isNewborn && wetCount < 4 && ageDays > 3) ? 'attention' : 'good';
    const moodStatus = !hasMoodToday ? 'no_data' : hasStrugglingMood ? 'attention' : 'good';
    const medsStatus = activeMeds.length === 0 ? 'no_data' : hasOverdueMeds ? 'attention' : 'good';

    const domains: PulseDomain[] = [
      { key: 'feeding', label: 'Feeding', status: feedingStatus, icon: 'coffee' },
      { key: 'sleep', label: 'Sleep', status: sleepStatus, icon: 'moon' },
      { key: 'diapers', label: 'Diapers', status: diaperStatus, icon: 'droplet' },
      { key: 'mood', label: 'Mood', status: moodStatus, icon: 'heart' },
      { key: 'meds', label: 'Meds', status: medsStatus, icon: 'thermometer' },
    ];

    const goodCount = domains.filter((d) => d.status === 'good').length;
    const trackedCount = domains.filter((d) => d.status !== 'no_data').length;

    const pulse: PulseData = {
      domains,
      summary: trackedCount === 0
        ? 'Start logging to see your daily snapshot'
        : `${goodCount} of ${trackedCount} tracked areas looking good`,
      dayLabel: ageLabel || 'Today',
    };

    return { pulse, urgent, wellness, patterns, positive };
  }, [baby, babyName, babyAgeDays, correctedAge, moodEntries, activeMeds, feedingTimer, sleepTimer, feedingMethod, dismissedHashes]);

  return {
    grouped,
    babyName,
    babyAgeDays,
    feedingMethod,
  };
}
```

---

### Task 5: Rewrite insights.tsx screen with sectioned layout (SEQUENTIAL — after Tasks 2-4)

**Files:**
- Modify: `app/(app)/(tabs)/insights.tsx`

**Dependencies:** Tasks 1, 2, 3, 4 (all must be complete)

Replace the full file with the new sectioned layout:

```typescript
// ============================================================
// Nodd — Insights Screen
// Grouped, categorized insight feed with pulse summary,
// filter chips, and differentiated card sizes
// ============================================================

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/shared/constants/theme';
import { InsightCard } from '../../../src/modules/insights/components/InsightCard';
import { CompactInsightCard } from '../../../src/modules/insights/components/CompactInsightCard';
import { MiniInsightRow } from '../../../src/modules/insights/components/MiniInsightRow';
import { PulseCard } from '../../../src/modules/insights/components/PulseCard';
import { FilterChips } from '../../../src/modules/insights/components/FilterChips';
import { SectionHeader } from '../../../src/modules/insights/components/SectionHeader';
import { ChatSheet } from '../../../src/modules/insights/components/ChatSheet';
import { useInsightsData } from '../../../src/modules/insights/hooks/useInsightsData';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { useDiaperStore } from '../../../src/stores/diaperStore';
import { useFeedingStore } from '../../../src/stores/feedingStore';
import { useInsightDismissStore } from '../../../src/stores/insightDismissStore';
import { generateUUID } from '../../../src/stores/createSyncedStore';
import { InsightToast } from '../../../src/shared/components/InsightToast';
import { FILTER_OPTIONS } from '../../../src/modules/insights/types';
import type { InsightCardData, QuickAction, FilterCategory } from '../../../src/modules/insights/types';
import type { FeedingLog } from '../../../src/modules/feeding/types';

export default function InsightsScreen() {
  const router = useRouter();
  const { grouped, babyName, babyAgeDays, feedingMethod } = useInsightsData();
  const dismiss = useInsightDismissStore((s) => s.dismiss);
  const [chatInsight, setChatInsight] = useState<InsightCardData | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [positiveCollapsed, setPositiveCollapsed] = useState(true);

  const handleDiscuss = useCallback((insight: InsightCardData) => {
    setChatInsight(insight);
    setShowChat(true);
  }, []);

  const handleCloseChat = useCallback(() => {
    setShowChat(false);
  }, []);

  const handleDismiss = useCallback((contentHash: string) => {
    dismiss(contentHash);
  }, [dismiss]);

  const handleQuickAction = useCallback((action: QuickAction) => {
    const baby = useBabyStore.getState().getActiveBaby();
    if (!baby) return;
    const session = useAuthStore.getState().session;
    const loggedBy = session?.user?.id ?? '';

    if (action.type === 'log_diaper') {
      useDiaperStore.getState().quickLog(baby.id, baby.family_id, loggedBy, 'wet');
      setToastMsg('Wet diaper logged!');
      setShowToast(true);
    } else if (action.type === 'log_feed') {
      const now = new Date().toISOString();
      const feedType = feedingMethod === 'formula_only' ? 'bottle' : 'breast';
      const log: FeedingLog = {
        id: generateUUID(),
        baby_id: baby.id,
        family_id: baby.family_id,
        logged_by: loggedBy,
        type: feedType,
        started_at: now,
        ended_at: now,
        breast_side: feedType === 'breast' ? 'both' : null,
        left_duration_seconds: null,
        right_duration_seconds: null,
        bottle_amount_ml: null,
        bottle_content: null,
        bottle_temperature: null,
        solid_foods: null,
        notes: null,
        baby_response: null,
        photo_url: null,
        created_at: now,
        updated_at: now,
      };
      useFeedingStore.getState().addItem(log);
      setToastMsg('Feed logged!');
      setShowToast(true);
    } else if (action.type === 'log_sleep') {
      router.push('/(app)/log/sleep');
    }
  }, [feedingMethod, router]);

  // Apply filter to all sections
  const applyFilter = (cards: InsightCardData[]): InsightCardData[] => {
    if (filter === 'all') return cards;
    const opt = FILTER_OPTIONS.find((o) => o.key === filter);
    if (!opt || opt.tags.length === 0) return cards;
    return cards.filter((c) => opt.tags.includes(c.tag));
  };

  const urgent = applyFilter(grouped.urgent);
  const wellness = applyFilter(grouped.wellness);
  const patterns = applyFilter(grouped.patterns);
  const positive = applyFilter(grouped.positive);
  const totalCards = urgent.length + wellness.length + patterns.length + positive.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.nurseIcon}>
              <Feather name="zap" size={18} color={colors.textInverse} />
            </View>
            <View>
              <Text style={styles.title}>Insights</Text>
              <Text style={styles.subtitle}>Your AI Nurse is watching over you</Text>
            </View>
          </View>
        </View>

        {/* Filter Chips */}
        <FilterChips selected={filter} onSelect={setFilter} />

        {/* Pulse Card */}
        <PulseCard pulse={grouped.pulse} />

        {totalCards === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="sunrise" size={48} color={colors.neutral[300]} />
            <Text style={styles.emptyTitle}>Insights are brewing</Text>
            <Text style={styles.emptyText}>
              Start logging feeds, diapers, and sleep to receive personalized
              insights from your AI Nurse. The more data she has, the smarter
              her advice becomes.
            </Text>
          </View>
        ) : (
          <>
            {/* Needs Attention — full cards */}
            {urgent.length > 0 && (
              <>
                <SectionHeader
                  icon="alert-circle"
                  iconColor={colors.secondary[500]}
                  title="Needs Attention"
                  count={urgent.length}
                />
                {urgent.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onDiscuss={handleDiscuss}
                    onQuickAction={handleQuickAction}
                    onDismiss={handleDismiss}
                  />
                ))}
              </>
            )}

            {/* Your Wellness — full cards, separate section */}
            {wellness.length > 0 && (
              <>
                <SectionHeader
                  icon="heart"
                  iconColor="#E53935"
                  title="Your Wellness"
                  count={wellness.length}
                />
                {wellness.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onDiscuss={handleDiscuss}
                    onQuickAction={handleQuickAction}
                    onDismiss={handleDismiss}
                  />
                ))}
              </>
            )}

            {/* Today's Patterns — compact cards */}
            {patterns.length > 0 && (
              <>
                <SectionHeader
                  icon="activity"
                  iconColor={colors.primary[500]}
                  title="Today's Patterns"
                  count={patterns.length}
                />
                {patterns.map((insight) => (
                  <CompactInsightCard
                    key={insight.id}
                    insight={insight}
                    onDiscuss={handleDiscuss}
                    onQuickAction={handleQuickAction}
                    onDismiss={handleDismiss}
                  />
                ))}
              </>
            )}

            {/* Going Well — mini rows, collapsed by default */}
            {positive.length > 0 && (
              <>
                <SectionHeader
                  icon="check-circle"
                  iconColor={colors.success}
                  title="Going Well"
                  count={positive.length}
                  collapsible
                  collapsed={positiveCollapsed}
                  onToggle={() => setPositiveCollapsed((p) => !p)}
                />
                {!positiveCollapsed && positive.map((insight) => (
                  <MiniInsightRow
                    key={insight.id}
                    insight={insight}
                    onPress={handleDiscuss}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Chat Sheet */}
      <ChatSheet
        visible={showChat}
        onClose={handleCloseChat}
        insight={chatInsight}
        babyName={babyName}
        babyAgeDays={babyAgeDays}
        feedingMethod={feedingMethod}
      />

      {/* Quick action toast */}
      <InsightToast
        visible={showToast}
        title="Logged!"
        body={toastMsg}
        severity="info"
        onDismiss={() => setShowToast(false)}
        autoDismissMs={3000}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nurseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
});
```

---

### Task 6: Hydrate dismiss store + typecheck + test (SEQUENTIAL — final)

**Files:**
- Modify: `src/stores/HydrationProvider.tsx` (add dismiss store hydration)

**Step 1: Add dismiss store hydration**

Open `src/stores/HydrationProvider.tsx` and add `useInsightDismissStore` to the hydration list, following the same pattern as other stores.

Add import:
```typescript
import { useInsightDismissStore } from './insightDismissStore';
```

Add to the hydration effect (wherever other stores call `.hydrate()`):
```typescript
useInsightDismissStore.getState().hydrate();
```

**Step 2: Run typecheck**

Run: `cd /Users/bernahazalgedik/sprout-baby-tracker/nodd && npx tsc --noEmit --pretty 2>&1 | head -50`
Expected: No new errors in modified/created files

**Step 3: Run Expo build check**

Run: `cd /Users/bernahazalgedik/sprout-baby-tracker/nodd && npx expo export --platform ios --dump-sourcemap 2>&1 | tail -20`
Expected: Successful export (verifies all imports resolve)

---

## Dependency Graph

```
Task 1 (types + store) ──┬──→ Task 2 (new UI components)  ──┐
                          ├──→ Task 3 (InsightCard update)  ──┼──→ Task 5 (screen assembly) ──→ Task 6 (hydrate + test)
                          └──→ Task 4 (hook refactor)       ──┘
```

Tasks 2, 3, 4 are fully independent and can run as **parallel subagents**.

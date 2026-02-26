# Insights Screen Redesign — Design Document

**Date:** 2026-02-25
**Status:** Approved

## Problem

The Insights screen renders all insight cards as a flat, priority-sorted list with no visual grouping, no category navigation, and no information hierarchy. Despite 8 tag categories in the data model, the UI treats every card identically — making it feel like random facts rather than organized, actionable nurse guidance.

## Design

### Data Layer

**Grouped return type** from `useInsightsData`:

```typescript
interface PulseDomain {
  key: string;
  label: string;
  status: 'good' | 'attention' | 'no_data';
}

interface PulseData {
  domains: PulseDomain[];
  summary: string; // e.g. "4 of 5 areas looking good today"
  dayLabel: string; // e.g. "Day 5"
}

interface GroupedInsights {
  pulse: PulseData;
  urgent: InsightCardData[];    // high priority
  wellness: InsightCardData[];  // mothers_wellness tag
  patterns: InsightCardData[];  // medium priority
  positive: InsightCardData[];  // low priority
}
```

**Content hash** on each `InsightCardData`:
- Derived from the data that triggered the insight (e.g., `feeding-${feedCount}-${day}`)
- Used for dismiss tracking — when data changes, hash changes, card resurfaces

**New `insightDismissStore.ts`**:
- `dismissedHashes: Record<string, number>` — maps contentHash to dismissedAt timestamp
- Follows existing Zustand + AsyncStorage pattern from `prepChecklistStore.ts`
- Cards filtered out when their contentHash matches a dismissed entry

### New Components

**`PulseCard.tsx`** — Hero summary replacing static nurse quote:
- Shows colored status dots per domain (Feeding, Sleep, Diapers, Mood, Meds)
- Green = on track, amber = needs attention, gray = no data
- Dynamic summary line

**`FilterChips.tsx`** — Horizontal scrollable category pills:
- Uses existing `TAG_COLORS` from InsightCard
- Filters across all sections simultaneously
- "All" selected by default

**`CompactInsightCard.tsx`** — Smaller card for medium/low priority:
- Tag pill + title + truncated body (2 lines)
- Tap to expand full body inline
- "Discuss" CTA only visible when expanded
- Quick action visible if present

**`MiniInsightRow.tsx`** — Minimal row for positive reinforcement:
- Green checkmark + title, grouped under collapsible "Going Well" section

**`SectionHeader.tsx`** — Reusable section header with icon and optional collapse toggle

### Screen Layout

```
Header + subtitle
[Filter Chips — horizontal scroll]
PulseCard (dynamic summary)
"Needs Attention" section → Full InsightCards, swipeable to dismiss
"Your Wellness" section → Full InsightCards, pink accent
"Today's Patterns" section → CompactInsightCards
"Going Well" section → MiniInsightRows, collapsed by default
```

### Dismiss Behavior

- Swipe left on any card triggers dismiss
- Uses `Animated` + `PanResponder` (no external dependencies)
- Stores contentHash (not card ID, since IDs regenerate each render)
- Data change → hash change → auto-resurface
- "Going Well" items skip dismiss (already collapsed)

### Card Body Changes

- Bodies truncated to first ~2 sentences by default
- "Read more" expands inline
- Full educational content preserved, just not shown upfront

## Files Changed

- `src/modules/insights/types.ts` — Add GroupedInsights, PulseData, contentHash field
- `src/modules/insights/hooks/useInsightsData.ts` — Return GroupedInsights, add pulse computation, add contentHash
- `src/stores/insightDismissStore.ts` — New dismiss state store
- `src/modules/insights/components/PulseCard.tsx` — New
- `src/modules/insights/components/FilterChips.tsx` — New
- `src/modules/insights/components/CompactInsightCard.tsx` — New
- `src/modules/insights/components/MiniInsightRow.tsx` — New
- `src/modules/insights/components/SectionHeader.tsx` — New
- `src/modules/insights/components/InsightCard.tsx` — Add swipe-to-dismiss, collapsible body
- `app/(app)/(tabs)/insights.tsx` — New sectioned layout

## Constraints

- No new external dependencies (use RN Animated API)
- Follow existing Zustand + AsyncStorage store pattern
- Respect existing design system colors/spacing/typography
- Maintain all existing functionality (chat, quick actions, red flags)
